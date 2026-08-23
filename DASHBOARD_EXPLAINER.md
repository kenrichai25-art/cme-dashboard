# CME Compliance Dashboard — Plain-English Guide

This document explains what the dashboard shows, where the numbers come from, and
where to be careful. It's written for people who will use the dashboard day to
day, not for developers — no code, no jargon you haven't already been introduced
to elsewhere in the document.

---

## 1. What this is, and who it's for

The dashboard analyses **Children Missing Education (CME)** statistics published
by the Department for Education, and re-presents them for one specific purpose:
identifying children who may be relevant to **HMRC Child Benefit compliance** —
specifically, cases where a child has been reported missing from a school roll
because a family is believed to have left the country, gone untraceable, or moved
to another local authority, since Child Benefit entitlement depends on the child
still being in the UK.

It's built for compliance and casework teams who need to see, per local
authority and per term: how many children are recorded as CME, how long they've
been missing, why they're recorded as missing, and — where the data allows it —
a modelled estimate of how many of those cases might be worth investigating and
what that could be worth in recovered payments.

It is **not** a live case-management system. It doesn't hold any individual
child's name or personal details — only the aggregate counts DfE publish for
each local authority and term.

---

## 2. Where the data comes from, and how often it's updated

Every figure in the dashboard originates from one place: DfE's **Explore
Education Statistics (EES)** platform, specifically the "Children missing
education at census date" dataset, published as **Official Statistics**. This
is the same statutory census DfE publish for public use — nothing in this
dashboard is collected independently.

DfE publish this dataset **termly** — three times a year, roughly in line with
the Autumn, Spring and Summer school terms. The dashboard currently holds four
published terms (2024/25 Autumn through 2025/26 Autumn). Two figures are
published for each local authority, each region, and for England as a whole,
every term:

- **Reason** the child is recorded as missing (20 defined categories, e.g.
  "Believed to have moved to another country", "Unknown", "Mental health").
  Reason has only been published from the **2025/26 Autumn** term onward — DfE
  didn't publish this breakdown for earlier terms.
