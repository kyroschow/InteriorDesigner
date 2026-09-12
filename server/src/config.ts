import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export interface AppConfig {
  host: string
  port: number
  dataDir: string
  mongodbUri: string
  mongodbDb: string
  inventoryDir: string
  llmProvider: 'openclaw' | 'ollama' | 'none'
  llmTimeoutMs: number
  openclaw: { baseUrl: string; agentId: string; token?: string; configPath: string; model?: string }
  ollama: { baseUrl: string; model: string; numCtx: number }
  generation: { maxTurns: number; timeBudgetMs: number }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const provider = env.LLM_PROVIDER ?? 'openclaw'
  if (provider !== 'openclaw' && provider !== 'ollama' && provider !== 'none') {
    throw new Error(`LLM_PROVIDER must be openclaw, ollama or none (got ${provider}).`)
  }
  return {
    host: env.HOST ?? '127.0.0.1',
    port: Number(env.PORT ?? 3001),
    dataDir: path.resolve(env.DATA_DIR ?? path.join(serverRoot, 'data')),
    // Local single-node replica set from server/docker-compose.yml.
    mongodbUri: env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/?replicaSet=rs0&directConnection=true',
    mongodbDb: env.MONGODB_DB ?? 'interior',
    inventoryDir: path.resolve(env.INVENTORY_DIR ?? path.join(serverRoot, '..', 'inventory')),
    llmProvider: provider,
    llmTimeoutMs: Number(env.LLM_TIMEOUT_MS ?? 180_000),
    openclaw: {
      // Dedicated gateway from scripts/setup-openclaw.sh (profile `interior`).
      baseUrl: env.OPENCLAW_BASE_URL ?? 'http://127.0.0.1:18989',
      agentId: env.OPENCLAW_AGENT_ID ?? 'interior',
      token: env.OPENCLAW_GATEWAY_TOKEN || undefined,
      configPath: env.OPENCLAW_CONFIG_PATH ?? path.join(os.homedir(), '.openclaw-interior', 'openclaw.json'),
      model: env.OPENCLAW_MODEL || undefined,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
      model: env.OLLAMA_MODEL ?? 'qwen3.6-35b-a3b-fp8:latest',
      numCtx: Number(env.OLLAMA_NUM_CTX ?? 32768),
    },
    generation: {
      maxTurns: Number(env.GENERATION_MAX_TURNS ?? 12),
      timeBudgetMs: Number(env.GENERATION_TIME_BUDGET_MS ?? 900_000),
    },
  }
}
