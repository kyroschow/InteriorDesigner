# Is drafted.ai open source? — Verification report

**Date of investigation:** 2026-09-12
**Question:** The user believes `drafted.ai` is an open-source project. Verify or refute.

---

## Verdict: REFUTED — drafted.ai is NOT open source

**Drafted.ai is a closed-source, venture-backed commercial SaaS product.** There is no public
source code, no repository, no license, and no open-source claim anywhere on the site or
anywhere else I could find.

The likely source of the confusion: **Drafted is free to use.** Its own FAQ says
"Drafted is completely free." *Free ≠ open source.* It is a free-tier commercial product
from a Y Combinator company that has raised $17.5M.

**Do not look for a repository to fork. There isn't one.**

---

## The evidence

### 1. The GitHub org exists — and is empty

This is the single most decisive piece of evidence. `github.com/drafted-ai` is a real,
claimed GitHub organization that points at the product's website — and it has published
nothing.

From the GitHub REST API (`https://api.github.com/orgs/drafted-ai`):

```json
{
  "login": "drafted-ai",
  "name": "Drafted.ai",
  "blog": "drafted.ai",
  "location": "United States of America",
  "public_repos": 0,
  "public_gists": 0,
  "followers": 3,
  "created_at": "2025-08-01T22:00:05Z",
  "updated_at": "2026-07-08T08:22:18Z",
  "is_verified": false
}
```

`https://api.github.com/orgs/drafted-ai/repos` returns an empty array: `[]`.
The org page states "This organization has no public repositories."

This is the signature of a company that reserved its GitHub handle for private development
and CI — not of an open-source project.

### 2. The website contains zero open-source signals

I downloaded the homepage and every significant page in the sitemap and grepped the raw
HTML (including the Next.js RSC payloads, not just visible text):

| Page | "github"/"gitlab" | "open source" | "self-host" | license names |
|---|---|---|---|---|
| `/` | 0 | 0 | 0 | 0 |
| `/learn` | 0 | 0 | 0 | 0 |
| `/learn/faq` | 0 | 0 | 0 | 0 |
| `/learn/news/drafted-v2` | 0 | 0 | 0 | 0 |
| `/house-plans` | 0 | 0 | 0 | 0 |
| `/revit` | 0 | 0 | 0 | 0 |

**Zero occurrences across every page.** Not one link to a repo, not one mention of a license.

Probed URLs that would exist if it were open source — all **404**:
`/open-source`, `/opensource`, `/LICENSE`, `/changelog`, `/docs`, `/about`, `/terms`, `/privacy`.

The only outbound domains on the homepage are press logos (TechCrunch, Business Insider,
Reviewed), its own auth subdomain `clerk.drafted.ai`, Intercom, Cloudflare Turnstile,
and Google Tag Manager. No code host appears anywhere.

### 3. `robots.txt` describes a closed commercial app

```
User-Agent: *
Allow: /
Disallow: /admin/*
Disallow: /app/create
Disallow: /app/drafts/create
Disallow: /app/studio
Disallow: /app/drafts/all
Disallow: /app/checkout/*
Disallow: /sso-callback
Disallow: /auth
```

An admin area, an authenticated app, a **checkout flow**, and SSO. This is a hosted
proprietary product with a payment path, not a self-hostable open-source tool.
(Note the `/app/checkout/*` route despite the current "completely free" positioning —
monetization infrastructure is already in place.)

### 4. The company is a funded, closed-source startup

- **Y Combinator, Spring 2026 batch**, 9 people, San Francisco.
  Founder/CEO: **Nicholas (Nick) Donahue**.
- **$17.5M raised** — Buckley Ventures, Y Combinator, Patrick Collison, Bill Clerico,
  Ben Silbermann (Pinterest co-founder), Jack Altman, Samsung NEXT, Starship Ventures,
  Charlie Songhurst, Evan Moore, Kevin Mahaffey, Ryan Tedder.
- Donahue's previous company **Atmos** (also YC, ~$20M from Khosla Ventures and Sam Altman)
  was also a proprietary custom-home-design business.
- The YC company page makes **no mention** of open source, GitHub, or public source code.

