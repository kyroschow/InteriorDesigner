/**
 * One pinned tool call against the configured provider(s), printing latency.
 *   npm run smoke:llm                 # both providers
 *   LLM_PROVIDER=ollama npm run smoke:llm
 */
import { loadConfig } from '../src/config.ts'
import { OllamaClient } from '../src/llm/ollamaClient.ts'
import { OpenClawClient } from '../src/llm/openclawClient.ts'
import type { LlmClient } from '../src/llm/types.ts'

const config = loadConfig({ ...process.env, LLM_PROVIDER: process.env.LLM_PROVIDER ?? 'openclaw' })
const clients: LlmClient[] = []
if (!process.env.LLM_PROVIDER || process.env.LLM_PROVIDER === 'openclaw') clients.push(new OpenClawClient(config.openclaw))
if (!process.env.LLM_PROVIDER || process.env.LLM_PROVIDER === 'ollama') clients.push(new OllamaClient(config.ollama))

for (const client of clients) {
  console.log(`\n== ${client.id}`)
  console.log('health:', await client.health())
  try {
    const res = await client.chat({
      messages: [{ role: 'user', content: 'Report ok=true using the report tool.' }],
      tools: [{ name: 'report', description: 'Report status', parameters: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] } }],
      toolChoice: 'required',
      temperature: 0,
      timeoutMs: config.llmTimeoutMs,
    })
    console.log(`latency ${res.latencyMs} ms; tool calls:`, res.toolCalls, 'usage:', res.usage)
  } catch (err) {
    console.log('FAILED:', err instanceof Error ? `${err.name}: ${err.message}` : err)
  }
}
