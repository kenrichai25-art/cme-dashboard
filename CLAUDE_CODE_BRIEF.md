# CME Dashboard — data layer correction brief

Paste each stage into Claude Code one at a time. Check the dashboard after each
stage before moving on. Do not run them all at once.

---

## Standing instructions — include these with every stage

> This is a data-correctness fix, not a redesign. Do not change styling, layout,
> Tailwind classes, component structure, colours, spacing or copy tone. Where a
> component must change because the data shape changed, make the minimum edit
> and keep the existing markup and classes. Do not "improve" anything I have not
> asked you to change. Do not add new dependencies.
>
> Before you start, set up git in this project and commit the current state so
> every change afterwards is reviewable. I am new to git — keep the commands
> simple and explain what each commit does.
>
> After each change, run the dev server and confirm it builds before telling me
> you are done.

---

## Context Claude Code needs

The app reads `src/data/officialDfeData.json`, generated from the DfE Explore
Education Statistics "Children missing education at census date" data set.

Two facts govern the whole task:

1. **DfE publish 20 reason categories and 8 duration bands, as separate
   breakdowns.** They are NOT cross-tabulated. Any figure combining a reason with
   a duration is an estimate and must be labelled as one.
2. **`low`, `x` and `z` are not statistical disclosure control.** `low` means a
   count that rounds to 0 but is not 0. `x` means not available. `z` means not
   applicable. None of them may be imputed with a substitute value.

A new module `src/data/cmeScope.ts` has been written and is already in the
project. It is the source of truth for reason categories, scope tiers, duration
thresholds and yield. Use it. Do not reimplement its logic elsewhere.

---

## Stage 1 — Restrict to terms with complete data

Duration breakdowns are only published from 2024/25 onwards; in 2022/23 and
2023/24 every duration band is `x`. Those terms also predate the collection
becoming mandatory, so they are not comparable.

- Reduce `ACADEMIC_TERMS` in `src/data/cmeData.ts` to exactly four terms:
  `2024/25 Autumn`, `2024/25 Spring`, `2024/25 Summer`, `2025/26 Autumn`.
- Update any chart, label or copy that says "9 Terms", "10 terms",
  "2023/24 – 2025/26" or similar to reflect four terms, 2024/25 – 2025/26.
- Add a short note near the trajectory chart: duration breakdowns are published
  from 2024/25 onwards, so earlier terms are excluded.

**Check:** the census dropdown offers four terms. The trajectory chart has four
points and no flat-zero segment.

---

## Stage 2 — Authority count and regions

- Deduplicate authorities on `new_la_code` within each term. North Yorkshire and
  Somerset appear under both old and new ONS codes in earlier terms.
- Replace every hardcoded `153` with a count derived from the data.
- The data contains **ten** regions, not nine — London is split into Inner London
  and Outer London. Fix the regional panel to use the regions present in the data
  rather than a hardcoded list.
- Remove the phantom "All England (0 LAs)" row from the regional list. National
  figures belong in the KPI cards, not as a region.

**Check:** header reads 153 / 153 for Autumn 2025/26. The regional list shows ten
real regions, each with a plausible total, and no row showing 34,700.

---

## Stage 3 — Replace the reason mapping with scope tiers

In `src/data/cmeData.ts` there is a block (around lines 210–220) that collapses
the 20 published reasons into 7 invented buckets. It is wrong in ways that matter:
`Believed to have moved to another country` is folded into an "Other" bucket, and
`Mental health` and `Physical health` are folded into a bucket displayed as
"Persistent Disengagement / Truancy".

- Delete that mapping block and the `reasons` object it produces, along with the
  `REASON_LABELS` constant and the seven bucket keys.
- Keep `officialReasons` and `officialDurations` on the term data — they hold the
  verbatim published values and everything now reads from them.
- Use `SCOPE_TIERS` and `scopeCohort()` from `cmeScope.ts` instead. The three
  in-scope tiers are: Believed moved abroad; Untraceable (Unknown + Not
  recorded); Believed moved to another LA. Everything else is Not in scope.
- Update the reasons panel to show the three tiers plus Not in scope.
- Add a reference table, using `buildReasonTable()`, showing all 20 published
  categories with their published counts, marked with which tier each belongs to.
  This table shows published figures only — no estimates, no yield.