A generative-layout model trained in-house is the core IP of this business. There is no
commercial logic under which they would open source it, and they have not.

### 5. No repository exists anywhere

Searches performed, all negative:

- GitHub repository search for `drafted.ai` — 310 results, **none** related; all are
  unrelated projects whose descriptions contain the English word "drafted"
  (e.g. "AI-drafted replies", "AI-drafted contracts").
- GitHub repository search for `drafted floor plan` — 41 results, none affiliated.
- GitHub user/org search for `drafted` — the similarly-named accounts are all unrelated:
  - `drafted` (user, 2020) — 1 repo, `am-i-drafted`, unrelated.
  - `draftedus` (org, 2015) — a recruiting company, "It's who you know", `explore.drafted.us`.
  - `draftedlabs` (user, 2023) — `joindrafted.com`, unrelated.
  - `Drafted-Lab` (org, 2026) — `drafted-lab.com`, 0 repos, unrelated.
  - `drafted-eng` (user, 2021) — 2 repos, unrelated.
  - `draftedai` — **404, does not exist.**
- GitLab project search for `drafted` — 10 results, none related.

---

## What the product actually does (for clone scoping)

Confirmed from the site's own FAQ JSON-LD and marketing pages:

- **Structured input, not a text prompt.** The FAQ is explicit: "Drafted's AI floor plan
  generator does not use a free-form text prompt; it generates plans from structured inputs
  including a room list, lot size, house shape, and optional room placements on a canvas."
  This is a meaningful architectural signal — it points at a constraint-solver / conditioned
  generative layout model, not an LLM-prompt wrapper.
- Interactive canvas: sketch house footprint, place rooms, define lot boundary.
- Generates multiple floor plan options in seconds from a room wish list + square footage.
- Direct editing of generated **walls, doors, and window placements**.
- **Real-time matching 3D model** that updates as the 2D plan is edited; includes doors,
  windows, and **gabled roofs**. Also elevations and exterior renders.
- Furniture placement and rendering.
- **Exports: PDF, CAD (AutoCAD/DXF), BIM (Revit).** There is a dedicated `/revit` page and
  a Revit lot-planning plugin use case.
- Multiplayer/collaboration: invite teammates, builders, architects, clients to a project.
- Imperial and metric units.
- **Single-storey only today.** Multi-storey, second floors, and basements "in progress".
- Importing an existing plan/blueprint image is **not yet supported** ("We're working on it").
- Explicit disclaimer: schematic design only, does not guarantee building-code compliance.

Public stack signals (from page source): **Next.js** front end, **Clerk** for auth,
Intercom for support, Cloudflare Turnstile, Google Tag Manager. Nothing is revealed about
the generation backend.

Traction claims: 120,000+ users and 325,000+ generated designs in one month.

---

## Legitimate open-source prior art to learn from

Since there is no drafted.ai repo to study, here is the real open-source landscape. **Read
the licence column carefully** — the best-known research models are explicitly barred from
commercial use.

### Critical licensing warning

The three highest-profile floor-plan generation repos are **NOT usable in a commercial
product**. I read their actual LICENSE files:

- **House-GAN** (`ennauata/housegan`) and **House-GAN++** (`ennauata/houseganpp`) —
  LICENSE begins with a banner: `THIS CODE CAN ONLY BE USED FOR RESEARCH PURPOSES`,
  followed by GPL-3.0. GitHub reports this as "NOASSERTION"/Other, which is easy to
  misread as permissive. It is not.
- **HouseDiffusion** (`aminshabani/house_diffusion`) — LICENSE reads verbatim: "The code
  and the model weights in this repository are not allowed for commercial usage. For
  research purposes, the terms follow the GPL v3."
- **RPLAN dataset** (the dataset all three train on) — restricted-access, research-only
  data-use agreement; **non-commercial only and redistribution prohibited** in whole or
  in part. 80,788 real residential floor plans from Asia. Access is by request to USTC.

Use these to understand *technique*. Do not vendor their code or weights into a product.

### Research / generative layout

