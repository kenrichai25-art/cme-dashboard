import React from 'react';
import { CalculatorParams } from '../types';
import { SCOPE_TIER_COLORS } from '../data/cmeData';
import { SCOPE_TIERS, ScopeTierId } from '../data/cmeScope';

// The three tiers that can carry yield. Not in scope is excluded by
// definition — it never counts toward any estimate, so there's nothing to
// toggle.
const YIELD_TIERS = SCOPE_TIERS.filter((t) => t.countsTowardYield);

interface ScopeTierToggleProps {
  calculatorParams: CalculatorParams;
  onChangeCalculatorParams: (params: CalculatorParams) => void;
}

/**
 * Persistent, header-level control for which scope tiers count toward every
 * £ estimate across the whole app — KPI cards, charts, the LA table, and the
 * Financial Impact calculator all read the same calculatorParams.includeTiers,
 * so toggling here updates all of them at once rather than needing the same
 * three checkboxes set separately on each tab.
 *
 * Deliberately multi-select (a pill can be on independently of the others),
 * not the single-select radio pattern of the "Tier" reference this was
 * modelled on — scope tiers are meant to be combined, not chosen between.
 */
export const ScopeTierToggle: React.FC<ScopeTierToggleProps> = ({
  calculatorParams,
  onChangeCalculatorParams,
}) => {
  const includeTiers = calculatorParams.includeTiers ?? ['abroad'];

  const toggleTier = (id: ScopeTierId) => {
    const next = includeTiers.includes(id)
      ? includeTiers.filter((t) => t !== id)
      : [...includeTiers, id];
    onChangeCalculatorParams({ ...calculatorParams, includeTiers: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
        Scope:
      </span>
      <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F4F6] p-1.5 rounded-full border border-neutral-200/80">
        {YIELD_TIERS.map((tier) => {
          const active = includeTiers.includes(tier.id);
          const color = SCOPE_TIER_COLORS[tier.id];
          return (
            <button
              key={tier.id}
              type="button"
              id={`scope-tier-toggle-${tier.id}`}
              onClick={() => toggleTier(tier.id)}
              aria-pressed={active}
              title={tier.rationale}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                active
                  ? 'text-white border-transparent shadow-xs'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-700'
              }`}
              style={active ? { backgroundColor: color } : undefined}
            >
              {tier.label}
              {tier.id === 'untraceable' && (
                <span className={`ml-1 font-medium ${active ? 'text-white/80' : 'text-neutral-400'}`}>
                  (rate unknown)
                </span>
              )}
            </button>
          );
        })}
      </div>
      {includeTiers.length === 0 && (
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
          No tiers selected — every £ estimate reads £0
        </span>
      )}
    </div>
  );
};
