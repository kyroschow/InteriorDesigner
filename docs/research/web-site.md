# Drafted (drafted.ai) — Public Product Research

**Researched:** 2026-09-12
**Target:** https://www.drafted.ai — "Design House Plans Instantly with AI"
**Scope:** public marketing site, `/learn` content hub, public SEO gallery, and the **publicly-served client JavaScript bundles** of the web app.

---

## 0. Method & Confidence

### What I actually did

| Step | Detail |
|---|---|
| `WebFetch` on `https://www.drafted.ai` | **Blocked — HTTP 403.** The site rejects the WebFetch user agent. |
| `curl` with a normal desktop Chrome UA | **HTTP 200.** All fetching below was done this way. |
| Sitemaps | Fetched `https://www.drafted.ai/robots.txt`, `/sitemap.xml`, `/main-sitemap.xml`, `/seo-filter-sitemap/sitemap/0.xml` |
| Pages | Fetched **all 31 URLs** in `main-sitemap.xml` + 4 additional pages discovered via internal links |
| App bundles | Fetched **59 JavaScript chunks** from `https://www.drafted.ai/_next/static/immutable/chunks/*.js` referenced by the served HTML, and read the catalogs/labels/flags embedded in them |

### Confidence tiers used in this document

- **[V-PAGE]** — VERIFIED, human-readable copy from a page I fetched. URL cited.
- **[V-CODE]** — VERIFIED, literal string/data structure read out of a public JS bundle I fetched. Bundle URL cited. This is the *product's own source of truth* for catalogs (room types, materials, roof shapes, plan tiers), but it reflects what is **shipped**, which can include feature-flagged or unreleased items — flagged where visible.
- **[V-SHOT]** — Corroborated by the local screenshots in `/home/dell/Pictures/Screenshots/` that were the basis of this request. Used only where it independently confirms a **[V-CODE]** finding.
- **[INFERRED]** — My reasoning. Explicitly labelled. Not a product claim.

### What I could NOT verify
- **No prices.** There is no public `/pricing` page (`/pricing`, `/learn/pricing`, `/about`, `/terms`, `/privacy` all return **404**). The subscription page lives behind auth at `/app/subscriptions`, and the bundle fetches all monetary amounts from a runtime API (`subscriptionsV2PricingOffer`) — no dollar figures are baked into the JS.
- **No credit allowances per tier.** The plan cards render `Plans & 3D`, `Renders`, `File Downloads` numbers from a server `allowances` payload. The numbers are not in the client code.
- **Nothing behind the login.** `robots.txt` disallows `/app/create`, `/app/studio`, `/app/drafts/all`, `/app/checkout/*`, `/auth`, `/admin/*`; I did not authenticate.
- I did not run or interact with the app.

---

## 1. What the product does, end to end

> "Design House Plans Instantly with AI — Generate floor plans, 3D models, renders, and professional CAD/BIM exports." **[V-PAGE]** — https://www.drafted.ai

Drafted is an **AI residential floor-plan generator built around an interactive canvas rather than a text prompt.** The user supplies structured inputs (a room list, room sizes, a lot/buildable area, a house footprint shape, a square-footage target, and optionally the placement of specific rooms), and a specialised model generates a complete single-storey plan — walls, doors, windows — plus a live-synchronised 3D massing model. The user then edits, regenerates selected regions, applies exterior materials, renders, and exports to PDF / CAD / BIM / 3D formats.

**Explicitly not a prompt tool** **[V-PAGE]** — https://www.drafted.ai/learn/faq:
> "Drafted's AI floor plan generator does not use a free-form text prompt; it generates plans from structured inputs including a room list, lot size, house shape, and optional room placements on a canvas."

**The five V2 capabilities, verbatim** **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2:
1. **Guided generation** — "Define rooms, lot requirements, house shape, square footage, a sketched footprint, and optional room placements before Drafted generates the rest of the plan."
2. **Targeted regeneration** — "Redesign one selected area without discarding the parts of the plan that already work."
3. **Live 3D editing and rendering** — "Keep the floor plan and matching 3D model synchronized while editing the footprint, porch, roof, and exterior materials."
4. **Projects and design history** — "Keep requirements, edits, visualizations, exports, and previous iterations connected to the same project."
5. **Professional exports** — "Download PDF, DXF, GLB, and IFC files for sharing, CAD drafting, 3D, and BIM workflows."

**The advertised workflow, verbatim** **[V-PAGE]** — https://www.drafted.ai/learn/ai-floor-plan-generators:
1. "Define your wish list: rooms, rooms sizes, lot shape, and house shape to give the AI a clear starting point."
2. "Draw out your ideas as a plan: place your rooms and adjust your house shape to see it change live in the 3D model."
3. "Generate concepts: create several layout directions quickly, then compare how each one handles the same priorities."
4. "Review the layout: compare flow, room relationships, and fit with the original idea."
5. "Refine and review: edit walls, doors, and windows, then invite your team, builder, architect, client, or loved ones to review the project without starting over each time."
6. "Move into development: continue your strongest direction with PDF floor plans, DXF exports for CAD workflows, IFC exports for BIM workflows, or GLB 3D files."

**Scale claims**
- "Explore 85,000+ AI-created house plans." **[V-PAGE]** — meta description of https://www.drafted.ai/house-plans
- "Drafted has already been used in 194 countries." **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2

**Press logos on the landing page** (Business Insider, TechCrunch, Reviewed), linking to: **[V-PAGE]** — https://www.drafted.ai
- `https://www.businessinsider.com/drafted-16m-funding-reshape-home-design-with-ai-2026-5`
- `https://techcrunch.com/2025/12/23/this-founder-just-landed-backing-for-a-second-go-at-the-same-problem-affordable-custom-home-design/`
- `https://www.reviewed.com/cooking/features/kbis-2026-award-winners`

---

## 2. Complete advertised feature list

All **[V-PAGE]** unless noted. Sources: https://www.drafted.ai/learn/news/drafted-v2, https://www.drafted.ai/learn/ai-floor-plan-generators, https://www.drafted.ai/learn/faq, https://www.drafted.ai/learn/best-floor-plan-generator-software

**Input & generation**
- Structured room list ("wish list") with per-room size tiers
- Buildable-area / lot width × depth input
- Target home size (square-footage target)
- House footprint shape: pick from a library, or draw/sculpt a custom one
- Drag-and-drop placement of specific rooms onto the canvas before generating ("Drafted V2 can generate a complete house around one placed room")
- Freehand sketch → structured plan ("Drafted also turns a loose sketch into a structured floor plan")
- Imperial **and** metric units
- Generate multiple layout directions per round, compare side by side

