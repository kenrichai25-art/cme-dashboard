import {
  AcademicTerm,
  CalculatorParams,
  LEACombined,
  LocalAuthority,
  Region,
  RiskLevel,
  StratosNationalAggregate,
  StratosRegionalRollup
} from '../types';
import { scopeCohort, computeYield } from '../data/cmeScope';
import { termHasReasonData, ALL_REGIONS } from '../data/cmeData';

export const DEFAULT_CALCULATOR_PARAMS: CalculatorParams = {
  recoveryPerCase: 2800,
  strikeRate: 0.75,
  // Abroad only, at 8 weeks: the default matches the Child Benefit rule that
  // entitlement for a claimant abroad generally ends after 8 weeks.
  includeTiers: ['abroad'],
  durationThreshold: 8,
};

export const RISK_TIER_CONFIG = {
  Critical: {
    label: 'Critical Priority',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    borderClass: 'border-rose-300',
    bgClass: 'bg-rose-50/50',
    description: 'In-scope cohort ≥ 200 OR published rate ≥ 1.2 per 100',
  },
  High: {
    label: 'High Priority',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50/50',
    description: 'In-scope cohort ≥ 80 OR published rate ≥ 0.6 per 100',
  },
  Medium: {
    label: 'Medium Priority',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    borderClass: 'border-sky-300',
    bgClass: 'bg-sky-50/50',
    description: 'In-scope cohort ≥ 30 OR published rate ≥ 0.4 per 100',
  },
  Low: {
    label: 'Low Priority',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-300',
    bgClass: 'bg-emerald-50/50',
    description: 'Standard baseline monitoring & routine audit compliance',
  },
};

/**
 * Format currency into standard UK GBP notation
 */
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

/**
 * Safely parse numeric value from DfE 'c', 'low', 'x', or number
 */
export function parseDfENumber(val: number | string | 'c' | undefined, defaultValue: number = 0): number {
  if (val === undefined || val === null) return defaultValue;
  if (val === 'c' || val === 'low') return 0; // Avoid fabricating numbers for suppressed cells
  if (val === 'x' || val === 'z') return 0;
  const n = Number(val);
  return isNaN(n) ? defaultValue : n;
}

/**
 * Compute STRATOS combined LEA model from authentic LocalAuthority DfE data
 */
