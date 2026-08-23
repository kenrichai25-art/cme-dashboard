import React from 'react';
import { Info } from 'lucide-react';
import { REASON_DATA_UNAVAILABLE_MESSAGE } from '../data/cmeData';

/**
 * Shown wherever a panel would otherwise render reason-derived figures (scope
 * tiers, yield, risk classification) for a term that has no published reason
 * breakdown. Duration-only content is never gated by this — it stays visible
 * for every term from 2024/25 onward.
 */
export const ReasonDataUnavailable: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-neutral-500 ${className}`}>
        <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        {REASON_DATA_UNAVAILABLE_MESSAGE}
      </span>
    );
  }
  return (
    <div
      className={`flex items-center gap-2.5 text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-2xl p-6 ${className}`}
    >
      <Info className="w-5 h-5 text-neutral-400 shrink-0" />
      <span>{REASON_DATA_UNAVAILABLE_MESSAGE}</span>
    </div>
  );
};
