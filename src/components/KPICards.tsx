import React from 'react';
import {
  Users,
  Clock,
  PoundSterling,
  AlertTriangle,
  Target,
  Sparkles,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { AggregatedStats, LocalAuthority, DurationBracket, CalculatorParams } from '../types';
import { formatUKNumber, formatUKCurrency, DURATION_CONFIG, computeSelectionYield, REASON_DATA_UNAVAILABLE_MESSAGE } from '../data/cmeData';
import { SCOPE_TIERS } from '../data/cmeScope';
import { EstimateMarker } from './stratos/EstimateMarker';

interface KPICardsProps {
  stats: AggregatedStats;
  currentLA: LocalAuthority | null;
  nationalStats: AggregatedStats;
  regionalStats?: AggregatedStats;
  showBenchmark: boolean;
  durationFilter?: DurationBracket;
  calculatorParams?: CalculatorParams;
  /** Authorities backing `stats` (the current LA/region/national selection). */
  authorities: LocalAuthority[];
}

export const KPICards: React.FC<KPICardsProps> = ({
  stats,
  currentLA,
  nationalStats,
  regionalStats,
  showBenchmark,
  durationFilter = 'all',
  calculatorParams = { recoveryPerCase: 2800, strikeRate: 0.75 } as CalculatorParams,
  authorities,
}) => {
  const isSuppressed = currentLA && currentLA.termsData[stats.term]?.totalCME === 'c';

  const w8_12 = stats.durationWeeks.weeks8To12;
  const w12p = stats.durationWeeks.weeks12Plus;
  const actionable8Plus = w8_12 + w12p;

  // Card 2: published duration count — not an estimate, and NOT gated by
  // reason-data availability (Duration is published for every term shown;
  // Reason is Autumn 2025/26 only). When the Duration Cohort filter narrows
  // to a specific published band, that band's own count takes over here,
  // independent of the Absence Threshold setting below (Financial Impact
  // tab) — the two are separate controls and shouldn't be conflated.
  const threshold = calculatorParams.durationThreshold ?? 8;
  let pastThreshold: number;
  let pastThresholdLabel: string;
  if (durationFilter === '8-12') {
    pastThreshold = w8_12;
    pastThresholdLabel = '8–12 weeks (DfE published)';
  } else if (durationFilter === '12+') {
    pastThreshold = w12p;
    pastThresholdLabel = '12+ weeks (DfE published)';
  } else {
    pastThreshold = threshold === 12 ? w12p : actionable8Plus;
    pastThresholdLabel = `${threshold}+ weeks (DfE published)`;
  }

  // Cards 3 & 4: tier-scoped estimate (Stage 4 method via cmeScope.ts — each
  // authority's own reason and duration breakdown scoped with
  // scopeCohort()/computeYield(), then summed). Replaces duration-band-count
  // * effectiveValPerCase, which priced every reason regardless of scope
  // tier. Unavailable when the term has no published reason breakdown
  // (Reason is published for Autumn 2025/26 only) — Duration-only card 2
  // above is unaffected by this gate.
  //
  // Scoped the same way as card 2: the Duration Cohort filter, when set to
  // a specific band, overrides the Absence Threshold for this estimate too.
  // The 8-12 band isn't a single scopeCohort() threshold, so it's derived
  // as (yield at 8+) minus (yield at 12+) — the same subtraction the
  // Duration Stack chart uses for its own 8-12 segment.
  const includeTierIds = calculatorParams.includeTiers ?? ['abroad'];
  const includedTierLabels = SCOPE_TIERS.filter((t) => includeTierIds.includes(t.id)).map((t) => t.label);
  const tierSubtitle = includedTierLabels.length ? includedTierLabels.join(' + ') : 'no tiers selected';

  const yieldAt8 = computeSelectionYield(authorities, stats.term, { ...calculatorParams, durationThreshold: 8 });
  const yieldAt12 = computeSelectionYield(authorities, stats.term, { ...calculatorParams, durationThreshold: 12 });

  let inScopeCases: number | null;
  let inScopeValue: number | null;
  let inScopeDurationLabel: string;
  if (durationFilter === '8-12') {
    inScopeCases = yieldAt8.available && yieldAt12.available ? Math.max(0, yieldAt8.cases - yieldAt12.cases) : null;
    inScopeValue = yieldAt8.available && yieldAt12.available ? Math.max(0, yieldAt8.value - yieldAt12.value) : null;
    inScopeDurationLabel = '8–12 weeks';
  } else if (durationFilter === '12+') {
    inScopeCases = yieldAt12.available ? yieldAt12.cases : null;
    inScopeValue = yieldAt12.available ? yieldAt12.value : null;
    inScopeDurationLabel = '12+ weeks';
  } else {
    const yieldAtActiveThreshold = threshold === 12 ? yieldAt12 : yieldAt8;
    inScopeCases = yieldAtActiveThreshold.available ? yieldAtActiveThreshold.cases : null;
    inScopeValue = yieldAtActiveThreshold.available ? yieldAtActiveThreshold.value : null;
    inScopeDurationLabel = `${threshold}+ weeks`;
  }

  // Percentages for visual progress bars — each narrower than the last, so
  // the row reads left to right as one narrowing story.
  const totalCMEPercent = Math.min(100, Math.max(15, Math.round((stats.totalCME / Math.max(nationalStats.totalCME, 1)) * 100)));
  const sharePastThreshold = stats.totalCME > 0 ? Math.round((pastThreshold / stats.totalCME) * 100) : 0;
  const shareInScope = pastThreshold > 0 && inScopeCases != null ? Math.round((inScopeCases / pastThreshold) * 100) : 0;

  const renderDelta = (delta: number | undefined, invert: boolean = false) => {
    if (delta === undefined || isNaN(delta)) {
      return <span className="text-xs font-bold text-slate-400 flex items-center mb-1">0.0% —</span>;
    }
    const isPositive = delta > 0;
    const isZero = delta === 0;

    if (isZero) {
      return <span className="text-xs font-bold text-slate-400 flex items-center mb-1">0.0% —</span>;
    }

    if (isPositive) {
      const color = invert ? 'text-indigo-600' : 'text-rose-500';
      return (
        <span className={`text-xs font-bold ${color} flex items-center mb-1`}>
          +{delta.toFixed(1)}% ↑
        </span>
      );
    }

    const color = invert ? 'text-slate-500' : 'text-emerald-500';
    return (
      <span className={`text-xs font-bold ${color} flex items-center mb-1`}>
        {delta.toFixed(1)}% ↓
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total CME Caseload */}
      <div 
        id="kpi-card-total-cme"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-[#FE5729]" />
              <span className="font-bold text-[#1C1C1C]">Total Active CME Caseload</span>
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            {isSuppressed ? (
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1C1C] leading-none" title="DfE Suppression (<5)">
                {'c* (<5)'}
              </span>
            ) : (
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1C1C1C] leading-none">
                {formatUKNumber(stats.totalCME)}
              </span>
            )}
            {renderDelta(stats.totalCMEDeltaPercent, false)}
          </div>
          <div className="mt-4 h-1.5 bg-[#F4F4F6] rounded-full overflow-hidden">
            <div className="bg-[#1C1C1C] h-full rounded-full transition-all" style={{ width: `${totalCMEPercent}%` }} />
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-neutral-700">
            {stats.laCount} {stats.laCount === 1 ? 'Authority' : 'Authorities'}
          </span>
          {showBenchmark && (
            <span className="text-xs sm:text-sm font-semibold text-neutral-600">
              Nat: {formatUKNumber(nationalStats.totalCME)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Past the Threshold — published duration count, not an estimate */}
      <div
        id="kpi-card-weeks-8-12"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#B91C1C]" />
              <span className="font-bold text-[#1C1C1C]">Past the Threshold</span>
            </span>
          </div>

          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#B91C1C] leading-none">
              {formatUKNumber(pastThreshold)}
            </span>
          </div>

          <div className="mt-4 h-1.5 bg-[#F4F4F6] rounded-full overflow-hidden">
            <div className="bg-[#B91C1C] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, sharePastThreshold))}%` }} />
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-neutral-700">
            {pastThresholdLabel}
          </span>
        </div>
      </div>

      {/* 3. In Scope (Estimated) — replaces the deleted SEN card */}
      <div
        id="kpi-card-in-scope"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-[#FE5729]" />
              <span className="font-bold text-[#1C1C1C]">In Scope (Estimated)</span>
            </span>
            <EstimateMarker />
          </div>

          <div className="flex items-end justify-between mt-2">
            {inScopeCases == null ? (
              <span className="text-lg font-semibold text-neutral-400" title={REASON_DATA_UNAVAILABLE_MESSAGE}>Not published</span>
            ) : (
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FE5729] leading-none">
                {formatUKNumber(inScopeCases)}
              </span>
            )}
          </div>

          <div className="mt-4 h-1.5 bg-[#F4F4F6] rounded-full overflow-hidden">
            <div className="bg-[#FE5729] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, shareInScope))}%` }} />
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-neutral-700 truncate" title={`${tierSubtitle}, ${inScopeDurationLabel}`}>
            {tierSubtitle}, {inScopeDurationLabel}
          </span>
        </div>
      </div>

      {/* 4. Estimated Value */}
      <div
        id="kpi-card-recovery-yield"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 mb-2">
            <span className="flex items-center space-x-1.5">
              <PoundSterling className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-[#1C1C1C]">Estimated Value</span>
            </span>
            <EstimateMarker />
          </div>

          <div className="flex items-end justify-between mt-2">
            {inScopeValue == null ? (
              <span className="text-lg font-semibold text-neutral-400" title={REASON_DATA_UNAVAILABLE_MESSAGE}>Not published</span>
            ) : (
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-emerald-700 leading-none">
                {formatUKCurrency(inScopeValue)}
              </span>
            )}
          </div>

          <div className="mt-4 h-1.5 bg-[#F4F4F6] rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, shareInScope))}%` }} />
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-neutral-700 truncate" title={tierSubtitle}>
            {tierSubtitle}
          </span>
        </div>
      </div>
    </div>
  );
};
