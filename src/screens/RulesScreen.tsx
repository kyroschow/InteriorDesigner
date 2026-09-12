import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { api } from '@/api/client'
import { ErrorBanner } from '@/components/ErrorBanner'
import { GenerationFindings } from '@/components/GenerationFindings'
import { RuleMultiSelect } from '@/components/RuleMultiSelect'
import { StagedLoadingOverlay } from '@/components/StagedLoadingOverlay'
import { isTerminal } from '@/hooks/useGeneration'
import { useProjectContext } from '@/screens/ProjectLayout'
import { MAX_TEXT_LENGTH, type CreateGenerationRequest } from '@/types/interior'

const STAGES = ['Queued…', 'Choosing products…', 'Placing furniture…', 'Checking the layout…']
const STAGE_INDEX = { selecting: 1, placing: 2, validating: 3 }

/** Design brief, rule selection and Apply: configuration PUT (if dirty), then generation POST and polling. */
export function RulesScreen() {
  const { project, rules, draft, setDraft, saveDraft, generation, generationActive, applyProject, reload, write } = useProjectContext()
  const navigate = useNavigate()
  const [scope, setScope] = useState<string>('home')
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<unknown>(null)
  const [startedId, setStartedId] = useState<string | null>(null)
  const attempt = useRef<{ payload: string; key: string; generationId: string | null } | null>(null)

  const [budgetText, setBudgetText] = useState((draft.budget.amountMinor / 100).toFixed(0))
  useEffect(() => setBudgetText((draft.budget.amountMinor / 100).toFixed(0)), [draft.budget.amountMinor])

  useEffect(() => {
    if (startedId && generation?.id === startedId && generation.status === 'succeeded') navigate(`/projects/${project.id}/export`)
  }, [generation, startedId, navigate, project.id])

  const roomLabel = (id: string) => project.floor.rooms.find((r) => r.id === id)?.label ?? id
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

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
        applyProject({ ...current, latestGenerationId: created.generationId })
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

  const lastAttempt = generation && generation.id === project.latestGenerationId && (generation.status === 'failed' || generation.status === 'stale') ? generation : null
  const notes = project.configuration.roomInstructions.filter((i) => i.note.trim()).map((i) => ({ room: roomLabel(i.roomId), text: i.note }))
  const ruleNotices = project.configurationFindings.filter((f) => f.code.startsWith('RULE_'))

  return (
    <>
      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-4">
        <section className="space-y-3">
          <div>
            <h2 className="serif text-lg text-ink">Design brief</h2>
            <p className="text-xs text-ink-soft/60">The prompt guides style; the budget is a hard cap on new furniture for the whole home.</p>
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
          <label className="block text-xs font-medium text-ink-soft">
            Budget (USD, before tax and shipping)
            <span className="mt-1 flex items-center rounded-control border border-canvas-line bg-app px-2.5 focus-within:border-accent">
              <span className="text-sm text-ink-soft/50">$</span>
              <input
                inputMode="numeric"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                onBlur={() => {
                  const dollars = Number(budgetText.replace(/[,\s]/g, ''))
                  if (Number.isFinite(dollars) && dollars >= 0) setDraft((d) => ({ ...d, budget: { amountMinor: Math.round(dollars * 100), currency: 'USD' } }))
                  else setBudgetText((draft.budget.amountMinor / 100).toFixed(0))
                }}
                className="tnum w-full bg-transparent px-1 py-1.5 text-sm text-ink focus:outline-none"
              />
            </span>
          </label>
        </section>

        <section className="space-y-2">
          <h2 className="serif text-lg text-ink">Design rules</h2>
          <p className="text-xs text-ink-soft/60">Baseline geometry checks always run. Library rules apply only where an evaluator exists.</p>
          <RuleMultiSelect
            rules={rules.items}
            beliefSystems={rules.beliefSystems}
            roomTypes={project.floor.rooms.map((r) => r.type)}
            selected={draft.selectedRuleIds}
            enabledBeliefSystems={draft.enabledBeliefSystems}
            notices={ruleNotices}
            onToggleRule={(id) => setDraft((d) => ({ ...d, selectedRuleIds: toggle(d.selectedRuleIds, id) }))}
            onToggleBelief={(id) => setDraft((d) => ({ ...d, enabledBeliefSystems: toggle(d.enabledBeliefSystems, id) }))}
          />
        </section>

        {lastAttempt && (
          <section className="rounded-control border border-red-200 bg-red-50/50 p-3">
            <p className="mb-2 text-xs font-semibold text-red-900">
              {lastAttempt.status === 'stale' ? 'The last generation went stale.' : (lastAttempt.error?.message ?? 'The last generation failed.')}
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
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded-control border border-canvas-line bg-app px-2 py-1 text-xs text-ink focus:border-accent focus:outline-none"
          >
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

      {generationActive && (
        <StagedLoadingOverlay stages={STAGES} stageIndex={generation?.stage ? STAGE_INDEX[generation.stage] : 0} notes={notes} />
      )}
    </>
  )
}