**Check:** Autumn 2025/26 national — abroad 3,400; untraceable 7,600; moved to
another LA 2,600. The reference table lists 20 rows and no category is missing.

---

## Stage 4 — Yield: scope it and label it

Currently `stratosCalculations.ts` applies the per-case value to every child in
the 8–12 and 12+ duration bands regardless of reason, producing about £37m. That
figure includes children awaiting school places, SEND placement disputes and
health cases, none of which are Child Benefit matters.

- Use `computeYield()` from `cmeScope.ts`. It takes only in-scope tiers and
  defaults to abroad only.
- Add a control to include or exclude each of the three tiers.
- Add a duration threshold control offering **8 weeks** and **12 weeks**, default
  8. Child Benefit for a claimant abroad generally ends after 8 weeks; 12 weeks
  applies only in defined circumstances. Label which rule each reflects.
- Every figure that combines reason with duration must carry a visible "estimate"
  marker and expose `ESTIMATE_METHOD` on hover or in a tooltip.
- Delete `cohortMode: 'untraceable-abroad'` and its hardcoded `0.25` coefficient.
  There must be no invented multiplier left anywhere in the file.

**Check:** with abroad only at 8 weeks, roughly 1,970 cases; at 12 weeks, roughly
1,690. At £2,800 × 75% that is about £4.1m and £3.6m. Nothing shows £37m or £43m.

---

## Stage 5 — Remove the SEN filter

The data set contains no SEN or EHCP characteristic. The filter proxies it from
two reason categories and falls back to a hardcoded 30% whenever that proxy is
zero — which is in 123 of 150 authorities. The proxy itself yields 2.8%
nationally, so the filter mostly applies a flat 30% cut derived from nothing.

- Remove `senProportionPercent`, `senSupportCount`, `ehcpCount`,
  `senIdentifiedRatio`, the `excludeSEN` filter and the `cohortMode:
  'exclude-sen'` branch.
- Remove the "Exclude SEN (~30%)" toggle from the header, the risk matrix and
  anywhere else it appears, and the SEN / EHCP KPI card.
- Remove the SEN / EHCP column from the LA table.
- Do not replace it with anything.

**Check:** no reference to SEN remains outside the 20-category reference table,
where `School dissatisfaction SEND` correctly appears as a published reason.

---

## Stage 6 — Rates and the national path

- `compulsoryPupils` is currently back-derived from the published rate
  (`totalCME / (ratePer100/100)`), then used to recompute a rate — which is
  circular. Remove the derivation and the invented `8000` / `48000` fallbacks.
- Display DfE's published `rate_per_100` directly, labelled as DfE's published
  rate per 100 pupils, denominator ONS mid-year population estimates ages 5–16.
  Do not compute a second rate.
- In `cmeData.ts` the national path triggers on `authorities.length >= 140`, so
  any large sub-selection wrongly returns the published national total. Replace
  it with an explicit test of whether the selection is England.
- Keep reading the published National row for national figures. Do not sum
  authorities to produce a national total: DfE uprate national figures for
  non-response and do not uprate LA figures, so they will not reconcile, and that
  gap is not a rounding artefact.

**Check:** select a single region — the total is that region's own figure, not
34,700. National total still reads 34,700.

---

## Stage 7 — Provenance and honesty markers

- Show the data set version, DfE publication date and retrieval timestamp from
  `src/data/dfe-provenance.json` if present, in the footer or the API tab.
- Where a tier includes cells marked `low`, show the count of such authorities
  alongside the figure rather than treating them as zero — `scopeCohort()`
  returns `suppressedCells` for this.
- Remove any remaining copy claiming live API synchronisation unless the refresh
  script is actually running. If `server.ts` is no longer needed, delete it and
  serve the app statically.

**Check:** no figure on the dashboard is presented as published fact when it is
an estimate.

---

## Numbers to verify against — Autumn 2025/26, England

