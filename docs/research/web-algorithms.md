# Algorithms for an AI House-Plan Generator (drafted.ai clone)

Research notes — technical core. All dimensions are US residential (feet/inches).
Compiled 2026-09-12. Sources listed at the bottom of each section.

---

## 0. Executive recommendation (read this first)

**Primary engine: seeded simulated annealing over a slicing tree (normalized Polish
expression), with a reserved circulation spine, followed by an LP/flow dimensioning
pass.**

Why this and not the alternatives:

| Approach | No overlaps/gaps guaranteed? | Arbitrary adjacency? | Deterministic in TS? | Speed | Verdict |
|---|---|---|---|---|---|
| **Slicing tree (guillotine) + SA** | **Yes, by construction** | Soft (scored) | Yes (seeded PRNG) | ~10⁴–10⁵ moves/s | **USE THIS** |
| Squarified treemap | Yes, by construction | Very weak | Yes | ~instant | Use as *seed generator* for the SA |
| KD-tree subdivision | Yes | Weak | Yes | instant | Degenerate case of slicing tree |
| Rectangular dual (REL) | Yes | **Exact/hard** | Yes but fragile | slow (see below) | Use as *secondary variant source* |
| B*-tree / sequence pair / CBL | No — needs compaction, leaves dead space | Soft | Yes | fast | **Reject** — dead space is fatal for houses |

The killer argument: a house floor plan must **tile** its footprint — every square foot
belongs to exactly one room, hallway, or wall. VLSI non-slicing representations
(B\*-tree, sequence pair, corner block list) are *packing* representations. They
minimize dead space but never eliminate it, because chips tolerate whitespace and
houses do not. A guillotine/slicing partition is a **dissection**: area is conserved
exactly at every node, so overlaps and gaps are structurally impossible. That single
property removes an entire class of bugs.

The cost: slicing structures cannot express every adjacency graph (the classic
counterexample is the "pinwheel" of 5 rectangles). In practice this is fine, because
residential plans are overwhelmingly sliceable, and the adjacencies we care about
(kitchen↔dining, primary bath↔primary bed) are between few pairs and can be satisfied
by *ordering within the tree* rather than by global graph realization.

**Pipeline:**

```
room list (types, counts, S/M/L)  ──┐
house footprint polygon + target ft² ├─> [1] normalize program → target areas + constraints
                                    ─┘
  [2] rectilinear-decompose footprint into 1..k rectangles
  [3] reserve circulation spine (corridor band) inside the main rectangle
  [4] allocate rooms → zones by area + privacy gradient
  [5] seed slicing tree per zone (squarified treemap gives a good start)
  [6] simulated annealing over Polish expression (M1/M2/M3), seeded PRNG
  [7] shape-curve sizing (Stockmeyer) each accepted candidate → exact geometry
  [8] LP/flow dimensioning pass → enforce min widths + aspect ratio bounds exactly
  [9] wall generation (centerlines → thickened polygons, cleanup at T/L joints)
 [10] door placement (corner-proximity heuristic, per-pair)
 [11] window placement (exterior wall runs, daylight quota 8%, egress checks)
 [12] annotation (dimension strings, room labels)
 [13] roof (straight skeleton → hip / gable / flat+overhang / flat+parapet)
 [14] 3D massing (extrude walls with opening-aware sub-boxes; no CSG needed)
```

Variants A–E = five fixed seeds `0xA…0xE`, with a diversity filter (reject a candidate
whose room-centroid signature is within τ of an already-accepted variant) plus one
deliberately different *strategy* per variant (see §3.5).

---

## 1. Rectangular floor plan generation

### 1.1 Slicing trees and normalized Polish expressions (Wong–Liu) — RECOMMENDED

A **slicing floorplan** is one obtained by recursively cutting a rectangle with a
full-width horizontal or vertical line. Its slicing tree has rooms at the leaves and
cut operators `H` / `V` at internal nodes. The postorder traversal is a **Polish
expression**.

Convention (Wong–Liu):
- `i j H` → rectangle *i* is **on the bottom** of *j* (horizontal cut)
- `i j V` → rectangle *i* is **on the left** of *j* (vertical cut)

An expression `E = e₁e₂…e_{2n-1}` over *n* operands is a valid Polish expression iff:

1. Each operand appears exactly once.
2. **Balloting property**: for every prefix `Eᵢ = e₁…eᵢ`, `#operands > #operators`.

It is **normalized** iff it has no two consecutive operators of the same type
(no `…HH…` or `…VV…`). There is a **one-to-one correspondence** between normalized
Polish expressions and slicing floorplans — no redundancy, which makes the SA search
space clean.

**Initial solution:** `E = 1 2 V 3 V 4 V … n V` (all rooms in a row).

**Neighborhood moves** (a *chain* is a maximal run of operators `HVHV…` or `VHVH…`):

- **M1** — swap two adjacent *operands* `eᵢ`, `eⱼ`.
- **M2** — select a nonzero-length chain and **complement** it (`H↔V` for every
  operator in the chain).
- **M3** — swap an adjacent operand/operator pair.

M1 and M2 always preserve validity. **M3 can break the balloting property** and must be
validity-checked:

- swapping operand `eᵢ` with operator `e_{i+1}`: legal iff `e_{i-1} ≠ e_{i+1}`
  **and** `2·N_{i+1} < i`, where `N_k` = number of operators in `e₁…e_k`.
- swapping operator `eᵢ` with operand `e_{i+1}`: legal iff `eᵢ ≠ e_{i+2}`.

**Wong–Liu SA driver** (parameters `P` init-prob, `ε` freeze temp, `r` cooling rate,
`k` moves-per-temperature multiplier):

```
E ← 1 2 V 3 V … n V;  Best ← E
T₀ ← -Δavg / ln(P)          // Δavg = avg uphill cost of random moves
N  ← k·n                    // k typically 5..10
repeat
  MT ← uphill ← reject ← 0
  repeat
     M ← SelectMove()                      // M1 | M2 | M3, uniform or weighted
     NE ← apply(M, E)                      // reject illegal M3
     MT++;  Δ ← cost(NE) - cost(E)
     if Δ ≤ 0 or Random() < exp(-Δ/T) then
        if Δ > 0 then uphill++
        E ← NE
        if cost(E) < cost(Best) then Best ← E
     else reject++
  until uphill > N or MT > 2N
  T ← r·T                                  // r ≈ 0.85..0.95
until reject/MT > 0.95 or T < ε or out-of-time
```

For a house with 8–18 rooms per zone, `N = 10n ≈ 100–180`, ~40 temperature steps ⇒
roughly 5k–15k evaluated candidates. In TypeScript that is well under 100 ms.

### 1.2 Shape curves (Stockmeyer sizing) — exact soft-block sizing of a slicing tree

Each room is a **soft block**: fixed target area `A`, flexible aspect ratio.
Its shape function is the hyperbola `w·h = A` clipped by aspect bounds
`r ≤ h/w ≤ s`. Discretize into a small piecewise-linear set of `(w,h)` corner points
(e.g. 8–16 samples across the legal aspect band, snapped to a 2-inch or 4-inch module).

Combine children bottom-up:

- **`V` cut (side-by-side, vertical abutment of the cut line):**
  `w = w_left + w_right`, `h = max(h_left, h_right)`
- **`H` cut (stacked):**
  `w = max(w_bottom, w_top)`, `h = h_bottom + h_top`

Merging two sorted corner-point lists is a linear merge; sizing the whole tree is
`O(n log n)` amortized (`O(Σ|list|)` per node). At the root, pick the corner point that
best fits the footprint rectangle; then walk **top-down** recording which child corner
point produced it, which fixes every room's `(w,h)` exactly. This is the standard
Stockmeyer algorithm and it is fully deterministic.

> Implementation note: keep corner-point lists capped (e.g. ≤ 64 entries) by pruning
> dominated and near-duplicate points, otherwise lists grow combinatorially.

### 1.3 Squarified treemaps (Bruls–Huizing–van Wijk; Marson–Musse for floor plans)

Classic treemap subdivision that greedily builds *strips* to keep aspect ratios near 1.

```
worst(R, w) = max( (w²·s²)/(r₊²) , r₋/(w²·s²) )      // s = Σ R, r₊ = max R, r₋ = min R
                                                      // w = length of the short side

squarify(children, row, w):
   c ← head(children)
   if worst(row, w) ≥ worst(row ++ [c], w):
        squarify(tail(children), row ++ [c], w)       // keep adding to this strip
   else:
        layoutrow(row)                                // commit the strip
        squarify(children, [], width(remaining))      // restart with the new short side
```

Areas are sorted **descending** first; the strip runs along the **shorter** side of the
remaining free rectangle, which is what drives aspect ratios toward 1.

Marson & Musse (2010) applied exactly this to floor plans, recursively: first place
*zones* (social / service / private), then subdivide each zone into rooms. Because
rooms in real houses do have aspect ratios near 1, it produces plausible results
instantly — but it does **not** preserve adjacency. **Use it as the SA's initial
solution, not as the final answer.**

A squarified treemap is trivially convertible to a slicing tree: each committed strip
is one cut, and the rooms inside a strip are cuts of the opposite orientation. So step
[5] of the pipeline hands step [6] a valid Polish expression for free.

### 1.4 KD-tree subdivision