**Editing**
- Edit generated walls
- Edit door and window placement
- Targeted/area regeneration — "Click rooms to regenerate them" / "Regenerate selected rooms; unselected rooms stay fixed" **[V-CODE]** — `/_next/static/immutable/chunks/44kxp5hz0dd81.js`
- Editor constraint modes: **Lot** ("Constrain Lot"), **Shape** ("Constrain Footprint"), **Rooms** ("Constrain Rooms"), **Roof** ("Edit Roof") **[V-CODE]** — same bundle
- Roof-form editing per roof section (hip ⇄ gable etc.)
- Design history — "preserves earlier iterations… return to previous directions"
- Reset Canvas / Clear Rooms from Canvas / "Starting over?" full reset **[V-CODE]**

**Visualisation**
- Live 3D model generated in-browser, synchronised with the 2D plan; reflects doors, windows, garages, gabled roofs, porches
- Exterior material application across 5 slots, then AI render ("Furnish & Render", "Re-Render", "Render with New Materials") **[V-CODE]**
- Interior rooms come **auto-staged with furniture**
- Saveable/loadable **material palettes** ("Load Palette" / "Load Material Palette") **[V-CODE]**

**Collaboration & organisation**
- Projects with cover photo, name, target size, buildable area, room counts
- Design library, Shortlist, "New" designs, archived designs
- Invite collaborators ("Invite Professionals, Teammates, and Partners"); roles incl. View Only; pending invites; request-access flow for private designs **[V-CODE]**
- Public/Private design toggle ("Make Public" / "Make Private") **[V-CODE]**
- Share popover: Share via Email, device share sheet, Facebook, LinkedIn, Pinterest, X; "Share or Print" **[V-CODE]**
- **Remix** — fork someone else's public design into your own project ("Remix this design", "View All Remixes", "Remixed from") **[V-CODE]**
- Referral: "Give 50% off their first month. Get 50% off your next month." **[V-CODE]**

**Outputs** — see §8.

**Explicitly "coming soon" / not available**
- Upload an existing floor plan / blueprint / inspiration image — "We're working on it." **[V-PAGE]** — https://www.drafted.ai/learn/faq and https://www.drafted.ai/learn/use-cases (labelled "Coming soon")
- Multi-storey homes, second floors, basements — waitlist only (§6)
- Revit plug-in ("Drafted in Revit", "Generate AI house plans directly in Revit") exists as a **Pro-tier feature** and a landing page at https://www.drafted.ai/revit **[V-CODE]** + **[V-PAGE]**

---

## 3. The 3-step flow

The app header reads **`1 Create Room List — 2 Place Rooms & Shape — 3 Results`**.

Route→label map, literal from the bundle **[V-CODE]** — `/_next/static/immutable/chunks/105-2w1yxo0uy.js`:
```js
{"room-list":"Create Room List", editor:"Place Rooms & Shape", review:"Results"}
```
URL shape: `https://www.drafted.ai/app/studio/projects/{projectId}/create/{timelineKey}/room-list` → `/editor` → `/review` **[V-CODE]** + **[V-SHOT]**

### Step 1 — Create Room List
In-product tutorial copy, verbatim **[V-CODE]** — `/_next/static/immutable/chunks/255-emztmua27.js` (flow id `room-list-editor`):
- "This is the Tutorial" / "You will have full freedom after the tutorial to use the product however you want."
- **"Start from your beds and baths"** — "Prefilled from your project. Adjust for this design if you'd like."
- **"Create your dream room list"** — "List every room you'd like included. This helps our AI understand your vision."
- "Click continue when you're ready"

Other Step-1 UI strings **[V-CODE]** — `44kxp5hz0dd81.js`:
- Panels: `Room Catalog` (left), `My Rooms` (right), `Clear All`
- Per-room `S / M / L` size selector, `+` / `−` counters, a `MAX` badge when a room type hits its cap **[V-SHOT]**
- Footer readout: `Total {n} ft² | Heated {n} ft² | 1 Story`, and CTA `Continue with only {n} rooms`
- Guard modal: **"Please create a full room list." / "Partial room lists will generate incorrect results."**
- Also: "A complete room list helps us create better designs.", "Add rooms to continue", "Add a closet"

Marketing framing **[V-PAGE]** — https://www.drafted.ai/learn/ai-floor-plan-generators:
> "All you need is a list of rooms to generate an initial layout. Once you can see the first concept, you can refine the wish list, adjust the plan, and generate better options."

### Step 2 — Place Rooms & Shape (the canvas / editor)
Tutorial copy, verbatim **[V-CODE]** — `255-emztmua27.js` (flow id `canvas-editor`):
- **"Welcome to your canvas"** — "This is where you shape your home, place key rooms, and let AI do the rest."
- **"Start from adding a shape"** — "Sculpt your home in 3D, and our AI will create layouts to fit."
- **"Place Rooms That Matter Most"** — "Drag rooms from My Rooms onto the canvas, then fine-tune their location, size, and shape."
- **"Ready to Create?"** — "Add as much or as little as you like to progress your design."

House-shape sub-flow **[V-CODE]** — same bundle (flow id `house-shape-editor`):
- **"Choose A House Shape"** — "Pick one from the library or create your own. Hover to preview it in 3D."
- **"Shape It Your Way"** — "Select and adjust your home's shape and watch it update live in 3D."
- Related UI: `My House Shape`, `Custom Shape`, `Current Shape`, `Choose Different Shape`, `Browse, edit or create the shape of your home.`, pinned shapes (`Delete this pinned shape?`)

Canvas constraints & inputs **[V-CODE]**:
- `Buildable Area` — "The usable area available for the home, if known." / "The usable area inside setbacks. Keep this separate from the overall lot size." Fields: `Width`, `Depth`.
- `Target Home Size` — a drag knob in **250 sq ft increments**, or type an exact value
- Validation strings: `Buildable Area is too small for your house.`, `Home Size is too large for this Buildable Area`, `Home Size is nearing this Buildable Area's capacity`, `Home Size is at this Buildable Area's capacity`, `Can't shrink further, unless you reduce your rooms.`
- `Ceiling Height` is shown as a fixed **10 ft**

Marketing framing **[V-PAGE]** — https://www.drafted.ai/learn/ai-floor-plan-generators:
> "Drafted uses an interactive floor plan canvas where you show the tool what you want, rather than trying to describe it… a floor plan canvas with editable inputs passes more information at once so the AI can respond to the actual shape and placement intentions."

### Step 3 — Results (review)
**[V-CODE]** `44kxp5hz0dd81.js` + **[V-PAGE]** drafted-v2:
- Generated layout options arrive as a batch you compare; "Press Generate. Every design in the round is planned inside the outline."
- Re-roll with no input change: "Keep the same brief and press Generate again. Nothing changes on the input side, so you get a fresh batch against requirements you already know are right."
- Reuse an earlier brief: "Click Reuse under any earlier prompt, or press Generate again without changing anything."
- Targeted regeneration: "Click rooms to regenerate them" — "Press Generate. What you kept is preserved, and the next batch is designed around it."
- Failure copy: "Generation Failed" / "Something went wrong while generating this draft. This can happen if the constraints were too difficult to satisfy."
- Then: **Furnish & Render** → **Choose Exterior Materials** → **Download Files** / **Share** / **Remix**
- A design detail panel shows: `Total Area`, `Area Breakdown` (`Heated Area`, `Unheated Area`, `Garage`, outdoor), `Dimensions` (width × depth), `Ceiling Height`, `Stories`, `Rooms` **[V-SHOT]**

