import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '@/api/client'
import { ErrorBanner } from '@/components/ErrorBanner'
import { GenerationFindings } from '@/components/GenerationFindings'
import { isTerminal } from '@/hooks/useGeneration'
import { useProjectContext } from '@/screens/ProjectLayout'
import { MAX_TEXT_LENGTH, type CreateGenerationRequest, type GenerationStage } from '@/types/interior'

const STAGE_LABEL: Record<GenerationStage, string> = {
  selecting: 'Choosing candidate products…',
  placing: 'The AI planner is placing furniture…',
  validating: 'Checking the layout…',
}
const DEFAULT_BUDGET_MINOR = 300000

/** Design brief, safety rules and Apply: configuration PUT (if dirty), then generation POST and polling. */
export function RulesScreen() {
  const { project, rules, draft, setDraft, saveDraft, generation, generationActive, applyProject, reload, write } = useProjectContext()
  const navigate = useNavigate()
  const [scope, setScope] = useState<string>('home')
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<unknown>(null)
  const [startedId, setStartedId] = useState<string | null>(null)
  const attempt = useRef<{ payload: string; key: string; generationId: string | null } | null>(null)

  const budgetDollars = (draft.budget?.amountMinor ?? DEFAULT_BUDGET_MINOR) / 100
  const [budgetText, setBudgetText] = useState(String(budgetDollars))
  useEffect(() => setBudgetText(String(budgetDollars)), [budgetDollars])

  useEffect(() => {
    if (startedId && generation?.id === startedId && generation.status === 'succeeded') navigate(`/projects/${project.id}/export`)
  }, [generation, startedId, navigate, project.id])

  const roomLabel = (id: string) => project.floor.rooms.find((r) => r.id === id)?.label ?? id

  async function apply() {
    setSubmitting(true)
    setApplyError(null)
    try {
      await saveDraft()
      const res = await write(async (current) => {
        const body: CreateGenerationRequest = {
          expectedRevision: current.revision,
          configurationRevision: current.configuration.revision,
          scope: scope === 'home' ? { kind: 'home' } : { kind: 'room', roomId: scope },
        }
        const payload = JSON.stringify(body)
        // Same payload reuses its key, so a retry or double click can't start a second job.
        // A finished job with unchanged inputs gets a fresh key: "generate again".
        const previous = attempt.current
        const finished = previous?.generationId && generation?.id === previous.generationId && isTerminal(generation.status)
        const nextAttempt = previous?.payload === payload && !finished ? previous : { payload, key: crypto.randomUUID(), generationId: null }
        attempt.current = nextAttempt
        const created = await api.createGeneration(current.id, body, nextAttempt.key)
        nextAttempt.generationId = created.generationId
        applyProject({ ...current, latestGeneration: { id: created.generationId, status: created.status, stage: null, scope: body.scope } })
        return created
      })
      setStartedId(res.generationId)
      reload().catch(() => {})
    } catch (err) {
      setApplyError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const lastAttempt = generation && generation.id === project.latestGeneration?.id && (generation.status === 'failed' || generation.status === 'stale') ? generation : null
  const lastTurn = generation?.progress.turns.at(-1)

  return (
    <>
      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        <section className="space-y-3">
          <div>
            <h2 className="serif text-lg text-ink">Design brief</h2>
            <p className="text-xs text-ink-soft/60">The prompt guides the planner's style choices. A budget, if set, is a hard cap on the whole home.</p>
          </div>
          <label className="block text-xs font-medium text-ink-soft">
            <span className="flex justify-between">
              Prompt
              <span className="tnum text-[10px] text-ink-soft/50">
                {draft.prompt.length}/{MAX_TEXT_LENGTH}
              </span>
            </span>
            <textarea
              rows={3}
              maxLength={MAX_TEXT_LENGTH}
              value={draft.prompt}
              onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
              placeholder="A calm home with light wood and neutral upholstery."
              className="mt-1 w-full resize-y rounded-control border border-canvas-line bg-app px-2.5 py-1.5 text-sm font-normal text-ink placeholder:text-ink-soft/40 focus:border-accent focus:outline-none"
            />
          </label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <input
                type="checkbox"
                checked={draft.budget !== null}
                onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.checked ? { amountMinor: DEFAULT_BUDGET_MINOR, currency: 'USD' } : null }))}
              />
              Set a budget (USD, before tax and shipping)
            </label>
            {draft.budget !== null && (
              <span className="flex items-center rounded-control border border-canvas-line bg-app px-2.5 focus-within:border-accent">
                <span className="text-sm text-ink-soft/50">$</span>
                <input
                  inputMode="numeric"
                  aria-label="Budget in dollars"
                  value={budgetText}
                  onChange={(e) => setBudgetText(e.target.value)}
                  onBlur={() => {
                    const dollars = Number(budgetText.replace(/[,\s]/g, ''))
                    if (Number.isFinite(dollars) && dollars >= 0) setDraft((d) => ({ ...d, budget: { amountMinor: Math.round(dollars * 100), currency: 'USD' } }))
                    else setBudgetText(String(budgetDollars))
                  }}
                  className="tnum w-full bg-transparent px-1 py-1.5 text-sm text-ink focus:outline-none"
                />
              </span>
            )}
            <p className="text-[10px] text-ink-soft/50">Standard-size stand-ins have no price and don't count toward the budget.</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="serif flex items-center gap-1.5 text-lg text-ink">
            <ShieldCheck size={16} className="text-emerald-700" />
            Safety rules
          </h2>
          <p className="text-xs text-ink-soft/60">All {rules.items.length} rules are hard: a layout is saved only if every one passes.</p>
          <ul className="divide-y divide-canvas-line rounded-control border border-canvas-line">
            {rules.items.map((rule) => (
              <li key={rule.id} className="px-2.5 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-ink">{rule.title}</span>
                  <span className="shrink-0 text-[10px] text-ink-soft/40">{rule.id}</span>
                </div>
                <p className="text-[11px] text-ink-soft/70">
                  {rule.description}
                  {Object.keys(rule.params).length > 0 && <span className="text-ink-soft/50"> ({Object.entries(rule.params).map(([k, v]) => `${k} ${v}`).join(', ')})</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {generationActive && (
          <section aria-live="polite" className="space-y-1 rounded-control border border-accent/30 bg-accent-pale/60 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-accent-deep">
              <Loader2 size={13} className="animate-spin" />
              {generation?.status === 'queued' || !generation?.stage ? 'Queued…' : STAGE_LABEL[generation.stage]}
            </p>
            {generation && generation.progress.turn > 0 && (
              <p className="text-[11px] text-ink-soft">
                Planner turn {generation.progress.turn} of {generation.progress.maxTurns}
                {lastTurn?.violations != null ? ` · last check: ${lastTurn.violations} rule violation${lastTurn.violations === 1 ? '' : 's'}` : ''}
              </p>
            )}
            {lastTurn?.details && lastTurn.details.length > 0 && (
              <ul className="list-disc pl-4 text-[10px] text-ink-soft/70">
                {lastTurn.details.slice(0, 3).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-ink-soft/60">This can take a few minutes. You can keep working; results open when the layout is ready.</p>
          </section>
        )}

        {lastAttempt && (
          <section className="rounded-control border border-red-200 bg-red-50/50 p-3">
            <p className="mb-2 text-xs font-semibold text-red-900">
              {lastAttempt.status === 'stale' ? 'The project changed while generating, so that result was not applied.' : `Generation failed${lastAttempt.errorCode ? ` (${lastAttempt.errorCode})` : ''}.`}
              {project.activeLayoutId ? ' Your previous layout is unchanged.' : ''}
            </p>
            <GenerationFindings findings={lastAttempt.issues} roomLabel={roomLabel} />
          </section>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-canvas-line p-4">
        {applyError != null && <ErrorBanner error={applyError} onReload={() => reload().then(() => setApplyError(null))} onDismiss={() => setApplyError(null)} />}
        <label className="flex items-center justify-between gap-2 text-xs text-ink-soft">
          Generate for
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="rounded-control border border-canvas-line bg-app px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none">
            <option value="home">Whole home</option>
            {project.floor.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} only (keep other rooms)
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}`)}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            disabled={submitting || generationActive}
            onClick={apply}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-app transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-40"
          >
            <Sparkles size={15} />
            {submitting ? 'Saving…' : generationActive ? 'Generating…' : 'Apply & generate'}
          </button>
        </div>
      </div>
    </>
  )
}