Recursive binary split with alternating (or best-of-two) axis. This is simply a slicing
tree constrained to alternate `H`/`V` strictly — i.e. a *normalized* Polish expression
where the chain structure is forced. Cheap, deterministic, but the forced alternation
throws away good solutions. Use the general slicing tree instead; you lose nothing.

### 1.5 Rectangular duals (theoretically exact adjacency) — secondary generator

See §2. Short version: it gives you **exact** adjacency, but only for adjacency graphs
that are *properly triangulated planar graphs* (PTPG) with ≤ 4 corner-implying paths
and no separating triangles. Real room programs routinely violate this. GPLAN (the
reference implementation) generated 1300 topologically distinct plans for one 9-room
graph in **282 seconds** in Python — far too slow for interactive variant generation,
though acceptable as an offline/lazy secondary source.

### 1.6 VLSI non-slicing representations — REJECT for this product

- **Sequence pair** (Murata et al.): two permutations `(Γ₊, Γ₋)`; `a` is left of `b`
  iff `a` precedes `b` in both. Geometry recovered by longest-path in constraint graphs.
- **B\*-tree** (Chang et al.): ordered binary tree; left child = block immediately to
  the right at the same bottom edge, right child = block above with the same x. Packs
  to the bottom-left corner. Used with Fast-SA.
- **Corner block list**: `(S, L, T)` triple encoding mosaic floorplans.

All three represent *packings*, not *dissections*. They leave dead space, and
post-compaction cannot in general remove it. They also have no notion of "fill the
footprint exactly." They're the right tool for chips, the wrong tool for houses.

