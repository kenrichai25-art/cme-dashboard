/**
 * cmeScope.ts
 *
 * Compliance scoping for the CME dashboard.
 *
 * Two rules govern everything in this file:
 *
 *  1. The 20 DfE reason categories are never collapsed or renamed. They are
 *     reproduced verbatim for the reference table.
 *  2. Any figure that combines a reason with a duration is an ESTIMATE, because
 *     DfE publish reason and duration as separate marginal distributions and do
 *     not cross-tabulate them. Every such figure is returned with
 *     `isEstimate: true` and a method string, and must be labelled in the UI.
 *
 * No coefficient in this file is invented. The only assumption is stated
 * explicitly in ESTIMATE_METHOD below.
 */

// ---------------------------------------------------------------------------
// The 20 published reason categories, verbatim from the DfE data set.
// Order is the published order; do not re-sort in the data layer.
// ---------------------------------------------------------------------------

export const DFE_REASON_CATEGORIES = [
  'Believed to have moved to another country',
  'Believed to have moved to another local authority',
  'Challenging school attendance order',
  'Did not apply for school place at compulsory school age',
  'Did not get school preference',
  'Difficulty accessing suitable school place',
  'Mental health',
  'Moved in from another country',
  'Moved in from another local authority',
  'Not recorded',
  'Offered school place but not yet accepted',
  'Other',
  'Parental decision not to register at school',
  'Physical health',
  'School application awaiting outcome',
  'School dissatisfaction SEND',
  'School dissatisfaction general',
  'Unknown',
  'Unsuitable elective home education',
  'Waiting school start',
] as const;