---

## 4. Room catalog

The app ships a versioned JSON catalog. **[V-CODE]** — `https://www.drafted.ai/_next/static/immutable/chunks/0a477x9ggxuwb.js`
```
{"schema":"drafted.room-catalog","version":"1.0.0","generated_at":"2025-11-04", "types": { … 35 entries … }}
```

### 4.1 Sidebar grouping (exactly as rendered)
Read from the `RoomCatalogSidebar` JSX. **[V-CODE]** — `44kxp5hz0dd81.js`. Corroborated **[V-SHOT]**.

| Group | Colour-band sub-group | Rooms (UI label) |
|---|---|---|
| **Beds & Baths** | `#FFDFD6` | Primary Bed, Bedroom |
| | `#D0E5F7` | Primary Bath, Bathroom |
| | `#FFDBC1` | Primary Closet *(desc: "Auto-included with Primary Bed")*, Bed Closet *(desc: "Auto-included with Bedroom")* |
| **Living Spaces** | `#FFE08F` | Kitchen, Dining, Breakfast Nook |
| | `#FFE08F` | Pantry |
| | `#FFE08F` | Living, **Den 🔒**, **Family Room 🔒**, **Sunroom 🔒** |
| | `#FFE08F` | Foyer |
| **Outdoor Spaces** | `#D9F7DA` | Front Porch, Outdoor Living |
| **Specialty Spaces** | `#FFDBEA` | Office |
| **Garage & Utility** | `#F1E7EC` | Garage |
| | `#DBFAF2` | Laundry |
| | `#E9E9E9` | Mudroom, Utility Closet, Storage |

Internal onboarding keys for those bands: `bedroom`, `bathroom`, `closet`, `eating`, `outdoor`, `specialty`, `garage`, `laundry`, `back_of_house`. **[V-CODE]**

### 4.2 The locked (premium) room types — exact
```js
l7 = ["den","family_room","sunroom"];  ce = new Set(l7);
// exported as isPremiumRoomKind
```
**[V-CODE]** — `44kxp5hz0dd81.js`. This is the definitive list: **Den, Family Room, Sunroom — and nothing else.** The catalog JSON independently marks exactly these three `"is_premium": true`. **[V-CODE]** — `0a477x9ggxuwb.js`

The gate component is `PremiumRoomCatalogGroup`, rendered in place of those three rows when locked. Its markup, verbatim:
- Amber badge text: **`UPGRADE SUBSCRIPTION`** (styled `#D2B96C` border / `#F3E5AC` fill / `#695719` text)
- Button: `View` → `router.push("/app/subscriptions")`
- Each locked row keeps its icon + name, shows a **lock** glyph, and `aria-label` = `` `View plans to add ${displayName}` ``
- Analytics event: `trackPremiumRoomUpgradeClicked({projectId, surface})`, surface `"room-list"`
- Remix path has its own gate: **"This remix includes locked room types that require a subscription. Upgrade to unlock these rooms and continue your remix."**

Access is decided by `useSpecialRoomTypesAccess` → locked unless the subscription payload has `features.specialRoomTypes === true`. **[V-CODE]** — `105-2w1yxo0uy.js`

### 4.3 Full room type table

**[V-CODE]** — all from `0a477x9ggxuwb.js`. `heat` = counts as heated area; `ext` = exterior space.

| key | display | premium | heat | ext | icon |
|---|---|:--:|:--:|:--:|---|
| `primary_bedroom` | Primary Bedroom | | ✓ | | PrimaryBedIcon |
| `bedroom` | Bedroom | | ✓ | | BedIcon |
| `primary_bathroom` | Primary Bathroom | | ✓ | | PrimaryBathIcon |
| `bathroom` | Bathroom | | ✓ | | BathIcon |
| `primary_closet` | Primary Closet | | ✓ | | PrimaryClosetIcon |
| `closet` | Utility Closet *(UI "Bed Closet" in Beds & Baths)* | | ✓ | | ClosetIcon |
| `kitchen` | Kitchen | | ✓ | | KitchenIcon |
| `dining` | Dining | | ✓ | | DiningIcon |
| `nook` | Nook *(UI "Breakfast Nook")* | | ✓ | | NookIcon |
| `pantry` | Pantry | | ✓ | | PantryIcon |
| `bar` | Bar | | ✓ | | BarIcon |
| `living` | Living | | ✓ | | SofaIcon |
| `family_room` | Family Room | **✓** | ✓ | | LoungeChairIcon |
| `den` | Den | **✓** | ✓ | | DenIcon |
| `sunroom` | Sunroom | **✓** | ✓ | | SunroomIcon |
| `foyer` | Foyer *(auxiliary_role: circulation)* | | ✓ | | FoyerIcon |
| `office` | Office | | ✓ | | OfficeIcon |
| `rec_room` | Rec Room | | ✓ | | RecRoomIcon |
| `theater` | Theater | | ✓ | | TheaterIcon |
| `gym` | Gym | | ✓ | | ExerciseIcon |
| `garage` | Garage | | ✗ | | CarIcon |
| `laundry` | Laundry | | ✓ | | LaundryIcon |
| `mudroom` | Mudroom | | ✓ | | MudroomIcon |
| `storage` | Storage | | ✓ | | StorageIcon |
| `front_porch` | Front Porch | | ✗ | ✓ | FrontPorchIcon |
| `outdoor_living` | Outdoor Living | | ✗ | ✓ | CoveredOutdoorIcon |
| `pool` | Pool | | ✗ | ✓ | PoolIcon |

Plus 8 **auxiliary / internal** types never shown as user-addable: `circulation` (display "Hallway"), `deadspace`, `fireplace`, `windows`, `doors`, `window`, `door`, `yeet`. **[V-CODE]**

> **[INFERRED]** `bar`, `rec_room`, `theater`, `gym`, `pool` exist in the catalog and in the public SEO taxonomy (§9) and get remix icons, but they are **not** in the Step-1 `RoomCatalogSidebar` JSX I read. Most likely they are addable only via a different surface (project setup / remix / an SEO-filtered browse), or are behind a flag. I could not confirm which.

