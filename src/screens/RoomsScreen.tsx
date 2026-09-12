import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/api/client'
import { ErrorBanner } from '@/components/ErrorBanner'
import { RoomStatusBadge } from '@/components/RoomStatusBadge'
import { polygonSizeM, type DraftRoomRect } from '@/lib/sceneCoordinates'
import { formatAreaM2, formatLengthM, inputToMeters, lengthInputUnit, metersToInput } from '@/lib/units'
import { useProjectContext } from '@/screens/ProjectLayout'
import { ROOM_TYPE_LABELS, ROOM_TYPES, type Point, type Project, type RoomType } from '@/types/interior'

const MIN_ROOM_M = 1
const round3 = (n: number) => Math.round(n * 1000) / 1000
const EPS = 1e-6

interface Partitions {
  /** Depth of the south row (Y up), i.e. where the east–west wall sits. */
  splitY: number
  southX: number
  northX: number
}

interface Grid {
  south: [string, string]
  north: [string, string]
  partitions: Partitions
}

function roomRects(project: Project): DraftRoomRect[] {
  return project.floor.rooms.map((room) => {
    const origin = project.roomTransforms.find((t) => t.roomId === room.id)?.origin ?? { x: 0, y: 0 }
    const { w, d } = polygonSizeM(room.polygon)
    return { id: room.id, name: room.label, type: room.type, x: origin.x, y: origin.y, w, d }
  })
}

/** The editable family: two rooms in the south row and two in the north row, each row split by one wall. */
function detectGrid(rects: DraftRoomRect[], footprint: { w: number; d: number }): Grid | null {
  if (rects.length !== 4) return null
  const south = rects.filter((r) => Math.abs(r.y) < EPS).sort((a, b) => a.x - b.x)
  const north = rects.filter((r) => r.y > EPS).sort((a, b) => a.x - b.x)
  if (south.length !== 2 || north.length !== 2) return null
  const splitY = south[0].d
  const rowOk = (row: DraftRoomRect[], y: number, d: number) =>
    row.every((r) => Math.abs(r.y - y) < EPS && Math.abs(r.d - d) < EPS) && Math.abs(row[0].x) < EPS && Math.abs(row[0].w - row[1].x) < EPS && Math.abs(row[1].x + row[1].w - footprint.w) < EPS
  if (!rowOk(south, 0, splitY) || !rowOk(north, splitY, footprint.d - splitY)) return null
  return { south: [south[0].id, south[1].id], north: [north[0].id, north[1].id], partitions: { splitY, southX: south[0].w, northX: north[0].w } }
}

const rectPolygon = (w: number, d: number): Point[] => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: d },
  { x: 0, y: d },
]

