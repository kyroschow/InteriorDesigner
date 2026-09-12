# drafted.ai — Tech Stack & UI Design System

Research date: **2026-09-12**
Target: `https://www.drafted.ai` (signed-out landing page)
Purpose: inform a faithful, **offline-capable** clone.

> **Evidence labelling used throughout**
> - `[OBSERVED]` — I fetched the bytes and read them. Quoted strings are verbatim from the response.
> - `[INFERRED]` — a conclusion I drew from observed evidence, not directly seen.
> - `[UNVERIFIED]` — could not check (auth-gated or not loaded).

---

## 1. Method & scope

What I actually did:

| Step | Result |
|---|---|
| `curl` of `https://www.drafted.ai/` | HTTP 200, 133,911 bytes of HTML |
| Fetched all 3 linked stylesheets | 3,203 + 369,635 + 38,373 bytes |
| Fetched **all 48** linked JS chunks | 5.2 MB total |
| Grepped bundles for library signatures | see §7 |
| Unauthenticated GET on discovered `/api/*` routes | see §9 |

**Scope limit that matters a lot:** everything below comes from the **signed-out landing page**. The actual plan editor is behind Clerk auth. Next.js code-splits, so the editor's own chunks were never linked from this page and I could not download them. Statements about the editor are therefore evidence *about* the editor found in shipped code, not the editor's code itself. This is called out explicitly in §6.

`WebFetch` returned **HTTP 403** on this host (Cloudflare bot challenge). Plain `curl` with a browser User-Agent succeeded. Worth knowing if you script against it later.

I did **not** attempt to authenticate, create an account, or access any user's data. All inspection was unauthenticated and limited to publicly served assets.

---

## 2. Hosting, edge, framework

`[OBSERVED]` Response headers:

```
server: cloudflare
x-powered-by: Next.js
x-vercel-cache: MISS
x-vercel-id: iad1::iad1::hftv6-...
x-matched-path: /
x-clerk-auth-status: signed-out
x-clerk-auth-reason: session-token-and-uat-missing
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
```

- **Next.js App Router** — confirmed by the `rsc` / `next-router-state-tree` Vary headers and an inline RSC flight payload in the HTML.
- **Exact version: Next.js `16.3.1`** `[OBSERVED]` — leaked by a source path left in a bundle:
  `node_modules/.bun/next@16.3.1+1aa8df51a398247c/node_modules/next/dist/compiled/buffer/`
- **Turbopack** is the bundler `[OBSERVED]` — there is a chunk literally named `turbopack-1v_0y4qu69y_r.js`, and asset URLs use the `/_next/static/immutable/chunks/` layout with content-hashed *names* (not the classic webpack `[id]-[hash].js` shape).
- **Bun is the package manager** `[OBSERVED]` — the `.bun/` path segment and the `pkg@ver+hash` directory convention are Bun's isolated-install layout. `[INFERRED]` They likely use Bun for install/CI; the runtime is still Node on Vercel.
- **Vercel** hosting with **Cloudflare** proxying in front `[OBSERVED]`.
- **Clerk** for auth `[OBSERVED]` — Clerk middleware sets the `x-clerk-auth-*` headers; `@clerk/clerk-js@6` is loaded from a **vanity/CNAME domain** `https://clerk.drafted.ai/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, and `@clerk+shared@4.12.2` appears in a bundle path.

---

## 3. Typography — fully resolved

`[OBSERVED]` The `link:` response header preloads exactly two woff2 files, which are the latin subsets of the two families:

```
</_next/static/immutable/media/0c8f209abc35ee02-s.p.0q59resy_4ije.woff2>; rel=preload; as=font   → DM Serif Display (latin)
</_next/static/immutable/media/83afe278b6a6bb3c-s.p.45535valc9rzk.woff2>; rel=preload; as=font   → Inter (latin)
```

`[OBSERVED]` `@font-face` rules from the CSS:

- **`DM Serif Display`** — `font-weight: 400`, single weight, `font-display: swap`. Two subsets (latin, latin-ext). **This is the "Drafted" wordmark serif.** Confirmed, not a guess.
- **`Inter`** — **variable font**, `font-weight: 100 900`, `font-display: swap`, 7 unicode-range subsets (latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese, symbols). **This is the UI sans.**

`[OBSERVED]` Next.js generates metric-matched fallbacks to kill layout shift:

```css
@font-face{font-family:DM Serif Display Fallback;src:local(Times New Roman);
  ascent-override:94.37%;descent-override:30.51%;line-gap-override:0.0%;size-adjust:109.78%}
@font-face{font-family:Inter Fallback;src:local(Arial);
  ascent-override:90.44%;descent-override:22.52%;line-gap-override:0.0%;size-adjust:107.12%}
