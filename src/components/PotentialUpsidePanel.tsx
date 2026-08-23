import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AcademicTerm, LocalAuthority, Region } from '../types';
import { computeUntraceableCount, formatUKNumber, formatUKCurrency } from '../data/cmeData';
import { ReasonDataUnavailable } from './ReasonDataUnavailable';

interface PotentialUpsidePanelProps {
  term: AcademicTerm;
  currentLA: LocalAuthority | null;
  region: Region;
  /** Read-only — this panel never writes back to calculator state. */
  recoveryPerCase: number;
  strikeRate: number;
}

/**
 * CLAUDE_CODE_BRIEF.md Stage 10 — "Potential upside" panel.
 *
 * Deliberately isolated: takes primitives, not the shared CalculatorParams
 * object or setter, and holds its own local slider state. There is no code
 * path from this component back into calculatorParams, the KPI cards, the
 * league table, the yield figure, or any export — the percentages here are
 * illustrative reader exploration only, never a finding.
 */
export const PotentialUpsidePanel: React.FC<PotentialUpsidePanelProps> = ({
  term,
  currentLA,
  region,
  recoveryPerCase,
  strikeRate,
}) => {
  const [pctA, setPctA] = useState(20);
  const [pctB, setPctB] = useState(50);

  const untraceable = computeUntraceableCount(term, { la: currentLA, region });
  const effectiveValue = recoveryPerCase * strikeRate;

  const project = (pct: number) => {
    const cases = Math.round((untraceable.count * pct) / 100);
    return { cases, value: Math.round(cases * effectiveValue) };
  };

  const rowA = project(pctA);
  const rowB = project(pctB);

  return (
    <div className="border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-3xl p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
          <AlertCircle className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-extrabold text-amber-900 font-display">
            Potential upside — not yet evidenced
          </h3>

          {!untraceable.available ? (
            <div className="mt-2">
              <ReasonDataUnavailable compact />
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-1.5 leading-relaxed">
                {formatUKNumber(untraceable.count)} children are recorded as Unknown or Not recorded: the local
                authority has no destination for them. An unknown proportion have left the country.
                {untraceable.suppressedCells > 0 && (
                  <span className="text-amber-700"> ({untraceable.suppressedCells} authorities report 'low' — not counted above.)</span>
                )}
              </p>

              <div className="mt-4 space-y-3.5">
                {[
                  { pct: pctA, setPct: setPctA, row: rowA, id: 'upside-slider-a' },
                  { pct: pctB, setPct: setPctB, row: rowB, id: 'upside-slider-b' },
                ].map(({ pct, setPct, row, id }) => (
                  <div key={id} className="bg-white/70 border border-amber-200 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-amber-950 font-medium flex-wrap gap-1">
                      <span>
                        If <span className="font-extrabold">{pct}%</span> are abroad → ~
                        <span className="font-extrabold">{formatUKNumber(row.cases)}</span> cases → ~
                        <span className="font-extrabold">{formatUKCurrency(row.value)}</span>
                      </span>
                    </div>
                    <input
                      id={id}
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={pct}
                      onChange={(e) => setPct(Number(e.target.value))}
                      className="w-full h-1.5 mt-2.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-[11px] text-amber-800/80 mt-3.5 leading-relaxed">
            Illustrative rates, not findings. A sample of worked cases is needed before any figure here can be
            relied upon.
          </p>
        </div>
      </div>
    </div>
  );
};
