#!/usr/bin/env bash
# Idempotent setup of a dedicated OpenClaw gateway for the InteriorDesigner backend.
#
# It runs under its own profile (~/.openclaw-interior), port and token, so the main
# OpenClaw setup is untouched. Tool Search is turned off there: with local models it
# otherwise hides the backend's client tools (check_layout/submit_layout) behind a
# search step, and the agent loops until the context overflows.
set -euo pipefail

NODE_BIN="${NODE_BIN:-$HOME/.nvm/versions/node/v24.21.0/bin}"
export PATH="$NODE_BIN:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="${OPENCLAW_PROFILE:-interior}"
PORT="${OPENCLAW_PORT:-18989}"
AGENT="${OPENCLAW_AGENT_ID:-interior}"
MODEL_ID="${OLLAMA_MODEL:-qwen3.6-35b-a3b-fp8:latest}"
OLLAMA_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
STATE="$HOME/.openclaw-$PROFILE"
WORKSPACE="$STATE/workspace"
CONFIG="$STATE/openclaw.json"
GATEWAY="http://127.0.0.1:$PORT"

oc() { openclaw --profile "$PROFILE" "$@"; }

mkdir -p "$WORKSPACE"
chmod 700 "$STATE"

echo "==> Agent '$AGENT' (profile '$PROFILE')"
if ! oc agents list 2>/dev/null | grep -qE "^- $AGENT( |$)"; then
  oc agents add "$AGENT" --non-interactive --workspace "$WORKSPACE" --model "ollama/$MODEL_ID"
fi
# Replace the seeded chat-assistant bootstrap files (birth sequence, persona) with minimal ones.
for f in AGENTS.md SOUL.md USER.md IDENTITY.md BOOTSTRAP.md; do
  install -m 0644 "$REPO/server/openclaw/$f" "$WORKSPACE/$f"
done

echo "==> Gateway, model and tool policy"
PATCH="$(mktemp)"
trap 'rm -f "$PATCH"' EXIT
node - "$PATCH" "$CONFIG" "$PORT" "$AGENT" "$MODEL_ID" "$OLLAMA_URL" "$WORKSPACE" "$STATE" <<'EOF'
const fs = require('fs')
const crypto = require('crypto')
const [out, config, port, agent, model, ollamaUrl, workspace, state] = process.argv.slice(2)
let token
try {
  token = JSON.parse(fs.readFileSync(config, 'utf8')).gateway?.auth?.token
} catch {}
token ||= crypto.randomBytes(32).toString('hex')
const patch = {
  gateway: {
    mode: 'local',
    port: Number(port),
    bind: 'loopback',
    auth: { mode: 'token', token },
    tailscale: { mode: 'off' },
    http: { endpoints: { chatCompletions: { enabled: true } } },
  },
  models: {
    mode: 'merge',
    providers: {
      ollama: {
        api: 'ollama',
        apiKey: 'ollama-local',
        baseUrl: ollamaUrl,
        models: [
          {
            id: model,
            name: model,
            input: ['text', 'image'],
            reasoning: true,
            contextWindow: 262144,
            contextTokens: 32768,
            maxTokens: 8192,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            compat: { supportsTools: true, supportsJsonSchemaResponseFormat: true, supportsUsageInStreaming: true },
          },
        ],
      },
    },
  },
  plugins: { entries: { ollama: { enabled: true } } },
  tools: { profile: 'minimal', toolSearch: false },
  agents: {
    defaults: { model: { primary: `ollama/${model}` }, workspace, skipBootstrap: true, bootstrapTotalMaxChars: 4000 },
    entries: {
      [agent]: {
        name: agent,
        workspace,
        agentDir: `${state}/agents/${agent}/agent`,
        model: { primary: `ollama/${model}` },
        identity: { name: agent },
        thinkingDefault: 'off',
        skills: [],
        tools: { profile: 'minimal' },
      },
    },
  },
}
fs.writeFileSync(out, JSON.stringify(patch, null, 2))
EOF
oc config patch --file "$PATCH"
oc config validate
chmod 600 "$CONFIG"

echo "==> Gateway service on port $PORT"
oc gateway install --port "$PORT" || true
oc gateway restart || echo "Could not restart the '$PROFILE' gateway service; run: openclaw --profile $PROFILE gateway --port $PORT"
for _ in $(seq 1 60); do
  curl -fsS -m 2 "$GATEWAY/health" >/dev/null 2>&1 && break
  sleep 1
done

TOKEN="${OPENCLAW_GATEWAY_TOKEN:-$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).gateway.auth.token)' "$CONFIG")}"

echo "==> GET /v1/models"
curl -fsS "$GATEWAY/v1/models" -H "Authorization: Bearer $TOKEN" | head -c 600
echo

echo "==> Tool-call smoke test"
START=$(date +%s)
RESPONSE="$(curl -sS -m 300 "$GATEWAY/v1/chat/completions" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{
    \"model\": \"openclaw/$AGENT\",
    \"temperature\": 0,
    \"messages\": [{\"role\": \"user\", \"content\": \"Report ok=true using the report tool.\"}],
    \"tools\": [{\"type\": \"function\", \"function\": {\"name\": \"report\", \"description\": \"Report status\",
      \"parameters\": {\"type\": \"object\", \"properties\": {\"ok\": {\"type\": \"boolean\"}}, \"required\": [\"ok\"], \"additionalProperties\": false}}}],
    \"tool_choice\": {\"type\": \"function\", \"function\": {\"name\": \"report\"}}
  }")"
echo "$RESPONSE" | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    const body = JSON.parse(s)
    if (body.error) { console.log("error:", JSON.stringify(body.error)); process.exitCode = 1; return }
    const c = body.choices[0]
    console.log("finish_reason:", c.finish_reason, "arguments:", c.message.tool_calls?.[0]?.function?.arguments)
  })'
echo "Latency: $(( $(date +%s) - START ))s"
echo "Backend settings: OPENCLAW_BASE_URL=$GATEWAY OPENCLAW_CONFIG_PATH=$CONFIG OPENCLAW_AGENT_ID=$AGENT"