```

`[OBSERVED]` The Tailwind font tokens:

```css
--font-dm-serif-display: "DM Serif Display", "DM Serif Display Fallback";
--font-inter:            "Inter", "Inter Fallback";
--font-serif:            var(--font-dm-serif-display);
--font-mono:             ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                         "Liberation Mono", "Courier New", monospace;
```

So `.font-sans` → Inter, `.font-serif` → DM Serif Display, `.font-mono` → **system stack, no webfont loaded**.

`[OBSERVED]` These are wired up via `next/font` CSS-module variables on `<body>`:
`class="dm_serif_display_41901ade-module__YjsXUa__variable inter_fe8b9d92-module__LINzvG__variable antialiased overscroll-none h-full overflow-hidden"`

**Takeaway for the clone:** DM Serif Display 400 for display/wordmark, Inter variable 100–900 for everything else, system mono. Both are open-source (OFL) and available as npm packages — see §11.

---

## 4. Color system & design tokens

### 4.1 The page ground is set inline, not by a token

`[OBSERVED]` `<body ... style="background-color:#FAF8F2">` — hard-coded inline on the body element.

`#FAF8F2` is the warm cream you identified (your `#F5F2EC` guess was close, the real value is slightly lighter and warmer). It appears **40 times** across the CSS, plus ~15 more times with alpha suffixes (`#faf8f2cc`, `#faf8f2e6`, `#faf8f299`, …) for scrims and gradient stops.

### 4.2 The shadcn token layer is *stock* — this is the key structural insight

`[OBSERVED]` The full shadcn/ui CSS-variable contract is present, in both light and dark blocks:

```
--background --foreground --card --card-foreground --popover --popover-foreground
--primary --primary-foreground --secondary --secondary-foreground
--muted --muted-foreground --accent --accent-foreground --destructive
--border --input --ring --chart-1..--chart-5
--sidebar --sidebar-foreground --sidebar-primary --sidebar-primary-foreground
--sidebar-accent --sidebar-accent-foreground --sidebar-border --sidebar-ring
--radius: .625rem
```

`[OBSERVED]` But the **values are shadcn's untouched `neutral` defaults**:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#fff` | `#0a0a0a` |
| `--foreground` | `#0a0a0a` | `#fafafa` |
| `--primary` | `#171717` | `#e5e5e5` |
| `--primary-foreground` | `#fafafa` | `#171717` |
| `--muted` | `#f5f5f5` | `#262626` |
| `--muted-foreground` | `#737373` | `#a1a1a1` |
| `--card` / `--popover` | `#fff` | `#171717` |
| `--destructive` | `#e40014` | `#ff6568` |
| `--radius` | `.625rem` (10px) | — |

`[INFERRED]` **They did not re-theme shadcn.** The warm identity is painted *on top* using Tailwind arbitrary-value utilities. Evidence `[OBSERVED]`: the compiled CSS contains classes like `.bg-\[\#B49F60\]`, `.border-\[\#B49F60\]\/35`, `.fill-\[\#d2b96c\]`, `.text-\[\#B89A45\]`, `.bg-\[\#B4BCA5\]` — i.e. literal hex written inline in `className`, not semantic tokens.

This is worth copying *deliberately or not at all*. It's pragmatic but it means the palette lives in hundreds of scattered class strings. **For the clone I recommend promoting these to real tokens** (see §11.4).

Note also `--radius: .625rem` = **10px**, and each shadcn token is emitted twice — once as hex, once as a `lab()` color (e.g. `--primary: lab(7.78201% -.0000149012 0)`). `[INFERRED]` That's Tailwind v4's / Lightning CSS's wide-gamut output with a hex fallback.

### 4.3 The actual brand palette (by frequency in compiled CSS)

`[OBSERVED]` Top colors, ranked by occurrence count:

**Cream / paper**
| Hex | Count | Role `[INFERRED]` |
|---|---|---|
| `#FAF8F2` | 40 | page ground, canvas paper |
| `#FDFCF9` | 11 | raised surface / card |
| `#F9F4E4` | 5 | warm tint fill |
| `#FFFEF9`, `#FFF8E1`, `#FFF7DC`, `#FFF7ED` | 2–3 each | highlight washes |

**Brass / gold — the accent family**
| Hex | Count |
|---|---|
| `#B49F60` | 26 |
| `#D2B96C` | 14 |
| `#D6A900` | 12 |
| `#E0C679` | 7 |
| `#C9AD5C`, `#C5AD63`, `#C1AA50` | 4 each |
| `#B7902E`, `#9F8B52`, `#F3E5AC` | 4 each |

`#B49F60` is the dominant brand gold. `[OBSERVED]` There is also a `"gold-shimmer"` appearance variant in a component (`'gold-shimmer'===e.appearance`) and a `project-progress-banner-hover-shimmer` class — so gold is used for premium/progress affordances.

**Sage green — secondary accent**
`#B4BCA5` (10), `#DEE2D6` (6), `#EEF1E9` (4), `#B0B4A8` (3).

