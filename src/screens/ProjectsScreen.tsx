import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FolderOpen } from 'lucide-react'
import { Brand } from '@/components/Brand'

/** "My Projects" — honest empty state, since nothing persists between sessions yet. */
export function ProjectsScreen() {
  const navigate = useNavigate()

  return (
    <div className="animate-pane-in mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Brand size="sm" />
      <div className="panel flex w-full flex-col items-center gap-4 rounded-panel p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-ink-soft">
          <FolderOpen size={24} />
        </div>
        <h1 className="serif text-2xl text-ink">No projects yet</h1>
        <p className="text-sm text-ink-soft/70">
          Projects aren't saved between sessions yet — start a new one whenever you're ready.
        </p>
        <button
          type="button"
          onClick={() => navigate('/new')}
          className="mt-2 inline-flex items-center gap-2 rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
        >
          New Project
          <ArrowRight size={16} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 rounded-control px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
      >
        <ArrowLeft size={16} />
        Back home
      </button>
    </div>
  )
}
