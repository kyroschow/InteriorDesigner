export interface ToolCall {
  id: string
  name: string
  /** Raw JSON string, exactly as produced by the model. */
  arguments: string
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; name: string; content: string }

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ChatRequest {
  messages: ChatMessage[]
  tools: ToolDefinition[]
  toolChoice: 'auto' | 'required' | { name: string }
  temperature?: number
  seed?: number
  maxTokens?: number
  timeoutMs: number
  signal?: AbortSignal
}

export interface ChatResponse {
  content: string
  toolCalls: ToolCall[]
  latencyMs: number
  usage?: { promptTokens?: number; completionTokens?: number }
}

export type LlmErrorKind = 'timeout' | 'unavailable' | 'bad_response' | 'aborted'

export class LlmError extends Error {
  constructor(
    public readonly kind: LlmErrorKind,
    message: string,
  ) {
    super(message)
  }
}

export interface LlmClient {
  readonly id: string
  chat(request: ChatRequest): Promise<ChatResponse>
  health(): Promise<{ ok: boolean; detail: string }>
}

/** Combine a caller's signal with a timeout. */
export function withTimeout(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}
