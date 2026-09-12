import { AlertTriangle, RotateCw, X } from 'lucide-react'
import { ApiError } from '@/api/client'

interface ErrorBannerProps {
  error: unknown
  /** Offered for 409s: the project changed elsewhere, so reload before retrying. */
  onReload?: () => void
  onDismiss?: () => void
  className?: string
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

/** API errors with their per-field details; conflicts get a reload action. */
export function ErrorBanner({ error, onReload, onDismiss, className }: ErrorBannerProps) {
  const conflict = error instanceof ApiError && error.status === 409
  const details = error instanceof ApiError ? error.details.map((d) => d.message ?? d.code) : []
  return (
    <div role="alert" className={`rounded-control border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 ${className ?? ''}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{errorMessage(error)}</p>
          {details.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {details.slice(0, 8).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
          {conflict && onReload && (
            <button type="button" onClick={onReload} className="mt-1.5 inline-flex items-center gap-1 font-semibold underline">
              <RotateCw size={12} />
              Reload latest
            </button>
          )}
        </div>
        {onDismiss && (
          <button type="button" aria-label="Dismiss" onClick={onDismiss} className="shrink-0 rounded p-0.5 hover:bg-red-100">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
