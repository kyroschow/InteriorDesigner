import { useNavigate } from 'react-router-dom'
import { ArrowRight, FolderOpen, Plus } from 'lucide-react'
import { Brand } from '@/components/Brand'

/** The true entry point — hero + where to start, separate from the actual onboarding wizard. */
export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="animate-pane-in mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <Brand size="xl" />
      <h2 className="serif mt-8 text-3xl text-ink-soft/80 sm:text-4xl">
        Turn any floor plan
        <br />
        into a fully furnished room.
      </h2>

      <div className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/new')}
          className="panel group flex flex-col items-start gap-3 rounded-card p-6 text-left transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-control bg-accent text-app">
            <Plus size={20} />
          </div>
          <div>
            <div className="serif text-lg text-ink">New Project</div>
            <p className="mt-1 text-sm text-ink-soft/60">Start furnishing a floor plan from scratch or an upload.</p>
          </div>
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent-deep">
            Get started
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="panel group flex flex-col items-start gap-3 rounded-card p-6 text-left transition-transform hover:-translate-y-0.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-control bg-canvas text-ink-soft">
            <FolderOpen size={20} />
          </div>
          <div>
            <div className="serif text-lg text-ink">My Projects</div>
            <p className="mt-1 text-sm text-ink-soft/60">Pick up where you left off.</p>
          </div>
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-ink-soft">
            View projects
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </div>
  )
}
