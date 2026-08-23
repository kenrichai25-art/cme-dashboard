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
  const w1_8 = stats.durationWeeks.weeks1To8;
  const actionable8Plus = w8_12 + w12p;

  // Scoped yield (Stage 4 method via cmeScope.ts), band-split the same way
  // stratosCalculations.ts does: yield at the active threshold, and yield at
  // 12 weeks specifically, so the 8-12 band is the difference between them.
  // Replaces duration-band-count * effectiveValPerCase, which priced every
  // reason regardless of scope tier. null when the term has no published
  // reason breakdown (Reason is published for Autumn 2025/26 only).
  const yieldAtActiveThreshold = computeSelectionYield(authorities, stats.term, calculatorParams);
  const yieldAt12 = computeSelectionYield(authorities, stats.term, {
    ...calculatorParams,
    durationThreshold: 12,
  });
  const yieldDataAvailable = yieldAtActiveThreshold.available && yieldAt12.available;
  const totalYield8Plus = yieldDataAvailable ? yieldAtActiveThreshold.value : null;
  const yield12p = yieldDataAvailable ? yieldAt12.value : null;
  const yield8_12 = yieldDataAvailable ? Math.max(0, yieldAtActiveThreshold.value - yieldAt12.value) : null;

  // Percentages for visual progress bars
  const totalCMEPercent = Math.min(100, Math.max(15, Math.round((stats.totalCME / Math.max(nationalStats.totalCME, 1)) * 100)));
  const share8_12 = stats.totalCME > 0 ? Math.round((w8_12 / stats.totalCME) * 100) : 0;
  const share12p = stats.totalCME > 0 ? Math.round((w12p / stats.totalCME) * 100) : 0;
  const share8Plus = stats.totalCME > 0 ? Math.round((actionable8Plus / stats.totalCME) * 100) : 0;

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

      {/* 2. Target 8-12 Weeks */}
      <div 
        id="kpi-card-weeks-8-12"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="text-sm font-semibold text-neutral-600 mb-2">
            Target 8-12 Weeks
          </div>

          <div className="mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#B91C1C] leading-none block">
              {yield8_12 == null ? (
                <span className="text-lg font-semibold text-neutral-400" title={REASON_DATA_UNAVAILABLE_MESSAGE}>Not published</span>
              ) : (
                formatUKCurrency(yield8_12)
              )}
            </span>
          </div>

          <div className="mt-4 h-1.5 bg-rose-100/60 rounded-full overflow-hidden">
            <div className="bg-[#FF3366] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, share8_12 * 2.5))}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-neutral-600 tracking-tight">
            {formatUKNumber(w8_12)}
          </span>
          <span className="text-base font-normal text-neutral-500 ml-1.5">
            Cases
          </span>
        </div>
      </div>

      {/* 3. Target 12+ Weeks */}
      <div 
        id="kpi-card-weeks-12-plus"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="text-sm font-semibold text-neutral-600 mb-2">
            Target 12+ Weeks
          </div>

          <div className="mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#B91C1C] leading-none block">
              {yield12p == null ? (
                <span className="text-lg font-semibold text-neutral-400" title={REASON_DATA_UNAVAILABLE_MESSAGE}>Not published</span>
              ) : (
                formatUKCurrency(yield12p)
              )}
            </span>
          </div>

          <div className="mt-4 h-1.5 bg-rose-100/60 rounded-full overflow-hidden">
            <div className="bg-[#FF3366] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, share12p * 2))}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-neutral-600 tracking-tight">
            {formatUKNumber(w12p)}
          </span>
          <span className="text-base font-normal text-neutral-500 ml-1.5">
            Cases
          </span>
        </div>
      </div>

      {/* 4. Actionable 8+ Weeks Total Recovery Value / Yield */}
      <div 
        id="kpi-card-recovery-yield"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-300 shadow-sm flex flex-col justify-between min-h-[175px]"
      >
        <div>
          <div className="text-sm font-semibold text-neutral-600 mb-2">
            Actionable 8+ Weeks
          </div>

          <div className="mt-1">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FE5729] leading-none block">
              {totalYield8Plus == null ? (
                <span className="text-lg font-semibold text-neutral-400" title={REASON_DATA_UNAVAILABLE_MESSAGE}>Not published</span>
              ) : (
                formatUKCurrency(totalYield8Plus)
              )}
            </span>
          </div>

          <div className="mt-4 h-1.5 bg-orange-100/60 rounded-full overflow-hidden">
            <div className="bg-[#FE5729] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(12, share8Plus))}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-neutral-600 tracking-tight">
            {formatUKNumber(actionable8Plus)}
          </span>
          <span className="text-base font-normal text-neutral-500 ml-1.5">
            Cases
          </span>
        </div>
      </div>
    </div>
  );
};