export function computeSTRATOSLEAs(
  authorities: LocalAuthority[],
  selectedTerm: AcademicTerm,
  params: CalculatorParams
): LEACombined[] {
  const {
    recoveryPerCase,
    strikeRate,
    includeTiers = ['abroad'],
    durationThreshold = 8,
  } = params;
  const effectiveValuePerCase = recoveryPerCase * strikeRate;

  return authorities.map((la) => {
    const termData = la.termsData[selectedTerm] || Object.values(la.termsData)[0];
    const rawTotalCme = parseDfENumber(termData?.totalCME, 0);
    const rawW1_8 = parseDfENumber(termData?.durationWeeks?.weeks1To8, 0);
    const rawW8_12 = parseDfENumber(termData?.durationWeeks?.weeks8To12, 0);
    const rawW12_plus = parseDfENumber(termData?.durationWeeks?.weeks12Plus, 0);

    // Exact published statutory reason counts
    const officialReasons = termData?.officialReasons || {};
    const abroad = parseDfENumber(officialReasons['Believed to have moved to another country']?.count, 0);
    const unknown = parseDfENumber(officialReasons['Unknown']?.count, 0) + parseDfENumber(officialReasons['Not recorded']?.count, 0);
    const dispute = parseDfENumber(officialReasons['Unsuitable elective home education']?.count, 0) + 
                    parseDfENumber(officialReasons['Did not get school preference']?.count, 0);

    const totalCme = rawTotalCme;
    const w1_8 = rawW1_8;
    const w8_12 = rawW8_12;
    const w12_plus = rawW12_plus;

    // Yield is scoped to the selected tiers at the selected threshold, using this
    // authority's own published duration profile. ESTIMATE: reason and duration
    // are separate published breakdowns and are not cross-tabulated by DfE, so
    // every figure derived here must be labelled as an estimate in the UI.
    const officialDurations = termData?.officialDurations || {};
    const cohortAtThreshold = scopeCohort(
      officialReasons,
      officialDurations,
      termData?.totalRaw ?? rawTotalCme,
      durationThreshold
    );
    const cohortAt12 = scopeCohort(
      officialReasons,
      officialDurations,
      termData?.totalRaw ?? rawTotalCme,
      12
    );

    const yieldAtThreshold = computeYield(cohortAtThreshold, {
      recoveryPerCase,
      strikeRate,
      includeTiers,
    });
    const yieldAt12 = computeYield(cohortAt12, { recoveryPerCase, strikeRate, includeTiers });

    // Split the scoped yield across the published bands. At a 12-week threshold
    // the 8–12 band is out of scope entirely, so it contributes nothing.
    const w12_plus_val = yieldAt12.value;
    const w8_12_val = Math.max(0, yieldAtThreshold.value - w12_plus_val);
    const total_potential = yieldAtThreshold.value;
    const target_cases = yieldAtThreshold.cases;

    const w12_plus_pct = totalCme > 0 ? (w12_plus / totalCme) * 100 : 0;
    const avg_value_per_cme = totalCme > 0 ? total_potential / totalCme : 0;

    // Risk tier: in-scope cohort size at the active threshold, filtered to
    // the selected Scope tiers the same way computeYield() is — previously
    // this used cohortAtThreshold.inScopeAtThreshold directly, which sums
    // all three yield-eligible tiers regardless of includeTiers, so risk
    // classification stayed frozen while every £ figure on screen reacted
    // to the Scope Tier toggle. Now both move together. Combined with DfE's
    // published rate_per_100. Previously thresholded against estimated £
    // value (£500k/£200k/£50k), calibrated to the unscoped ~£37m yield that
    // no longer exists post-Stage-4. Breakpoints are percentile-anchored to
    // the actual distribution across the 153 authorities at Autumn 2025/26
    // (~p95/p85/p70 on both measures), not round numbers. OR, not AND: a
    // large authority can carry a big absolute in-scope cohort at an
    // unremarkable rate, and a small authority can carry an anomalous rate
    // at a modest headcount — requiring both would hide either kind of
    // problem.
    const riskDataAvailable = termHasReasonData(selectedTerm);
    const inScopeForRisk = cohortAtThreshold.tiers
      .filter((t) => t.tier.countsTowardYield && includeTiers.includes(t.tier.id))
      .reduce((sum, t) => sum + t.estimatedAtThreshold, 0);
    const rateRaw = termData?.ratePer100Published;
    const ratePer100ForRisk = !rateRaw || rateRaw === 'x' || rateRaw === 'low' ? 0 : parseDfENumber(rateRaw, 0);

    let risk_level: RiskLevel = 'Low';
    if (riskDataAvailable) {
      if (inScopeForRisk >= 200 || ratePer100ForRisk >= 1.2) {
        risk_level = 'Critical';
      } else if (inScopeForRisk >= 80 || ratePer100ForRisk >= 0.6) {
        risk_level = 'High';
      } else if (inScopeForRisk >= 30 || ratePer100ForRisk >= 0.4) {
        risk_level = 'Medium';
      }
    }
    // riskDataAvailable false only for a term with no published reason
    // breakdown, in which case risk_level stays 'Low' as an inert placeholder.
    // Every current consumer (StratosRiskMatrix, StratosFinancialTable,
    // StratosChartsSection, LADetailModal) already sits behind the same
    // reasonDataAvailable/termHasReasonData gate at its tab or component level
    // and shows the "Reason breakdown published from Autumn 2025/26 only"
    // message instead of rendering this field — riskDataAvailable is exposed
    // here too so a future direct consumer of LEACombined has the same signal
    // rather than needing to re-derive it.

    return {
      code: la.code,
      la_name: la.name,
      region: la.region,
      tier: la.tier,
      total_cme: totalCme,
      w1_8_count: w1_8,
      w8_12_count: w8_12,
      w12_plus: w12_plus,
      w12_plus_pct: Math.round(w12_plus_pct * 10) / 10,
      abroad,
      unknown,
      dispute,
      academic_year: selectedTerm,
      w8_12_value_calc: w8_12_val,
      w12_plus_value_calc: w12_plus_val,
      total_potential_calc: total_potential,
      target_cases_count: target_cases,
      avg_value_per_target_case: effectiveValuePerCase,
      avg_value_per_cme_case: Math.round(avg_value_per_cme),
      risk_level,
      riskDataAvailable,
    };
  });
}

/**
 * Compute National Aggregate for STRATOS Dashboard
 */
