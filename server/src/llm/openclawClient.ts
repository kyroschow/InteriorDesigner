import { readFileSync } from 'node:fs'
import OpenAI from 'openai'
import { type ChatRequest, type ChatResponse, type LlmClient, LlmError, withTimeout } from './types.ts'

export interface OpenClawOptions {
  baseUrl: string
  agentId: string
  token?: string
  configPath: string
  /** Optional `x-openclaw-model` override, e.g. `ollama/qwen3.6-35b-a3b-fp8:latest`. */
  model?: string
}

/** Reads the gateway token without ever logging it. */
function resolveToken(options: OpenClawOptions): string {
  if (options.token) return options.token
  try {
    const config = JSON.parse(readFileSync(options.configPath, 'utf8')) as { gateway?: { auth?: { token?: string } } }
    const token = config.gateway?.auth?.token
    if (token) return token
  } catch {
    // fall through
  }
  throw new LlmError('unavailable', `No OpenClaw gateway token: set OPENCLAW_GATEWAY_TOKEN or gateway.auth.token in ${options.configPath}.`)
}

/**
 * Calls the local model through the OpenClaw gateway's OpenAI-compatible
 * endpoint (`/v1/chat/completions`). Each request is a stateless run of the
 * dedicated `interior` agent; structured output comes from client function tools.
 */
export class OpenClawClient implements LlmClient {
  readonly id: string
  private client: OpenAI | null = null

  constructor(private readonly options: OpenClawOptions) {
    this.id = `openclaw:${options.agentId}`
  }

  private sdk(): OpenAI {
    this.client ??= new OpenAI({
      baseURL: `${this.options.baseUrl.replace(/\/$/, '')}/v1`,
      apiKey: resolveToken(this.options),
      maxRetries: 0,
      defaultHeaders: this.options.model ? { 'x-openclaw-model': this.options.model } : undefined,
    })
    return this.client
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now()
    const signal = withTimeout(request.timeoutMs, request.signal)
    try {
      const completion = await this.sdk().chat.completions.create(
        {
          model: `openclaw/${this.options.agentId}`,
          stream: false,
          temperature: request.temperature,
          seed: request.seed,
          max_completion_tokens: request.maxTokens,
          tools: request.tools.map((t) => ({
            type: 'function' as const,
            function: { name: t.name, description: t.description, parameters: t.parameters },
          })),
          tool_choice:
            typeof request.toolChoice === 'string'
              ? request.toolChoice
              : { type: 'function' as const, function: { name: request.toolChoice.name } },
          messages: request.messages.map((msg) => {
            switch (msg.role) {
              case 'assistant':
                return {
                  role: 'assistant' as const,
                  content: msg.content,
                  tool_calls: msg.toolCalls?.length
                    ? msg.toolCalls.map((c) => ({ id: c.id, type: 'function' as const, function: { name: c.name, arguments: c.arguments } }))
                    : undefined,
                }
              case 'tool':
                return { role: 'tool' as const, tool_call_id: msg.toolCallId, content: msg.content }
              default:
                return { role: msg.role, content: msg.content }
            }
          }),
        },
        { signal },
      )
      const message = completion.choices[0]?.message
      if (!message) throw new LlmError('bad_response', 'OpenClaw returned no choices.')
      return {
        content: message.content ?? '',
        toolCalls: (message.tool_calls ?? [])
          .filter((c) => c.type === 'function')
          .map((c) => ({ id: c.id, name: c.function.name, arguments: c.function.arguments })),
        latencyMs: Date.now() - started,
        usage: { promptTokens: completion.usage?.prompt_tokens, completionTokens: completion.usage?.completion_tokens },
      }
    } catch (err) {
      throw toLlmError(err, request.signal)
    }
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    try {
      const models = await this.sdk().models.list({ signal: AbortSignal.timeout(5000) })
      const target = `openclaw/${this.options.agentId}`
      const ok = models.data.some((mdl) => mdl.id === target)
      return { ok, detail: ok ? `${target} available` : `${target} not listed by the gateway` }
    } catch (err) {
      return { ok: false, detail: toLlmError(err).message }
    }
  }
}

function toLlmError(err: unknown, callerSignal?: AbortSignal): LlmError {
  if (err instanceof LlmError) return err
  if (callerSignal?.aborted) return new LlmError('aborted', 'Request was cancelled.')
  if (err instanceof OpenAI.APIConnectionTimeoutError) return new LlmError('timeout', 'OpenClaw request timed out.')
  if (err instanceof OpenAI.APIUserAbortError || (err instanceof Error && err.name === 'AbortError') || (err instanceof Error && err.name === 'TimeoutError')) {
    return new LlmError('timeout', 'OpenClaw request timed out.')
  }
  if (err instanceof OpenAI.APIConnectionError) return new LlmError('unavailable', `OpenClaw gateway unreachable: ${err.message}`)
  if (err instanceof OpenAI.APIError) {
    const kind = err.status && err.status >= 500 ? 'unavailable' : 'bad_response'
    return new LlmError(kind, `OpenClaw ${err.status ?? ''} ${err.message}`.trim())
  }
  return new LlmError('bad_response', err instanceof Error ? err.message : String(err))
}