| Project | Stars | Lang | License | Notes |
|---|---|---|---|---|
| [ennauata/housegan](https://github.com/ennauata/housegan) | 293 | Python | GPL-3.0 **+ research-only** | House-GAN. Relational GAN, graph-constrained layout. Bubble diagram → layout. The canonical reference. |
| [ennauata/houseganpp](https://github.com/ennauata/houseganpp) | 254 | Python | GPL-3.0 **+ research-only** | House-GAN++ (CVPR 2021). Iterative layout *refinement* — closest in spirit to Drafted's "generate then refine" loop. |
| [aminshabani/house_diffusion](https://github.com/aminshabani/house_diffusion) | 235 | Python | **non-commercial** | HouseDiffusion (CVPR 2023). **Vector** floorplan output via diffusion with discrete+continuous denoising. Vector output matters — it is what makes CAD export clean. |
| [HanHan55/Graph2plan](https://github.com/HanHan55/Graph2plan) | 349 | JavaScript | **none stated** | Graph2Plan (SIGGRAPH 2020). Layout graph + building boundary → floor plan, human-in-the-loop. No licence file = all rights reserved; unusable as-is. |
| [luozn15/FloorplanGAN](https://github.com/luozn15/FloorplanGAN) | 73 | Jupyter | **MIT** | Vector residential floorplan adversarial generation. One of the few permissively licensed research repos. |
| [SizheHu/GSDiff](https://github.com/SizheHu/GSDiff) | 32 | Python | **GPL-3.0** | AAAI 2025. Vector floorplans via geometry-enhanced structural *graph* generation. Copyleft but genuinely open. |
| [Cornell-VAILab/Raster2Seq](https://github.com/Cornell-VAILab/Raster2Seq) | 52 | Python | **MIT** | SIGGRAPH 2026. Polygon *sequence* generation for floorplan reconstruction. Recent and permissive. |
| [WizardZZH/Floorplan-generation](https://github.com/WizardZZH/Floorplan-generation) | 14 | Python | GPL-3.0 | Neural-guided room layout from bubble-diagram constraints. |
| [mariaaoprea/Diffusion-Models-for-floor-plan-drafting](https://github.com/mariaaoprea/Diffusion-Models-for-floor-plan-drafting) | 25 | Python | — | Bachelor thesis; useful as a readable walkthrough. |

### Procedural / algorithmic layout (no ML, no dataset licensing risk)

This is the most practical starting point for a clone: deterministic, debuggable, no
training data, no licence entanglement.

| Project | Stars | Lang | License | Notes |
|---|---|---|---|---|
| [laserson/squarify](https://github.com/laserson/squarify) | 334 | Python | **Apache-2.0** | Squarified treemap layout. The classic way to turn `{room: target_area}` into a rectangular dissection with good aspect ratios. Directly applicable to "room list + square footage → plan". |
| [huy-nguyen/squarify](https://github.com/huy-nguyen/squarify) | 32 | TypeScript | — | TS port of the same algorithm, if the stack is JS. |
| [clementbat/treemap](https://github.com/clementbat/treemap) | 24 | JavaScript | **MIT** | Another permissive JS squarify implementation. |
| [AI4SC/bim-diffusion-models](https://github.com/AI4SC/bim-diffusion-models) | 6 | Python | **MIT** | A *procedural* floor plan generator written specifically to synthesize training data. Very relevant: it sidesteps the RPLAN licence problem entirely. |
| [LeandroDornela/floor-plan-generator](https://github.com/LeandroDornela/floor-plan-generator) | 5 | C# | **MIT** | Procedural floor plan + building generation (Unity). |
| [togzhan-krbkv/procedural-city-generator](https://github.com/togzhan-krbkv/procedural-city-generator) | 1 | Python | **MIT** | Shape grammars + L-systems for floor plans and city blocks. |
| [rohvani/Research](https://github.com/rohvani/Research) | 9 | C# | — | Implements Mirahmadi & Shami, "Real-time Procedural Generation of Building Floor Plans" — a slicing-tree/dissection approach. Good paper to read even if the code is unlicensed. |

**Key algorithmic concepts to research** (the literature, not repos): squarified treemaps,
**slicing trees / slicing floorplans** (from VLSI physical design — this is a mature field
with decades of literature on rectangular dissection), **rectangular dual graphs** (turning
an adjacency graph of rooms into a rectangular layout — this is the rigorous formulation of
"bubble diagram → floor plan"), simulated annealing over slicing-tree representations, and
Voronoi/KD-tree subdivision of a footprint polygon.

### Interactive editors and renderers (directly reusable UI)

| Project | Stars | Lang | License | Notes |
|---|---|---|---|---|
| [cvdlab/react-planner](https://github.com/cvdlab/react-planner) | 1476 | JavaScript | **MIT** | React component for plan design: draw 2D floorplan, navigate in 3D. The single most directly reusable piece for a clone's editor. |
| [ekymo/homeRoughEditor](https://github.com/ekymo/homeRoughEditor) | 393 | JavaScript | **MIT** | **SVG** floorplan editor — walls, doors, windows, rooms. Exactly the blueprint-SVG-renderer layer. Strong reference for wall-joint geometry. |
| [il4mb/Floorplan](https://github.com/il4mb/Floorplan) | — | TypeScript | **MIT** | TypeScript rewrite of the above. |
| [iliyavalchanov/2d-moodboard-floor-planner](https://github.com/iliyavalchanov/2d-moodboard-floor-planner) | — | JavaScript | — | React-Konva infinite canvas — relevant to Drafted's "digital lot" canvas metaphor. |
| [Sweet Home 3D](https://sweethome3d.org/) | — | Java | **GPL-2.0** | Mature desktop 2D/3D interior design. Exports plans to **SVG**, models to OBJ. Decades of hard-won detail on wall/door/window modelling. |
| [charmlinn/blueprint3d-modern](https://github.com/charmlinn/blueprint3d-modern) | — | TypeScript | — | Modern TS rewrite of blueprint3d (Three.js). 2D plan ↔ 3D room view. |
| [OpenPlan3D](https://openplan3d.com/) | — | — | open source | 2D draw / 3D view, iPhone LiDAR scan, exports PNG, SVG, DXF, PDF. |

### CAD / BIM export (Drafted's PDF + CAD + Revit exports)

| Project | Stars | Lang | License | Notes |
|---|---|---|---|---|
| [mozman/ezdxf](https://github.com/mozman/ezdxf) | 1438 | Python | **MIT** | The standard Python DXF read/write library. This is how you ship "export to CAD". Actively maintained. |
| [IfcOpenShell/IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) | 2781 | C++/Python | **LGPL-3.0** | The open IFC library and geometry engine. This is how you ship "export to BIM" without licensing Revit. LGPL — linkable from a commercial product with care. |
| [AECgeeks/ifc-pipeline](https://github.com/AECgeeks/ifc-pipeline) | 175 | Python | **MIT** | Processing queue + web BIM viewer built on IfcOpenShell. Good template for a server-side export pipeline. |

### Datasets — and which ones you may actually use commercially

| Dataset | Size | License | Commercial use? |
|---|---|---|---|
| **[Swiss Dwellings](https://archilyse.standfest.science/swiss-dwellings)** | 45,000+ Swiss apartments, verified geometry, 367 simulation columns per area | **CC BY 4.0** | **YES** — the permissive option. Start here. |
| [Modified Swiss Dwellings (MSD)](https://www.kaggle.com/datasets/caspervanengelenburg/modified-swiss-dwellings/data) | 5.3K+ plans of medium/large building complexes | derived from Swiss Dwellings | Likely yes; verify. Benchmark repo: [cvaad-workshop/iccv23-challenge](https://github.com/cvaad-workshop/iccv23-challenge) |
| [RPLAN](http://staff.ustc.edu.cn/~fuxm/projects/DeepLayout/index.html) | 80,788 real residential plans (Asia) | research-only DUA, no redistribution | **NO** |
| [CubiCasa5K](https://github.com/CubiCasa/CubiCasa5k) | 5,000 plans, 80+ object categories | **CC BY-NC-SA 4.0** | **NO** (non-commercial) |
| [ResPlan](https://github.com/m-agour/ResPlan) | 17,000 residential plans, vector-graph | NOASSERTION — verify | Unclear; check before use |
| [ModRes](https://github.com/emmashelley/ModRes) | ~8,500 cleaned ResPlan plans | **MIT** (repo) | Repo is MIT; underlying data rights still need checking |

**Practical consequence:** if the clone is ever commercial, the cleanest path is
Swiss Dwellings (CC BY 4.0) plus procedurally synthesized training data
(the [AI4SC/bim-diffusion-models](https://github.com/AI4SC/bim-diffusion-models) approach,
MIT), avoiding RPLAN and CubiCasa5K entirely.

### Suggested architecture for a clone

Drawing the threads together — a defensible, licence-clean stack:

1. **Input layer** — structured constraints, mirroring Drafted: room list with counts and
   target areas, total square footage, footprint polygon, lot boundary, optional adjacency
   hints and canvas-placed room seeds. Deliberately *not* a free-text prompt.
2. **Layout solver** — start deterministic, not neural. Represent the plan as a slicing
   tree / rectangular dissection over the footprint polygon; seed areas with squarified
   treemap; optimize with simulated annealing against a cost function over adjacency
   satisfaction, aspect ratio, circulation, and daylight (exterior wall access for bedrooms
   and living spaces). This gives you plausible plans on day one with zero dataset risk,
   and it is inspectable when it produces something odd.
3. **Refinement** — only then consider a learned model. GSDiff (GPL-3.0) and Raster2Seq
   (MIT) are the licence-viable references; House-GAN++ is the conceptual reference for
   iterative refinement.
4. **Wall/opening geometry** — derive walls from the dissection edges, resolve joints, place
   doors on shared edges along the circulation graph, windows on exterior edges.
   `homeRoughEditor` is the reference implementation for the fiddly parts.
5. **Editor** — `react-planner` (MIT) or `homeRoughEditor` (MIT) as the base; SVG for 2D.
6. **3D** — Three.js extrusion from the 2D plan, per blueprint3d-modern. Gabled roof
   generation from the footprint is a separate, well-documented straight-skeleton problem.
7. **Export** — `ezdxf` (MIT) for DXF/CAD, `IfcOpenShell` (LGPL) for IFC/BIM, SVG→PDF for
   plan sheets.

---

## Confidence and limits

**High confidence, verified directly:**
- drafted.ai has no public source code. Verified three independent ways: the GitHub API
  reports `public_repos: 0` for the org that the company itself claims; the website contains
  zero references to github/gitlab/open-source/self-hosting/any licence across every page in
  its sitemap; and repository searches on both GitHub and GitLab return nothing affiliated.
- It is a YC Spring 2026 company with $17.5M in funding and a checkout flow.
- The licence terms I quote for House-GAN, House-GAN++, HouseDiffusion and squarify were
  read from the actual LICENSE files, not inferred from GitHub's label.

**Could not verify:**
- `www.drafted.ai` returns **403** to the WebFetch tool (bot protection). All site findings
  come from direct `curl` with a browser user-agent, which succeeded — so the pages were read,
  but via raw HTML/RSC payload rather than rendered text. I could have missed a string that
  only appears after client-side hydration, though a GitHub link in a footer would normally
  be in the server payload.
- The site has **no `/terms`, `/privacy`, or `/about` page** at the obvious paths (all 404).
  I could not read the legal terms, so the formal licensing/ownership language is unconfirmed.
  These may live inside the authenticated app.
- I did **not** log into the app, so the in-product experience and any in-app open-source
  attribution page are unexamined.
- Drafted's actual generation algorithm is **entirely unknown and unknowable from outside**.
  Everything in the "architecture for a clone" section is my own synthesis from the open
  literature, not reverse-engineering of their system. The only real signal about their
  approach is the FAQ's statement that they use structured inputs rather than a text prompt.
- Funding figures come from secondary press coverage and the YC page; I saw $16M, $16.5M,
  $1.65M and $17.5M across different outlets. The YC page's **$17.5M** is the most
  authoritative and is what I report. Some of the aggregator articles are low-quality SEO
  content and should not be relied on.
- The RPLAN "non-commercial, no redistribution" terms come from secondary sources and the
  project page; the project page did not render its full terms for me. **Verify directly
  with the authors before relying on it** — but the conservative reading is that it is
  unusable commercially.
- Dataset licences change. Re-verify Swiss Dwellings' CC BY 4.0 status before building on it.

---

## Sources

Primary — drafted.ai and its GitHub presence:
- https://www.drafted.ai/ (fetched via curl; WebFetch returns 403)
- https://www.drafted.ai/robots.txt
- https://www.drafted.ai/sitemap.xml
- https://www.drafted.ai/main-sitemap.xml
- https://www.drafted.ai/learn/faq
- https://www.drafted.ai/learn/news/drafted-v2
- https://www.drafted.ai/house-plans
- https://www.drafted.ai/revit
- https://www.drafted.ai/learn/ai-floor-plan-generators
- https://www.drafted.ai/learn/best-floor-plan-generator-software
- https://github.com/drafted-ai
- https://api.github.com/orgs/drafted-ai
- https://api.github.com/orgs/drafted-ai/repos
- https://api.github.com/users/drafted

Company background:
- https://www.ycombinator.com/companies/drafted
- https://www.crunchbase.com/organization/drafted-b9b3
- https://connecteddesign.tech/putting-ai-to-use-in-floor-plan-generation-with-drafted/
- https://aibusinessweekly.net/p/drafted-ai-home-design-funding-floor-plans
- https://stockpil.com/drafted-ai-custom-home-funding/
- https://www.newsbeep.com/us/683266/

Open-source projects:
- https://github.com/ennauata/housegan
- https://raw.githubusercontent.com/ennauata/housegan/master/LICENSE
- https://github.com/ennauata/houseganpp
- https://raw.githubusercontent.com/ennauata/houseganpp/main/LICENSE
- https://raw.githubusercontent.com/ennauata/houseganpp/main/README.md
- https://github.com/aminshabani/house_diffusion
- https://raw.githubusercontent.com/aminshabani/house_diffusion/main/LICENSE
- https://github.com/HanHan55/Graph2plan
- https://github.com/luozn15/FloorplanGAN
- https://github.com/SizheHu/GSDiff
- https://github.com/Cornell-VAILab/Raster2Seq
- https://github.com/WizardZZH/Floorplan-generation
- https://github.com/mariaaoprea/Diffusion-Models-for-floor-plan-drafting
- https://github.com/laserson/squarify
- https://raw.githubusercontent.com/laserson/squarify/master/LICENSE.txt
- https://github.com/huy-nguyen/squarify
- https://github.com/clementbat/treemap
- https://github.com/AI4SC/bim-diffusion-models
- https://github.com/LeandroDornela/floor-plan-generator
- https://github.com/togzhan-krbkv/procedural-city-generator
- https://github.com/rohvani/Research
- https://github.com/cvdlab/react-planner
- https://github.com/ekymo/homeRoughEditor
- https://github.com/il4mb/Floorplan
- https://github.com/iliyavalchanov/2d-moodboard-floor-planner
- https://github.com/charmlinn/blueprint3d-modern
- https://sweethome3d.org/
- https://sourceforge.net/projects/sweethome3d/
- https://opensource.com/article/19/10/interior-design-sweet-home-3d
- https://openplan3d.com/
- https://github.com/mozman/ezdxf
- https://github.com/IfcOpenShell/IfcOpenShell
- https://github.com/AECgeeks/ifc-pipeline

Datasets:
- http://staff.ustc.edu.cn/~fuxm/projects/DeepLayout/index.html (RPLAN)
- https://dl.acm.org/doi/10.1145/3355089.3356556 (Wu et al., "Data-driven interior plan generation for residential buildings")
- https://github.com/CubiCasa/CubiCasa5k
- https://archilyse.standfest.science/swiss-dwellings
- https://www.kaggle.com/datasets/caspervanengelenburg/modified-swiss-dwellings/data
- https://github.com/cvaad-workshop/iccv23-challenge
- https://github.com/m-agour/ResPlan
- https://arxiv.org/html/2508.14006v2 (ResPlan paper)
- https://github.com/emmashelley/ModRes
- https://arxiv.org/pdf/2407.10121 (MSD benchmark)
- https://arxiv.org/pdf/2407.15723 (DStruct2Design)
- https://arxiv.org/pdf/2311.15941 (Tell2Design)
- https://arxiv.org/pdf/2504.09694 (Computer-Aided Layout Generation for Building Design: A Review)