**Warm neutrals — Tailwind `stone`, not `neutral`**
`[OBSERVED]` `#D6D3D1` (stone-300, 12), `#A8A29E` (stone-400, 8), `#1C1917` (stone-900, 9), `#78716C` (stone-500, 4), `#292524` (stone-800, 3). Utility classes confirm: `bg-stone-800`, `text-stone-500`.

`[INFERRED]` So there's a slight split personality: shadcn components carry cool `neutral` tokens, while hand-written marketing/app chrome uses warm `stone`. The clone should pick **`stone` throughout** for coherence.

**Near-black buttons** — `#171717` (12) and `#0a0a0a` (6), i.e. the stock shadcn `--primary`. Your observation is confirmed: near-black primary buttons on cream.

**Charts** `[OBSERVED]` — they *did* override the chart ramp: light `#1447e6, #009588, #104e64, #ac4bff, #f99c00`; dark `#f05100, #00bb7f, #f99c00, #fcbb00, #ff2357`.

---

## 5. Component library — shadcn/ui on Radix, confirmed

`[OBSERVED]` Radix UI primitives are present and identifiable:

- `window[Symbol.for("radix-ui")] = !0` — the Radix global marker.
- Radix CSS custom properties: `--radix-popper-transform-origin`, `--radix-popper-available-height`, `--radix-select-trigger-height`, `--radix-select-trigger-width`, `--radix-popover-trigger-width`, `--radix-tooltip-content-transform-origin`.
- `data-radix-focus-guard` focus-guard spans, `data-radix-collection-item`.
- Auto-generated ids of the form `` `radix-${i}` ``.

Components identified in use: **Tooltip, Select, Popover, Dialog/focus-scope**, plus a shadcn **Sidebar** (from the `--sidebar-*` token block).

`[OBSERVED]` The decisive proof of **shadcn/ui** specifically — this is the verbatim current shadcn Button base class, found intact in a bundle:

```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium
transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none
[&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-n…
```

The `[&_svg:not([class*='size-'])]:size-4` selector is a shadcn fingerprint. Also observed: the `cn()` helper (minified as `eT.cn` / `G.cn` / `s.cn`), and `cva` (class-variance-authority) and `clsx` signatures.

`[OBSERVED]` **Tailwind CSS v4**, not v3 — `@layer theme`, `@layer base`, `@layer components`, `@layer utilities`, 2,380 `--tw-*` variables, 475 `color-mix()` calls, `oklch()`, and the v4-only paren syntax `origin-(--radix-select-content-transform-origin)` / `max-h-(--radix-select-content-available-height)`.

`[OBSERVED]` `tailwindcss-animate` / `tw-animate-css` classes: `animate-in`, `slide-in-from-bottom-2`, `fade-in`.
`[OBSERVED]` **lucide** icons (3 references).
`[OBSERVED]` **vaul** (1 reference) — the shadcn Drawer primitive.
`[OBSERVED]` Extreme z-indexes on overlays: `z-[100000000002]` `[INFERRED]` — chosen to sit above the Intercom widget.

---

## 6. Canvas tech — **Konva / Canvas2D**, and no three.js

This is the headline answer. **The plan editor is Konva, i.e. Canvas2D — not SVG, not WebGL.**

### 6.1 Evidence for Konva `[OBSERVED]`

First-party instrumentation code, shipped on the landing page, names Konva explicitly:

```js
// inline <script> in the document <head>:
if (window.localStorage && window.localStorage.getItem("draftedKonvaLoadDebug") === "1") {
  performance.mark("drafted:startup:root-layout-inline");
}
```

And in chunk `44kxp5hz0dd81.js`, inside a React component using `useEffect`/`useLayoutEffect`:

```js
nh("konva ready", { width: rB.width, height: rB.height })
np("konva stage committed", { width: rB.width, height: rB.height })
markEditorProfile("konva paint opportunity", { width: rB.width, height: rB.height })
markEditorProfile("konva post-paint work enabled", ...)
nh("editor surface visible", { widthFt: eF.widthFt, depthFt: eF.depthFt })
// nearby: "room polygon…", ncVertices(...)
```

Note `"konva stage committed"` — **Stage** is Konva's root node type. And `widthFt` / `depthFt` confirm a real-world-units floor-plan editor.

### 6.2 The honest caveat `[OBSERVED]`

The **Konva library itself is not in these 48 chunks.** I grepped for Konva internals and found **zero** hits for `sceneFunc`, `hitStrokeWidth`, `hitCanvas`, `batchDraw`, `getLayer`, `"Konva warning"`.

