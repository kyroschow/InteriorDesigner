# Drafted (drafted.ai) — Screen Forensics, Batch 07

Source: 12 sequential 1920×1200 screenshots of one continuous user session, `/home/dell/Pictures/Screenshots/Screenshot from 2026-09-12 15-13-25.png` … `15-17-05.png`.
Session covers the **tail of the create wizard (Step 3 Results → materials → render)**, the **project dashboard**, the **published design ("draft") detail page**, the **share/invite modal**, and a **return trip into the Step 2 editor**.

Browser chrome throughout: Firefox-like window, 5 tabs (`New tab`, `Local Model Chat` ×2, the Drafted tab, `Free 3D House Design`). Drafted tab title alternates between **"Drafted - Design your d…"** (app/studio routes) and **"Free 3BR 4BA House Pl…"** (public draft route) — i.e. the draft detail page has SEO-style document titles.

---

## 1. `15-13-25` — Step 3 Results › "Choose Materials" modal (Tutorial step 15)

**URL (verbatim)**
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/review?spread=01M2B2SW8C79DMQBB68ARGFKK2&slot=E
```
Route shape: `/app/studio/projects/{projectId}/create/{ULID:runId}/review?spread={ULID:spreadId}&slot={A–E}`.

**Stepper (top nav, center)** — `① Create Room List — ② Place Rooms & Shape — ③ Results`, with **3 Results** active (filled black circle + bold label); 1 and 2 are grey/filled-grey circles.

**Top nav (left → right)**: serif **"Drafted"** wordmark (with a small flourish/swash under the "d"), house icon + **My Studio**, vertical divider, `‹` chevron + **"Place Rooms & Shape"** (back-to-previous-step link), stepper. Right side is occluded by the tutorial card but two pill buttons and the avatar edge are visible (Learn / credits pill / avatar).

**Canvas behind the modal** (dimmed): grid workspace; a floating zoom toolbar top-center with **zoom-out (−) / zoom-in (+) / reset-view (circular arrow)** icon buttons; a "New desi…" (**New design**) `+` card on the left; a plan card badged **"Latest"** with an **"✎ Edit p[lan]"** overlay button and footer stats **"Total 2,498 ft² | Heated 2…"**; a grey line-art elevation of the house on the right.

**Design-variant strip (bottom center)**: five square thumbnail cards labelled with black circular badges **A, B, C, D, E** — each showing a miniature colored floor plan. **E is selected** (dark 2px border + slight lift), matching `&slot=E` in the URL.

**Modal — "Choose Materials"**
- Header: `‹` back chevron, serif title **Choose Materials**; right side: credits pill (sparkle icon + small progress bar + **"1 left"**) and **"⌷ Save Palette"** (bookmark icon) button.
- Body heading: **"Choose Exterior Materials"**, sub-line **"Complete all 5 categories to render."**
- Five material tiles in a row, each a torn-paper/watercolor swatch with a **black circular ✓ check badge** top-right (all 5 complete):

| Category | Selected material | Swatch |
|---|---|---|
| Cladding | Beige / Sand | horizontal lap siding, warm beige |
| Foundation | Fieldstone | tan/ochre irregular stone |
| Roofing | Onyx Black | near-black shingle |
| Windows & Trim | Putty / Almond | white/cream double-hung window |
| Front Door | Black | black panel door with sidelights |

- Primary CTA: **"✧ Furnish & Render"** — black pill button with sparkle icon, wrapped in the tutorial's dashed spotlight ring; a dashed curved arrow points at it from the tutorial card.

**Tutorial callout (top-right, white rounded card)**
- Eyebrow: **TUTORIAL STEP 15**
- Title (serif): **"Start the render"**
- Body: **"Click Furnish & Render to start the render."**
- Footer: a thin horizontal progress bar, ~95% filled.

Bottom-right: circular Intercom-style chat launcher.

---

## 2. `15-13-35` — Render kickoff, full-screen loading (still Tutorial step 15)

**URL**: unchanged — `…/create/01M2B203CPTDZ0S2DVMTQF8AVC/review?spread=01M2B2SW8C79DMQBB68ARGFKK2&slot=E`

**Transition from #1**: user clicked **Furnish & Render**. The entire app chrome (top nav + stepper + canvas) is replaced by a blank cream full-bleed surface with a large centered card.

**Content**: centered spinner (circular arc), serif heading **"Starting your render"**, grey sub-line **"Thinking through your constraints."** No controls — blocking state.

Tutorial card still reads **TUTORIAL STEP 15 / Start the render / "Click Furnish & Render to start the render."** (it has not advanced yet).

---

## 3. `15-13-41` — Project dashboard, design materializing (Tutorial step 16a)

**URL (verbatim)**
```
www.drafted.ai/app/studio/projects/114312?materializingDesign=85440&optimisticMaterializing=1&optimisticMaterializingStartedAt=1789226017697
```
→ After firing the render the app **navigates out of the wizard back to the project dashboard**, carrying optimistic-UI query params: `materializingDesign={designId}`, `optimisticMaterializing=1`, `optimisticMaterializingStartedAt={epoch ms}`.

**Top nav**: Drafted wordmark · 🏠 **My Studio** (underlined = current section) · divider · small grey label **PROJECT** over bold **"Morgan's Dreamhome"** with a ▾ chevron (project switcher). Right: **"📖 Learn"** outlined pill, credits pill (sparkle + progress bar + **"5 left"**), circular avatar **NA**.

**Left column — project card**
- **"Add Cover Photo"** dropzone (image icon) with sub-label **"Click or drop image to upload"**.
- Serif title **"Morgan's Dreamhome"** + ✎ pencil edit button.
- Big stat: **2,009 ft²** / caption **Heated Area**.
- Row: 🛏 **3 Beds** | 🛁 **3 Baths**.
- Divider row: **Buildable Area** … **Flexible**.
- **Project Team** card with **"+ Invite"** button; member row: avatar **NA**, **Nagrom A.**, role **Homeowner**, right-side status **"● Now"** (green dot).
- **My Designs (1)** nav list:
  - **✧ New (1)** — selected (dark filled row, `›` chevron)
  - **⌷ Shortlisted (0)**
  - **▦ Design Library (0)**

**Main column**
- Achievement/onboarding banner: serif **"Design and render your first home in minutes."**, a 4-step progress dot row (**1 = open ring (in progress), 2–4 = padlock icons**, connected by hairlines), three illustration cards (grey massing model → line-art elevation → painted color elevation), and a circular progress ring reading **0/1**.
- Section header **✧ New (1)**.
- Design card (wrapped in the tutorial's dashed spotlight):
  - Header: **Design 1** · avatar NA · **Nagrom** · amber pill **"Materializing"** · **· just now**
  - Body: faded skeleton with a grey spinner + **"Preparing render"**, a floating progress card **"Preparing render"** + bar + **11%**, and a faint colored floor plan preview behind it.
- Section **⌷ Shortlisted (0)** with empty state row: ⌷ **"Shortlist your favorite designs."**
- Section **▦ Design Library (0)**.

**Right column** — **Inspiration (0)**, a dashed-border card with a `+` circle and serif **"Explore Other Designs"** over a watercolor mid-century house illustration.

**Tutorial callout (bottom-right)**
- **TUTORIAL STEP 16**
- Title: **"◔ Your house is rendering"** (spinner glyph precedes the serif title)
- Body: **"Hang tight, this usually takes a minute or two. The highlighted card is where your house will appear."**
- Progress bar at 100%.

---

## 4. `15-14-30` — Project dashboard, render complete (Tutorial step 16b)

**URL (verbatim)**: `www.drafted.ai/app/studio/projects/114312` — the optimistic query params have been **stripped** once the design resolved.

**Transition from #3**: render finished (~50 s later). Changes:
- Banner swapped to the **next** achievement: serif **"Explore three different design directions."**, dot row now **① filled ✓ (gold) — ② open ring (active) — ③ padlock — ④ padlock**, three stacked idea cards labelled **"✧ Idea 1"**, **"✧ Idea 2"**, **"✧ Idea 3"** (each a painted elevation), ring reads **1/3**.
- A **"＋ ✧ New Design"** black pill button appears at the top-right of the "My Designs (1)" section header.
- Section header changed from `✧ New (1)` (with banner above) to **"My Designs (1)"** heading + the New Design button; `✧ New (1)` sub-header remains below the banner.

**Completed design card** (still spotlighted with a dashed ring)
- Header: ⌷ bookmark/shortlist icon, **Design 1**, avatar NA, **Nagrom**, **· just now**; right: 🗑 trash/delete icon button.
- Left half: painterly watercolor exterior render (ranch house, beige siding, tan garage door, dark hip roof, autumn trees).
- Right half: colored 2-D furnished floor plan thumbnail (garage with 2 cars at left, living/dining center, bedrooms + baths right).
- Metric strip: ⌂ **2,053 ft²** / *Heated Area* · ▣ **2,489 ft²** / *Total Area* · ⌗ **97 ft 10 in x 32 ft 0 in** / *Width x Depth* · 🛏 **3** / *Bed* · (next metric clipped by the overlay: **B[ath]**).
- Actions: **"◎ View Design ›"** (outlined, spotlit) and **"🔒 Public"** (gold-outlined, gold text, padlock icon — visibility toggle/badge).

**Tutorial callout (bottom-right)**
- **TUTORIAL STEP 16**
- Title: **"Open your house"**
- Body: **"Your render is ready — click the design card to open your new house."**
- Progress bar 100%.

---

## 5. `15-14-39` — Draft (design) detail page + "Tutorial complete" modal

**URL (verbatim)**
```
www.drafted.ai/app/drafts/142980?origin=project&returnTo=%2Fapp%2Fstudio%2Fprojects%2F114312
```
Route shape: `/app/drafts/{draftId}?origin=project&returnTo={encoded path}`. Tab title becomes **"Free 3BR 4BA House Pl…"**.

**Transition from #4**: user clicked the design card / View Design → navigates to the public-facing draft page.

**Top nav**: Drafted · 🏠 My Studio · divider · `‹` **Morgan's Dreamhome** (back to project) · right: **📖 Learn** + avatar **NA**.

**Page header**
- ⌷ bookmark icon, serif H1 **"3 Bed House Plan"**
- Meta line: **"Created by ⓝ Nagrom on 9/12/2026 · Pinned 0 times"**
- Action row (right): **🔒 Public** (gold outline) · **⚡ Remix** (black) · **📄 Download Files** (black) · **⇪ Share** (white outline).

**Hero**: full-width painterly render of the house.

**Right rail — "Materials" card**
- Header: serif **Materials**, **"🎨 Load Palette"** outlined button, **⌷** bookmark icon button.
- Rows (thumbnail · name · category · ✎ edit pencil):
  1. **Beige / Sand** — Cladding
  2. **Fieldstone** — Foundation
  3. **Onyx Black** — Roofing
  4. **Putty / Almond** — Windows & Trim
  5. **Black** — Front Door
- Footer italic note: **"This design has 1 material palette options."** (sic — pluralization bug worth cloning or fixing).

**Below the fold (partially visible)**
- **"About This Design"** card (serif heading + body copy).
- Center plan viewer card with a **"◔ Preparing plan"** pill (plan still generating).
- **"Design Details"** rail: ▣ **2,489** **ft² Total Area**, **Area Breakdown**, ⌂ **Heated Area … 2,053 ft²**.

**Modal — Tutorial complete**
- Thin progress line with **100%** at its right end.
- (In this frame the illustration slot is blank — mid-animation.)
- Serif **"Tutorial complete"**
- Body: **"Your first house, from room list to rendered design."**
- Full-width outlined **"Done"** button.

---

## 6. `15-14-41` — Same modal, celebratory state (confetti)

**URL**: unchanged (`/app/drafts/142980?origin=project&returnTo=…`).

**Transition from #5**: 2 s later — the modal's illustration has drawn in (a **line-art house outline with a green ✓ check inside**) and a **multi-colour confetti burst** animates across the whole viewport. An OS "Screenshot captured / You can paste the image from the clipboard." toast overlays the browser chrome (not app UI).

Newly visible under the hero: the plan viewer's **zoom-out / zoom-in** icon buttons, a **"◌ Reset"** button (disabled/greyed), and a **"⇩ Customize"** outlined button at the card's top-right. Design Details now shows **Heated Area 2,053 ft²**.

---

## 7. `15-15-03` — Draft page scrolled to the plan viewer (sticky action bar)

**URL**: unchanged.

**Transition from #6**: user pressed **Done** (modal dismissed) and scrolled down. The page's action buttons **collapse into the sticky top nav**: now the nav reads Drafted · 🏠 My Studio · `‹` Morgan's Dreamhome … **🔒 Public · ⚡ Remix · 📄 Download Files · ⇪ Share · 📖 Learn · NA**. Horizontal page scroll is also present (the left card is cut off), i.e. the 3-column layout overflows at this width.

**Center — plan viewer card**
- Toolbar: **zoom-out (−)**, **zoom-in (+)**, **"◌ Reset"** (now enabled, own row), and **"⇩ Customize"** (outlined, top-right).
- Content: **furnished color floor plan**, rendered top-down with shadows — garage with two cars (left), open living with sofa group + coffee table, dining table with 6 chairs, kitchen with island (right), three bedrooms with beds, bathrooms with tub/vanity fixtures, laundry.

**Left card — "About This Design"** (clipped at left edge; reconstructed):
> "This 3-bedroom, 4-bathroom ai-generated home spans 2,053 heated square feet in a single-story layout. The open-concept floor plan features a living, a kitchen, and a dining. The primary suite includes a … closet and an ensuite … 2 additional bedrooms … flexible space for family, … or a home office. Practical … include a laundry room and … . Outdoor and utility spaces … a garage. The home … approximately 98 feet … 32 feet deep."

**Right rail — "Design Details"**
- ▣ **2,489** **ft² Total Ar[ea]**
- **Area Breakdown**: ⌂ Heated Area **2,0[53 ft²]** · ❄ Unheated Area **4[36 ft²]** · (indented, grey) Garage **4[36 ft²]**
- **Dimensions**: 📏 Dimensi… **98 ft 0 in × 32 [ft 0 in]** · ⌸ Ceiling Height **10 [ft 0 in]** · ▤ Stories (value clipped, = 1)
- **Rooms**: 🛏 Bedrooms · 🛁 Bathrooms (values clipped)

---

## 8. `15-15-27` — Plan viewer zoomed in

**URL**: unchanged.

**Transition from #7**: user clicked **zoom-in (+)** one or more times (and the **Customize** button is now **filled black** = hover/active). The plan is magnified ~2×, showing the left/top portion: primary bath with tub, bedrooms with beds and nightstands, hall bath, living room with sectional + two armchairs + patterned coffee-table books, dining table with 6 chairs, kitchen counters at right. **Reset** button is now enabled (dark text).

---

## 9. `15-15-38` — "Invite collaborators" / Share modal

**URL**: unchanged.

**Transition from #8**: user scrolled back to top (page action row visible again, nav back to Learn+avatar only) and clicked **⇪ Share** (button shown in pressed/active state).

**Modal — Invite collaborators**
- Close **✕** top-right.
- Circular dark icon (two-people glyph), serif **"Invite collaborators"**, sub-line **"Invite people to Morgan's Dreamhome."**
- Field label **"Email address"**; text input placeholder **`name@example.com`**; adjacent **gold "🔒 PRO"** upgrade badge; black **"➤ Send invite"** button.
- **"Current team"** header with **"Manage team"** link (underlined, right-aligned); member row: avatar **NA** · **Nagrom**.
- Inset panel **"Share this design instead"**: **"🔗 Copy link"** outlined button + 5 circular social buttons — **Facebook** (blue), **X** (black), **LinkedIn** (blue), **Pinterest** (red), **Email** (dark envelope).
- Footer: outlined **"Done"** button (bottom-right).

---

## 10. `15-16-22` — Draft page, Rooms list + dimensioned plan, "Opening creator…"

**URL**: unchanged (`/app/drafts/142980?origin=project&returnTo=…`).

**Transition from #9**: modal dismissed; user scrolled; the left card now shows the **Rooms** list (the left column of the draft page is a stack: About This Design → Rooms). User then clicked **Customize** — a **"◌ Opening creator…"** toast/pill appears centered over the plan, and the viewer's top-right button has flipped to **"⇧ Overview"**.

**Left card — "Rooms"**, right-aligned count **"19 rooms"**. Each row = colored rounded-square icon tile + room name + dimensions:

| # | Room | Dimensions | Icon tile colour |
|---|---|---|---|
| 1 | Living | 34 ft 4 in × 14 ft 4 in | amber/yellow (sofa) |
| 2 | Kitchen | 20 ft 8 in × 11 ft 10 in | amber/yellow (counter+sink) |
| 3 | Dining | 16 ft 10 in × 14 ft 4 in | amber/yellow (table) |
| 4 | Primary Bedroom | 12 ft 4 in × 13 ft 2 in | salmon/darker pink (double bed) |
| 5 | Bedroom | 11 ft 8 in × 13 ft 2 in | light pink (single bed) |
| 6 | Bedroom | 10 ft 4 in × 13 ft 2 in | light pink (single bed) |
| 7 | Bathroom | 5 ft 2 in × 8 ft 10 in | light blue (shower) |
| 8 | Bathroom | 5 ft 6 in × 7 ft 4 in | light blue (shower) |
| 9 | Bathroom | 5 ft 10 in × 5 ft 2 in | light blue (shower) |
| 10 | Primary Bathroom | 5 ft 10 in × 3 ft 10 in | mid blue (bathtub) |
| 11 | Garage | 23 ft 10 in × 21 ft 0 in | lavender (car) |
| 12 | Laundry | 9 ft 8 in × 8 ft 10 in | mint green (washer) |
| 13 | Primary Closet | 3 ft 10 in × 13 ft 2 in | orange/peach (shelving) |

Footer: **"⌄ 6 more rooms"** disclosure (the 6 = Closet, Pantry, Hallway ×4 — confirmed in #11/#12).

**Center — dimensioned schematic plan** (different render mode from #7/#8: pastel room fills, no furniture, wall poché, **dimension strings**). Visible dimension chips: **12'6"**, **5'8"**, **4'8"**, **14'6"**, **7'8"**, **5'10"**. Room labels with sizes drawn inside: *Garage 23'10" x 21'0"*, *Living 34'4" x 14'4"*, *Dining 16'10" x 14'6"*, *Kitchen 20'11" x 11'…*, *Pantry 5'4" x 5'4"*, *Bathroom 5'2" x 9'*, *Bedroom 10'4" x 13'2"*, *Primary Bed 12'4" x 13'2"*, *Primary Bath*, *Closet*, *Laundry 9'8" x 8'…*, *Primary Closet*.

**Right rail — Design Details (now fully readable)**
- Thumbnail: grey **3-D massing/line-art elevation** on a green ground plane.
- ▣ **2,489 ft² Total Area**
- **Area Breakdown**: ⌂ Heated Area **2,053 ft²** · ❄ Unheated Area **436 ft²** · Garage **436 ft²**
- **Dimensions**: 📏 Dimensi… **98 ft 0 in × 32 ft 0 in** · ⌸ Ceiling Height **10 ft 0 in** · ▤ Stories **1**

---

## 11. `15-16-30` — Back into the wizard: Step 2 "Place Rooms & Shape" editor

**URL (verbatim, truncated in the bar)**
```
www.drafted.ai/app/studio/projects/114312/create/01M2B203CPTDZ0S2DVMTQF8AVC/editor?returnTo=%2Fapp%2Fdrafts%2F142980%3Forigin%3Dproject%26returnTo%3D%252Fapp%252Fstudio%252F…
```
Route shape: `/app/studio/projects/{projectId}/create/{ULID}/editor?returnTo={double-encoded return path}`. Tab title flips back to **"Drafted - Design your d…"**.

**Transition from #10**: "Opening creator…" resolved → the **Customize** action deep-links back into the wizard's Step-2 editor with a nested `returnTo` so the user can bounce back to the draft page.

**Top nav**: Drafted · 🏠 My Studio · divider · `‹` **Back** · stepper `① Create Room List — ② Place Rooms & Shape — ③ Results` with **② active** (black filled circle, bold label; ① grey-filled, ③ grey-filled). Right: **📖 Learn**, credits pill (sparkle + bar + **"5 left"**), avatar **NA**. No tutorial callout (tour completed).

**Canvas toolbar (top center, four grouped pill clusters)**
1. Group A (mode/layer segmented): 📍 site/plot icon · ⬓ footprint/outline icon · **[⬚ Rooms]** *(active — gold text + gold outline + cream fill)* · ⌂ roof/house icon
2. Group B (view): **zoom-out (−)** · **zoom-in (+)** · **reset view (↺)**
3. Group C (history/edit): **undo (↶, disabled)** · **redo (↷, disabled)** · **"◇ Reset ⌄"** (eraser icon + dropdown chevron)
4. Group D: **"🧲 Snap"** — active state, mint-green fill + green text/icon (toggle)

**Left panel — "My Rooms"**
- Header: 👥 icon + serif **My Rooms**; **"＋ Add Rooms"** outlined button.
- **AI-Create Mix** slider row: label left, gold label **"Best Balance"** right; a horizontal **slider track with a ▼ handle at the far-left (0%)** and a gold gradient fill on the right portion; legend below: **"⚡ 0% AI-Create"** (gold) and **"✋ 100% Placed by You"**.
- Sub-header: ✋ **Placed by You** … **19 Rooms**
- Masonry of **room shape tiles** (each = the room's actual polygon silhouette, filled with its category colour, with name + status **"Placed"**):
  Primary Bedroom · Bedroom · Bedroom · Primary Bathroom · Bathroom · Bathroom · Bathroom · Primary Closet · Closet · Kitchen · Dining · Pantry · Living · Garage · Laundry · Hallway · Hallway · Hallway · Hallway  (= 19)
- Bottom (below the fold): a second group header **"⚡ AI-Create … 0 Rooms"**.

**Canvas — room-block plan** (pastel blocks with **teal/green outlines** = placed & snapped). Each labelled block shows **name**, then **size class + area** as `S | 119 ft²` style:
- **Bedroom — S | 119 ft²** (pink)
- **Bedroom — M | 157 ft²** (pink)
- **Primary Bedr… — S | 165 ft²** (salmon)
- **Garage — M | 416 ft²** (lavender)
- **Living — L | 504 ft²** (pale amber)
- **Dining — L | 219 ft²** (amber)
- **Kitchen — L | 254 ft²** (amber)
- **Laundry — M | 90 ft²** (mint)
- Unlabeled small blocks carry only category icons: shower (light blue), bathtub (blue), closet/hanger (peach), shelving (orange), pantry/jars (tan), and **hallway/connector blocks marked with a bow-tie "⋈" glyph** (yellow).

**Roof preview panel (floating, right)**: white card with a grey **3-D roof massing model** on a light ground, a small ▲ north/orientation marker beneath it, a ⌂ home/reset-camera icon button bottom-left, and a **"◇ Hip ⌄"** dropdown bottom-right (roof-shape selector).

**Bottom bar (floating, center)**: **"Total 2,556 ft² | Heated 2,556 ft² | 1 Story"** over a full-width black **"⚡ Create"** button with a gold ring.

*(Note the numbers differ from the finished draft: the editor's live totals are 2,556/2,556, whereas the rendered design reports 2,489 total / 2,053 heated / 436 unheated.)*

---

## 12. `15-17-05` — Step 2 editor: roof-shape dropdown open + room context action

**URL**: unchanged (`…/create/01M2B203CPTDZ0S2DVMTQF8AVC/editor?returnTo=…`).

**Transition from #11**: user (a) scrolled the left room list down, (b) hovered/selected the **Living** tile which revealed a **"🗑 Delete"** red-outlined context button attached to the tile, (c) zoomed the canvas out / reset the view (plan is smaller, and the site grid now shows **orientation labels "Back" (top), "Left" (left), "R[ight]" (right)** with centre axis lines), and (d) opened the **roof-shape dropdown**.

**Left panel (scrolled)** — visible tiles: (partial Bathroom, Primary Closet) · **Closet** · **Kitchen** · **Dining** · **Pantry** · **Living** *(with the floating **"🗑 Delete"** button overlapping to its right)* · **Garage** · **Laundry** · **Hallway** · **Hallway** · **Hallway** · **Hallway**; then the group divider and **"⚡ AI-Create … 0 Rooms"**.

**Canvas**: same 19 blocks, smaller; labels persist for Bedroom M | 157 ft², Primary … S | 165 ft², Garage M | 416 ft², Living L | 504 ft², Dining, Kitchen L | 254 ft².

**Roof panel**: the control now reads **"Roof Shape ◇ Hip ⌃"** (expanded, label revealed), and a **2×2 option grid popover** opens below it:

| | |
|---|---|
| **Hip** — selected (black filled card, white isometric hip-roof icon) | **Gable** (grey icon) |
| **Flat with Overhangs** (grey icon) | **Flat with Parapets** (grey icon) |

**Bottom bar** unchanged: **Total 2,556 ft² | Heated 2,556 ft² | 1 Story** + black **"⚡ Create"** button.

---

## Synthesis

### Route map recovered
| Route | Purpose |
|---|---|
| `/app/studio/projects/{projectId}` | Project dashboard (designs, team, inspiration) |
| `/app/studio/projects/{projectId}?materializingDesign={id}&optimisticMaterializing=1&optimisticMaterializingStartedAt={epochMs}` | Dashboard in optimistic "render in flight" state |
| `/app/studio/projects/{projectId}/create/{ULID}/editor?returnTo={encoded}` | Wizard Step 2 — Place Rooms & Shape |
| `/app/studio/projects/{projectId}/create/{ULID}/review?spread={ULID}&slot={A-E}` | Wizard Step 3 — Results; `spread` = a 5-variant set, `slot` = the chosen letter |
| `/app/drafts/{draftId}?origin=project&returnTo={encoded}` | Public-ish design ("draft") detail page |
| (implied from batch context) `/app/studio/projects/{id}/create/{ULID}/room-list` | Wizard Step 1 |

IDs: projects are short numeric (`114312`), drafts numeric (`142980`), designs numeric (`85440`), wizard runs and spreads are **ULIDs** (26-char Crockford base32).

### Wizard / tutorial model
- Three-step stepper persists in the nav across `editor` and `review`: **1 Create Room List · 2 Place Rooms & Shape · 3 Results**; the active step is a black filled numeral + bold label, inactive are grey.
- A left "back" link in the nav shows the **previous step's name** in the wizard (`‹ Place Rooms & Shape` on review, `‹ Back` on editor) and the **parent project name** on the draft page (`‹ Morgan's Dreamhome`).
- The product tour is at least **16 steps**; this batch captures 15 ("Start the render"), 16 ("Your house is rendering" → "Open your house") and the **"Tutorial complete"** modal with a 100% bar, check-in-house illustration, confetti, and a **Done** button. Tour cards are white rounded cards with `TUTORIAL STEP N` eyebrow (uppercase, letter-spaced, grey), serif title, grey body, bottom progress bar; they pair with a **dashed spotlight ring** around the target element and sometimes a **hand-drawn dashed arrow**.

