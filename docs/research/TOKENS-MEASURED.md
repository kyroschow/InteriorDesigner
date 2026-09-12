# Measured design tokens — sampled from the screenshots (ground truth)

These hex values were sampled **programmatically** from the original PNGs with PIL, from
screenshots that are **not dimmed** by the tutorial scrim. Trust these over any value read
by eye from a dimmed screenshot.

> **Important:** Screenshots taken while the onboarding tutorial overlay is up are darkened to
> ~73% brightness. Undimmed screenshots are the ones from `15-16-30` onward, plus any where the
> header strip at (1450,172) samples as `#FAF9F2`. Colours sampled from dimmed shots read ~27% too
> dark (e.g. bedroom pink reads `#B99387` dimmed vs `#FEDFD6` true).

## App chrome

| Token | Hex | Notes |
|---|---|---|
| `--app-bg` | `#FAF9F2` | warm cream page background (also reads `#FAF8F2`) |
| `--canvas-bg` | `#DEE2D6` | sage grey-green editor canvas |
| `--card` | `#FFFFFF` | panel/card surface (`#FCFBFB` where overlapped) |
| `--card-alt` | `#FEFEFC` | secondary panel surface |
| `--ink` | `#0C0A09` | primary button fill, active stepper pill (Tailwind `stone-950`) |
| `--ink-soft` | `#1C1917` | secondary dark buttons (Tailwind `stone-900`) |
| `--muted` | `#E7E5E4` | credits pill background (Tailwind `stone-200`) |
| `--wall-stroke` | `#818181` | floor-plan wall line |
| `--accent-warn` | `#F9F4E4` | "Public" pill background (pale gold) |

The near-blacks and greys line up exactly with Tailwind's **stone** scale, so use `stone-*`
utilities and only define the cream/sage/room colours as custom tokens.

## Floor-plan room fills (authoritative)

Sampled from the rendered results plan in `Screenshot from 2026-09-12 15-20-11.png`.

| Room | Fill | Family |
|---|---|---|
| Primary Bed(room) | `#FDC7B7` | warm salmon (deeper = "primary") |
| Bedroom | `#FEDFD6` | warm pink |
| Primary Bath(room) | `#B3D5F3` | blue (deeper = "primary") |
| Bathroom | `#D1E5F7` | pale blue |
| Living | `#FEEAB2` | butter yellow |
| Dining | `#FEEAB2` | butter yellow |
| Kitchen | `#FEEAB2` | butter yellow |
| Nook / Breakfast Nook | `#FEEAB2` | butter yellow (same family) |
| Hallway | `#F0E7C4` | muted olive-cream (between yellow and neutral) |
| Laundry | `#DCFAF2` | mint |
| Garage | `#F1E7EC` | pale lavender (unheated) |
| Closet (Primary/Bed) | `#FDDBC1` | tan/apricot |

### The colour rule

Room colour is keyed to **function group**, not to the individual room:

- **Sleeping** (Primary Bed, Bedroom) → salmon/pink
- **Bathing** (Primary Bath, Bathroom) → blue
- **Living/eating** (Living, Dining, Kitchen, Nook, Family, Den, Sunroom) → butter yellow
- **Storage** (Primary Closet, Bed Closet, Pantry, Linen) → tan
- **Utility** (Laundry, Mudroom, Mechanical) → mint
- **Unheated** (Garage, Porch, Deck, Patio) → pale lavender
- **Circulation** (Hallway, Foyer, Stairs) → muted olive-cream

Within a group, the **"Primary" variant is one step more saturated** than the plain variant
(`#FDC7B7` vs `#FEDFD6`; `#B3D5F3` vs `#D1E5F7`). Apply the same rule to any room the
screenshots don't show.

## Typography

- Wordmark **"Drafted"** and all headings: a high-contrast serif. Closest free match:
  **Fraunces** (or Playfair Display / Instrument Serif). Loaded in `index.html`.
- UI text, labels, numbers: a neutral grotesque — **Inter**.
- Area figures (`2,489 ft²`) are set noticeably larger and in the serif on detail panels.

## Measured layout facts

- Browser viewport in the captures: the app content area starts at x≈364, y≈150 within a
  1920×1200 screen — i.e. the app itself renders at roughly **1556×1050 CSS px**. Design for a
  ~1440px-wide desktop layout.
- Top app bar height ≈ 48px, containing: wordmark · `My Studio` · breadcrumb/Back · centred
  3-step stepper · `Learn` · credits pill · avatar.
- The step-2 editor canvas fills the area below the bar, with floating toolbar centred at top
  and floating panels overlaid left (`My House Shape` / `My Rooms`) and right (roof preview).

---

## Corroboration from the real app's compiled CSS

The `web-stack.md` research downloaded drafted.ai's actual stylesheets. Its findings match the
screenshot sampling and add the accent family:

- Page ground `#FAF8F2` (40 occurrences) — matches the sampled `#FAF9F2`.
- Raised surface `#FDFCF9`; warm tint fill `#F9F4E4` — matches the sampled "Public" pill.
- **Brass/gold accent family** (the app's only real accent): `#B49F60` (26×), `#D2B96C` (14×),
  `#D6A900` (12×), `#E0C679` (7×), `#B7902E`, `#F3E5AC`. Used for upgrade/subscription tints,
  tutorial eyebrow text and progress rings.
- The real app is Tailwind v4 + shadcn/ui + Radix, with `--radius: .625rem` = **10px** on controls.

All of the above are now defined as `@theme` tokens in `src/styles/index.css`:
`bg-app`, `bg-canvas`, `text-ink`, `bg-brass`, `bg-gold`, `bg-room-sleep`, `rounded-control`, …

## Fonts — offline requirement

The real app loads fonts via `next/font/google`. **We must not**: the clone has to build and run
with no network. Fonts are therefore self-hosted from npm and imported at the top of
`src/styles/index.css`:

- `@fontsource-variable/inter` → `font-sans` (`'Inter Variable'`)
- `@fontsource/fraunces` (400/600/700) → `font-serif`

There is **no `<link>` to fonts.googleapis.com in `index.html`** — do not add one back.
