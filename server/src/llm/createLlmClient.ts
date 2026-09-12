import type { AppConfig } from '../config.ts'
import { OllamaClient } from './ollamaClient.ts'
import { OpenClawClient } from './openclawClient.ts'
import type { LlmClient } from './types.ts'

export function createLlmClient(config: AppConfig): LlmClient | null {
  switch (config.llmProvider) {
    case 'openclaw':
      return new OpenClawClient(config.openclaw)
    case 'ollama':
      return new OllamaClient(config.ollama)
    case 'none':
      return null
  }
}