- **Duration** the child has been missing, in eight published bands (from "Less
  than 2 weeks" up to "Over 52 weeks"). Duration is published for every term the
  dashboard holds.

Because Reason isn't available for every term, any part of the dashboard that
depends on Reason clearly says "not published" for terms it doesn't cover — it
never quietly shows a made-up or zero figure.

---

## 3. Published facts vs. estimates — and why the difference matters

This is the single most important thing to understand about the dashboard.

**Published facts** are numbers DfE actually printed in their release: total CME
count, the reason breakdown, the duration breakdown, the rate per 100 pupils.
These are shown as plain numbers with no special marking, because they're not
derived from anything — they're just DfE's own figures, read directly.

**Estimates** appear wherever the dashboard needs to know *how long* a child in
a *specific reason category* has been missing — for example, "how many children
believed to have moved abroad have been missing 8+ weeks?" DfE do not publish
that combination. They publish Reason and Duration as two **separate**
breakdowns of the same cohort, and never cross-tabulate them (i.e. they never
tell you the duration breakdown *within* a single reason category).

To answer that question anyway, the dashboard makes one explicit, stated
assumption: it applies each local authority's own overall duration profile
(what share of *all* its CME children have been missing 8+ weeks) to the
count of children in a given reason category, on the assumption that duration
is spread the same way inside that reason category as it is across the
authority's whole caseload. That assumption is reasonable but unproven — it is
likely to understate the true figure for children believed to have moved
abroad specifically, since a family that has actually left the country is
plausibly missing for longer than the average case, not the same or less.

**Every number built this way carries a visible marker** in the interface (a
small "Est" badge you can hover over to see the method above, wherever it
appears) so it's never confused with a figure DfE actually published. If you
ever see a duration-and-reason combination *without* that marker, that's worth
flagging — it shouldn't happen.

If DfE ever publish the reason/duration cross-tabulation directly, these
figures stop being estimates and become published facts. A request for exactly
that has been drafted (not yet sent, at time of writing) to DfE's statistics
team.

---

## 4. The three compliance scope tiers, and why they exist

Not every CME reason is relevant to Child Benefit. The dashboard groups the 20
DfE reason categories into four tiers, based on relevance to the question "is
this family plausibly no longer entitled to Child Benefit because the child has
left the UK?":

| Tier | DfE reason(s) included | Why it's treated this way |
|---|---|---|
| **Believed moved abroad** | "Believed to have moved to another country" | The direct, on-its-face match to the Child Benefit absence rule — the local authority itself believes the child has left the country. |
| **Untraceable** | "Unknown", "Not recorded" | The authority doesn't know where the child went. Some of these children will genuinely have left the country; others moved within England or were simply never traced. Until outcomes are tracked (see §6), this tier's true "worth investigating" rate is unknown and is **not** assumed to be as high as the "Believed moved abroad" tier. |
| **Believed moved to another LA** | "Believed to have moved to another local authority" | Not obviously a Child Benefit matter — the child is believed to still be in England. It's included as the lowest-priority tier only because "another LA" is still an authority's belief rather than a confirmed destination, so it isn't ruled out entirely. |
| **Not in scope** | Every other DfE reason (e.g. Mental health, Physical health, Parental decision not to register, SEND dissatisfaction, etc.) | These children are understood to be in the country and in contact with the authority. No Child Benefit entitlement question arises, so they never contribute to any recovery estimate. |

By default, the dashboard's financial estimates only count the **"Believed
moved abroad"** tier — the most defensible one. You can widen the calculation to
include the other in-scope tiers, but the dashboard makes clear which tiers are
switched on for any figure you're looking at.

---

## 5. The 8-week vs. 12-week threshold

Child Benefit for a claimant who is abroad generally stops after **8 weeks**
away, with an extension to **12 weeks** available only in specific defined
circumstances (e.g. the claimant's own illness, or the death of a close
relative). The dashboard lets you toggle which threshold to apply:

- **8 weeks (default)** — matches the general rule. A child recorded as missing
  8 weeks or more, in an in-scope tier, is counted as potentially past the point
  where Child Benefit should have stopped.
- **12 weeks** — the more conservative view. It only counts cases that have
  passed the *maximum* extension period, so it will always show a smaller
  number of cases than the 8-week view, but each one is harder to argue against.

Every figure that depends on this toggle — case counts, estimated values, risk
tiers — moves together when you switch it, and the dashboard labels which
threshold is currently active.

---

## 6. Known limitations and open questions

**The £2,800-per-case vs. per-child question (unresolved).** The dashboard's
default "average recovery per case" is £2,800, multiplied by cases in scope to
produce an estimated value. £2,800 is understood to be the average recovery
*per Child Benefit case worked* — but the dashboard currently multiplies it by a
count of *children*. Child Benefit is paid as one claim per family, and UK
families average roughly 1.7 dependent children, so the true number of
*claims* affected is likely meaningfully lower than the number of *children*
shown — which means the estimated recovery value may currently be **overstated**
by roughly that same factor. This has not been corrected in the dashboard and
should be treated as an open question, not a settled figure, until it's
confirmed with whoever owns the £2,800 assumption: is it per claim or per
child, and does a multi-child family count as one case or several?

**The 75% strike rate is an assumption, not yet a measured figure.** The
dashboard defaults to assuming 75% of opened cases confirm an actual Child
Benefit error. That number hasn't been derived from this dataset — it's a
starting assumption. The dashboard includes an outcome-tracking feature (in
each local authority's detail view) where you can record, per authority and per
tier, how many cases were actually worked and how many were confirmed as
errors. Once an authority has logged real outcomes, the dashboard shows its own
**measured** strike rate instead of the 75% default for that authority/tier —
this is specifically meant to make the "Untraceable" tier's true conversion
rate knowable over time, since right now it is not.

**Reason data only exists for one term.** Any figure that depends on Reason
(which includes every tier-based estimate) is only available for 2025/26
Autumn. Earlier terms will show duration figures (published facts) but "not
published" for anything tier- or reason-based — this is expected, not a fault.

**The reason/duration cross-tabulation doesn't exist yet.** As explained in
§3, every tier-based estimate rests on one stated assumption because DfE
haven't published the combination directly. A request to DfE for that
cross-tabulation has been drafted but not yet sent as of this writing.

---

## 7. What "Refresh Live DfE Data" / "Sync All England" actually does

This button (in the header, and again on the API tab) is a **real** action — it
is not a decorative simulation. Clicking it makes a genuine network request to
DfE's live API and re-downloads the current published dataset.

What it does **not** do is instantly change any number you're currently looking
at. Here's the actual sequence:

1. The button asks you to confirm, because the action isn't reversible from
   the dashboard and nothing checks the new data against what's currently
   shown.
2. If you confirm, the server fetches the latest data directly from DfE and, if
   that succeeds, **overwrites the server's own cached copy of the dataset on
   disk**.
3. The dashboard you're looking at right now keeps showing the figures it was
   already showing — the numbers on screen are built into the app at the point
   it was last built, not read live on every page load.
4. For the newly-fetched data to actually appear in the dashboard, the app has
   to be **rebuilt and redeployed** using that new cached copy.
5. Because nothing automates that re-check, **every benchmark figure needs to
   be manually re-verified against the new release before the rebuilt app is
   trusted** — a new DfE release could change category definitions, add or
   drop a term, or shift numbers in a way nothing here would catch
   automatically. This is exactly what the warning caption under the button is
   telling you.

If the live fetch fails (DfE's API is unreachable, for example), the dashboard
says so honestly and keeps showing the existing cached data — it will never
silently substitute a fake "success" or a reassuring fallback number.