export function computeStratosNationalAggregate(
  combined: LEACombined[],
  selectedTerm: AcademicTerm,
  params: CalculatorParams
): StratosNationalAggregate {
  const totalLeas = combined.length;
  const totalCme = combined.reduce((acc, curr) => acc + curr.total_cme, 0);
  const totalW8_12 = combined.reduce((acc, curr) => acc + curr.w8_12_count, 0);
  const totalW12_plus = combined.reduce((acc, curr) => acc + curr.w12_plus, 0);
  // Sum the scoped per-authority estimate. Adding the published duration bands
  // here would silently reintroduce the all-reasons cohort the yield excludes.
  const totalTargetCases = combined.reduce((acc, curr) => acc + curr.target_cases_count, 0);

  const totalW8_12_value = combined.reduce((acc, curr) => acc + curr.w8_12_value_calc, 0);
  const totalW12_plus_value = combined.reduce((acc, curr) => acc + curr.w12_plus_value_calc, 0);
  const totalPotential = totalW8_12_value + totalW12_plus_value;

  const criticalCount = combined.filter((la) => la.risk_level === 'Critical').length;
  const highCount = combined.filter((la) => la.risk_level === 'High').length;
  const mediumCount = combined.filter((la) => la.risk_level === 'Medium').length;
  const lowCount = combined.filter((la) => la.risk_level === 'Low').length;

  return {
    academic_year: selectedTerm,
    total_leas: totalLeas,
    total_cme: totalCme,
    total_target_cases: totalTargetCases,
    total_w8_12_count: totalW8_12,
    total_w12_plus_count: totalW12_plus,
    total_w8_12_value: totalW8_12_value,
    total_w12_plus_value: totalW12_plus_value,
    total_projected_potential: totalPotential,
    avg_potential_per_lea: totalLeas > 0 ? Math.round(totalPotential / totalLeas) : 0,
    effective_value_per_opened_case: params.recoveryPerCase * params.strikeRate,
    critical_leas_count: criticalCount,
    high_leas_count: highCount,
    medium_leas_count: mediumCount,
    low_leas_count: lowCount,
  };
}

/**
 * Compute Regional Rollup for STRATOS Dashboard
 */
export function computeStratosRegionalRollup(
  combined: LEACombined[],
  regions: Region[] = ALL_REGIONS
): StratosRegionalRollup[] {
  return regions
    .filter((r) => r !== 'All England')
    .map((region) => {
      const inRegion = combined.filter((la) => la.region === region);
      const leaCount = inRegion.length;
      const totalCme = inRegion.reduce((acc, curr) => acc + curr.total_cme, 0);
      const w8_12 = inRegion.reduce((acc, curr) => acc + curr.w8_12_count, 0);
      const w12_plus = inRegion.reduce((acc, curr) => acc + curr.w12_plus, 0);
      // Scoped per-authority estimate, not the published duration bands.
      const targetCases = inRegion.reduce((acc, curr) => acc + curr.target_cases_count, 0);
      const totalPotential = inRegion.reduce((acc, curr) => acc + curr.total_potential_calc, 0);
      // Scoped band split, summed from the authorities. Deriving these from the
      // published duration counts would reintroduce the unscoped all-reasons yield.
      const w8_12Value = inRegion.reduce((acc, curr) => acc + curr.w8_12_value_calc, 0);
      const w12PlusValue = inRegion.reduce((acc, curr) => acc + curr.w12_plus_value_calc, 0);

      const criticalCount = inRegion.filter((la) => la.risk_level === 'Critical').length;
      const highCount = inRegion.filter((la) => la.risk_level === 'High').length;

      return {
        region,
        lea_count: leaCount,
        total_cme: totalCme,
        w8_12_count: w8_12,
        w12_plus_count: w12_plus,
        target_cases: targetCases,
        w8_12_value: w8_12Value,
        w12_plus_value: w12PlusValue,
        total_potential: totalPotential,
        avg_potential_per_lea: leaCount > 0 ? Math.round(totalPotential / leaCount) : 0,
        critical_count: criticalCount,
        high_count: highCount,
      };
    })
    // Ordered by published caseload, which does not move when the tier or
    // threshold controls change. Sorting by total_potential made the regional
    // bars reshuffle on every toggle, so nothing could be tracked across changes.
    .sort((a, b) => b.total_cme - a.total_cme);
}