### 4.4 Room size tiers
Every room has **S / M / L / XL** tiers with sqft ranges, a user-facing name, and an internal prompt name. The room-list picker renders `["S","M","L"]`; XL is gated by `ENABLE_XL_ROOM_SIZES` (shipped `true`) and `getAvailableRoomSizes` / `clampRoomSizeValueForXLFlag`, which downgrades `XL → L` when the flag is off. **[V-CODE]** — `44kxp5hz0dd81.js`, `0r10p-s0bgi_0.js`, `25pwgbbn8hrhe.js`. Screenshots show S/M/L only. **[V-SHOT]**

Selected examples **[V-CODE]** — `0a477x9ggxuwb.js`:

| Room | S | M | L | XL |
|---|---|---|---|---|
| Bedroom | 80–128 ft² "Twin/Full Bedroom" | 128–175.5 "Queen/King Bedroom" | 175.5–223 "King Bed with Small Flex Space" | 223–270 "King Bed with Large Flex Space" |
| Primary Bedroom | 106–185 | 185–264 | 264–343 | 343–422 "Primary \| Presidential Suite" |
| Bathroom | 20–45 "Compact Full Bath" | 45–76.5 | 76.5–108 | 108–140 |
| Primary Bathroom | 40–63 | 63–112 | 112–162 | 162–211 |
| Kitchen | 64–147 "Single Wall Kitchen" | 147–230 "…w. Island" | 230–313 "Two Wall Kitchen with Island" | 313–396 "Multi-Section Kitchen with Island" |
| Living | 109–242 "4-6 Person Living Room" | 242–375 | 375–508 | 508–641 |
| Dining | 60–130 "4-6 Person Dining" | 130–204 | 204–278 | 278–352 "14-16+ Person Dining" |
| Garage | 240–248 "1-Car Garage" | 248–495 "2-Car" | 495–742 "3-Car" | 742–989 "4-Car" |
| Pantry | 4–28 "Small Closet Pantry" | 28–53 "Walk-in Pantry" | 53–77 "Butler's Pantry" | 77–101 "Scullery" |
| Outdoor Living | 28–526 "Small Rear Patio / Deck" | 526–1024 | 1024–1523 | 1523–2021 |
| Pool | 254–840 "…Plunge Pool" | 840–1426 "…Lap Pool" | 1426–2012 "Resort" | 2012–2598 "Lagoon" |
| Theater | 52–404 "Private Screening Room" | 404–757 "Home Theater" | 757–1110 | 1110–1462 "Ultimate Theater" |
| **Den** (premium) | 52–152 "4-6 Person Den" | 152–252 | 252–352 "10-12 Person Den" | 352–453 |
| **Family Room** (premium) | 108–234 | 234–360 | 360–486 | 486–612 |
| **Sunroom** (premium) | 62–200 "4-6 Person Sunroom" | 200–339 | 339–478 "10-12 Person Sunroom" | 478–617 |

