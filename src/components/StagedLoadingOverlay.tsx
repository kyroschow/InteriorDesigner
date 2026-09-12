import { Sparkles } from 'lucide-react'

export interface LoadingNote {
  room: string
  text: string
}

interface StagedLoadingOverlayProps {
  stages: string[]
  stageIndex: number
  /** Freeform notes to visibly echo back, so the client can see their requests were picked up. */
  notes?: LoadingNote[]
}

/** A soft blurred overlay with a spinning ring + cycling message — used wherever we fake "thinking." */
export function StagedLoadingOverlay({ stages, stageIndex, notes }: StagedLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-app/85 backdrop-blur-sm">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent-pale border-t-accent" />
        <Sparkles size={20} className="text-accent" />
      </div>
      <p className="text-sm font-medium text-ink-soft">{stages[stageIndex]}</p>
      {notes && notes.length > 0 && (
        <div className="mt-2 flex max-w-xs flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.06em] text-ink-soft/40 uppercase">Considering your notes</span>
          {notes.map((note, i) => (
            <span key={i} className="rounded-control bg-accent-pale px-2.5 py-1 text-xs text-accent-deep">
              <span className="font-semibold">{note.room}:</span> “{note.text}”
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
