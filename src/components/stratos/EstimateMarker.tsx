import React from 'react';
import { ESTIMATE_METHOD } from '../../data/cmeScope';

/**
 * Visible marker for any figure that combines a reason with a duration.
 *
 * DfE publish reason and duration as separate breakdowns and do not
 * cross-tabulate them, so every such figure is an estimate. The marker sits on
 * the figure itself, not in a tooltip; ESTIMATE_METHOD is exposed on hover.
 */
export const EstimateMarker: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title={ESTIMATE_METHOD}
    className={`inline-flex items-center px-1.5 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[9px] font-bold uppercase tracking-wide cursor-help align-middle ${className}`}
  >
    Est
  </span>
);