Each tier also carries an internal `prompt_name` (Den: Hideaway/Hollow/Parlor/Retreat; Sunroom: Garden/Solarium/Atrium/Orangery; Kitchen: Compact/Galley/Island/Chef's) and a `prompt_color_name` used to describe the room to the model. **[V-CODE]**

### 4.5 Derived / auto-included rooms
- Closets are **bundled**: `getBundledClosetSqft` — Primary Closet auto-included with Primary Bed, Bed Closet auto-included with Bedroom; in the UI those rows are read-only counters. **[V-CODE]** + **[V-SHOT]**
- Hallways are **AI-managed** with a user-adjustable count, bounded by `MAX_MANAGED_HALLWAYS`. **[V-CODE]**
- Deprecated room types are migrated via a `DEFAULT_DEPRECATED_ROOM_REPLACEMENTS` map — user sees "This design uses room types that are no longer available in Create. Choose a replacement for each room before continuing." **[V-CODE]**
- Remix is restricted to a whitelist, `SANCTIONED_REMIX_ROOM_TYPES` (22 types): `primary_bedroom, bedroom, primary_bathroom, bathroom, primary_closet, closet, kitchen, dining, nook, pantry, living, family_room, den, sunroom, foyer, front_porch, outdoor_living, office, garage, laundry, mudroom, storage`. **[V-CODE]**

---

## 5. "Room List Capacity"

This is a **token-budget meter on the AI's room-processing limit** — not a billing quota.

**[V-CODE]** — `44kxp5hz0dd81.js`, component `RoomCapacityMeter`:
- Label: **`Room List Capacity`** with an info tooltip whose entire text is: **"Our AI has a limit on how many rooms it can process currently."**
- Two render variants exist: one shows **`{n}% Remaining`**, the other **`{n}% Filled`** plus a delta (`+5%`) and a progress bar. Screenshots show the *Filled* variant (13% → 28% → 36% as rooms are added). **[V-SHOT]**
- Traffic-light state: `green` normally, `yellow` at ≤15% remaining, `red` at ≤0 or over limit.
- Hovering a `+` button **previews** the capacity delta before you commit (`projectLimitRoomsAfterAdd` / `…AfterSubtract`, `setRoomListLimitPreviewRooms`).
- Blocking reason when full: `overTokenBudget` (one of the `ADD_TOOLTIP_MESSAGE` keys); the generic guard message is "All supported room types are already at their limit."
- Implementation note found in the bundle: *"Precomputed GPT-2 BPE token costs. Estimate = areaBase + digits(sqft) + Σ(roomCost) − roomCount × mergeOverheadPerLine."* **[V-CODE]** — this is a literal comment string in the shipped code.

> **[INFERRED]** The capacity limit is a property of the generation model's prompt length, is identical for all plan tiers, and is unrelated to the credits meter in §10. The evidence is the tooltip text and the token-cost formula; I did not find any tier-conditioned code around it.

Alongside it sits **`Room List Total`** (`~{sqft}`) vs **`Buildable Area`**. **[V-CODE]**

---

## 6. "Story" count — single-storey only

- The room-list header carries a button labelled **`1 Story`** with `aria-label` **"Story count: 1. Learn about multi-story homes"** and `title` "Story count". Clicking it fires `trackMultistoryWaitlistOpened({projectId, timelineKey, surface:"room-list"})` and opens `MultistoryWaitlistModal`. **[V-CODE]** — `44kxp5hz0dd81.js`. Visible in screenshots. **[V-SHOT]**
- Waitlist copy: **"Join waitlist to get early access to multi-story and basement designs."**, "Sign up or log in to get early access to multi-story and basement designs.", "Join Waitlist", "You're on the waitlist.", and the flat statement **"We only support single-story homes for now."** **[V-CODE]**
- Marketing agrees **[V-PAGE]** — https://www.drafted.ai/learn/faq:
  > "Drafted is focused on single-level floor plans today. Multi-story homes, second floors, and basements are in progress and expected to become available soon."
- The design-details panel still exposes a `Stories` field. **[V-SHOT]**

---

## 7. Roof shapes

**[V-CODE]** — `https://www.drafted.ai/_next/static/immutable/chunks/0jsz7wapy_396.js`, export `ROOF_SHAPE_SELECTION_LABELS`:

```js
{ hip:"Hip", gable:"Gable", shed:"Shed Roof",
  "flat-overhang":"Flat with Overhangs", "flat-parapet":"Flat with Parapets" }
```

The `RoofShapeDropdown` renders a 2-column grid containing, unconditionally: **Hip**, **Gable**, **Flat with Overhangs**, **Flat with Parapets**. **Shed Roof** is rendered *only* when the feature flag **`roof-edit-shed-flat`** is on (`useFeatureFlag("roof-edit-shed-flat")`).

**Answer to "any others?": yes — one, "Shed Roof", behind a feature flag. There are no others.**

Internal model: both flat variants collapse to `roofFormKind === "flat"` and are distinguished by a flat style of `"slab"` (overhang) vs `"parapet"` (parapet); `roofShapeSelectionForDesign` defaults an unspecified flat roof to **parapet**. **[V-CODE]**

Related **[V-CODE]**:
- Roof editing is per-section: **"Change any roof section from hipped to gabled with a click, and the 3D model updates instantly"** **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2
- A `RoofPlanPanel` overlays the canvas; the editor tool tray has a dedicated **Roof** mode ("Edit Roof")
- Roof pitch/material note: "Not used for flat roofs"
- Data model carries `roofPipelineVersion`, `RoofDesignV2Schema`, `roofBuildSnapshot`, `roofDesignBaselineHash`

---

## 8. Exterior materials

Five slots, in fixed order. **[V-CODE]** — `44kxp5hz0dd81.js`, exports `SLOT_LABELS` / `SLOT_ORDER` / `MATERIAL_STEPS`:

```js
SLOT_ORDER  = ["cladding","foundation","roof","windows","door"]
SLOT_LABELS = { cladding:"Cladding", foundation:"Foundation", roof:"Roofing",
                windows:"Windows & Trim", door:"Front Door" }
```

| Slot | Step subtitle (verbatim) |
|---|---|
| Cladding | "Choose your primary exterior material" |
| Foundation | "Select your foundation material" |
| Roofing | "Select your roof material" |
| Windows & Trim | "Choose your window and trim package" |
| Front Door | "Pick your front door" |

### 8.1 Category tabs per slot (`MATERIAL_STEP_CATEGORIES`) **[V-CODE]**
- **Cladding:** Lap · Board & Batten · Wood · Brick · Stone · Stucco · Metal
- **Foundation:** Stone · Brick · Board & Batten · Stucco · Concrete *(+ a synthetic "Match Cladding" tab)*
- **Roofing:** Asphalt Shingle · Metal · Other
- **Front Door:** Mostly Solid · Half Glass · Full Glass
- **Windows & Trim:** *no categories — a flat list of 5*

### 8.2 Full swatch catalog (`STEP_SWATCHES`) **[V-CODE]**
**119 swatches total.** Each carries `id`, `name`, `type`, a hex `color`, a PNG at `/material-swatches-nobg/{slot}/{id}.png`, `category`, and a `promptDesc` fed to the render model.

**Cladding — 44**
| Category | Options |
|---|---|
| Lap (`siding`) — 7 | White (Fiber Cement), Dove Gray (Fiber Cement), Charcoal (Fiber Cement), Beige / Sand (Vinyl), Sage Green (Fiber Cement), Navy (Fiber Cement), Shake / Scallop (Fiber Cement) |
| Board & Batten — 5 | White, Black, Blue, Green, Red |
| Wood — 7 | Natural Cedar, Shou Sugi Ban (Charred Wood), Pine (Horizontal), Pine (Vertical), Weathered Gray, Reclaimed Barnwood, Whitewashed |
| Brick — 6 | Red Brick, White / Painted, Tan / Buff, Brown Brick, Gray Brick, Clinker / Dark Blend |
| Stone — 6 | Fieldstone, Limestone, Ledgestone (Stacked Stone), River Rock, Slate, Cultured Stone (Manufactured Stone) |
| Stucco — 6 | White Stucco, Sand / Beige, Gray Stucco, Terracotta, Smooth White, Smooth Gray |
| Metal — 7 | Corten Steel, Standing Seam Black, Standing Seam Gray, Standing Seam Green, Corrugated Galvanized, Zinc Panel, Copper Panel |

**Foundation — 31**
| Category | Options |
|---|---|
| Stone — 8 | Fieldstone, Ledgestone, Cultured Stone, Limestone, River Rock, Dry Stack, Slate Veneer, Cobblestone |
| Brick — 5 | Red Brick, Tan / Buff, Brown Brick, Gray Brick, Painted White |
| Board & Batten — 7 | White, Black, Blue, Green, Red, Gray, Natural Wood |
| Stucco — 5 | White Stucco, Sand / Beige, Gray Stucco, Smooth White, Smooth Gray |
| Concrete — 5 | Parged Concrete, Exposed Aggregate, Smooth Gray, Stamped Concrete, Board-Formed |
| Match — 1 | **Match Primary** (`id: match-primary`, type "Same as cladding") |

There is also a `resolveFoundationForMatch` lookup that picks a sensible foundation for a given cladding (e.g. every metal cladding → `fdn-smooth-grey`; default `fdn-smooth-white`). **[V-CODE]**

**Roofing — 18**
| Category | Options |
|---|---|
| Asphalt Shingle — 6 | Onyx Black, Charcoal Shingle, Weathered Wood, Brown / Autumn Blend, Dual-Tone Gray, Desert Tan |
| Metal — 7 | Standing Seam Black, Standing Seam Bronze, Galvanized, Green, Red / Barn Red, Copper, Zinc |
| Other — 5 | Terracotta Tile (Clay Tile), Natural Slate (Slate), Cedar Shake (Wood), Spanish Clay Tile (Clay Tile), Green / Living Roof (Vegetative) |

**Windows & Trim — 5 (no categories)**
White (Vinyl) · Black (Aluminum) · Dark Bronze (Aluminum) · Natural Wood (Wood) · Putty / Almond (Vinyl)

**Front Door — 21**
| Category | Options (all 7 each) |
|---|---|
| Mostly Solid | Black, White, Bold Red, Blue, Hunter Green, Charcoal (all Painted) + Natural Oak (Wood) |
| Half Glass | Black, White, Red, Blue, Charcoal, Gray (Painted) + Natural Oak (Wood) |
| Full Glass | Black, White, Red, Blue, Green, Charcoal (Painted) + Natural Oak (Wood) |

### 8.3 Render composition
The render key is composed from the selected slots, so materials are **combinatorially conditioned on cladding**: **[V-CODE]**
```
cladding__{c} | foundation__{f}__{c} | windows__{w}__{c}__{f}
roof__{r}__{c} | door__{d}__{c}__{f}
```
Defaults observed: foundation `fdn-smooth-white`; a `match-primary` foundation resolves through the cladding. **[V-CODE]**

### 8.4 Architectural style presets
A separate style vocabulary exists for describing the design: **[V-CODE]** — `44kxp5hz0dd81.js`
```js
{ modern_farmhouse:"Modern Farmhouse", hill_country:"Hill Country",
  modern_mountain:"Modern Mountain", mediterranean:"Mediterranean",
  transitional_european:"Transitional European", craftsman:"Craftsman",
  contemporary:"Contemporary", custom:"Custom" }
```
Note this is **distinct** from the public gallery's "Character" vocabulary in §9.

Rendering caveat **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2:
> "These renders establish a visual direction; they are not construction details or physical product specifications."

---

## 9. Outputs, exports, sharing

### 9.1 Export formats — 8 targets
**[V-CODE]** — `44kxp5hz0dd81.js`. Modal title is **"Free Design Downloads"** when the free path applies, otherwise **"Download Files"**.

| id | Name | format | `whatsIncluded` (verbatim) |
|---|---|---|---|
| `pdf` | **PDF** | pdf | "High-resolution PDF file with floor plan and 4 elevations." |
| `autocad` | **AutoCAD** | **dxf** | "Floor plan with polylines and block-based doors/windows." · "4 elevation assembled into a single sheet." · "All files bundled in a single ZIP download." |
| `ifc` | **IFC** | ifc | "IFC 4 model with walls, doors, windows, roofs, and slabs." · "Supported by many BIM viewers and coordination tools." · "Neutral BIM handoff…" |
| `glb` | **GLB** | glb | "Binary glTF model of the full building." · "Compatible with Three.js, model-viewer, Blender, Sketchfab, and most 3D web viewers." |
| `glb-editable` | **Blender** | glb-editable | "Individually selectable building elements organized in a scene hierarchy." · "Semantic names and metadata for Blender and game-engine workflows." |
| `revit` | **Revit** | revit-link | "Drafted add-in package for native editable walls, floors, doors—including garage doors—windows, porch posts, and supported footprint roofs." · "IFC4 reference model for Revit's Link IFC workflow." · "Stable Drafted element IDs written to imported native elements." · "Both Revit workflows bundled in one ZIP download." |
| `sketchup` | **SketchUp** | **dxf** | "DXF floor plan importable via File > Import in SketchUp." · "Layered polylines for easy selection and editing." |
| `softplan` | **SoftPlan** | dxf (`selectedByDefault: false`) | "Exterior, interior, and minor wall centerlines on separate SP-* mapping layers." · "Door, garage-door, window, room-name, and porch-post content on dedicated layers." · "No debug layers, hatches, or elevation sheets." |

**Answer to "PDF? DWG?": PDF yes. DWG no — CAD handoff is DXF** (AutoCAD/SketchUp/SoftPlan profiles), plus IFC for BIM and GLB for 3D.

Sample files served publicly: `/example.dxf`, `/export-examples/export-sample-pdf.pdf`, `/export-examples/export-sample-ifc.ifc`. **[V-CODE]**

Marketing counts only four **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2:
> "Drafted V2 provides four file formats: PDF for sharing and review, DXF for CAD drafting, GLB for 3D workflows, and IFC for building information modeling."

> **[INFERRED]** Blender / Revit / SketchUp / SoftPlan are newer or gated additions. Supporting evidence: the bundle wraps part of the export UI in a feature flag `enable-cad-handoff-exports`, and `softplan` ships with `selectedByDefault:false`. I could not confirm which specific formats that flag controls.

Other export constraints **[V-CODE]**:
- Desktop only: "CAD and BIM exports are available on desktop — open this design on your computer to choose from the formats currently available to you." / "Export on Desktop"
- Modal copy: "Select file formats, preview available exports, and download design files.", "Available Formats", "Choose a format on the left to preview", "Click to preview export"
- Email delivery: **"Send Design Files"** — "Send selected design export files to an email address."
- Button states: `Download Files` (free/included) vs `Generate Files` vs a **priced** state showing an amount + "Estimated cost. Actual pricing confirmed at checkout"
- Quota race guard: "Your included download was just used. Review the updated price, then click Download Files again."

### 9.2 Other outputs
- **2D floor plan** — furnished/staged raster + SVG; artifact types found: `svg`, `raster`, `exterior`, `canny`, `staged`, `staged-raw` **[V-CODE]**
- **3D model** — live in-browser, exportable as GLB
- **Exterior render** — AI render conditioned on the material selections
- **Design detail panel** — Total Area, Heated / Unheated / Garage / outdoor breakdown, width × depth, ceiling height, stories, room counts **[V-SHOT]**

### 9.3 Sharing
**[V-CODE]** + **[V-PAGE]** https://www.drafted.ai/learn/faq:
- Public/Private per design; public designs appear in the gallery and are remixable
- Share popover: Email, device share sheet, Facebook, LinkedIn, Pinterest, X, "Share or Print"
- Project invites with roles; "Approved people join this project with View Only access."; access-request flow for private designs
- > "Invite teammates, builders, architects, clients, friends, or family to join a project and review the design with you."

---

## 10. Pricing, plans, and the credits system

### 10.1 The public-marketing position
**[V-PAGE]** — https://www.drafted.ai/learn/faq:
> **"How much does Drafted cost?** Drafted is completely free. Browse designs for inspiration, design your own plan, and download your plan as a PDF, CAD, or BIM file, all for free."

Also: "It is free to use, just find the Create tab to start." **[V-PAGE]** same page; "the complete workflow is free to start, from browsing designs through creating a plan and downloading the files" **[V-PAGE]** https://www.drafted.ai/learn/news/drafted-v2; "PDF downloads are free." **[V-PAGE]** https://www.drafted.ai/learn/use-cases/design-render-pdf-plan; "No credit card required" **[V-CODE]**.

**⚠️ This is contradicted by the shipped app**, which contains a complete five-tier Stripe-backed subscription system with metered allowances, overage pricing, and locked room types. Both facts are verified; see §13.

### 10.2 Plan tiers
**[V-CODE]** — `https://www.drafted.ai/_next/static/immutable/chunks/105-2w1yxo0uy.js`

```js
{ explorer:"Dreamer", free:"Free", professional:"Pro", professional_scale:"Pro Scale" }
```
Page heading: **"Unlock Access & Usage"**. Five cards render (Free, Dreamer, Pro, Pro Scale, Enterprise). One tier is badged **`RECOMMENDED`**; the user's own is badged **`CURRENT`**. Billing cadence toggles **monthly / annual**, with the monthly×12 list price struck through on annual.

| Tier | `features[]` verbatim |
|---|---|
| **Free** | "Core home planning" |
| **Dreamer** (`explorer`) | "Special room types" · "Private designs" · "Remix public designs" |
| **Pro** (`professional`) | "Everything in Dreamer" · "Create multiple projects" · "Project archiving" · "Collaboration" · "Revit Plug-in" |
| **Pro Scale** (`professional_scale`) | "Everything in Pro" · "On your website experience" |
| **Enterprise** | price "Custom" · "Everything in Pro Scale" · "On your website experience" · "API access" · "Custom AI model" · CTA "Contact Us" |

Other tier-gate strings **[V-CODE]**:
- `"{Free|Dreamer} plan limit reached"` → **"Create 1 project and join 1 project."** → CTA "View Pro"
- "Upgrade to Pro to archive this project. It will stay active until then."
- "Private designs require a subscription. Downgrading will make all of your private designs public."
- "Upgrade to remix this design"
- "Basic access with limited features" / "Basic floor plan tools" / "Limited design generations" / "Professional-grade tools for power users"
- Also present: a **"Free 1 Day Trial"** string, a **student verification** flow (`.edu` gate), an admin **Tier Override** (Off / Free / Dreamer / Pro / Pro Scale), and a **Pro waitlist** — "Join the waitlist and we'll email you when subscriptions become available."

Checkout is **Stripe** (`Opening Stripe Checkout`, `Opening secure checkout`, customer portal for billing). **[V-CODE]**

### 10.3 The credits system — "5 left", "4 left", "1 left"

This chip is the component **`SubscriptionsV2UsageTopNav`**. **[V-CODE]** — `105-2w1yxo0uy.js`.

```js
// default props
{ headingId:"top-nav-monthly-usage-title",
  resourceKey:"generation_credits",
  resourceLabel:"Plans and 3D" }
…
label = `${allowance.capacity.remainingUnits} left`
usedPercent = (capacityUnits - remainingUnits) / capacityUnits * 100
```

- It is a **sparkle icon + a small gold progress bar + `"{n} left"`**, and it is a **button** that opens a popover. `aria-label` = `` `Open monthly usage, ${label} for ${resourceLabel}` ``. Matches the screenshots exactly. **[V-SHOT]**
- **It tracks `generation_credits` by default** — i.e. the "Plans & 3D" resource, not renders and not downloads.
- `"Unlimited"` renders instead of a number when the allowance is unlimited; `"— left"` when unconfigured.

**The popover** is headed **`Monthly usage`** (sparkle icon) with **`Resets {date}`** on the right, and lists three metered resources: **[V-CODE]**

| Row label | `resourceKey` | Notes |
|---|---|---|
| **Plans & 3D** | `generation_credits` | shows `"{n} in progress"` for reserved units |
| **Renders** | `render_units` | shows `"{n} in progress"` |
| **File Downloads** | `included_export_bundles` | no in-progress line |

Each row shows `{n} left` / `Unlimited` / `—`. Below: **`Additional this cycle`** with a currency total, and a **`Subscriptions →`** button to `/app/subscriptions`. A "Reload usage" fallback exists.

**Overage (pay-as-you-go past the allowance)** — the plans page renders an **`Overage Pricing:`** line with three items: **[V-CODE]**

| Label | Operation key |
|---|---|
| "Additional plans & 3D" | `platform_create_design_batch` |
| "Additional render" | `platform_render` |
| "Extra export" | from `exportBundles` |

Only `generation_credits` and `render_units` accrue overages (`p = new Set(["generation_credits","render_units"])`); export bundles are priced per bundle at download time. Per-row detail renders as `` `${quantity} additional (${pending} pending) - ${amount}` ``. **[V-CODE]**

**So, to answer the question directly:** "5 left / 4 left / 1 left" is **the remaining monthly `generation_credits` ("Plans & 3D") allowance for the current billing period**, counting down as you generate. It is a per-month allowance that resets on a date shown in the popover, and exceeding it moves you to metered overage pricing rather than hard-blocking.

> **[INFERRED]** The specific starting number (5) is the Free-tier `generation_credits` allowance. I cannot verify this — the number comes from a server `allowances` payload, and no tier→units mapping exists in the client code.

### 10.4 What exactly gates behind "UPGRADE SUBSCRIPTION"
Verified gates, each with its own code path **[V-CODE]**:

| Gate | Mechanism |
|---|---|
| **Den, Family Room, Sunroom** | `isPremiumRoomKind` / `PremiumRoomCatalogGroup`; requires `features.specialRoomTypes` |
| **Private designs** | `features.privateDesigns` |
| **Remixing public designs** | Dreamer+ feature; separate remix gate for locked room types |
| **Multiple projects / joining >1 project** | Free & Dreamer capped at "Create 1 project and join 1 project." |
| **Project archiving** | Pro |
| **Collaboration** | Pro |
| **Revit Plug-in** | Pro |
| **"On your website experience"** | Pro Scale |
| **API access, Custom AI model** | Enterprise |
| **Monthly volume** (plans/3D, renders, downloads) | metered allowances + overage on every tier |

---

## 11. Public gallery & SEO taxonomy

**Gallery:** https://www.drafted.ai/house-plans — an infinite grid of community designs, each card showing an exterior render + floorplan thumbnail, author, age, Character, bd/ba, heated ft², total ft², and a **Download Files** button. **[V-PAGE]**

**Filters on the gallery:** `Bedrooms`, `Bathrooms`, `Heated Area`, `Character`, `Shape` (the Shape filter's only value is **"Custom Shape"**). **[V-PAGE]** + **[V-CODE]**

**"Character" vocabulary — 8 values** (derived from the 10,890 URLs in https://www.drafted.ai/seo-filter-sitemap/sitemap/0.xml): **[V-PAGE]**
`Bold` · `Bright` · `Classic` · `Dark` · `Earthy` · `Industrial` · `Natural` · `Rustic`

**Other SEO facet dimensions** from the same sitemap: **[V-PAGE]**
- Bedrooms: 1–5 · Bathrooms: 1–4
- Heated area buckets: `under-2000`, `2000-to-3500`, `3500-to-5000`, `5000-to-6500`, `over-6500` sq ft
- "with X" features: `home-office`, `pool`, `rec-room`, `bar`, `gym`, `theater`

Example landing pages: `/4-bedroom-3-bath-house-plans`, `/2-bedroom-house-plans`, `/industrial-house-plans`, `/natural-house-plans`. **[V-PAGE]** — https://www.drafted.ai/learn

**Project progress banners (gamification)** **[V-CODE]** — `/_next/static/immutable/chunks/3zgvfd1eabw0n.js`:
| Banner | goal | metric |
|---|---|---|
| "Design and render your first home in minutes." | 1 | Rendered Design |
| "Explore three different design directions." | 3 | Rendered Designs |
| "Remix your favorite house designs." | 1 | Remixes |
| "Shortlist your two favorite designs." | 2 | Shortlisted Designs |

*(This is the `2/3` ring visible in the screenshots — a milestone counter, **not** a credits meter.)* **[V-SHOT]**

---

## 12. How the AI works — what they say

All **[V-PAGE]** — https://www.drafted.ai/learn/news/drafted-v2 unless noted.

- "Our **specialized AI model** accepts a room list, lot requirements, house shape, square footage targets, a sketched footprint, and optional room placements before it generates the rest of the house."
- "That structured input is what makes Drafted better at matching the user's intent. The model does not have to infer every requirement from a single sentence."
- "AI floor plan generation is a harder problem than producing an image that simply looks convincing. But a successful plan also has to resolve room adjacency, circulation, privacy, outdoor connections, and the overall building footprint."
- "Drafted's design flow turns requirements, constraints, and layout decisions into a floor plan that follows **residential design and buildability constraints**."
- "Drafted follows the user's sketch and direction while generating a structured floor plan with walls, doors, and windows."
- Speed: "the industry's fastest AI model generation" **[V-PAGE]** https://www.drafted.ai/learn/ai-floor-plan-generators; "generate multiple floor plan directions in the time it takes Revit to start up" **[V-PAGE]** https://www.drafted.ai/learn/drafted-exports
- Model identifiers visible in the bundle: `aura-4.3-5m`, `aura-4.9-5m-base`, and a composite id `aura-4.3-5m-aura-4.9-outdoor` splitting indoor and outdoor models; outdoor set = `{outdoor_living, front_porch, pool}`. Internal naming throughout: "Aura", `useAuraInference…`. **[V-CODE]** — `/_next/static/immutable/chunks/2cih94b1z7qst.js`, `816805`

---

## 13. Limits, disclaimers, and contradictions

### Stated limits **[V-PAGE]** / **[V-CODE]**
| Limit | Source |
|---|---|
| **Single-storey only**; no 2nd floor, no basement | FAQ + in-app "We only support single-story homes for now." |
| **Room List Capacity** — the model has a hard cap on room count/complexity | in-app tooltip |
| **No plan upload** yet | FAQ, Use Cases "Coming soon" |
| **Not construction documents** — "Drafted focuses on accelerating the schematic design phase… it's best to engage with an architect, structural engineer, or other building professional before building." | https://www.drafted.ai/learn/faq |
| "Construction blueprints are technical drawing sets, so that stage still belongs with qualified professionals." | https://www.drafted.ai/learn/ai-floor-plan-generators |
| **"Drafted does not check building codes. Generated plans are starting points for design development and must be reviewed by a qualified design professional."** | **[V-CODE]** `44kxp5hz0dd81.js` |
| Renders "are not construction details or physical product specifications." | drafted-v2 |
| **Desktop-only creation** — "Creating and editing designs is built for larger screens." / "Create on Desktop" / "Export on Desktop" | **[V-CODE]** |
| Stated cons: "Does not scan an existing home" · "Not a replacement for final permit drawings or professional review" · "Less relevant for room-only decorating" | https://www.drafted.ai/learn/best-floor-plan-generator-software |

### Contradictions worth flagging
1. **"Completely free" vs. a full paywall.** The FAQ says "Drafted is completely free… download your plan as a PDF, CAD, or BIM file, all for free" (https://www.drafted.ai/learn/faq), while the shipped app contains 5 paid tiers, three metered monthly allowances, overage pricing, per-download pricing, and three locked room types. Both are verified. **[INFERRED]** the `/learn` content predates the V2 monetisation rollout — supporting evidence: the learn articles are dated "Updated May 20, 2026", the subscription code is namespaced `subscriptionsV2` with a rollout-state hook (`useSubscriptionsV2RolloutState`) and a `subscriptionsEnabled` toggle, and a Pro **waitlist** string still exists ("Join the waitlist and we'll email you when subscriptions become available"). So the paywall appears to be mid-rollout.
2. **Four export formats vs. eight.** Marketing says "four file formats" (drafted-v2); the bundle ships eight targets, some behind `enable-cad-handoff-exports`.
3. **XL room sizes** exist in the catalog data but the room-list picker renders only S/M/L.
4. There is **no public terms-of-service or privacy-policy page** (`/terms` and `/privacy` both 404), which is notable for a product that takes payments.

---

## 14. Site map (everything fetched, HTTP 200)

**Marketing / gallery**
- https://www.drafted.ai (landing)
- https://www.drafted.ai/house-plans (gallery, 85,000+ plans)
- https://www.drafted.ai/revit (Revit plug-in landing; client-rendered, title "AI House Plan Generator for Revit")
- https://www.drafted.ai/onboarding (client-rendered; "What describes you?" → Homebuyer / Architect / Builder / Developer / Interior Designer / Drafter / Real Estate Agent / Other)
- SEO facets, 10,890 URLs: https://www.drafted.ai/seo-filter-sitemap/sitemap/0.xml

**Learn hub** — https://www.drafted.ai/learn
- /learn/faq · /learn/news · /learn/news/drafted-v2 · /learn/use-cases · /learn/careers
- /learn/ai-floor-plan-generators · /learn/best-floor-plan-generator-software · /learn/ai-house-design-workflow
- /learn/drafted-exports *(serves the "AI for Revit" page)* · /learn/where-to-start-designing-floor-plan · /learn/integrate-ai-into-home-design-project
- Persona guides: /learn/ai-for-{architects,builders,developers,drafters,homebuyers}
- Use cases: /learn/use-cases/{builder-preconstruction-concepts, client-layout-iteration, client-wish-list-square-footage, cohesive-plan-set-development, design-house-on-your-lot, design-render-pdf-plan, drafted-for-autocad, drafted-for-chief-architect, drafted-for-revit, image-to-revit, prepare-for-architect, residential-development-planning, revit-lot-planning-plugin, tiny-home-design, upload-plan-preview}

**404 (confirmed absent):** `/pricing`, `/learn/pricing`, `/about`, `/terms`, `/privacy`

**Key JS bundles read** (all under `https://www.drafted.ai/_next/static/immutable/chunks/`)
| File | Contains |
|---|---|
| `0a477x9ggxuwb.js` | the entire `drafted.room-catalog` v1.0.0 JSON (35 types, all size tiers) |
| `44kxp5hz0dd81.js` | main app — room sidebar, premium gate, materials catalog, exports, capacity meter, editor |
| `0jsz7wapy_396.js` | `ROOF_SHAPE_SELECTION_LABELS` + `RoofShapeDropdown` |
| `105-2w1yxo0uy.js` | subscriptions v2 — tiers, features, usage meter, overage pricing |
| `255-emztmua27.js` | all three page-tutorial flow definitions (verbatim step copy) |
| `3zgvfd1eabw0n.js` | project progress banners |
| `2cih94b1z7qst.js` | Aura model ids, generation store |
| `0r10p-s0bgi_0.js`, `3chudarcyl83g.js`, `1iv5-fnlsjx-e.js` | room size tiers, sqft maths, icon map |

**Support contact found in-app:** "Text or Call: (510) 361-0508" **[V-CODE]**