**Sources:** [Wong–Liu / Polish expressions, NTU EDA lecture notes](http://cc.ee.ntu.edu.tw/~ywchang/Courses/EDA/lec3.pdf) ·
[Squarified Treemaps, Bruls–Huizing–van Wijk](https://vanwijk.win.tue.nl/stm.pdf) ·
[Marson & Musse, *Automatic Real-Time Generation of Floor Plans Based on Squarified Treemaps*](https://onlinelibrary.wiley.com/doi/10.1155/2010/624817) ·
[Camozzato et al., *A Novel Algorithm for Real-time Procedural Generation of Building Floor Plans*](https://ar5iv.labs.arxiv.org/html/1211.5842) ·
[Modern floorplanning based on B\*-tree and fast simulated annealing](https://ieeexplore.ieee.org/document/1610730/)

---

## 2. Adjacency graph → geometry

### 2.1 The exact theory (rectangular duals)

Given a planar adjacency graph `G` whose vertices are rooms and edges are required
adjacencies, a **rectangular dual** is a dissection of a rectangle into rectangles, one
per vertex, such that two rectangles share a positive-length wall segment iff the
vertices are adjacent.

**Existence (Kozminski & Kinnen; Bhasker & Sahni).** A rectangular dual exists for a
bi-connected PTPG `G` iff:

1. `G` has **at most four corner-implying paths (CIPs)**,
2. `G` has **no separating triangles**,
3. the exterior face of `G` is **not** a triangle.

A *properly triangulated planar graph* is a connected planar graph in which every
interior face is a triangle. Bhasker & Sahni give an **O(n)** construction.

**Regular Edge Labeling (REL) / transversal structure.** For a PTPG with exterior face
of length 4 (vertices `N, E, S, W` clockwise), an REL partitions the interior edges into
two directed sets `T₁, T₂` such that around every interior vertex `u`, counter-clockwise,
the edges appear as: `T₁` leaving, `T₂` entering, `T₁` entering, `T₂` leaving. Boundary
condition: all interior edges at `N` are `T₁` entering `N`; at `E` are `T₂` entering `E`;
at `S` are `T₁` leaving `S`; at `W` are `T₂` leaving `W`.

`T₁` encodes vertical adjacency, `T₂` horizontal adjacency. **An REL uniquely determines
a rectangular dual.** Different RELs of the same triangulation give *topologically
distinct* floor plans with the same adjacency graph — this is exactly the machinery you
would use to enumerate variants A–E with identical adjacency.

Moving between RELs is done by **flipping** a "flippable item" (a four-sided face or
degree-4 vertex whose labels can be rotated); the set of RELs forms a distributive
lattice, so you can walk it systematically.

When conditions 1–3 fail you must **repair**: add dummy vertices to break separating
triangles (3 ways per triangle) and to reduce CIPs (for `k > 4` CIPs there are `C(k,4)`
ways), obtain an RFP, then **merge the dummy rooms back**, which yields an *orthogonal*
(L/T/Z-shaped) floorplan rather than a rectangular one.

**Area-universality (Eppstein et al.).** A rectangular layout is *area-universal* iff
every maximal segment in it is **one-sided** (all rectangles on one of its two sides
have an endpoint on it). An area-universal layout can realize **any** assignment of
positive target areas while preserving the exact combinatorial structure. This is
extremely relevant: if you want to let the user drag a "bedroom bigger" slider without
the plan re-shuffling, prefer layouts that are area-universal, and test the one-sided
property over your maximal segments — it's a simple `O(n)` sweep.

### 2.2 The practical recommendation

Do **not** make the rectangular-dual path your primary engine. Instead:

1. Encode adjacency as **soft constraints in the SA cost function** (§3.2). The SA will
   find slicing layouts satisfying essentially all requested adjacencies for realistic
   room programs, because the required adjacency set is sparse (typically 8–15 edges).
2. Encode adjacency as **structural priors on the slicing tree**: force
   kitchen+dining into the same subtree, primary bed+primary bath+primary closet into
   the same subtree. A shared subtree with a single cut *guarantees* a shared wall.
   This alone satisfies most of the hard requirements before annealing starts.
3. Keep a rectangular-dual generator behind a flag as a variant source for users who
   hand-draw an adjacency bubble diagram.

**Closets inside bedrooms** should not be rooms in the global partition at all — model
them as a *nested* slicing tree inside the bedroom's leaf rectangle. Same for pantries
inside kitchens and water closets inside primary baths. This drops the global room
count by 30–40 %, which speeds the SA up quadratically in practice and makes the
"closet is inside the bedroom" invariant structural rather than scored.

### 2.3 Dimensioning: Encoded Matrix → st-graphs → network flow LP

This is the single most reusable algorithm found. It takes a **dimensionless rectangular
arrangement** (what the SA/treemap/REL produces) and assigns **exact dimensions** that
satisfy per-room minimum widths and aspect-ratio ranges while preserving every
adjacency. Source: Upasani, Shekhawat & Sachdeva, *Automated generation of dimensioned
rectangular floorplans*.

**Step A — Encoded Matrix (EM).** Rasterize the arrangement onto a grid; each cell holds
the index of the room covering it. Pad with four border rooms `N, E, S, W` so the
composition is rectangular.

**Step B — Build the two st-graphs directly from the EM.**

- **HST (horizontal st-graph):** traverse each **row** left→right; for every pair of
  *distinct consecutive* entries add a directed edge (former → latter). Delete `N` and
  `S`. Source = `W`, sink = `E`.
- **VST (vertical st-graph):** traverse each **column** top→bottom; for every pair of
  distinct consecutive entries add a directed edge (former → latter). Delete `W` and
  `E`. Source = `N`, sink = `S`.

Edges into the sink nodes are redundant and can be dropped.

**Step C — Flow networks.** Treat each st-graph as a network flow. **One design variable
per directed edge**: `w(e_ij)` = the length of the wall section shared between rooms
*i* and *j*. Conservation at every interior node:

```
Σ w(e_ji)  =  Σ w(e_ik)        ∀ i ∈ V(G)          (2)
 inflow        outflow
```

Room dimension = total inflow: `width_i = Σ w(e_ji)` on the **vertical** network (VNF,
which carries widths), `height_i = Σ w(e_ji)` on the **horizontal** network (HNF).

**Objective** — minimize the overall dimension (total flow out of the source):

```
minimize  f = Σ w(e_sj),      s ∈ {N, W}           (1)
```

**Inequalities** — per-room min/max dimension:

```
min(d) ≤ Σ w(e_ik) ≤ max(d)   ∀ i ∈ V(G)          (3)
```

**Variable lower bounds** — every edge variable is a shared wall, so its lower bound is
the **minimum door width plus jambs** (use `3.0 ft`; see §4). This is what guarantees
that every declared adjacency has room for an actual door.

**Step D — Iterate to satisfy aspect ratios.**

```
1. input  w_i,min  and  (AR_i,min , AR_i,max)  per room
2. solve VNF (simplex) for minimum total width  → yields every w_i
3. h_i,min ← w_i × AR_i,min                                    (4)
   solve HNF with those as lower bounds        → yields every h_i
4. for each room whose realized AR exceeds AR_i,max:
        w_i,min(up) ← h_i,min / AR_i,max                       (5)
   repeat 2–4 until all AR_i ∈ [AR_i,min, AR_i,max]
5. construct the floorplan from the EM, traversing columns left→right
```

Converges in a handful of iterations. In TypeScript use `javascript-lp-solver`,
`glpk.js` (GLPK compiled to WASM — deterministic and fast), or a small hand-rolled
simplex; the problems are tiny (edges ≈ 2–3× rooms).

> **Why bother, when the slicing tree already gives geometry?** Because shape-curve
> sizing optimizes area/aspect but has no direct handle on *"this specific shared wall
> must be ≥ 3 ft so a door fits"*. The flow LP expresses that as a variable lower bound,
> exactly. Run it as a final snap/repair pass on the SA winner.

**Sources:** [Bhasker & Sahni, *A linear algorithm to find a rectangular dual of a planar triangulated graph*](https://link.springer.com/article/10.1007/BF01762117) ·
[GPLAN: Computer-Generated Dimensioned Floorplans for given Adjacencies](https://arxiv.org/pdf/2008.01803) ·
[Upasani et al., *Automated generation of dimensioned rectangular floorplans*](https://arxiv.org/pdf/1910.00081) ·
[Eppstein et al., *Area-Universal Rectangular Layouts*](https://arxiv.org/pdf/1302.3672) ·
[Regular Labelings and Geometric Structures (Eppstein survey)](https://arxiv.org/pdf/1007.0221)

---

## 3. Constraint / optimization

### 3.1 Determinism

Everything stochastic must come from one seeded PRNG. Use **mulberry32** (32-bit, 1 line,
passes gjrand, no dependencies):

```ts
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function (): number {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Rules: never call `Math.random()`; never iterate a `Map`/`Set` whose insertion order
depends on anything non-deterministic; sort every collection with an explicit total
order (tie-break on room id) before any `rng()` draw. Then seed `A..E` reproduce
byte-identical plans forever.

### 3.2 The cost function

Follow Merrell, Schkufza & Koltun (*Computer-Generated Residential Building Layouts*,
SIGGRAPH Asia 2010), whose cost function is the best-validated one in the literature:

```
C(x) = k_a·C_a(x) + k_d·C_d(x) + k_f·C_f(x) + k_s·C_s(x)
```

Adapted and extended for our single-floor, footprint-constrained case:

```
C(x) = k_adj ·C_adj                 // adjacency / accessibility
     + k_area·C_area                // area error vs. S/M/L target
     + k_ar  ·C_ar                  // aspect ratio
     + k_dim ·C_dim                 // minimum room dimension
     + k_lit ·C_lit                 // daylight / exterior wall access
     + k_priv·C_priv                // privacy gradient
     + k_circ·C_circ                // circulation reachability
     + k_shape·C_shape              // near-convexity (only if non-rectangular rooms allowed)
```

**Shared-wall length.** For axis-aligned rects `i`, `j` (all tests with `ε = 0.01 ft`):

```ts
function sharedWall(i: Rect, j: Rect): number {
  // vertical contact (i right edge touches j left edge, or vice versa)
  if (Math.abs(i.x2 - j.x1) < EPS || Math.abs(j.x2 - i.x1) < EPS) {
    return Math.max(0, Math.min(i.y2, j.y2) - Math.max(i.y1, j.y1));
  }
  // horizontal contact
  if (Math.abs(i.y2 - j.y1) < EPS || Math.abs(j.y2 - i.y1) < EPS) {
    return Math.max(0, Math.min(i.x2, j.x2) - Math.max(i.x1, j.x1));
  }
  return 0;
}
```

**C_adj — adjacency / accessibility.** Merrell defines it simply as *the number of
missing connections plus the number of enclosed patios, entrances and garages*. Use a
graded version so the SA gets a gradient:

```
C_adj = Σ_{(i,j) ∈ R_req}  w_ij · max(0, D_min − shared(i,j)) / D_min
      + Σ_{(i,j) ∈ R_forbid} w_ij · [ shared(i,j) > 0 ]
```

with `D_min = 3.0 ft` (32" door leaf + 2 jambs + trim reveal, see §4.1).
`w_ij` weights: hard pairs (primary bath↔primary bed, kitchen↔dining, garage↔mudroom,
foyer↔exterior) `w = 10`; soft pairs (kitchen↔laundry, office↔foyer) `w = 1`.
Forbidden pairs (bedroom↔kitchen direct, bath door opening into kitchen/dining) `w = 5`.

**C_area.** Merrell uses the negative log-likelihood of area and aspect ratio under a
Bayesian network trained on real plans:
`C_d(x) = −Σᵢ ( ℓᵢ_a(x) + ℓᵢ_as(x) )`.
We don't have that training data, so use a normalized squared relative error against the
S/M/L preset midpoint `A*ᵢ`:

```
C_area = Σᵢ  ( (Aᵢ − A*ᵢ) / A*ᵢ )²
```

Plus a **global** term so the house hits the user's target ft²:

```
C_total = ( (Σᵢ Aᵢ − A_target) / A_target )²        with weight k_total ≈ 50
```

**C_ar — aspect ratio.** `ARᵢ = max(wᵢ/hᵢ, hᵢ/wᵢ) ≥ 1`. One-sided hinge:

```
C_ar = Σᵢ  max(0, ARᵢ − AR_max(typeᵢ))²
```

`AR_max` by type: bedrooms/living/family **1.6**; kitchen **1.9**; dining/office/den
**1.7**; bathrooms **2.2**; laundry/pantry/mudroom **2.5**; closets **3.0**;
hallway **unbounded** (a hallway *wants* a high aspect ratio — exclude it).

**C_dim — minimum dimension.** `C_dim = Σᵢ max(0, minDim(typeᵢ) − min(wᵢ,hᵢ))²`
(numbers in §5).

**C_lit — daylight / exterior wall.** Compute each room's exterior perimeter:

```ts
extWall(i) = Σ over the 4 edges of rect i of (length of the part lying on the footprint boundary)
```

IRC R303.1 requires glazing ≥ **8 %** of floor area for habitable rooms. With a typical
glass height of 4'-0" and ~80 % glass-to-unit ratio, each linear foot of window wall
yields ≈ 3.2 ft² of glazing, so:

```
reqExtᵢ = max(3.0, 0.08·Aᵢ / 3.2)  ≈ max(3.0, 0.025·Aᵢ)   [feet]
C_lit  = Σᵢ needsLight(typeᵢ) · max(0, 1 − extWall(i)/reqExtᵢ)²
```

`needsLight = true` for bedroom, primary bedroom, living, family, dining, kitchen, den,
office, nook, sunroom. `false` for bath, closet, pantry, laundry, hallway, foyer,
mudroom, garage (all may be mechanically ventilated per R303.4 / R303.3 exception).

**C_priv — privacy gradient.** Rooms get a privacy rank
`public = 0` (foyer, living, dining, powder), `semi = 1` (kitchen, family, den, laundry,
mudroom, office), `private = 2` (bedrooms, baths, closets). Penalize a door directly
between rank 0 and rank 2:

```
C_priv = Σ_{doors (i,j)} max(0, |rank(i) − rank(j)| − 1)
```

**C_circ — circulation reachability.** Build the door graph (edge iff
`shared(i,j) ≥ D_min` and the pair is allowed). Penalize any room not reachable from
the foyer, and penalize rooms reached only by passing *through* another private room:

```
C_circ = (#rooms unreachable from foyer)·10
       + Σᵢ max(0, hops_through_private(i))
```

**C_shape — near-convexity** (only needed if you allow L-shaped rooms). Merrell:

```
M_c(S) = ( A(H(S)) − A(S) ) / A(S)  +  e(S)
```
`H(S)` = convex hull, `e(S)` = number of outline edges (a regularizer that penalizes
complexity even in near-convex shapes). Hallways and stairways get an indicator `hᵢ = 1`
and are **excluded** from this penalty — they're meant to be travelled through, not
lived in:

```
C_s(x) = k_r Σᵢ (1−hᵢ)·M_c(Rᵢ)  +  k_g Σᵢ M_c(Gᵢ)  +  k_o Σ e(Fᵢ)
```
where `Gᵢ` are *groups* of rooms connected by open walls (they read as one space), and
the last term penalizes irregularity in the outline of each floor.

**Suggested starting weights** (tune on a corpus of 20 hand-checked programs):

| term | weight |
|---|---|
| `k_adj` | 40 |
| `k_circ` | 40 |
| `k_area` | 10 |
| `k_total` | 50 |
| `k_dim` | 25 |
| `k_ar` | 8 |
| `k_lit` | 6 |
| `k_priv` | 4 |

Rule of thumb: hard-validity terms (`adj`, `circ`, `dim`) must dominate, because a plan
with a bedroom you cannot reach is worthless regardless of how good its areas are.

### 3.3 Merrell's proposal moves (for the free-form / non-slicing variant)

If you later want non-rectangular rooms, the Merrell move set is the reference:

- **Slide a wall.** Pick a wall (a maximal contiguous set of collinear wall segments)
  and a split point along it. Split into two collinear walls; move one by
  `d ~ N(0, σ²)`. The split point has strictly positive probability of being an
  endpoint (⇒ whole wall moves, no split). Splits are what introduce concave corners.
- **Snap.** After a move, snap the wall to an existing one if within `ε`.
  Merrell's empirical values: **ε = 1 ft, σ = 2ε = 2 ft.**
- **Swap rooms.** Pick two rooms at random and interchange their labels. This produces
  a drastic cost change and is what lets the chain escape deep local minima.

Objective is Boltzmann: `f(x) = exp(−β·C(x))`; plain Metropolis (not RJMCMC) is
sufficient in practice. Merrell reports convergence around 20k–100k iterations for a
whole-house layout.

**We recommend staying on the slicing tree** (M1/M2/M3 + a continuous "adjust cut ratio"
move) because it keeps the no-gap guarantee. Add a fourth move:

- **M4 — perturb a cut position.** Pick an internal node, shift its cut ratio by
  `δ ~ N(0, 0.05)` clamped so both children still satisfy their min dimensions.

### 3.4 The circulation spine

Do **not** try to discover the hallway after the fact. Reserve it first.

```
1. Take the main footprint rectangle W × H.
2. Choose a spine orientation: along the longer axis.
3. Reserve a band of width w_spine = 3.5 ft (42"), positioned at ratio ρ ∈ [0.35, 0.65]
   of the short dimension. Root cut becomes:  Zone_A / Spine / Zone_B   (two H cuts).
4. Anchor the foyer at one end of the spine, touching the front exterior wall.
5. Allocate rooms to Zone_A and Zone_B to balance areas and respect the privacy
   gradient (private wing on one side, public/service on the other).
6. Within each zone, the FIRST cut is parallel to the spine only if the zone is deep
   enough for two rows; otherwise every room in the zone is a single row of cuts
   perpendicular to the spine — which guarantees every room touches the spine.
```

Step 6's single-row constraint is the whole trick: in a single row, **every room shares
a wall with the spine**, so every room gets a door onto the hallway, and `C_circ = 0`
by construction. Only allow a second row where a room legitimately opens off another
room (ensuite bath, walk-in closet, pantry, garage↔mudroom).

For a T- or L-shaped footprint, run the spine down the long leg and branch a secondary
spine into the short leg; the junction becomes the natural place for stairs.

Marson's alternative (discover the corridor) for reference: build a graph from the room
walls, prune degree-one vertices, find the shortest path connecting all rooms needing
connection, apply `{Shift | Lengthen}` to each edge, filter configurations producing
unusable room shapes, and select the corridor with **minimum area**. It works, but it's
non-deterministic in its tie-breaks and much slower. Prefer spine-first.

### 3.5 Generating 5 distinct variants (A–E)

Don't just change the seed — users will see five near-identical plans. Vary the
*strategy* as well:

| Variant | Seed | Strategy delta |
|---|---|---|
| **A** | `0xA5A5` | Spine along long axis, ρ = 0.5, private wing = rear |
| **B** | `0xB6B6` | Spine along long axis, ρ = 0.38, private wing = left |
| **C** | `0xC7C7` | Spine along **short** axis (cross-plan) |
| **D** | `0xD8D8` | Open-concept: kitchen+dining+living merged into one `Group`, no wall between; spine shortened |
| **E** | `0xE9E9` | L-shaped circulation with a central "hub" instead of a linear corridor |

Then apply a **diversity filter**. Signature = the sorted vector of normalized room
centroids `(cx/W, cy/H)` keyed by room type. Reject a candidate if

```
dist(sig_new, sig_accepted) < τ    with τ ≈ 0.12  (L2 over the 2n-vector)
```

and re-run that variant's SA with a bumped seed. Cap at ~8 retries, then accept the most
distant candidate found.

**Sources:** [Merrell, Schkufza & Koltun, *Computer-Generated Residential Building Layouts*](https://paulmerrell.org/wp-content/uploads/2021/06/floorplan-final.pdf) ·
[Wong–Liu SA schedule (NTU notes)](http://cc.ee.ntu.edu.tw/~ywchang/Courses/EDA/lec3.pdf) ·
[Camozzato et al., corridor generation](https://ar5iv.labs.arxiv.org/html/1211.5842)

---

## 4. Door and window placement + real residential dimensions

### 4.1 Door dimensions (US residential)

Door sizes are called in feet-inches: a "2-8" is 2'-8" = 32" wide; all standard heights
are 6'-8" = 80" ("6/8").

| Use | Leaf size | Nominal width | Rough opening (W × H) |
|---|---|---|---|
| Front entry | 3-0 × 6-8 | 36" | 38" × 82½" |
| Secondary exterior / garage-to-house | 2-8 or 3-0 × 6-8 | 32–36" | 34–38" × 82½" |
| Bedroom | 2-6 or 2-8 × 6-8 | 30–32" | 32–34" × 82½" |
| Bathroom (full) | 2-6 × 6-8 | 30" | 32" × 82½" |
| Powder room | 2-4 or 2-6 × 6-8 | 28–30" | 30–32" × 82½" |
| Closet (reach-in, bifold/sliding) | 4-0 / 5-0 / 6-0 × 6-8 | 48/60/72" | +2" / +2½" |
| Pantry / linen | 2-0 to 2-6 × 6-8 | 24–30" | +2" / +2½" |
| Double / French (dining, office) | 5-0 or 6-0 × 6-8 | 60–72" | +2" / +2½" |
| Garage overhead — single | 9-0 × 7-0 | 108" | — |
| Garage overhead — double | 16-0 × 7-0 | 192" | — |

Rule of thumb for rough openings: **width + 2"**, **height + 2½"**.

**Minimum shared-wall length to fit a door** (`D_min` in the cost function):

```
D_min = door width + 2 jambs (2 × ¾" = 1½") + 2 × trim reveal/casing (2 × 3½" = 7")
      + clearance to the perpendicular wall (3")
For a 2-8 door:  32" + 1.5" + 7" + 3" ≈ 43.5"  ≈ 3.6 ft
```
Use **`D_min = 3.0 ft`** as the LP lower bound (bare minimum for a 2-6 with tight trim)
and **`D_pref = 3.75 ft`** as the cost-function target.

At least one door in the dwelling must be a **3-0 × 6-8 side-hinged egress door**
(IRC R311.2).

### 4.2 Interior door placement heuristic

Merrell's rule, straight from Alexander's *A Pattern Language*: a door in the middle of
a wall "creates a pattern of movement which breaks the room in two, destroys the center,
and leaves no single area which is large enough to use."

> **Place the door at the position that minimizes the sum of the distances from the door
> to the nearest corner in each of the two adjacent rooms.**

Concretely, for a shared wall segment spanning `[s, e]` along an axis, with door width
`d`:

```ts
function placeDoor(seg: [number, number], d: number,
                   cornersA: number[], cornersB: number[]): number {
  const [s, e] = seg;
  const lo = s + CLEAR + d / 2;        // CLEAR = 0.33 ft (4") off the return wall
  const hi = e - CLEAR - d / 2;
  if (hi < lo) return NaN;             // wall too short — no door
  // candidate centers: hard against each end, plus the midpoint as a fallback
  const cands = [lo, hi, (lo + hi) / 2];
  let best = cands[0], bestCost = Infinity;
  for (const c of cands) {
    const cost = minDist(c, cornersA) + minDist(c, cornersB);
    if (cost < bestCost - 1e-9) { bestCost = cost; best = c; }
  }
  return best;                          // center of the door along the wall
}
```

**Swing rules** (these are what make a plan read as professionally drawn):

1. Door swings **into** the less-trafficked room. Bedroom/bath doors swing **into** the
   bedroom/bath, not into the hall.
2. Hinge on the jamb **nearest the corner**, so the open leaf lies flat against the
   adjacent wall and the door screens the room as you enter.
3. Never swing a door into another door's arc, into a stair, or into a toilet/appliance
   clearance zone. Test the 90° swept quarter-disc against all fixture rectangles; if it
   collides, flip the hinge side, then flip the swing direction, then move the door.
4. Closet doors: bifold or sliding — **no swing arc**, draw as leaves in the opening.
5. Bathrooms under ~40 ft² frequently need an **out-swing or pocket door**; flag it.

**Passage openings (cased openings, no door)** between kitchen/dining/living: minimum
**4'-0"** wide, typically **5'-0"–8'-0"**; draw as a gap with jamb lines only. Use them
wherever `rank(i) == rank(j)` and both are public.

### 4.3 Window placement

Merrell: *windows are laid out along exterior wall segments at regular intervals within
each room*; different sizes/styles per room type; if obstructed, fall back to a smaller
type or omit.

Algorithm per room:

```
1. Collect the room's exterior wall runs (edges lying on the footprint boundary).
2. Required glazing  G_req = 0.08 × floorArea            (IRC R303.1)
   Required openable O_req = 0.04 × floorArea            (IRC R303.1)
3. Pick a window type for the room (table below) → unit W × H, glass area ≈ 0.80·W·H.
4. n = ceil(G_req / glassArea)
5. Distribute n units evenly across the longest run(s):
      usable = runLength − 2·CORNER_SETBACK     (CORNER_SETBACK = 1.5 ft)
      pitch  = usable / n
      center_k = runStart + CORNER_SETBACK + pitch·(k + 0.5),  k = 0..n-1
   Reject if pitch < W + 1.0 ft (units would collide) → step down a size and retry.
6. Snap centers to symmetry: if n is odd and the run is a whole facade, force the
   middle unit onto the run's centerline; if n is even, mirror about the centerline.
7. In the entrance room, replace the central window with the front door.
8. Every sleeping room: verify at least one unit meets egress (§4.4); if not, upsize.
```

**Standard window sizes.** Called out as a 4-digit code: `3050` = 3'-0" wide × 5'-0" tall.

| Type | Common widths | Common heights | Typical residential call sizes |
|---|---|---|---|
| Double-hung | 24–48" | 36–72" | 2436, 2840, 3040, 3046, 3050, 3052 |
| Casement | 16,20,24,28,32,36,40,44,48" | 24,36,48,54,60,72,84" | 2440, 2452, 3050 |
| Slider | 36–72" | 24–48" | 4030, 5030, 6040 |
| Picture / fixed | 24–96" | 12–96" | 4050, 5050, 6050 |
| Awning (bath) | 24–36" | 16–24" | 2416, 3020 |
| Transom | 24–72" | 12–24" | — |

Rough opening: **unit + ½" to 1" each way** (manufacturer-specific; use +1" W, +1" H).

**Standard heights (from finished floor):**

| Element | Height |
|---|---|
| Window **head** (aligns with door head) | **6'-8"** (80") |
| Typical window **sill**, living/bedroom (3050 unit) | **2'-8"** (32") |
| Picture-window sill | 1'-6" to 2'-0" |
| Bathroom / privacy window sill | 4'-6" (54") — above vanity backsplash |
| Kitchen window sill (above counter + backsplash) | 3'-6" to 3'-10" (42–46") |
| Transom bottom | 6'-10" |
| Egress window sill — **max** | **44"** (IRC R310.2.2) |

### 4.4 Egress (IRC R310) — hard validation rule

Every **sleeping room** (and basement) needs one emergency escape and rescue opening:

- Minimum **net clear opening area: 5.7 ft²** (5.0 ft² for grade-floor openings)
- Minimum **net clear opening height: 24"**
- Minimum **net clear opening width: 20"**
- Maximum **sill height above finished floor: 44"**

Note that a 20" × 24" opening is only 3.33 ft² — you must satisfy **all four**
simultaneously. Practical minimum double-hung that clears egress: a **3'-0" × 5'-0"**
(3050) unit gives ~ 32" × 27" net = 6.0 ft². Encode this as a post-generation validator
that raises a blocking error, not a soft cost.

### 4.5 Entry door placement

- Front door in the **foyer**, on the front facade, centered on the facade or on the
  foyer's exterior run, whichever reads better; prefer the facade centerline if the
  foyer straddles it.
- Landing required on both sides: **36" deep minimum**, at least as wide as the door
  (IRC R311.3).
- Garage-to-house door lands in the **mudroom** or **laundry**; must be self-closing and
  20-minute rated (IRC R302.5.1) — worth annotating on the plan.
- Rear/patio door off the family room, dining, or kitchen; typically a 6'-0" or 8'-0"
  sliding or French unit.

**Sources:** [IRC minimum dimensions (Fine Homebuilding)](https://www.finehomebuilding.com/2024/01/10/minimum-dimensions-in-the-irc) ·
[IRC R303 light & ventilation](http://www.boman-kemp.com/IRC-Code-R303-Light-Ventilation-and-Heating.htm) ·
[IRC 2015 R310/R303 egress](https://shapeproducts.com/wp-content/uploads/2021/01/Manual_EgressCode.pdf) ·
[Interior door sizing & rough openings](https://www.angelbau.com/blog/guide-to-interior-door-sizing-rough-opening-sizes) ·
[Standard window sizes (Pella)](https://www.pella.com/ideas/windows/standard-window-sizes/) ·
[Interior space dimensions (UpCodes)](https://up.codes/s/interior-space-dimensions)

---

## 5. Typical US residential room sizes — the S/M/L presets

These are the numbers to hard-code as presets. `A*` is the target area the cost function
aims at (use the midpoint); `minDim` is the hard minimum for the short side;
`AR_max` is the aspect-ratio ceiling.

### 5.1 Master table

| Room type | **S** (ft²) | **M** (ft²) | **L** (ft²) | Typical M dims | `minDim` | `AR_max` | Needs daylight |
|---|---|---|---|---|---|---|---|
| **Primary bedroom** | 150–195 | 200–290 | 300–450 | 14'-0" × 16'-0" | 11'-0" | 1.6 | yes |
| **Bedroom** (secondary) | 100–120 | 121–160 | 161–210 | 11'-0" × 12'-0" | 9'-0" | 1.6 | yes |
| **Primary bath** | 60–90 | 95–140 | 145–250 | 10'-0" × 12'-0" | 6'-0" | 2.0 | optional |
| **Bathroom** (full hall) | 35–45 | 46–60 | 61–90 | 6'-0" × 9'-0" | 5'-0" | 2.2 | optional |
| **Half bath / powder** | 16–20 | 21–28 | 29–40 | 4'-0" × 6'-0" | 3'-0" | 2.5 | no |
| **Kitchen** | 100–120 | 130–180 | 190–300 | 12'-0" × 14'-0" | 8'-0" | 1.9 | yes |
| **Dining** | 100–120 | 130–180 | 190–260 | 12'-0" × 14'-0" | 10'-0" | 1.7 | yes |
| **Living** | 200–250 | 260–350 | 360–500 | 15'-0" × 20'-0" | 12'-0" | 1.6 | yes |
| **Family room** | 200–250 | 260–350 | 360–500 | 16'-0" × 20'-0" | 12'-0" | 1.6 | yes |
| **Den** | 100–120 | 125–170 | 175–250 | 12'-0" × 12'-0" | 9'-0" | 1.7 | yes |
| **Office / study** | 80–100 | 105–150 | 155–220 | 11'-0" × 12'-0" | 8'-0" | 1.7 | yes |
| **Laundry** | 30–45 | 50–81 | 85–130 | 6'-0" × 9'-0" | 5'-0" | 2.5 | no |
| **Garage — 1 car** | 216–240 | 240–280 | 280–320 | 12'-0" × 20'-0" | 11'-0" | 2.2 | no |
| **Garage — 2 car** | 400–440 | 440–528 | 528–600 | 22'-0" × 22'-0" | 20'-0" | 1.5 | no |
| **Garage — 3 car** | 660–720 | 720–840 | 840–950 | 32'-0" × 24'-0" | 22'-0" | 1.8 | no |
| **Foyer / entry** | 36–50 | 55–90 | 95–140 | 8'-0" × 10'-0" | 5'-0" | 2.0 | optional |
| **Hallway** | — | — | — | width **3'-6"** | **3'-0"** | ∞ | no |
| **Pantry** (walk-in) | 9–14 | 15–24 | 25–40 | 4'-0" × 5'-0" | 3'-0" | 2.5 | no |
| **Closet — reach-in** | 8–12 | 13–18 | 19–26 | 2'-0" d × 7'-0" w | 2'-0" d | 4.0 | no |
| **Closet — walk-in** | 24–35 | 36–70 | 75–200 | 7'-0" × 8'-0" | 4'-0" | 2.5 | no |
| **Mudroom** | 32–42 | 43–64 | 65–110 | 7'-0" × 8'-0" | 5'-0" | 2.2 | no |
| **Nook / breakfast** | 60–80 | 85–110 | 115–160 | 9'-0" × 11'-0" | 7'-0" | 1.8 | yes |
| **Sunroom** | 100–140 | 150–220 | 230–350 | 12'-0" × 16'-0" | 9'-0" | 1.9 | yes |

### 5.2 Hard code minimums (IRC) — validate, never violate

| Requirement | Value | Code |
|---|---|---|
| Habitable room minimum **area** | **70 ft²** | R304.1 |
| Habitable room minimum **horizontal dimension** | **7'-0"** in any direction | R304.2 |
| Kitchen — exempt from the 70 ft² rule | — | R304.1 exc. |
| Ceiling height, habitable spaces + hallways | **7'-0"** | R305.1 |
| Ceiling height, bath / toilet / laundry | **6'-8"** | R305.1 |
| Ceiling height under exposed beams (2021 IRC) | 6'-6" | R305.1.1 |
| **Hallway width** | **3'-0"** | R311.6 |
| Stair width (clear, at/below handrail) | **3'-0"** | R311.7.1 |
| Stair **riser** max | **7¾"** (max 3/8" variance in a flight) | R311.7.5.1 |
| Stair **tread** min | **10"** | R311.7.5.2 |
| Stair headroom | **6'-8"** from tread nosing | R311.7.2 |
| Stair landing depth | **3'-0"** in direction of travel | R311.7.6 |
| Handrail clear spacing min | 27" between rails | R311.7.1 |
| Showerhead clearance over 30"×30" area | 6'-8" | R307 |
| Glazing area (habitable) | **≥ 8 %** of floor area | R303.1 |
| Openable area (habitable) | **≥ 4 %** of floor area | R303.1 |
| Egress opening net clear area | **5.7 ft²** (5.0 grade floor) | R310.2.1 |
| Egress opening net clear H / W | **24" / 20"** | R310.2.1 |
| Egress sill height max | **44"** | R310.2.2 |
| At least one exterior egress door | **3-0 × 6-8** side-hinged | R311.2 |

### 5.3 Fixture clearances (drive minimum room dimensions)

**Bathrooms**
| Item | Code min | NKBA recommended |
|---|---|---|
| Toilet centerline to any wall/fixture | **15"** | 18" |
| Clear space in front of toilet | **21"** | 30" |
| Clear space in front of lavatory | 21" | 30" |
| Clear space in front of tub (open side) | 21" | 30" |
| Clear space in front of shower door | 24" | 30" |
| Shower minimum interior | **30" × 30"** | 36" × 36" |
| Standard tub | **60" × 30–32"** | — |
| Vanity height | 30–32" (traditional) | **34–36"** "comfort height" |
| Vanity depth | 21–22" | 22" |
| Double vanity min width | 60" | 72" |

Derived minimum bathrooms:
- **Powder room:** 3'-0" × 6'-0" (18 ft²) — toilet + small lav in a row.
- **Full hall bath:** 5'-0" × 8'-0" (40 ft²) — the classic "5×8": tub across the end,
  toilet and lav down one wall. The 5'-0" is set by the 60" tub.
- **Primary bath with double vanity + 36" shower + WC:** minimum ~ 8'-0" × 12'-0".

**Kitchens (NKBA)**
| Item | Value |
|---|---|
| Work aisle, one cook | **42"** min |
| Work aisle, two cooks | **48"** min |
| Walkway (no work on either side) | **36"** min |
| Base cabinet depth | 24" |
| Counter height | 36" |
| Upper cabinet clearance above counter | 15" min (18" typical) |
| Work-triangle total | ≤ **26'-0"**; each leg **4'-0" to 9'-0"** |
| No triangle leg may cut an island by more than | 12" |
| Total countertop frontage needed | 158" (24" deep) |
| Island min length to be useful | 4'-0" |

Derived minimum kitchens: galley = 2 × 24" counters + 42" aisle = **8'-0"** minimum
width. That's the `minDim` in the table above.

**Bedrooms & closets**
| Item | Value |
|---|---|
| Reach-in closet depth | **24"** (hanging) |
| Reach-in closet min width to be useful | 4'-0" |
| Walk-in closet min total depth | **48"** (24" hanging + 24" walkway) |
| Walk-in, single-sided | 4'-0" × 6'-0" min |
| Walk-in, double-sided | 6'-0" wide min (24 + 24 hanging + 36 walkway = 84" is comfortable) |
| Hanging rod height, single | 66" |
| Hanging rod height, double-hang | 40" and 80" |
| Clearance around a queen bed (60×80) | 24" min at sides and foot; 36" preferred |

**Garages**
| Config | Common dims | ft² | Door |
|---|---|---|---|
| 1 car | 12' × 20' | 240 | 9-0 × 7-0 |
| 2 car (tight) | 20' × 20' | 400 | 16-0 × 7-0 |
| 2 car (standard) | 22–24' × 22–24' | 484–576 | 16-0 × 7-0 |
| 3 car | 32–36' × 24' | 768–864 | 16-0 + 9-0 |
| Depth for a full-size truck | 24' | — | — |

**Sources:** [Fine Homebuilding — Minimum Dimensions in the IRC](https://www.finehomebuilding.com/2024/01/10/minimum-dimensions-in-the-irc) ·
[UpCodes — interior space dimensions](https://up.codes/s/interior-space-dimensions) ·
[Stair code IRC R311.7](https://buildcalczone.com/guides/stair-building-code-requirements) ·
[NKBA kitchen guidelines](https://www.crddesignbuild.com/blog/kitchen-dimensions-code-requirements-nkba-guidelines/) ·
[NKBA Universal Drawing Standards, ch. 3 (PDF)](https://elearning.nkba.org/wp-content/uploads/2023/10/Chapter-3-Universal-Drawing-Standards.pdf) ·
[Bathroom clearances](https://www.jaspector.com/articles/bathroom-clearances-guide/) ·
[Standard closet dimensions](https://www.familyhandyman.com/article/average-closet-depth/) ·
[Average bedroom size](https://homeguide.com/articles/average-bedroom-size) ·
[Garage sizes](https://alansfactoryoutlet.com/blog/standard-garage-size/) ·
[Laundry room sizing](https://www.blockrenovation.com/guides/laundry-room-sizing-guide-minimums-averages-more)

---

## 6. 2D architectural drawing conventions

### 6.1 Scale and coordinate system

- Residential floor plans: **¼" = 1'-0"** (1:48). Large houses: **⅛" = 1'-0"** (1:96).
- Work internally in **feet as floats**, snapped to a **1/12 ft (1") module** — or
  better, work in **inches as integers** to avoid float drift entirely, and format for
  display. Snapping to 2" or 4" produces plans that look intentional.
- Screen rendering: pick `PX_PER_FOOT` (e.g. 12 px/ft ≈ ⅛" scale at 96 dpi, 24 px/ft ≈
  ¼" scale). For PDF export at true scale, `1 ft → 0.25 in → 18 pt`.
- Y-axis: architectural plans are Y-up; SVG is Y-down. Apply one
  `transform="translate(0,H) scale(1,-1)"` at the root group and never think about it
  again — but remember to counter-flip every `<text>`.

### 6.2 Wall thickness

| Wall | Framing | Total finished thickness |
|---|---|---|
| Exterior, 2×4 | 3½" studs + ½" GWB + ½" sheathing + siding | **4½"** to 6" (draw **5½"**) |
| Exterior, 2×6 (modern, insulated) | 5½" + ½" GWB + ½" sheathing | **6½"** (draw **6½"**) |
| Interior partition, 2×4 | 3½" + ½" GWB ×2 | **4½"** |
| Interior plumbing wall, 2×6 | 5½" + ½" GWB ×2 | **6½"** |
| Party / demising wall | double 2×4 or 2×6 staggered | 8"–10" |

Many production plans simplify to **6" exterior / 4" interior** nominal. Pick one
convention and be consistent; the LP dimensioning must know it because **room areas are
clear-inside-face**, not centerline.

**Two coordinate conventions — pick one and document it:**
1. **Centerline** — the partition sits centered on the cut line; each room loses
   `t/2` per side. Easier for slicing trees. **Recommended.**
2. **Clear-inside** — rooms carry their exact clear dimensions and walls are inserted
   between them, growing the overall footprint. Harder to fit a fixed footprint.

With centerline convention, convert at render time:
```
clearWidth  = cutWidth  − (t_left/2 + t_right/2)
clearHeight = cutHeight − (t_bottom/2 + t_top/2)
```
and feed the *clear* values back into the area cost so the user gets the ft² they asked
for.

### 6.3 Line weights (at ¼" scale)

| Element | Weight | Notes |
|---|---|---|
| Cut walls (poché outline) | 0.50–0.70 mm | heaviest |
| Wall fill / poché | solid light grey, or 45° hatch | |
| Cabinets, fixtures, stairs, doors, windows | 0.25–0.35 mm | medium |
| Dimension lines, extension lines, leaders | 0.13–0.18 mm | lightest |
| Text | 0.18 mm | |
| Hidden / above (upper cabinets, beams) | 0.18 mm **dashed** | |
| Centerlines | 0.13 mm long-dash-dot | |

### 6.4 Symbols

**Door.** Break the wall for the rough opening. Draw two short jamb lines closing the
break. Draw the **leaf** as a rectangle (thickness 1¾", scaled) perpendicular to the
wall at the hinge, and an **arc** from the closed position to the open position,
radius = door width, centered on the hinge point, swept 90°.

```ts
// doorArc: hinge at H, wall direction u (unit), inward normal n (unit), width w
const closedEnd = add(H, scale(u, w));
const openEnd   = add(H, scale(n, w));
// SVG: M closedEnd  A w w 0 0 sweep openEnd     (sweep = 0 or 1 per handedness)
```
Show the leaf at the **open** position (perpendicular to the wall) — this is the US
convention. Bifold: two/four small rectangles in a `V`. Pocket: dashed leaf inside the
wall. Sliding patio: two overlapping rectangles with a small arrow.

**Window.** Break the wall. Draw the two wall faces across the opening, plus **one or
two additional parallel lines** representing the glazing, inset from the wall faces —
three lines total in the break is the most common US convention. Casement adds a small
arc + hinge tick; slider adds a horizontal arrow; fixed/picture gets no operator mark.

**Other symbols to render:**
- Stairs: parallel tread lines, a **direction arrow** with `UP 15R` / `DN 15R`, and a
  break line where the stair passes the cut plane.
- Plumbing fixtures: toilet (oval + tank rectangle), lav (oval/rect in counter),
  tub (60×30 rounded rect + drain circle), shower (square + diagonal `X` + drain).
- Kitchen: base cabinets solid outline 24" deep; **upper cabinets dashed** 12" deep;
  range/cooktop with 4 burner circles; sink with 1–2 basins; refrigerator with a
  centerline arrow for the door.
- Closets: a single line at 24" from the back wall = the rod + shelf. Add a short
  perpendicular tick for the shelf bracket.

### 6.5 Dimension strings

Convention: **three chains** outside each facade, running outward:

1. **String 1** (nearest the building, ~⅜" off at paper scale): openings —
   from the outside face of the exterior wall to the **centerline** of each window and
   door, and on to the next.
2. **String 2** (~⅜" beyond string 1): major partitions — exterior face to interior
   **wall centerlines**.
3. **String 3** (outermost): the single **overall** dimension.

Formatting rules:
- **Architectural tick**: a 45° slash, not an arrowhead. Horizontal dimensions slash
  bottom-left → upper-right; vertical dimensions upper-left → bottom-right. Tick length
  ≈ ⅛" at paper scale.
- Dimension line **extends ⅛" past** the extension lines (or stops at them).
- Extension lines start **1/16" off** the object and extend **1/8" past** the dimension
  line.
- Text sits **above** the dimension line, centered, gap ≈ 1/32". (Mechanical drafting
  puts it *in* the line; architectural does not.)
- Text reads **left-to-right** for horizontal dims, **bottom-to-top** for vertical.
- Format **`12'-6"`**, never `12.5'`. Under one foot, inches only: `8"`. Whole feet:
  `12'-0"`, never `12'`.
- Never dimension the same thing twice; never over-dimension a string (one dimension in
  each chain must be left out or marked "HOLD").

Text sizes at ¼" scale: dimension text and room names **⅛"** (3.2 mm); sub-labels
(the ft² annotation) **3/32"**; sheet titles 3/16"–¼".

### 6.6 Room labels

Two-line, centered on the room's centroid (or on the largest inscribed rectangle if the
room is L-shaped):

```
        PRIMARY BEDROOM          ← 1/8", all caps, letter-spaced ~0.04em
         14'-0" x 16'-0"         ← 3/32", regular case for the x
            224 SQ FT            ← optional third line, 3/32", grey
```

Use `×` or a lowercase `x`, with spaces: `14'-0" x 16'-0"`. Suppress the label if it
doesn't fit inside the room at the current zoom; fall back to a number + legend.

**Sources:** [NKBA Universal Drawing Standards](https://elearning.nkba.org/wp-content/uploads/2023/10/Chapter-3-Universal-Drawing-Standards.pdf) ·
[Understanding dimensioning in architecture (VDCI)](https://vdci.edu/learn/blueprint-reading/understanding-dimensioning-in-architecture-and-engineering-an-in-depth-analysis) ·
[Standard text sizes in technical drawing](https://sourcecad.com/blog/standard-text-sizes-in-technical-drawing) ·
[Door and window symbols on floor plans](https://blueprintprimer.com/posts/door-and-window-symbols-on-floor-plans) ·
[Wall thickness for interior/exterior walls](https://plan7architect.com/wall-thickness-for-interior-walls-exterior-walls-and-load-bearing-walls-ai1/)

---

## 7. Roof geometry from a footprint polygon

### 7.1 The straight skeleton (basis for hip roofs)

Shrink the polygon inward: every edge moves inward at unit speed, parallel to itself
("wavefront" / "grassfire"). Vertices travel along **angular bisectors**. The traces of
the vertices form the **straight skeleton**. Laycock & Day established this as *the*
method for generating hip roofs.

**The roof lifting rule.** If each skeleton point is lifted to a height equal to its
offset distance `t` times the slope, the surface is a valid roof: water always runs
downhill to the eaves, wherever it lands.

```
z(p) = t(p) · tan θ
```
where `t(p)` is the time at which the wavefront reached `p` (equivalently, `p`'s
distance to the nearest footprint edge under the skeleton's metric) and `θ` is the roof
pitch angle. For a pitch of `p : 12`:

```
tan θ = p / 12          θ = atan(p/12)
```

| Pitch | Angle | `tan θ` | Notes |
|---|---|---|---|
| 2:12 | 9.46° | 0.167 | low-slope, needs special roofing |
| 3:12 | 14.04° | 0.250 | minimum for most shingles |
| **4:12** | **18.43°** | **0.333** | very common |
| 5:12 | 22.62° | 0.417 | common |
| **6:12** | **26.57°** | **0.500** | **most common US residential** |
| 8:12 | 33.69° | 0.667 | steep, traditional |
| 10:12 | 39.81° | 0.833 | |
| 12:12 | 45.00° | 1.000 | |

**Weighted skeleton.** Assigning a different speed/weight `wᵢ` to each footprint edge
lets different faces have different pitches — needed for shed dormers and for mixed
hip/gable. Multiplicative weights scale the wavefront speed; `z = t · wᵢ · tan θ`.

### 7.2 Straight skeleton implementation (TypeScript)

Footprints here are small (4–16 vertices) and usually **rectilinear**, so a naive
event-driven `O(n² log n)` implementation is entirely adequate. Robust formulation:

```
Represent the active wavefront as one or more circular lists (LAVs) of vertices.
Each vertex v has: prevEdge line L⁻, nextEdge line L⁺ (as infinite lines with inward normals).
Its position at time t is:  v(t) = intersect( offsetInward(L⁻, t), offsetInward(L⁺, t) )
   — this is numerically far more stable than computing bisector directions + speeds.

loop:
  for each active vertex v:
     EDGE EVENT: solve for the smallest t > tNow at which v(t) == prev(v)(t)
                 or v(t) == next(v)(t)   (i.e. an edge collapses to zero length)
  for each REFLEX vertex v:
     SPLIT EVENT: for every non-incident edge e, solve for the smallest t > tNow at
                 which v(t) lies on offsetInward(e, t) and within e's moving extent
  take the minimum-time event; ties broken by a stable (index) order for determinism

  EDGE EVENT  -> emit a skeleton node at (p, t); remove the two colliding vertices from
                 the LAV; insert one new vertex spanning their outer edges; emit skeleton
                 arcs from each removed vertex's last position to the new node.
                 If the LAV drops to 2 vertices, emit the final arc and close it.
  SPLIT EVENT -> emit a node; split the LAV into two LAVs at v and the hit edge.

until all LAVs are empty
```

Numerical hygiene that matters: snap all `t` values to 1e-6, dedupe skeleton nodes
within 1e-4 ft, and process simultaneous events in a fixed index order. Without these,
symmetric footprints (which is most of them) produce non-deterministic topology.

Alternative: use an existing library (`straight-skeleton` on npm, or a WASM build of
CGAL's `Straight_skeleton_2` which also provides `extrude_skeleton()`), but a
hand-rolled version for rectilinear polygons is ~300 lines and removes a dependency.

### 7.3 Generating each roof type

All four start from the footprint polygon `P`, **offset outward by the eave overhang**
`o` (12"–24" typical; use **18"**), giving `P_eave`. The roof is then built on `P_eave`.

**(a) Hip roof**
```
skel ← straightSkeleton(P_eave)
for each face f of skel (one per edge of P_eave):
    lift every vertex v of f to z = t(v)·tanθ + z_plate
    emit the polygon as a roof face
```
Every footprint edge gets a sloping face; all ridges are interior. No gables.

**(b) Gable roof**
Start from the hip, then convert chosen faces. Merrell's rule:

> For a given face of a hipped roof, project its vertices onto the **façade plane** to
> create a gable. If a roof face contains **horizontal top edges** (parallel to the
> ground plane, i.e. it's a ridge-bearing face), do **not** convert it — that would
> distort the other faces.

So: only the *triangular end faces* (those that meet the ridge at a point) are
convertible. Projecting their vertices onto the vertical plane of the footprint edge
turns that end face into a vertical triangle = the **gable wall**, and extends the two
adjacent trapezoidal faces into larger trapezoids/triangles that now meet at a ridge
which runs all the way out to the gable.

For the common case of a **simple rectangular footprint** `W × D` (gable across the
short dimension), skip the skeleton entirely:
```
ridgeHeight = (D/2) · tanθ                    // D = the span perpendicular to the ridge
ridge runs along the long axis at the centerline
two rectangular roof planes, each of slope θ
two vertical triangular gable walls, apex at ridgeHeight
rafterLength (per plane) = sqrt((D/2)² + ridgeHeight²) = (D/2)·sqrt(1 + tan²θ) = (D/2)/cosθ
```
`1/cosθ` is the **roof pitch multiplier**: 1.054 at 4:12, 1.118 at 6:12, 1.202 at 8:12.

**(c) Flat with overhangs**
```
P_eave ← offsetOutward(P, o)            // o = 18"–24"
slab   ← extrude(P_eave, thickness = 10"–14")   at z = z_plate
optional: give the slab a slight slope (¼" per foot = 2 % ) toward a chosen low edge
          for drainage — code minimum is ¼:12; visually it reads as flat.
```
Add a fascia band around the slab edge (6"–10" tall) and a soffit plane underneath.

**(d) Flat with parapets**
```
P_par ← offsetOutward(P, 0 … 8")        // parapets sit on the wall line, small or no overhang
roofDeck ← P_par at z = z_plate, sloped 2 % to internal scuppers/drains
parapetWall ← extrude the boundary of P_par upward by h_par
h_par: 18"–24" typical residential; 30" min where a fire-rated parapet is required (IBC);
       42" if the roof is occupied (guard height)
cap the parapet with a coping band 2"–4" thick, overhanging 1" each side
```
Parapets need no straight skeleton at all — they're a boundary extrusion.

**Roof selection heuristic per variant:** hip for traditional/ranch; gable for
craftsman/colonial/farmhouse; hipped-with-gables (convert only the front-facing end
faces) for most production suburban homes; flat+parapet for modern. Make it a style
template parameter exactly as Merrell does — a JSON listing pitch, overhang length,
gable flags, fascia/soffit sizes, and material ids.

**Sources:** [CGAL 2D Straight Skeleton and Polygon Offsetting](https://doc.cgal.org/latest/Straight_skeleton_2/index.html) ·
[Straight skeletons with additive and multiplicative weights, application to roofs](https://www.sciencedirect.com/science/article/pii/S0010448517301240) ·
[Straight Skeleton Computation Optimized for Roof Model Generation](https://www.academia.edu/100430368/Straight_Skeleton_Computation_Optimized_for_Roof_Model_Generation) ·
[Merrell et al. §6 (roofs, gables)](https://paulmerrell.org/wp-content/uploads/2021/06/floorplan-final.pdf) ·
[Roof pitch chart](https://roofpitch.net/)

---

## 8. Simple 3D massing from the 2D plan (three.js)

### 8.1 Heights

| Element | Value |
|---|---|
| Finish floor to ceiling (standard) | **8'-0"** (96") |
| Finish floor to ceiling (modern / main level) | **9'-0"** or 10'-0" |
| Code minimum | 7'-0" |
| Top plate height for an 8' ceiling | 8'-1⅛" (92⅝" studs + 3 plates) |
| Floor assembly thickness (between storeys) | 12"–16" |
| Door head / window head | **6'-8"** (80") |
| Slab / first-floor top | z = 0 |

### 8.2 Walls — build them opening-aware, do NOT use CSG

Boolean CSG in three.js (ThreeCSG, three-bvh-csg) is slow, fragile on coplanar faces,
and non-deterministic in its vertex ordering. You don't need it: a wall with a
rectangular opening decomposes trivially into **axis-aligned sub-boxes**.

For a wall of length `L`, thickness `t`, height `H`, with an opening spanning
`[x₀, x₁]` horizontally:

```
DOOR    (head h_d = 80"):
   [0,  x₀] × [0,   H  ]        // left pier
   [x₁, L ] × [0,   H  ]        // right pier
   [x₀, x₁] × [h_d, H  ]        // header / lintel above

WINDOW  (sill h_s, head h_h):
   [0,  x₀] × [0,   H  ]        // left pier
   [x₁, L ] × [0,   H  ]        // right pier
   [x₀, x₁] × [0,   h_s]        // apron below sill
   [x₀, x₁] × [h_h, H  ]        // header above
```

Generalize to `n` openings by sorting them along the wall, emitting the piers between
consecutive openings, then the header (and apron) strips. Every piece is a
`BoxGeometry`; merge all wall pieces of the model with
`BufferGeometryUtils.mergeGeometries()` into a single mesh for performance.

```ts
function buildWall(w: Wall): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const ops = [...w.openings].sort((a, b) => a.x0 - b.x0);
  let cursor = 0;
  for (const op of ops) {
    if (op.x0 - cursor > EPS) parts.push(box(cursor, op.x0, 0, w.H, w.t));
    if (op.sill > EPS)        parts.push(box(op.x0, op.x1, 0, op.sill, w.t));
    if (w.H - op.head > EPS)  parts.push(box(op.x0, op.x1, op.head, w.H, w.t));
    cursor = op.x1;
  }
  if (w.L - cursor > EPS) parts.push(box(cursor, w.L, 0, w.H, w.t));
  return parts;  // then rotate+translate into world space by the wall's centerline
}
```

Place each wall by a single `Object3D` transform: translate to the centerline midpoint,
rotate by `atan2(dy, dx)` about Y. All local geometry is built in wall-local space
(`x` along the wall, `y` up, `z` across the thickness).

### 8.3 Floors, ceilings, and the shell

- **Floor slab:** the footprint polygon as a `THREE.Shape` → `ExtrudeGeometry` with
  `{ depth: 10/12, bevelEnabled: false }`, rotated `-π/2` about X, at `z = -10/12`.
- **Per-room floor finishes:** each room rect as its own thin box, so you can colour by
  room type in the 2D-linked 3D view — this is what lets hovering a room in the plan
  highlight it in 3D.
- **Ceilings:** same polygons at `z = H`, only if you need an interior camera.
- **Exterior shell:** build exterior walls from the *footprint boundary* with
  `t_ext = 6.5"`, interior partitions from the slicing-tree cut lines with `t_int = 4.5"`.
  Reuse the same `buildWall()`.

### 8.4 Openings as objects

Insert a door leaf (a `1.75"` thick box, rotated to the open angle from the plan's swing
data) and a window unit (frame box + a transparent glass plane with
`MeshPhysicalMaterial { transmission: 0.9, roughness: 0.05 }`). Because the plan already
stores hinge side, swing direction, sill and head, the 3D is a pure function of the 2D —
which is exactly what makes the "3D updates live as you edit the 2D" behaviour work.

### 8.5 Roof mesh

From §7, you already have roof faces as 3D polygons. Triangulate each face with
`THREE.ShapeUtils.triangulateShape` after projecting it to its own plane, or just fan-
triangulate (roof faces from a straight skeleton are convex or near-convex). Add:
- **fascia**: a vertical band along each eave edge, 6"–10" tall;
- **soffit**: a horizontal plane from the eave edge back to the wall face;
- **gable walls**: vertical triangles, same material as the exterior wall.

### 8.6 Export

- **GLB** — `GLTFExporter`, the whole scene. This is what drafted.ai ships.
- **DXF** — the 2D plan only; write it by hand (DXF R12 ASCII is ~200 lines of code:
  `LINE`, `LWPOLYLINE`, `ARC`, `TEXT` entities on named layers `A-WALL`, `A-DOOR`,
  `A-GLAZ`, `A-ANNO-DIMS`, `A-ANNO-TEXT` per the AIA CAD Layer Guidelines).
- **PDF** — render the same SVG you show on screen through `svg2pdf.js` + `jsPDF`, at
  true ¼" = 1'-0" scale on ANSI D (24×36") or ARCH D (24×36").
- **IFC** — `web-ifc` / `IFC.js` can author `IfcWall`, `IfcDoor`, `IfcWindow`,
  `IfcSpace`, `IfcSlab`, `IfcRoof`. Significant work; treat as a later milestone.

**Sources:** [three.js ExtrudeGeometry](https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry) ·
[three.js CSG discussion (why to avoid it)](https://github.com/mrdoob/three.js/issues/16099) ·
[Merrell et al. §6, 3D model generation](https://paulmerrell.org/wp-content/uploads/2021/06/floorplan-final.pdf) ·
[Drafted.ai feature set / export formats](https://www.drafted.ai/learn/ai-floor-plan-generators)

---

## 9. What the product actually is (competitive note)

Drafted.ai's own docs describe the pipeline as: **structured inputs** (room list, lot
size, house shape, square footage, optional room placements on a canvas) → **generate
several layout directions** to compare → **edit walls, doors and windows** → **export**
PDF / DXF / IFC / GLB. A matching **3D model updates in real time** as the 2D plan is
edited, reflecting doors, windows and gabled roofs.

Two things to note:
1. There is no evidence of a large generative neural model in the loop. The inputs are
   structured and the outputs are rectilinear — consistent with a **combinatorial
   optimizer**, which is what this document describes. Treat "AI" as marketing for
   constrained search.
2. The learned alternatives (**RPLAN** — 80k annotated Chinese apartment plans; and
   **Graph2Plan** — GNN over a layout graph + CNN over the boundary raster, producing
   room boxes) are viable *later*, but they need training data, they produce apartment-
   shaped plans rather than US single-family plans, and their outputs still need a
   rectification pass to become valid dissections. Build the combinatorial engine first;
   a learned model can later be used to *propose* adjacency graphs and S/M/L presets
   from a text prompt, feeding this same geometry pipeline.

**Sources:** [Drafted — How to use an AI floor plan generator](https://www.drafted.ai/learn/ai-floor-plan-generators) ·
[Drafted FAQ](https://www.drafted.ai/learn/faq) ·
[Graph2Plan (arXiv 2004.13204)](https://arxiv.org/abs/2004.13204)

---

## 10. Implementation checklist

```
[ ] core/units.ts        — integer inches, feet-inch formatter, 1"/2"/4" snapping
[ ] core/rng.ts          — mulberry32, seeded, injected everywhere
[ ] core/geom.ts         — Rect, Polygon, sharedWall, offsetPolygon, rectilinearDecompose
[ ] program/presets.ts   — the §5 S/M/L table as data
[ ] program/normalize.ts — room list + target ft² → per-room A*, minDim, AR_max, adjacency edges
[ ] layout/polish.ts     — normalized Polish expression, validity, M1/M2/M3/M4 moves
[ ] layout/shapecurve.ts — Stockmeyer bottom-up sizing + top-down assignment
[ ] layout/treemap.ts    — squarified treemap → initial Polish expression
[ ] layout/spine.ts      — circulation spine reservation + zone allocation
[ ] layout/cost.ts       — the §3.2 cost terms, each independently unit-tested
[ ] layout/anneal.ts     — Wong–Liu SA driver
[ ] layout/dimension.ts  — EM → HST/VST → flow LP (glpk.js) iterative AR loop
[ ] build/walls.ts       — centerlines → thickened polygons, T/L/X joint cleanup
[ ] build/doors.ts       — corner-proximity placement, swing/hinge resolution, collision test
[ ] build/windows.ts     — exterior runs, 8% glazing quota, even distribution, egress validator
[ ] draw/svg.ts          — poché, symbols, door arcs, window lines
[ ] draw/dims.ts         — 3-chain dimension strings, tick marks, feet-inch text
[ ] draw/labels.ts       — room name + size, largest-inscribed-rect placement
[ ] roof/skeleton.ts     — straight skeleton (event-driven, deterministic tie-breaks)
[ ] roof/generate.ts     — hip / gable / flat+overhang / flat+parapet
[ ] three/massing.ts     — opening-aware wall sub-boxes, merged geometry, roof mesh
[ ] validate/code.ts     — the §5.2 IRC table as blocking assertions
[ ] variants.ts          — seeds A–E, strategy deltas, centroid-signature diversity filter
```

**Validate every generated plan against §5.2 before showing it.** A plan that violates
`70 ft²` habitable minimum or has an unreachable bedroom must be regenerated, not
displayed. That validator is the difference between a demo and a product.