`[INFERRED]` Konva is in a lazily-loaded, auth-gated editor chunk. The evidence above is drafted.ai's *own* code calling into and profiling Konva, which is strong first-party evidence of the dependency — but I did not read Konva's bytes. `[UNVERIFIED]` whether they use raw `konva` or `react-konva` (0 hits for `react-konva`, but the surrounding code is clearly React with hooks driving a Stage, so `[INFERRED]` react-konva or a thin in-house React binding is likely).

### 6.3 No three.js / WebGL scene engine `[OBSERVED]`

Case-sensitive grep for `THREE` across all 5.2 MB: **0 hits.** Also 0 for `react-three`, `WebGLRenderer`, `BufferGeometry`, `PerspectiveCamera`, `OrbitControls`, `GLTFLoader`, `useGLTF`, `fabric`, `PixiJS`, `babylon`, `paper.js`.

(My initial case-*insensitive* scan showed 8 "three" hits — all were the English word "three". A single `R3f` hit was a substring of a base64 `blurDataURL`. Both false positives, ruled out.)

The only `getContext("webgl…")` and `getContext("2d")` calls (10 each) live in the two Rive-bearing chunks — they belong to **Rive's** renderer, not to a 3D scene.

### 6.4 Rive is the animation runtime `[OBSERVED]`

```js
// bundled package manifest:
{"name":"@rive-app/canvas","version":"2.37.7","description":"Rive's canvas based web api."}

// and a WASM runtime pulled from a public CDN at runtime:
locateFile: () => "https://unpkg.com/@rive-app/canvas-advanced@2.32.0/rive.wasm"

// with a WebGL capability error string:
"Unable to create the renderer, your environment may not support WebGL.
 Try the @rive-app/canvas runtime as an alternative."
```

**This is an offline blocker to note:** the Rive WASM is fetched from `unpkg.com` at runtime. Any offline clone must vendor its WASM locally.

### 6.5 How 3D actually works here `[INFERRED]`

`[OBSERVED]` Export formats are declared in zod enums:

```js
z.enum(["ifc","revit-link","dxf","softplan","glb","glb-editable","pdf"])
z.enum(["queued","running","succeeded","failed"])     // job status
z.enum(["pending","ready","failed"]), format: z.enum(["obj","glb"])
```

`[OBSERVED]` UI copy describing the GLB export:

> "Interactive 3D model. Open in Three.js, Blender, model-viewer, or any glTF viewer."
> "Compatible with Three.js, model-viewer, Blender, Sketchfab, and most 3D web viewers."

Note carefully: `three.js` and `model-viewer` are named **only as consumers of the exported file**, in marketing copy. They are *not* dependencies of drafted.ai.

`[INFERRED]` 3D generation is an **asynchronous server-side job** (`queued → running → succeeded → failed`, `generationId`, `byteSize`, `errorMessage`), producing downloadable OBJ/GLB/IFC artifacts. The browser is a 2D Konva editor; the 3D is baked server-side. `[UNVERIFIED]` whether an in-app 3D preview exists behind auth.

---

## 7. State, data and persistence `[OBSERVED]`

| Library | Evidence | Version |
|---|---|---|
| **Zustand** | `node_modules/.bun/zustand@5.0.14+.../esm/middleware.mjs`; `[zustand devtools middleware]` and `[zustand persist middleware]` console strings | **5.0.14** |
| **TanStack Query** | `QueryClient` (53), `queryKey` (364), `useQuery` (116), `staleTime` (74), `dehydrate` (31), `hydrate` (78), `mutationCache` | (unversioned) |
| **Query persistence → IndexedDB** | `indexedDB.open("drafted-query-cache", 1)`, with `persistClient` / `restoreClient` and a debounced `setTimeout` + `requestIdleCallback(…, {timeout:3000})` write | — |
| **Dexie** | real library internals present: `DexieError`, `BulkError`, `ModifyError`, `Dexie.Promise`, `"Dexie: Need to reopen db"`, `PR1398_maxLoop` | (unversioned) |
| **Zod** | 1,115 references — used pervasively for API/domain schemas | (unversioned) |
| **clsx / cva** | `cn()` helper, variant maps | — |

`[INFERRED]` The architecture: Zustand holds editor/UI state (with `persist` + `devtools` middleware), TanStack Query owns server state and is persisted to IndexedDB so the app rehydrates instantly on reload, and Dexie manages a separate richer IndexedDB store `[UNVERIFIED]` — most plausibly offline draft/plan documents.

`[OBSERVED]` Zustand 5 + Next 16 + Tailwind 4 + shadcn = a **current, 2026-era** stack, not a legacy one.

---

## 8. Third-party scripts `[OBSERVED]`