| Figure | Value |
|---|---|
| Total CME | 34,700 |
| 12 weeks or more | 14,600 (42%) |
| 8 weeks or more | 17,800 (51%) |
| Believed moved abroad | 3,400 |
| Untraceable (Unknown + Not recorded) | 7,600 |
| Believed moved to another LA | 2,600 |
| Estimated abroad, 8 weeks+ | ~1,970 |
| Estimated abroad, 12 weeks+ | ~1,690 |
| Local authorities | 153 |
| Largest caseloads | Nottingham 1,990; Lincolnshire 1,910; Kent 1,340 |

If any of these come out differently after a change, stop and say so rather than
adjusting the figure to match.

---

## Stage 8 — Rank by rate, not volume

DfE publish `rate_per_100` (denominator: ONS mid-year population estimates, ages
5–16). Nothing currently uses it, so the league table is effectively ranked by
population size.

For Autumn 2025/26 the national rate is 0.4 per 100 pupils. Nottingham is 4.2,
Southampton 3.0, Hackney 2.6. Kent and Birmingham are both 0.5 — they appear on
the current "high exposure" list only because they are large.

- Add a `Rate per 100` column to the LA table, sourced from the published
  `rate_per_100`. Label it as DfE's published rate.
- Default the table sort to rate descending, with total caseload as a visible
  secondary column.
- Do the same for the "High-Exposure Authority Spotlight" panel.
- Show the national rate as a comparison marker so a reader can see how far above
  or below average each authority sits.

**Check:** the table's default order starts Nottingham, Southampton, Hackney,
East Sussex, Lincolnshire. Kent and Birmingham are no longer near the top.

---

## Stage 9 — KPI row as a funnel

Rebuild the four KPI cards so they read left to right as one narrowing story.
Keep the existing card styling exactly as it is.

1. **Total CME** — 34,700
2. **Past the threshold** — driven by the duration control (8 weeks: 17,800;
   12 weeks: 14,600). Must move when the threshold changes.
3. **In scope (estimated)** — the selected tiers at the selected threshold.
   Carries a visible estimate marker and a subtitle naming which tiers are
   included. This replaces the deleted SEN card.
4. **Estimated value** — subtitle must name the included tiers, e.g. "abroad
   only". Carries a visible estimate marker.

The estimate marker sits on the card face, not in a tooltip. The method text
(`ESTIMATE_METHOD`) is available on hover.

**Check:** switching the threshold between 8 and 12 weeks moves cards 2, 3 and 4
together. Card 4's subtitle always states which tiers are in the figure.

---

## Stage 10 — Tier defaults and the upside panel

**Defaults.** The tier toggles default to **abroad only**. The untraceable tier
carries a visible label: "conversion rate unknown until sampled".

**Upside panel.** Below the KPI row, add an outlined panel — visually distinct
from the KPI cards, clearly a different kind of claim. Not a fifth card, not the
same dark treatment.

Content:

> **Potential upside — not yet evidenced**
>
> 7,600 children are recorded as Unknown or Not recorded: the local authority has
> no destination for them. An unknown proportion have left the country.
>
> If [X]% are abroad → ~[N] cases → ~£[V]
>
> Illustrative rates, not findings. A sample of worked cases is needed before any
> figure here can be relied upon.

Requirements:

- The percentage is a **control the reader can move** (slider or input), not a
  hardcoded value. Show two illustrative points by default, 20% and 50%, so it
  reads as a range rather than a forecast.
- "not yet evidenced" appears in the heading, not the small print.
- This panel must **never** feed the KPI cards, the league table, the yield
  figure, or any CSV export. It is display-only.

**Check:** the headline value is unchanged whatever the upside slider is set to.
Exports contain no upside figures.

---

## Stage 11 — Outcome tracking

Add a per-authority field for cases the team has actually worked and how many
confirmed a payment error, stored locally (localStorage is fine — this is not
case data, only counts).

- Display realised strike rate by authority alongside the estimated cohort.
- Where no local data exists, fall back to the national 75% and label it as the
  default rather than a measured rate.
- Show realised rate separately for each tier, so the untraceable tier's true
  conversion becomes visible once sampled.

This is what turns the upside panel from an assumption into a measured figure,
and it is the strongest argument for keeping the dashboard in use.

**Check:** entering worked-case counts for one authority changes its displayed
strike rate and nothing else.
