import type { FastifyError, FastifyInstance } from 'fastify'

export interface ErrorDetail {
  path?: string
  code: string
  message?: string
  [key: string]: unknown
}

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message)
  }
}

export const envelope = (code: string, message: string, details: ErrorDetail[] = []) => ({
  error: { code, message, details },
})

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | AppError, request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send(envelope(err.code, err.message, err.details))
    }
    const code = (err as FastifyError).code
    if (code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' || code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
      return reply.status(415).send(envelope('UNSUPPORTED_MEDIA_TYPE', err.message))
    }
    if (code === 'FST_ERR_CTP_BODY_TOO_LARGE' || code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send(envelope('PAYLOAD_TOO_LARGE', err.message))
    }
    if (code === 'FST_ERR_CTP_EMPTY_JSON_BODY' || code === 'FST_ERR_CTP_INVALID_JSON_BODY' || err instanceof SyntaxError) {
      return reply.status(400).send(envelope('INVALID_JSON', 'Request body is not valid JSON.'))
    }
    const status = (err as FastifyError).statusCode
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send(envelope(code ?? 'BAD_REQUEST', err.message))
    }
    request.log.error(err)
    return reply.status(500).send(envelope('INTERNAL_ERROR', 'Unexpected server error.'))
  })

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(envelope('NOT_FOUND', `No route for ${request.method} ${request.url}.`))
  })
}