| Service | Detail |
|---|---|
| **Clerk** | `https://clerk.drafted.ai/npm/@clerk/clerk-js@6/dist/clerk.browser.js` (vanity CNAME), `@clerk/shared@4.12.2` |
| **Intercom** | app id `v7grr9i5`; lazy-loaded via `window.__draftedLoadIntercom("lazy")`; `widget.intercom.io`, `api-iam.intercom.io`; launcher hidden on touch screens < 768px; sets `data-intercom-notifications-suppressed="true"` |
| **PostHog** | `{api_host:"https://t.drafted.ai", ui_host:"https://us.posthog.com", defaults:"2026-01-30", capture_exceptions:true, debug:false}` — **reverse-proxied through their own domain** to dodge ad-blockers; `capture_exceptions` means PostHog doubles as error tracking |
| **Google Ads / gtag** | `googletagmanager.com/gtag/js?id=AW-17766858145` — an `AW-` id, so **conversion tracking**, lazy-loaded |
| **Stripe** | `confirmPayment({redirect:"if_required"})` → **Stripe Elements** (embedded, not hosted Checkout redirect) + `stripe_checkout_sessions`, `stripe_subscriptions`, `drafted_subscriptions`; a `data-drafted-stripe-preconnect` hint and a `CheckoutTransitionOverlay` component |
| **Cloudflare Turnstile** | `<link rel="preconnect" href="https://challenges.cloudflare.com" crossorigin>` |
| **Rive** | `unpkg.com/@rive-app/canvas-advanced@2.32.0/rive.wasm` |
| **Figma html.to.design** | `<Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="lazyOnload">` |

Two things worth flagging:

1. **The Figma script is almost certainly unintentional.** `mcp.figma.com/mcp/html-to-design/capture.js` is the capture agent for Figma's *html.to.design* import tool. `[INFERRED]` A designer or engineer added it to import the live site into Figma and never removed it — it is shipping to every production visitor. Do **not** replicate this in the clone.
2. All analytics/support scripts use `strategy="lazyOnload"` `[OBSERVED]` — a deliberate performance choice, keeping the critical path to Clerk + the app shell only.

`[OBSERVED]` There is also a defensive hydration hack in an inline script: it strips `fdprocessedid` attributes (injected by some password managers) from nodes before React hydrates, alongside `suppressHydrationWarning` on `<body>`.

---

## 9. Public API routes discovered `[OBSERVED]`

Extracted from string literals in the bundles. I issued **unauthenticated GETs only**, and only to confirm reachability:

| Route | Status | Notes |
|---|---|---|
| `/api/explore-plan-count` | **200** | `{"totalCount":140474}` — ~140k public plans |
| `/api/outage-message` | **200** | `{"message":"","updatedAt":"2026-06-05T01:51:58.477Z","updatedByEmail":"<redacted internal address>"}` |
| `/api/house-shapes-v2/current-manifest` | 500 | errors when unauthenticated |
| `/api/community-drafts` | 405 | not a GET endpoint |

Also referenced in code but not probed: `/api/aura/room-location`, `/api/collab-session-end`, `/api/creator-profile`, `/api/explore-click`, `/api/explore-impressions`, `/api/subscriptions-v2/{checkout,checkout/prepare,country-context,pricing-quote,admin-pricing-countries,usage-overage-checkout}`, `/api/subscriptions-v2/export-bundles/{checkout,prepare}`.

**Minor security note for your awareness (not something to replicate):** `/api/outage-message` publicly returns an internal staff email address in `updatedByEmail`. I have redacted it here rather than reproduce it. `[INFERRED]` an admin field leaking through a public status endpoint.

`[OBSERVED]` `/api/collab-session-end` implies **multiplayer / collaborative editing sessions**. `/api/aura/room-location` implies an internal AI service codenamed "aura". Pricing is **country-aware** (`country-context`, `admin-pricing-countries`, `pricing-quote`) with usage **overages** and **export bundles** — so the business model is subscription + metered exports.

---

## 10. Product surface `[OBSERVED]`

Hero copy, verbatim from the HTML:

> **"Design House Plans Instantly with AI"**
> "Generate floor plans, 3D models, renders, and professional CAD/BIM exports."

CTAs: "Get Started", "Start Creating", "Sign In", "Learn".
Onboarding persona picker: Homebuyer / Architect / Builder / Developer / Interior Designer / Drafter / Real Estate Agent / Other.
A community gallery with plan titles, author handles and relative timestamps ("Warm Natural 4-Bed House — Paige — 1w ago").

Export catalogue `[OBSERVED]`: **PDF**, **CAD (.dxf)**, **BIM (3D .ifc)**, **Web dev (.glb)**, plus `softplan`, `revit-link`, `glb-editable` (labelled "Blender"). Entitlements are `"included" | "paid"`; export slots have a reservation lifecycle `"not_reserved" | "reserved" | "committed" | "released"`.

Also observed: room semantics with capacity modelling — `--room-capacity-bar-color`, `--room-capacity-delta-color`, and generated room descriptions like `{"concept_name":"Solarium","description":"An immersive sunroom for a 6-8 person lounge set."}`.

---

## 11. Recommended stack for an offline, Node-22, aarch64-Linux clone