### Economy / gating
- Credits pill in the nav: sparkle icon + mini progress bar + **"N left"** (**5 left** on the dashboard/editor; **1 left** inside the Choose Materials modal — i.e. a *separate* render/material credit counter).
- Gold **"🔒 PRO"** badge gates the invite-by-email field.
- Achievement banners gate progressively: dots render as **✓ completed (gold) / open ring (current) / padlock (locked)**; ring counters **0/1** then **1/3**.

### Visual system
- Serif display face (Playfair/Canela-like) for the **Drafted** wordmark, page H1s, card titles, big numbers; humanist sans (Inter-like) for body, labels, buttons.
- Palette: warm off-white/cream page ground (`#F7F5F0`-ish), near-black buttons (`#1E1D1A`), **gold/brass accent** (`#B79355`-ish) for credits, PRO, achievement rings, active `Rooms` tool; **mint green** for the active Snap toggle; red only for Delete.
- Canvas grid: pale sage/green dotted grid with dashed major gridlines; placed rooms outlined in **teal-green**.
- Room colour families (consistent across list icons, panel tiles and canvas blocks): **amber/yellow = living/kitchen/dining/hallway**, **pink = bedrooms** (salmon = primary), **light blue = bathrooms** (mid blue = primary bath), **peach/orange = closets**, **tan = pantry**, **lavender = garage**, **mint = laundry**.
- Material swatches are torn-paper/watercolor circles; roof-shape options are isometric line icons.

