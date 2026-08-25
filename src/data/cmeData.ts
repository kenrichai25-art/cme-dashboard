import { AcademicTerm, AggregatedStats, LocalAuthority, Region, TermDataPoint } from '../types';
import officialDataJson from './officialDfeData.json';
import { scopeCohort, computeYield, ScopeTierId, DurationThreshold } from './cmeScope';

// The ten real DfE regions present in the data. Excludes 'All England' — that is a
// filter sentinel meaning "no region filter", not a region of its own.
export const ALL_REGIONS: Region[] = [
  'North East',
  'North West',
  'Yorkshire and The Humber',
  'East Midlands',
  'West Midlands',
  'East of England',
  'Inner London',
  'Outer London',
  'South East',
  'South West',
];

export const ACADEMIC_TERMS: AcademicTerm[] = [
  '2025/26 Autumn',
  '2024/25 Summer',
  '2024/25 Spring',
  '2024/25 Autumn',
];

export const DFE_DATASET_METADATA = officialDataJson.metadata;

export const DURATION_CONFIG = {
  'all': {
    id: 'all',
    label: 'All Durations',
    shortLabel: 'All Wks',
    filterDescription: 'All recorded CME cases across all 8 statutory DfE duration intervals',
    badgeText: 'All Durations (Published Total)',
    color: '#4f46e5',
    accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  '8-12': {
    id: '8-12',
    label: '8–12 Weeks (Medium Term)',
    shortLabel: '8–12 Wks',
    filterDescription: 'Escalated cases requiring multi-agency statutory intervention and casework',
    badgeText: '8–12 Weeks (Medium Term)',
    color: '#f59e0b',
    accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  '12+': {
    id: '12+',
    label: '12+ Weeks (12–26w, 26–52w, Over 52w)',
    shortLabel: '12+ Wks',
    filterDescription: 'Severe chronic CME cases out of educational roll for over a full academic term',
    badgeText: '12+ Weeks (Persistent / Chronic)',
    color: '#e11d48',
    accentBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
} as const;

export const OFFICIAL_20_REASONS = [
  'School application awaiting outcome',
  'Moved in from another local authority',
  'Believed to have moved to another country',
  'Unsuitable elective home education',
  'Moved in from another country',
  'Believed to have moved to another local authority',
  'Waiting school start',
  'Offered school place but not yet accepted',
  'Did not get school preference',
  'Difficulty accessing suitable school place',
  'Challenging school attendance order',
  'School dissatisfaction SEND',
  'School dissatisfaction general',
  'Parental decision not to register at school',
  'Did not apply for school place at compulsory school age',
  'Mental health',
  'Physical health',
  'Unknown',
  'Not recorded',
  'Other'
];

export const REASON_COLORS: Record<string, string> = {
  'School application awaiting outcome': '#2563eb',
  'Moved in from another local authority': '#0284c7',
  'Believed to have moved to another country': '#dc2626',
  'Unsuitable elective home education': '#d97706',
  'Moved in from another country': '#0d9488',
  'Believed to have moved to another local authority': '#4f46e5',
  'Waiting school start': '#16a34a',
  'Offered school place but not yet accepted': '#059669',
  'Did not get school preference': '#7c3aed',
  'Difficulty accessing suitable school place': '#9333ea',
  'Challenging school attendance order': '#c026d3',
  'School dissatisfaction SEND': '#e11d48',
  'School dissatisfaction general': '#ea580c',
  'Parental decision not to register at school': '#ca8a04',
  'Did not apply for school place at compulsory school age': '#65a30d',
  'Mental health': '#0891b2',
  'Physical health': '#059669',
  'Unknown': '#64748b',
  'Not recorded': '#94a3b8',
  'Other': '#475569'
};

// Presentation colours for the compliance scope tiers defined in cmeScope.ts.
// Keyed by ScopeTierId; the tiers themselves are data, these are display only.
export const SCOPE_TIER_COLORS: Record<string, string> = {
  abroad: '#dc2626',
  untraceable: '#64748b',
  movedLa: '#4f46e5',
  outOfScope: '#cbd5e1',
};

// Transform the official JSON into typed LocalAuthority objects
function mapTermKey(termLabel: string): string {
  const [year, tName] = termLabel.split(' ');
  const cleanYear = year.replace('/', '');
  return `${cleanYear}_${tName}`;
}

function parseVal(val: any): number {
  if (val === 'low' || val === 'x' || val === 'z' || val === undefined || val === null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// North Yorkshire and Somerset are published twice in the raw dataset: once under
// their old (pre-reorganisation) ONS code and once under their new one. The old-code
// row carries no data for any term we display, so it is a duplicate authority with
// nothing in it. Keep only entries that have a real record for at least one of the
// terms actually shown.
const activeTermKeys = new Set(ACADEMIC_TERMS.map(mapTermKey));
const dedupedAuthorities = (officialDataJson.localAuthorities as any[]).filter(
  (la) => la.terms && Object.keys(la.terms).some((k) => activeTermKeys.has(k))
);

export const LOCAL_AUTHORITIES_DATA: LocalAuthority[] = dedupedAuthorities.map((la) => {
  const termsData: Record<AcademicTerm, TermDataPoint> = {} as any;

  for (const term of ACADEMIC_TERMS) {
    const termKey = mapTermKey(term);
    const rawTerm = la.terms?.[termKey] || { total: 0, totalRaw: '0', reasons: {}, durations: {}, sex: {}, yearGroups: {} };

    const totalRaw = rawTerm.totalRaw || '0';
    const totalCME = totalRaw === 'low' ? 'c' : totalRaw === 'x' || totalRaw === 'z' ? 0 : parseVal(rawTerm.total);

    // Sum duration buckets
    const dur = rawTerm.durations || {};
    const less2w = parseVal(dur['Less than 2 weeks']?.count);
    const w2_4 = parseVal(dur['2 to 4 weeks']?.count);
    const w4_8 = parseVal(dur['4 to 8 weeks']?.count);
    const w8_12 = parseVal(dur['8 to 12 weeks']?.count);
    const w12_26 = parseVal(dur['12 to 26 weeks']?.count);
    const w26_52 = parseVal(dur['26 to 52 weeks']?.count);
    const w52p = parseVal(dur['Over 52 weeks']?.count);
    const durUnknown = parseVal(dur['Unknown']?.count);

    const weeks1To8 = less2w + w2_4 + w4_8;
    const weeks8To12 = w8_12;
    const weeks12Plus = w12_26 + w26_52 + w52p;

    const longTermMissingCount = weeks12Plus;
    const longTermMissingPercent = (totalCME && totalCME !== 'c' && totalCME > 0)
      ? Number(((weeks12Plus / totalCME) * 100).toFixed(1))
      : 0;

    // Year groups
    const yg = rawTerm.yearGroups || {};
    const primaryCount = parseVal(yg['Reception']?.count) + parseVal(yg['Year 1']?.count) + parseVal(yg['Year 2']?.count) + parseVal(yg['Year 3']?.count) + parseVal(yg['Year 4']?.count) + parseVal(yg['Year 5']?.count) + parseVal(yg['Year 6']?.count);
    const secondaryCount = parseVal(yg['Year 7']?.count) + parseVal(yg['Year 8']?.count) + parseVal(yg['Year 9']?.count) + parseVal(yg['Year 10']?.count) + parseVal(yg['Year 11']?.count);

    termsData[term] = {
      term,
      totalCME,
      totalRaw,
      ratePer100Published: rawTerm.ratePer100 || 'x',
      longTermMissingCount,
      longTermMissingPercent,
      durationWeeks: {
        weeks1To8,
        weeks8To12,
        weeks12Plus,
        rawLess2Weeks: less2w,
        raw2To4Weeks: w2_4,
        raw4To8Weeks: w4_8,
        raw8To12Weeks: w8_12,
        raw12To26Weeks: w12_26,
        raw26To52Weeks: w26_52,
        rawOver52Weeks: w52p,
        rawUnknown: durUnknown,
      },
      officialReasons: rawTerm.reasons || {},
      officialDurations: rawTerm.durations || {},
      officialSex: rawTerm.sex || {},
      officialYearGroups: rawTerm.yearGroups || {},
      ageCohorts: {
        primaryKS1_KS2: primaryCount,
        secondaryKS3_KS4: secondaryCount,
        unknownAge: parseVal(yg['Unknown']?.count),
      }
    };
  }

  // Determine tier
  let tier: 'Metropolitan District' | 'London Borough' | 'Unitary Authority' | 'County Council' = 'Unitary Authority';
  if (la.region === 'Inner London' || la.region === 'Outer London') tier = 'London Borough';
  else if (la.code.startsWith('E08')) tier = 'Metropolitan District';
  else if (la.code.startsWith('E10')) tier = 'County Council';

  return {
    code: la.code,
    name: la.name,
    region: (la.region || 'All England') as Region,
    tier,
    termsData,
  };
});

// Single source of truth for "how many local authorities are in the data" — replaces
// every previously hardcoded 153 across the app.
export const TOTAL_AUTHORITIES_COUNT = LOCAL_AUTHORITIES_DATA.length;

type RawBreakdown = Record<string, { count?: string | number; percent?: string | number }>;

export interface PublishedBreakdown {
  /** Verbatim published reason cells, keyed by the DfE category name. */
  reasons: RawBreakdown;
  /** Verbatim published duration cells, keyed by the DfE band name. */
  durations: RawBreakdown;
  /** Published total as a raw string, so 'low' / 'x' / 'z' survive to parseCell. */
  totalRaw: string | number;
  /** Where these figures came from, so the UI can be honest about provenance. */
  source: 'national' | 'region' | 'authority' | 'summed';
}

// Terms with a published reason breakdown, derived from the data rather than
// hardcoded. Duration is published for every term in ACADEMIC_TERMS (2024/25
// onward), but Reason is currently published for Autumn 2025/26 only — every
// earlier term has every reason cell marked 'x' (not available), checked here
// against the published National row so this stays correct if DfE publish
// reason data for another term.
const REASON_DATA_TERMS = new Set<AcademicTerm>(
  ACADEMIC_TERMS.filter((term) => {
    const row = (officialDataJson.national as any)?.[mapTermKey(term)];
    const reasons = row?.reasons;
    return !!reasons && Object.values(reasons).some((cell: any) => cell?.count !== 'x');
  })
);

/**
 * Whether DfE have published a reason breakdown for this term. Any component
 * that reads officialReasons, or calls scopeCohort() / computeYield(), must
 * check this before rendering — for a term without reason data those cells
 * are all 'x', which parses to null and silently sums to zero, so the naive
 * result looks like an authentic zero rather than "not published".
 */
export function termHasReasonData(term: AcademicTerm): boolean {
  return REASON_DATA_TERMS.has(term);
}

export const REASON_DATA_UNAVAILABLE_MESSAGE = 'Reason breakdown published from Autumn 2025/26 only';

/**
 * Resolve the published reason and duration breakdowns for the current selection.
 *
 * DfE publish National, Regional and LA rows separately, so wherever a published
 * row exists we read it verbatim rather than summing authorities — DfE uprate
 * national figures for non-response and do not uprate LA figures, so the two do
 * not reconcile. Summing is a last resort for an arbitrary subset of authorities.
 *
 * Feed the result to scopeCohort() / buildReasonTable() in cmeScope.ts. This
 * function deliberately performs no scoping or estimation of its own.
 */
export function getPublishedBreakdown(
  term: AcademicTerm,
  opts: { la?: LocalAuthority | null; region?: Region; authorities?: LocalAuthority[] } = {}
): PublishedBreakdown {
  const termKey = mapTermKey(term);
  const { la, region, authorities } = opts;

  if (la) {
    const d = la.termsData[term];
    return {
      reasons: (d?.officialReasons as RawBreakdown) || {},
      durations: (d?.officialDurations as RawBreakdown) || {},
      totalRaw: d?.totalRaw ?? 0,
      source: 'authority',
    };
  }

  if (region && region !== 'All England') {
    const row = (officialDataJson.regions as any)?.[region]?.[termKey];
    if (row) {
      return {
        reasons: row.reasons || {},
        durations: row.durations || {},
        totalRaw: row.totalRaw ?? row.total ?? 0,
        source: 'region',
      };
    }
  }

  if (!authorities) {
    const row = (officialDataJson.national as any)?.[termKey];
    return {
      reasons: row?.reasons || {},
      durations: row?.durations || {},
      totalRaw: row?.totalRaw ?? row?.total ?? 0,
      source: 'national',
    };
  }

  // Arbitrary subset: sum the authority rows. Markers are not imputed — a key
  // stays 'low' only when every contributing cell was 'low' and nothing numeric
  // was added, so a real-but-unquantified count is never shown as a hard 0.
  const sumInto = (pick: (d: any) => RawBreakdown): RawBreakdown => {
    const totals: Record<string, number> = {};
    const lowOnly: Record<string, boolean> = {};
    for (const a of authorities) {
      const src = pick(a.termsData[term]) || {};
      for (const [key, cell] of Object.entries(src)) {
        const raw = String(cell?.count ?? '').trim();
        const n = Number(raw);
        if (raw !== '' && !Number.isNaN(n)) {
          totals[key] = (totals[key] || 0) + n;
          lowOnly[key] = false;
        } else if (raw === 'low') {
          if (!(key in totals)) totals[key] = 0;
          if (!(key in lowOnly)) lowOnly[key] = true;
        }
      }
    }
    const out: RawBreakdown = {};
    for (const key of Object.keys(totals)) {
      out[key] = { count: totals[key] === 0 && lowOnly[key] ? 'low' : totals[key] };
    }
    return out;
  };

  let total = 0;
  for (const a of authorities) {
    const v = a.termsData[term]?.totalCME;
    if (typeof v === 'number') total += v;
  }

  return {
    reasons: sumInto((d) => d?.officialReasons),
    durations: sumInto((d) => d?.officialDurations),
    totalRaw: total,
    source: 'summed',
  };
}

export interface SelectionYieldParams {
  recoveryPerCase: number;
  strikeRate: number;
  includeTiers?: ScopeTierId[];
  durationThreshold?: DurationThreshold;
  childrenPerCase?: number;
}

export interface SelectionYield {
  /** False when the term has no published reason breakdown. cases/value are
   *  both 0 in that case and MUST NOT be rendered as a real figure — show
   *  REASON_DATA_UNAVAILABLE_MESSAGE instead. */
  available: boolean;
  cases: number;
  value: number;
}

/**
 * Scoped financial yield for a set of authorities, computed exactly the way
 * computeSTRATOSLEAs / Stage 4 established: each authority's own published
 * reason and duration breakdown is scoped with scopeCohort() and priced with
 * computeYield() individually, then summed. This is deliberately NOT one
 * scopeCohort() call against a blanket National or Regional row — DfE do not
 * cross-tabulate reason with duration at any level, so a single national
 * duration profile applied to the national reason count is a *different,
 * less accurate* estimate than summing each authority's own profile (~1,744
 * cases nationally at 8 weeks abroad-only, vs. ~1,974 summing per authority —
 * the second is the one the brief's benchmark is built from).
 *
 * Pass `[la]` for a single authority, a region's filtered list, or the full
 * national list — the summing behaviour is the same in every case.
 *
 * This replaces any calculation of yield as
 * (duration band count) * (recoveryPerCase * strikeRate), which counts every
 * reason regardless of scope tier and ignores the threshold control entirely.
 *
 * Reason is published for Autumn 2025/26 only, so this refuses to compute a
 * figure for a term without it — available:false, not a duration-only
 * approximation, so it can never be mistaken for a real number.
 */
export function computeSelectionYield(
  authorities: LocalAuthority[],
  term: AcademicTerm,
  params: SelectionYieldParams
): SelectionYield {
  if (!termHasReasonData(term)) {
    return { available: false, cases: 0, value: 0 };
  }
  let cases = 0;
  let value = 0;
  for (const la of authorities) {
    const d = la.termsData[term];
    if (!d) continue;
    const cohort = scopeCohort(
      d.officialReasons || {},
      d.officialDurations || {},
      d.totalRaw ?? d.totalCME,
      params.durationThreshold ?? 8
    );
    const result = computeYield(cohort, {
      recoveryPerCase: params.recoveryPerCase,
      strikeRate: params.strikeRate,
      includeTiers: params.includeTiers,
      childrenPerCase: params.childrenPerCase,
    });
    cases += result.cases;
    value += result.value;
  }
  return { available: true, cases, value };
}

export interface UntraceableCount {
  /** False when the term has no published reason breakdown. */
  available: boolean;
  /** Published count for "Unknown" + "Not recorded" — not an estimate. */
  count: number;
  /** Cells carrying 'low' within that count — real children, count unknown. */
  suppressedCells: number;
}

/**
 * Published count of children recorded as "Unknown" or "Not recorded"
 * (the 'untraceable' scope tier's reasons), for the same selection
 * getPublishedBreakdown() resolves — the published National/Regional/LA row
 * read directly wherever one exists, summed across authorities only as a
 * last resort for an arbitrary subset. This is a real published figure, not
 * a duration-scoped estimate — no assumption about how many are abroad is
 * made here. Feeds the Stage 10 "potential upside" panel only; must never
 * be summed into a KPI card, the league table, the yield figure, or an
 * export.
 */
export function computeUntraceableCount(
  term: AcademicTerm,
  opts: { la?: LocalAuthority | null; region?: Region; authorities?: LocalAuthority[] } = {}
): UntraceableCount {
  if (!termHasReasonData(term)) {
    return { available: false, count: 0, suppressedCells: 0 };
  }
  const breakdown = getPublishedBreakdown(term, opts);
  const cohort = scopeCohort(breakdown.reasons, breakdown.durations, breakdown.totalRaw, 8);
  const tier = cohort.tiers.find((t) => t.tier.id === 'untraceable');
  return { available: true, count: tier?.publishedCount ?? 0, suppressedCells: tier?.suppressedCells ?? 0 };
}

export interface AggregateScope {
  /** True only for the whole-England selection. Not inferred from selectedLabel text. */
  isEngland?: boolean;
  /** Set when the selection is exactly one DfE region. */
  region?: Region;
}

/**
 * Calculate aggregate totals for national, regional or LA selections from
 * authentic DfE published rows.
 *
 * `scope` is an explicit description of what `authorities` represents — it is
 * never inferred from `selectedLabel`, which is display text a caller can
 * change freely (e.g. the region "East of England" contains the substring
 * "England", so matching on label text previously misidentified it as the
 * national selection and returned the national total for that region).
 */
export function calculateAggregate(
  authorities: LocalAuthority[],
  term: AcademicTerm,
  selectedLabel: string,
  scope: AggregateScope = {}
): AggregatedStats {
  const termKey = mapTermKey(term);
  const { isEngland = false, region } = scope;
  const nationalRaw = (officialDataJson.national as any)?.[termKey];

  let totalCME = 0;
  let longTermMissingCount = 0;
  let weeks1To8 = 0;
  let weeks8To12 = 0;
  let weeks12Plus = 0;

  const ageCohortsSum = {
    primaryKS1_KS2: 0,
    secondaryKS3_KS4: 0,
    unknownAge: 0,
  };

  for (const la of authorities) {
    const data = la.termsData[term];
    if (!data) continue;

    const cmeVal = data.totalCME === 'c' ? 0 : data.totalCME;
    totalCME += cmeVal;

    const w1_8 = data.durationWeeks.weeks1To8 === 'c' ? 0 : data.durationWeeks.weeks1To8;
    const w8_12 = data.durationWeeks.weeks8To12 === 'c' ? 0 : data.durationWeeks.weeks8To12;
    const w12p = data.durationWeeks.weeks12Plus === 'c' ? 0 : data.durationWeeks.weeks12Plus;

    weeks1To8 += w1_8;
    weeks8To12 += w8_12;
    weeks12Plus += w12p;
    longTermMissingCount += w12p;

    ageCohortsSum.primaryKS1_KS2 += data.ageCohorts.primaryKS1_KS2;
    ageCohortsSum.secondaryKS3_KS4 += data.ageCohorts.secondaryKS3_KS4;
    ageCohortsSum.unknownAge += data.ageCohorts.unknownAge;
  }

  // Keep reading the published National row for the national total rather than
  // summing authorities: DfE uprate national figures for non-response and do
  // not uprate LA figures, so a sum of authorities will not reconcile with the
  // published total, and that gap is not a rounding artefact.
  if (isEngland && nationalRaw && nationalRaw.total > 0) {
    totalCME = nationalRaw.total;
  }

  // Same principle applied to the duration bands: the published National row
  // carries its own duration breakdown, uprated the same way as the national
  // total. Summing authorities previously gave 17,890 / 14,670 at 8/12 weeks
  // against a published 17,800 / 14,600 — not a rounding gap, the same
  // non-response uprating that totalCME above already accounts for.
  if (isEngland && nationalRaw?.durations) {
    const natDur = nationalRaw.durations;
    const natLess2w = parseVal(natDur['Less than 2 weeks']?.count);
    const natW2_4 = parseVal(natDur['2 to 4 weeks']?.count);
    const natW4_8 = parseVal(natDur['4 to 8 weeks']?.count);
    const natW8_12 = parseVal(natDur['8 to 12 weeks']?.count);
    const natW12_26 = parseVal(natDur['12 to 26 weeks']?.count);
    const natW26_52 = parseVal(natDur['26 to 52 weeks']?.count);
    const natW52p = parseVal(natDur['Over 52 weeks']?.count);
    weeks1To8 = natLess2w + natW2_4 + natW4_8;
    weeks8To12 = natW8_12;
    weeks12Plus = natW12_26 + natW26_52 + natW52p;
    longTermMissingCount = weeks12Plus;
  }

  // DfE's own published rate per 100 pupils for this exact selection, read
  // verbatim — never computed. Denominator: ONS mid-year population estimates,
  // ages 5–16. Only National, a single Region, or a single Local Authority
  // carry a published rate; an arbitrary group of authorities has none, and
  // none is derived here to fill the gap.
  let ratePer100Published: string | undefined;
  if (isEngland) {
    ratePer100Published = nationalRaw?.ratePer100;
  } else if (region) {
    ratePer100Published = (officialDataJson.regions as any)?.[region]?.[termKey]?.ratePer100;
  } else if (authorities.length === 1) {
    ratePer100Published = authorities[0].termsData[term]?.ratePer100Published;
  }

  const longTermMissingPercent = totalCME > 0 ? Number(((weeks12Plus / totalCME) * 100).toFixed(1)) : 0;

  // Previous term for trend delta
  const termIdx = ACADEMIC_TERMS.indexOf(term);
  const prevTerm = termIdx < ACADEMIC_TERMS.length - 1 ? ACADEMIC_TERMS[termIdx + 1] : undefined;

  let totalCMEDeltaPercent: number | undefined;
  if (prevTerm) {
    const prevAggregate = calculateAggregate(authorities, prevTerm, selectedLabel, scope);
    if (prevAggregate.totalCME > 0) {
      totalCMEDeltaPercent = Number((((totalCME - prevAggregate.totalCME) / prevAggregate.totalCME) * 100).toFixed(1));
    }
  }

  return {
    term,
    selectedLabel,
    totalCME,
    ratePer100Published,
    longTermMissingCount: weeks12Plus,
    longTermMissingPercent,
    durationWeeks: {
      weeks1To8,
      weeks8To12,
      weeks12Plus,
    },
    ageCohorts: ageCohortsSum,
    laCount: authorities.length,
    prevTerm,
    totalCMEDeltaPercent,
  };
}

export function formatUKNumber(val: number | 'c' | null | undefined): string {
  if (val === 'c' || val === undefined || val === null) return 'c* (<5)';
  return val.toLocaleString('en-GB');
}

// Label for every "rate per 100 pupils" figure on the dashboard. There is
// exactly one rate anywhere in this app, and this is it — no second rate is
// ever computed from it.
export const RATE_PER_100_LABEL =
  "DfE's published rate per 100 pupils. Denominator: ONS mid-year population estimates, ages 5–16.";

/** Formats a verbatim published rate_per_100 string ('0.4000000' or 'x'). */
export function formatRatePer100(raw: string | number | null | undefined): string {
  if (raw === undefined || raw === null || raw === 'x') return 'Not published';
  const n = Number(raw);
  if (Number.isNaN(n)) return 'Not published';
  return `${n.toFixed(2)} per 100`;
}

/**
 * Numeric value of a published rate_per_100, for sorting/comparison only.
 * Returns null for 'x'/'low'/unpublished — callers must not treat that as 0
 * (a null rate should sort last, not tie with a genuine 0.0).
 */
export function parseRatePer100(raw: string | number | null | undefined): number | null {
  if (raw === undefined || raw === null || raw === 'x' || raw === 'low') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export function formatGBP(val: number, compact: boolean = false): string {
  if (compact) {
    if (val >= 1_000_000) {
      return `£${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `£${(val / 1_000).toFixed(0)}k`;
    }
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(val);
}

export const formatUKCurrency = formatGBP;

export function formatUKRate(val: number | 'c' | null | undefined): string {
  if (val === 'c' || val === undefined || val === null) return 'c*';
  return `${val.toFixed(2)} per 1k`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
}