Constraints: **fully local**, no Clerk, no Vercel, no cloud, aarch64 Linux, Node 22.

### Summary table

| Layer | drafted.ai (observed) | Recommendation for the clone | Why |
|---|---|---|---|
| Framework | Next.js 16.3.1 / Turbopack / Vercel | **Next.js 16 `output: "standalone"`**, self-hosted via `node server.js` | Same mental model and file layout as the target, but standalone emits a self-contained `.next/standalone` with its own minimal `node_modules` and runs on bare Node 22. Pure JS — no native compile step, so aarch64 is a non-issue. |
| 2D canvas | **Konva (Canvas2D)** | **`konva` + `react-konva`** | Match the target exactly. Pure JS + `CanvasRenderingContext2D`, zero native deps, identical on aarch64. Gives you Stage/Layer/Group/Transformer, hit-testing via an offscreen hit canvas, and `listening:false` layers for static content. Comfortably handles the few-thousand-node scenes a floor plan needs. |
| 3D | server-side job → GLB/IFC | **`three` + `@react-three/fiber` + `@react-three/drei`**, rendered **client-side** | You have no job queue offline, so extrude the 2D plan to 3D in the browser. WebGL2 works fine under Mesa on aarch64. Export with three's built-in `GLTFExporter` — pure JS, no Blender, no server. |
| State | Zustand 5.0.14 + TanStack Query | **Zustand 5** for editor/UI + **TanStack Query only if you keep an HTTP layer** | Zustand matches the target and is ~1 KB. If the clone talks to a local SQLite server, keep Query; if it's browser-only, drop Query entirely and read Dexie directly — Query's cache layer buys you nothing when the "server" is local. |
| Undo/redo | `[UNVERIFIED]` | **`immer` patches + a command stack**, or **`zundo`** | A plan editor lives or dies on undo. Immer's `produceWithPatches` gives you inverse patches for free, which is far more robust than snapshotting a large scene graph on every drag. |
| Styling | Tailwind v4 + shadcn/ui + Radix | **Tailwind v4 + shadcn/ui + Radix** — but **tokenise the brand** | Identical to target. Deviate on one point: promote `#FAF8F2`/`#B49F60`/`#B4BCA5` into real `@theme` tokens instead of `bg-[#B49F60]` arbitrary values (see §11.4). |
| Fonts | `next/font/google` | **`@fontsource/inter` + `@fontsource-variable/inter` + `@fontsource/dm-serif-display`** | **Critical for offline.** `next/font/google` hits Google's servers *at build time* and will fail on an air-gapped box. Fontsource ships the woff2 files inside the npm package — installs once, builds forever offline. Both fonts are OFL-licensed. |
| Persistence | Postgres-ish + IndexedDB caches | **SQLite via `node:sqlite` (Node 22 built-in) or `better-sqlite3`**, + **Dexie** in the browser | See §11.5. |
| Auth | Clerk | **Drop it** — single local user, or `lucia`-style cookie session over SQLite | No cloud identity provider can work offline. For a local-first clone, auth is usually pure overhead. |
| Analytics / support / payments | PostHog, gtag, Intercom, Stripe, Turnstile | **Remove all** | None can function offline, and all are pure telemetry/monetisation with no bearing on fidelity of the editor. |
| Animation | Rive (WASM from unpkg) | **CSS + `motion`**, or **vendor Rive's `.wasm` locally** | If you want Rive, copy `rive.wasm` into `/public` and set `locateFile: () => "/rive.wasm"`. Otherwise CSS keyframes + `tailwindcss-animate` cover the shimmer/fade vocabulary. |

### 11.1 Framework — Next.js 16 standalone

`next.config.ts`:

```ts
export default {
  output: "standalone",
  images: { unoptimized: true },  // avoids sharp at runtime; see note
}
```

Justification: it mirrors drafted.ai's App Router structure, so component boundaries, route layout and RSC/client-component splits transfer over 1:1. `output: "standalone"` is the officially supported no-Vercel path and produces a directory you can run with plain `node`. Everything in the Next.js runtime is JavaScript — the only native module in a default install is `sharp` for image optimisation, which is why `images.unoptimized` is set above; `sharp` *does* publish `linux-arm64` prebuilds, so keep image optimisation if you want it, but disabling it removes one moving part.

**Alternative if you want less machinery:** Vite + React + React Router. Faster HMR, simpler offline story, no server needed at all. The trade-off is you lose SSR and the file-system router, so the layout diverges from the original. Choose Next.js for fidelity, Vite for velocity.

### 11.2 2D canvas — Konva

Copy the original. Konva is the right call for this problem class and drafted.ai independently reached the same conclusion.