### Features & controls revealed by this batch
See the structured list returned alongside this report; highlights: the five-category exterior-material gate before rendering, the A–E variant spread selector, optimistic render progress (`Preparing render … 11%`), the design card metric strip, draft-page Remix/Download Files/Share/Public controls, the Materials rail with per-slot edit + Load Palette + Save Palette, the plan viewer's zoom/reset/Customize↔Overview toggle, the Customize deep-link back into the Step-2 editor, the AI-Create Mix slider (0% AI-Create ↔ 100% Placed by You, labelled "Best Balance"), the Rooms/site/footprint/roof mode switcher, Snap toggle, undo/redo/Reset, per-room Delete, the S/M/L size class + ft² labels on canvas blocks, the roof-shape popover (Hip/Gable/Flat with Overhangs/Flat with Parapets), and the live totals bar + Create button.

### Open questions
- What are wizard Step 1's controls (room-list builder, the S/M/L segmented size control implied by the `S | 119 ft²` labels)? Not in this batch.
- What does "Buildable Area: Flexible" open into (a lot/site constraint editor)?
- What does the `‹` back chevron in the Choose Materials modal return to — a per-category material picker grid?
- What does **Load Palette** / **Save Palette** browse (saved palettes library)?
- What is behind the **Reset ⌄** dropdown in the editor toolbar (reset rooms / reset shape / reset all)?
- Full content of the **Learn** panel and the **Design Library** / **Inspiration** sections (all 0 in this session).
- What does the **⌷ bookmark** icon on the draft H1 and design card do vs. **Shortlisted**? (Likely the same shortlist action; "Pinned 0 times" suggests a separate public pin count.)
- Why the discrepancy between editor totals (2,556 ft²) and the rendered design (2,489 total / 2,053 heated)?