/** Confirm room boundaries and categories (flow step 2). Saves with `PUT /rooms`. */
export function RoomsScreen() {
  const { project, applyProject, reload, write, setRoomsPreview, selectedRoomId, setSelectedRoomId } = useProjectContext()
  const navigate = useNavigate()
  const unit = project.unitSystem
  const footprint = project.footprintM

  const saved = useMemo(() => roomRects(project), [project])
  const grid = useMemo(() => detectGrid(saved, footprint), [saved, footprint])
  const savedMeta = useMemo(() => Object.fromEntries(saved.map((r) => [r.id, { label: r.name, type: r.type }])), [saved])

  const [meta, setMeta] = useState(savedMeta)
  const [partitions, setPartitions] = useState<Partitions | null>(grid?.partitions ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const draftRects: DraftRoomRect[] = useMemo(() => {
    if (!grid || !partitions) return saved.map((r) => ({ ...r, name: meta[r.id]?.label ?? r.name, type: meta[r.id]?.type ?? r.type }))
    const { splitY, southX, northX } = partitions
    const place = (id: string, x: number, y: number, w: number, d: number): DraftRoomRect => ({
      id,
      name: meta[id]?.label ?? '',
      type: meta[id]?.type ?? 'living_room',
      x: round3(x),
      y: round3(y),
      w: round3(w),
      d: round3(d),
    })
    return saved.map((r) => {
      if (r.id === grid.south[0]) return place(r.id, 0, 0, southX, splitY)
      if (r.id === grid.south[1]) return place(r.id, southX, 0, footprint.w - southX, splitY)
      if (r.id === grid.north[0]) return place(r.id, 0, splitY, northX, footprint.d - splitY)
      return place(r.id, northX, splitY, footprint.w - northX, footprint.d - splitY)
    })
  }, [grid, partitions, saved, meta, footprint])

  const geometryDirty = draftRects.some((r, i) => ['x', 'y', 'w', 'd'].some((k) => Math.abs(r[k as 'x'] - saved[i][k as 'x']) > EPS))
  const metaDirty = saved.some((r) => meta[r.id]?.label !== r.name || meta[r.id]?.type !== r.type)
  const dirty = geometryDirty || metaDirty

  // Adopt saved values after a save or reload, unless mid-edit.
  useEffect(() => {
    if (!dirty) {
      setMeta(savedMeta)
      setPartitions(grid?.partitions ?? null)
    }
  }, [project.revision]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setRoomsPreview(geometryDirty || metaDirty ? draftRects : null)
  }, [draftRects, geometryDirty, metaDirty, setRoomsPreview])
  useEffect(() => () => setRoomsPreview(null), [setRoomsPreview])

  const problems = [
    ...draftRects.filter((r) => r.w < MIN_ROOM_M || r.d < MIN_ROOM_M).map((r) => `${r.name || 'A room'} must be at least ${formatLengthM(MIN_ROOM_M, unit)} on each side.`),
    ...draftRects.filter((r) => !r.name.trim()).map(() => 'Every room needs a name.'),
  ]

  async function save(): Promise<boolean> {
    setSaving(true)
    setError(null)
    try {
      await write(async (current) => {
        const next = await api.replaceRooms(current.id, {
          expectedRevision: current.revision,
          rooms: draftRects.map((r) => ({ id: r.id, label: r.name.trim(), type: r.type, polygon: rectPolygon(r.w, r.d) })),
          roomTransforms: draftRects.map((r) => ({ roomId: r.id, origin: { x: r.x, y: r.y } })),
        })
        applyProject(next)
        return next
      })
      return true
    } catch (err) {
      setError(err)
      return false
    } finally {
      setSaving(false)
    }
  }

  const label = (id: string) => meta[id]?.label || 'room'
  const statusOf = (id: string) => project.roomStatuses.find((s) => s.roomId === id)?.status

  return (
    <>
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Rooms</h2>
          <p className="text-xs text-ink-soft/60">
            Name each room, pick its category and move the walls between them. The outer shell, doors, windows and fixtures stay where they are.
          </p>
        </div>

        {grid && partitions ? (
          <div className="panel space-y-3 rounded-card p-4">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">Walls</h3>
            <PartitionInput
              label={`${label(grid.south[0])} / ${label(grid.north[0])} wall — depth of the bottom row`}
              meters={partitions.splitY}
              min={MIN_ROOM_M}
              max={footprint.d - MIN_ROOM_M}
              unit={unit}
              onChange={(splitY) => setPartitions({ ...partitions, splitY })}
            />
            <PartitionInput
              label={`${label(grid.south[0])} | ${label(grid.south[1])} wall`}
              meters={partitions.southX}
              min={MIN_ROOM_M}
              max={footprint.w - MIN_ROOM_M}
              unit={unit}
              onChange={(southX) => setPartitions({ ...partitions, southX })}
            />
            <PartitionInput
              label={`${label(grid.north[0])} | ${label(grid.north[1])} wall`}
              meters={partitions.northX}
              min={MIN_ROOM_M}
              max={footprint.w - MIN_ROOM_M}
              unit={unit}
              onChange={(northX) => setPartitions({ ...partitions, northX })}
            />
          </div>
        ) : (
          <p className="rounded-control bg-canvas px-3 py-2 text-xs text-ink-soft">This layout's walls can't be edited here; you can still rename and recategorize rooms.</p>
        )}

        {draftRects.map((r) => (
          <div
            key={r.id}
            className={clsx('panel space-y-2 rounded-card p-4', selectedRoomId === r.id && 'ring-2 ring-accent')}
            onFocus={() => setSelectedRoomId(r.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="tnum text-[11px] text-ink-soft/50">
                {formatLengthM(r.w, unit)} × {formatLengthM(r.d, unit)} · {formatAreaM2(r.w * r.d, unit)}
              </span>
              <RoomStatusBadge status={statusOf(r.id)} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="text-[11px] text-ink-soft">
                Name
                <input
                  value={meta[r.id]?.label ?? ''}
                  maxLength={120}
                  onChange={(e) => setMeta({ ...meta, [r.id]: { ...meta[r.id], label: e.target.value } })}
                  className="mt-0.5 w-full rounded-control border border-canvas-line bg-app px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-[11px] text-ink-soft">
                Category
                <select
                  value={meta[r.id]?.type}
                  onChange={(e) => setMeta({ ...meta, [r.id]: { ...meta[r.id], type: e.target.value as RoomType } })}
                  className="mt-0.5 block rounded-control border border-canvas-line bg-app px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ROOM_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 space-y-2 border-t border-canvas-line p-4">
        {problems.length > 0 && <p className="text-xs text-amber-700">{problems[0]}</p>}
        {error != null && <ErrorBanner error={error} onReload={() => reload().then(() => setError(null))} onDismiss={() => setError(null)} />}
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setMeta(savedMeta)
                setPartitions(grid?.partitions ?? null)
                setError(null)
              }}
              className="rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            disabled={saving || problems.length > 0}
            onClick={async () => {
              if (!dirty || (await save())) navigate(`/projects/${project.id}`)
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-app transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : dirty ? 'Save rooms & continue' : 'Next: Furnish'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

interface PartitionInputProps {
  label: string
  meters: number
  min: number
  max: number
  unit: Project['unitSystem']
  onChange: (meters: number) => void
}

/** Numeric + slider control for one wall position — the keyboard-accessible alternative to dragging. */
function PartitionInput({ label, meters, min, max, unit, onChange }: PartitionInputProps) {
  const [text, setText] = useState(String(metersToInput(meters, unit)))
  useEffect(() => setText(String(metersToInput(meters, unit))), [meters, unit])
  const commit = () => {
    const value = Number(text)
    if (!Number.isFinite(value)) return setText(String(metersToInput(meters, unit)))
    const m = Math.min(max, Math.max(min, inputToMeters(value, unit)))
    onChange(m)
    setText(String(metersToInput(m, unit)))
  }
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-soft">{label}</span>
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-ink-soft/60">
          <input
            inputMode="decimal"
            value={text}
            aria-label={label}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="tnum w-16 rounded-control border border-canvas-line bg-app px-1.5 py-0.5 text-right text-xs text-ink focus:border-accent focus:outline-none"
          />
          {lengthInputUnit(unit)}
        </label>
      </div>
      <input
        type="range"
        aria-hidden
        tabIndex={-1}
        min={min}
        max={max}
        step={0.05}
        value={meters}
        onChange={(e) => onChange(round3(Number(e.target.value)))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  )
}