- **Why not SVG:** a detailed floor plan is thousands of nodes (walls, openings, fixtures, dimension strings, hatching). As live DOM, pan/zoom stalls because every transform triggers layout and paint across the whole tree. Konva rasterises to a single `<canvas>`.
- **Why not raw Canvas2D:** you'd hand-roll a scene graph, hit-testing, event dispatch, drag/transform handles and layer caching. Konva is precisely that library, and it's mature.
- **Why not WebGL for 2D:** unnecessary. Floor plans are hundreds-to-thousands of shapes, not hundreds of thousands, and Canvas2D text and dashed-stroke rendering is far better than what you'd get from a 2D WebGL batcher without significant work.

Practical notes: put static geometry on a cached layer with `listening: false`; keep interactive handles on a separate layer; use `Konva.Transformer` for selection; drive `scale`/`position` on the Stage for pan/zoom. Store plan geometry in **feet** as the source of truth (the original does — `widthFt`, `depthFt`) and convert to pixels only at render time.

### 11.3 3D — three.js + react-three-fiber

The original defers 3D to a server job, which you cannot do offline. Do it client-side instead:

1. Take the 2D room polygons from the Konva model.
2. `THREE.Shape` per room → `ExtrudeGeometry` for walls at storey height; boolean-free openings by building wall segments around door/window spans (avoid CSG libraries — they're slow and fragile).
3. `@react-three/fiber` to render, `@react-three/drei` for `OrbitControls`, `Environment`, `Bounds`.
4. Export via `GLTFExporter` → `.glb`, matching the original's headline 3D export.

All pure JS + WebGL2. On aarch64 Linux this runs on Mesa; if the box is headless and you need offscreen renders, `swiftshader`/`llvmpipe` works but is slow — prefer a real GPU or skip server-side rendering entirely.

For the other exports: **DXF is a plain-text format** — emit it directly or with `dxf-writer` (pure JS), no native CAD kernel required. **PDF** via `pdf-lib` or `jspdf` (both pure JS). Avoid Puppeteer/Chromium-based PDF on aarch64 — it's a large, fragile dependency. **IFC** is genuinely hard; I'd descope it for a clone.

### 11.4 Styling — Tailwind v4 + shadcn, with a real token layer

Match the original's Tailwind v4 + shadcn/ui + Radix choice, but fix its one weakness. Instead of scattering `bg-[#B49F60]`, define the brand in `@theme`:

```css
@import "tailwindcss";

@theme {
  --font-sans:  "Inter", "Inter Fallback", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "DM Serif Display", "Times New Roman", serif;

  --color-paper:      #FAF8F2;  /* page ground — observed on drafted.ai <body> */
  --color-paper-rise: #FDFCF9;  /* raised surface */
  --color-brass:      #B49F60;  /* primary accent */
  --color-brass-lite: #D2B96C;
  --color-sage:       #B4BCA5;  /* secondary accent */
  --color-sage-lite:  #DEE2D6;

  --radius: 0.625rem;           /* 10px — observed */
}

:root {
  --background: var(--color-paper);
  --foreground: #1C1917;        /* stone-900, warm — not shadcn's cool #0a0a0a */
  --primary:    #171717;        /* near-black buttons, as observed */
  --primary-foreground: #FAFAFA;
  --border:     #D6D3D1;        /* stone-300 */
  --muted-foreground: #78716C;  /* stone-500 */
}
```

Then use `bg-paper`, `text-brass`, `border-sage` everywhere. Two concrete improvements over the original: dark mode and any future re-skin become a one-file change, and you avoid the original's `neutral`-vs-`stone` split by committing to warm `stone` neutrals throughout.

Install shadcn components locally with the CLI once (it needs network), then they're vendored into your repo as source — fully offline thereafter, which suits this constraint well.

### 11.5 Persistence — pick by architecture

**If browser-only (simplest, genuinely offline-first):**
**Dexie** over IndexedDB, exactly as the original uses it. Store plans as JSON documents, keep an autosave with a debounced write, and expose import/export to `.json` files so users can move plans between machines. No server process at all.

**If you keep a local server (recommended if you want a real file-backed library of plans):**
**SQLite**. Two options on Node 22:

- **`node:sqlite`** — built into Node 22, **zero install, zero native compilation, works on aarch64 out of the box**. It was experimental in early Node 22 (needs `--experimental-sqlite` on older 22.x; stabilised later in the line). This is the lowest-friction choice for an air-gapped aarch64 box.
- **`better-sqlite3`** — faster and more featureful, synchronous API that suits Electron/local apps well. It ships `linux-arm64` prebuilds, so it usually installs without compiling; if the prebuild is missing you need `python3` + a C++ toolchain present, which is a real risk on a locked-down box.

Pair either with **Drizzle ORM** (pure TypeScript, no codegen daemon) if you want typed queries. Store the plan document as a JSON column plus indexed metadata columns — floor-plan geometry is a document, not a relational schema, and modelling every wall as a row will only cost you.

**Recommendation:** Dexie in the browser as the working store, SQLite on the local server as the durable library, and a plain "save/load" sync between them. That mirrors the original's two-tier IndexedDB-plus-backend shape while staying entirely on one machine.

### 11.6 Offline gotchas to plan for

| Risk | Fix |
|---|---|
| `next/font/google` fetches at **build** time | Use `@fontsource*` packages |
| Rive WASM fetched from `unpkg.com` at **runtime** | Vendor `rive.wasm` into `/public`, set `locateFile` |
| shadcn CLI needs network to add components | Run it once while online; components are then vendored source |
| `better-sqlite3` may compile from source | Prefer built-in `node:sqlite`, or verify the `linux-arm64` prebuild resolves |
| `sharp` native binary | `images.unoptimized: true`, or confirm the arm64 prebuild |
| Puppeteer/Chromium for PDF | Avoid — use `pdf-lib` instead |
| Any CDN `<script>` | Bundle everything; set a CSP that forbids remote origins so a regression fails loudly |

---

## 12. Confidence

### Verified with high confidence `[OBSERVED]`
- Next.js **16.3.1**, App Router, **Turbopack**, **Bun** as package manager, Vercel + Cloudflare, Clerk (`@clerk/clerk-js@6`, `@clerk/shared@4.12.2`).
- **DM Serif Display** (400) as the wordmark serif and **Inter** (variable, 100–900) as the UI sans — confirmed from `@font-face` rules and the two preloaded woff2 files, plus the `--font-serif` / `--font-inter` tokens.
- **Tailwind CSS v4** (not v3) — `@layer theme`, `color-mix()`, `oklch()`, v4 paren syntax.
- **shadcn/ui on Radix UI** — verbatim shadcn Button base class, `Symbol.for("radix-ui")`, `--radix-*` variables, `data-radix-focus-guard`, the `--sidebar-*` token block, `cn()`, `cva`, `vaul`, `lucide`.
- Page ground **`#FAF8F2`** (inline on `<body>`), brand gold **`#B49F60`**, sage **`#B4BCA5`**, near-black primary **`#171717`**, `--radius: .625rem`.
- shadcn tokens are at **stock `neutral` values**; the warm identity is applied via arbitrary-value utilities.
- **Zustand 5.0.14**, **TanStack Query** persisted to IndexedDB (`drafted-query-cache`), **Dexie**, **Zod** (1,115 refs).
- **Rive** `@rive-app/canvas@2.37.7` + `canvas-advanced@2.32.0` WASM from unpkg.
- Third-party: PostHog (proxied via `t.drafted.ai`), Google Ads `AW-17766858145`, Intercom `v7grr9i5`, Stripe Elements, Cloudflare Turnstile, and the stray Figma html.to.design capture script.
- 17 `/api/*` routes; 4 probed unauthenticated; `explore-plan-count` returns `140474`.
- **No three.js, no react-three-fiber, no fabric.js, no Pixi, no Babylon** in any of the 48 chunks (case-sensitive `THREE` → 0 hits).

### Strong but not byte-level proven `[INFERRED]`
- **The editor is Konva/Canvas2D.** drafted.ai's own shipped code emits perf marks `"konva ready"`, `"konva stage committed"`, `"konva paint opportunity"` and reads a `draftedKonvaLoadDebug` localStorage flag. That is first-party code naming the dependency. **However, Konva's library bytes are not in the landing-page chunks** (0 hits for `sceneFunc`, `batchDraw`, `hitCanvas`), so it loads from an auth-gated chunk I could not fetch.
- 3D is generated by an async **server-side job** (from the `queued/running/succeeded/failed` + `generationId` + `byteSize` schemas), not rendered client-side.
- The Figma capture script is an accidental leftover.

### Could NOT verify `[UNVERIFIED]`
- **Anything inside the authenticated editor** — this is the single biggest gap. The editor's chunks, its component structure, its actual Konva usage patterns, undo/redo implementation, and any in-app 3D preview are all behind Clerk. I did not attempt to authenticate.
- `konva` vs `react-konva`, and the exact Konva version.
- Backend language, database, AI model/provider, and the "aura" service.
- Versions of TanStack Query, Dexie, Zod, Radix, and Tailwind's exact patch release.
- Collaborative-editing transport (`/api/collab-session-end` proves sessions exist; the mechanism — WebSocket, CRDT, polling — is unknown).
- Whether `--radius`/token values differ inside the app shell versus the marketing page.

### Methodological caveats
- Everything reflects the **signed-out landing page on 2026-09-12**. Chunk names are content-hashed and will change on their next deploy.
- `WebFetch` is 403-blocked by Cloudflare on this host; `curl` with a browser UA works.
- Minified identifiers mean absence of a string is weaker evidence than presence. That said, library *names* and distinctive class/property strings survive minification, which is what every conclusion above rests on.
