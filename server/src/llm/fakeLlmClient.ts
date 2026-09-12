import type { ChatRequest, ChatResponse, LlmClient, ToolCall } from './types.ts'

export type FakeReply = { toolCalls?: Omit<ToolCall, 'id'>[]; content?: string } | Error

/** Scripted client for tests: the script sees each request and the call index. */
export class FakeLlmClient implements LlmClient {
  readonly id = 'fake'
  readonly requests: ChatRequest[] = []

  constructor(private readonly script: (request: ChatRequest, callIndex: number) => FakeReply | Promise<FakeReply>) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const index = this.requests.length
    this.requests.push(structuredClone({ ...request, signal: undefined }))
    const reply = await this.script(request, index)
    if (reply instanceof Error) throw reply
    return {
      content: reply.content ?? '',
      toolCalls: (reply.toolCalls ?? []).map((c, i) => ({ ...c, id: `fake_${index}_${i}` })),
      latencyMs: 0,
    }
  }

  async health() {
    return { ok: true, detail: 'fake client' }
  }
}
