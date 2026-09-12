import { type ChatRequest, type ChatResponse, type LlmClient, LlmError, withTimeout } from './types.ts'

export interface OllamaOptions {
  baseUrl: string
  model: string
  numCtx: number
}

interface OllamaToolCall {
  id?: string
  function: { name: string; arguments: Record<string, unknown> | string }
}

/** Direct Ollama `/api/chat` client; a fallback when the OpenClaw gateway is unavailable or too slow. */
export class OllamaClient implements LlmClient {
  readonly id: string

  constructor(private readonly options: OllamaOptions) {
    this.id = `ollama:${options.model}`
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const started = Date.now()
    const messages = request.messages.map((msg) => {
      switch (msg.role) {
        case 'assistant':
          return {
            role: 'assistant',
            content: msg.content,
            tool_calls: msg.toolCalls?.map((c) => ({ function: { name: c.name, arguments: safeParse(c.arguments) } })),
          }
        case 'tool':
          return { role: 'tool', tool_name: msg.name, content: msg.content }
        default:
          return { role: msg.role, content: msg.content }
      }
    })
    // Ollama has no tool_choice; state the requirement in the leading system message
    // (Qwen's chat template rejects system messages anywhere but the start).
    if (request.toolChoice !== 'auto') {
      const name = typeof request.toolChoice === 'string' ? 'one of the provided tools' : `the ${request.toolChoice.name} tool`
      const instruction = `Respond only by calling ${name}.`
      if (messages[0]?.role === 'system') messages[0] = { ...messages[0], content: `${messages[0].content}\n\n${instruction}` }
      else messages.unshift({ role: 'system', content: instruction })
    }

    let response: Response
    try {
      response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: withTimeout(request.timeoutMs, request.signal),
        body: JSON.stringify({
          model: this.options.model,
          stream: false,
          think: false,
          keep_alive: '30m',
          messages,
          tools: request.tools.map((t) => ({ type: 'function', function: t })),
          options: {
            temperature: request.temperature,
            seed: request.seed,
            num_ctx: this.options.numCtx,
            num_predict: request.maxTokens,
          },
        }),
      })
    } catch (err) {
      if (request.signal?.aborted) throw new LlmError('aborted', 'Request was cancelled.')
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) throw new LlmError('timeout', 'Ollama request timed out.')
      throw new LlmError('unavailable', `Ollama unreachable: ${err instanceof Error ? err.message : String(err)}`)
    }
    if (!response.ok) {
      throw new LlmError(response.status >= 500 ? 'unavailable' : 'bad_response', `Ollama ${response.status}: ${(await response.text()).slice(0, 300)}`)
    }
    const body = (await response.json()) as {
      message?: { content?: string; tool_calls?: OllamaToolCall[] }
      prompt_eval_count?: number
      eval_count?: number
    }
    return {
      content: body.message?.content ?? '',
      toolCalls: (body.message?.tool_calls ?? []).map((c, i) => ({
        id: c.id ?? `call_${Date.now()}_${i}`,
        name: c.function.name,
        arguments: typeof c.function.arguments === 'string' ? c.function.arguments : JSON.stringify(c.function.arguments),
      })),
      latencyMs: Date.now() - started,
      usage: { promptTokens: body.prompt_eval_count, completionTokens: body.eval_count },
    }
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    try {
      const res = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(5000) })
      const tags = (await res.json()) as { models?: { name: string }[] }
      const ok = Boolean(tags.models?.some((mdl) => mdl.name === this.options.model))
      return { ok, detail: ok ? `${this.options.model} available` : `${this.options.model} not pulled` }
    } catch (err) {
      return { ok: false, detail: `Ollama unreachable: ${err instanceof Error ? err.message : String(err)}` }
    }
  }
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}