export type DfeReason = (typeof DFE_REASON_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// The 8 published duration bands, verbatim.
// ---------------------------------------------------------------------------

export const DFE_DURATION_BANDS = [
  'Less than 2 weeks',
  '2 to 4 weeks',
  '4 to 8 weeks',
  '8 to 12 weeks',
  '12 to 26 weeks',
  '26 to 52 weeks',
  'Over 52 weeks',
  'Unknown',
] as const;

/** Bands at or beyond each Child Benefit threshold. */
export const BANDS_AT_OR_OVER = {
  8: ['8 to 12 weeks', '12 to 26 weeks', '26 to 52 weeks', 'Over 52 weeks'],
  12: ['12 to 26 weeks', '26 to 52 weeks', 'Over 52 weeks'],
} as const;

export type DurationThreshold = keyof typeof BANDS_AT_OR_OVER;

export const THRESHOLD_NOTES: Record<DurationThreshold, string> = {
  8:
    'Child Benefit for a claimant abroad generally ends after 8 weeks. ' +
    'Extension to 12 weeks applies only in defined circumstances.',
  12:
    'The 12-week view is the conservative position, covering only cases past ' +
    'the maximum extended absence period.',
};

// ---------------------------------------------------------------------------
// Scope tiers. These reflect Child Benefit relevance, not DfE structure.
// ---------------------------------------------------------------------------

export type ScopeTierId = 'abroad' | 'untraceable' | 'movedLa' | 'outOfScope';

export interface ScopeTier {
  id: ScopeTierId;
  label: string;
  /** Exact DfE category names. Never a pattern match. */
  reasons: DfeReason[];
  /** Whether yield is calculated for this tier. */
  countsTowardYield: boolean;
  rationale: string;
}

export const SCOPE_TIERS: ScopeTier[] = [
  {
    id: 'abroad',
    label: 'Believed moved abroad',
    reasons: ['Believed to have moved to another country'],
    countsTowardYield: true,
    rationale:
      'Direct match to the absence rule. The local authority believes the ' +
      'child has left the country.',
  },
  {
    id: 'untraceable',
    label: 'Untraceable',
    reasons: ['Unknown', 'Not recorded'],
    countsTowardYield: true,
    rationale:
      'Destination not known to the local authority. Some proportion will have ' +
      'left the country; the remainder moved within England or were never traced. ' +
      'Realised strike rate for this tier should be tracked separately.',
  },
  {
    id: 'movedLa',
    label: 'Believed moved to another LA',
    reasons: ['Believed to have moved to another local authority'],
    countsTowardYield: true,
    rationale:
      'Not a Child Benefit matter on its face, but the move is an authority ' +
      'assumption rather than a verified destination. Lowest priority tier.',
  },
  {
    id: 'outOfScope',
    label: 'Not in scope',
    // Every remaining category. Derived rather than listed, so a new DfE
    // category lands here by default instead of being silently dropped.
    reasons: DFE_REASON_CATEGORIES.filter(
      (r) =>
        ![
          'Believed to have moved to another country',
          'Unknown',
          'Not recorded',
          'Believed to have moved to another local authority',
        ].includes(r)
    ) as DfeReason[],
    countsTowardYield: false,
    rationale:
      'Children in contact with the local authority and understood to be in ' +
      'the country. No entitlement question arises.',
  },
];

export const ESTIMATE_METHOD =
  'Reason and duration are published as separate breakdowns and are not ' +
  'cross-tabulated by DfE. This figure applies each local authority\u2019s own ' +
  'duration profile to its reason count, assuming duration is distributed the ' +
  'same way within the reason as across that authority\u2019s whole cohort. ' +
  'Likely conservative for children believed to have moved abroad.';

// ---------------------------------------------------------------------------
// Parsing. DfE use three non-numeric markers.
//   'low' — rounds to 0 but is not 0
//   'x'   — not available
//   'z'   — not applicable
// None of them is statistical disclosure control, and none is imputed.
// ---------------------------------------------------------------------------

export type CellMarker = 'low' | 'x' | 'z';

export interface Cell {
  /** Numeric value, or null when the cell carries a marker. */
  value: number | null;
  marker: CellMarker | null;
  /** The raw published string, for display and audit. */
  raw: string;
}

export function parseCell(raw: unknown): Cell {
  const s = raw == null ? '' : String(raw).trim();
  if (s === 'low' || s === 'x' || s === 'z') {
    return { value: null, marker: s as CellMarker, raw: s };
  }
  const n = Number(s);
  if (s === '' || Number.isNaN(n)) return { value: null, marker: null, raw: s };
  return { value: n, marker: null, raw: s };
}

/** Sum treating markers as zero for totals, while reporting how many were skipped. */
function sumCells(cells: Cell[]): { total: number; suppressed: number } {
  let total = 0;
  let suppressed = 0;
  for (const c of cells) {
    if (c.value == null) {
      if (c.marker === 'low') suppressed++;
    } else {
      total += c.value;
    }
  }
  return { total, suppressed };
}

// ---------------------------------------------------------------------------
// Scoping a single authority-term.
// ---------------------------------------------------------------------------

type RawBreakdown = Record<string, { count?: string | number; percent?: string | number }>;

export interface TierResult {
  tier: ScopeTier;
  /** Published count for the tier's reasons. Not an estimate. */
  publishedCount: number;
  /** Cells carrying 'low' within this tier — real children, count unknown. */
  suppressedCells: number;
  /** Estimated portion of publishedCount at or beyond the threshold. */
  estimatedAtThreshold: number;
  isEstimate: true;
}

export interface ScopedCohort {
  /** Published total for the authority-term. */
  totalCME: number;
  /** Share of the cohort at or beyond the threshold. Published, not estimated. */
  durationShareAtThreshold: number;
  /** Published count at or beyond the threshold, all reasons. */
  durationCountAtThreshold: number;
  threshold: DurationThreshold;
  tiers: TierResult[];
  /** Sum of estimatedAtThreshold across yield-bearing tiers. */
  inScopeAtThreshold: number;
  estimateMethod: string;
  /** True when the duration profile could not be derived and no estimate is possible. */
  durationProfileUnavailable: boolean;
}

export function scopeCohort(
  officialReasons: RawBreakdown,
  officialDurations: RawBreakdown,
  publishedTotal: unknown,
  threshold: DurationThreshold
): ScopedCohort {
  const total = parseCell(publishedTotal).value ?? 0;

  const atThresholdBands = BANDS_AT_OR_OVER[threshold];
  const durationCells = atThresholdBands.map((b) => parseCell(officialDurations?.[b]?.count));
  const { total: durationCount } = sumCells(durationCells);

  const share = total > 0 ? durationCount / total : 0;
  const profileUnavailable = total <= 0 || durationCount <= 0;

  const tiers: TierResult[] = SCOPE_TIERS.map((tier) => {
    const cells = tier.reasons.map((r) => parseCell(officialReasons?.[r]?.count));
    const { total: count, suppressed } = sumCells(cells);
    return {
      tier,
      publishedCount: count,
      suppressedCells: suppressed,
      estimatedAtThreshold: profileUnavailable ? 0 : Math.round(count * share),
      isEstimate: true as const,
    };
  });

  const inScope = tiers
    .filter((t) => t.tier.countsTowardYield)
    .reduce((sum, t) => sum + t.estimatedAtThreshold, 0);

  return {
    totalCME: total,
    durationShareAtThreshold: share,
    durationCountAtThreshold: durationCount,
    threshold,
    tiers,
    inScopeAtThreshold: inScope,
    estimateMethod: ESTIMATE_METHOD,
    durationProfileUnavailable: profileUnavailable,
  };
}

// ---------------------------------------------------------------------------
// Yield. Applied only to in-scope tiers, and only at or beyond the threshold.
// ---------------------------------------------------------------------------

export interface YieldParams {
  /** Average recovery per confirmed case. */
  recoveryPerCase: number;
  /** Proportion of opened cases expected to confirm an error, 0–1. */
  strikeRate: number;
  /** Tiers to include. Defaults to abroad only. */
  includeTiers?: ScopeTierId[];
  /**
   * Child Benefit is claimed once per family, not once per child, so a
   * family with more than one dependent child inflates the child count
   * relative to the number of claims actually worked. Divides the estimated
   * child count down to an estimated claim count before pricing. Defaults
   * to 1 (no adjustment — cases == children), matching every figure in the
   * app before this control existed.
   */
  childrenPerCase?: number;
}

export interface YieldResult {
  cases: number;
  value: number;
  effectiveValuePerCase: number;
  includedTiers: ScopeTierId[];
  isEstimate: true;
  estimateMethod: string;
}

export function computeYield(cohort: ScopedCohort, params: YieldParams): YieldResult {
  const include = params.includeTiers ?? ['abroad'];
  const childCount = cohort.tiers
    .filter((t) => t.tier.countsTowardYield && include.includes(t.tier.id))
    .reduce((sum, t) => sum + t.estimatedAtThreshold, 0);

  const childrenPerCase = params.childrenPerCase && params.childrenPerCase > 0 ? params.childrenPerCase : 1;
  const cases = Math.round(childCount / childrenPerCase);

  const effective = params.recoveryPerCase * params.strikeRate;

  return {
    cases,
    value: Math.round(cases * effective),
    effectiveValuePerCase: effective,
    includedTiers: include,
    isEstimate: true,
    estimateMethod: cohort.estimateMethod,
  };
}

// ---------------------------------------------------------------------------
// Full 20-category reference table. Published figures only, no estimation.
// ---------------------------------------------------------------------------

export interface ReasonRow {
  reason: DfeReason;
  cell: Cell;
  /** Share of the published total, or null where the cell carries a marker. */
  sharePercent: number | null;
  tierId: ScopeTierId;
  inScope: boolean;
}

export function buildReasonTable(
  officialReasons: RawBreakdown,
  publishedTotal: unknown
): ReasonRow[] {
  const total = parseCell(publishedTotal).value ?? 0;
  const tierFor = (r: DfeReason): ScopeTier =>
    SCOPE_TIERS.find((t) => t.reasons.includes(r)) ??
    SCOPE_TIERS[SCOPE_TIERS.length - 1];

  return DFE_REASON_CATEGORIES.map((reason) => {
    const cell = parseCell(officialReasons?.[reason]?.count);
    const tier = tierFor(reason);
    return {
      reason,
      cell,
      sharePercent:
        cell.value != null && total > 0
          ? Number(((cell.value / total) * 100).toFixed(1))
          : null,
      tierId: tier.id,
      inScope: tier.countsTowardYield,
    };
  });
}
