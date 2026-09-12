import { Sparkles } from 'lucide-react'

interface StagedLoadingOverlayProps {
  stages: string[]
  stageIndex: number
}

/** A soft blurred overlay with a spinning ring + cycling message — used wherever we fake "thinking." */
export function StagedLoadingOverlay({ stages, stageIndex }: StagedLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-app/85 backdrop-blur-sm">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent-pale border-t-accent" />
        <Sparkles size={20} className="text-accent" />
      </div>
      <p className="text-sm font-medium text-ink-soft">{stages[stageIndex]}</p>
    </div>
  )
}
