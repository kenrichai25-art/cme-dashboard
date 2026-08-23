/**
 * outcomeTracking.ts
 *
 * CLAUDE_CODE_BRIEF.md Stage 11 — per-authority, per-tier outcome counts:
 * how many of the estimated in-scope cases have actually been worked, and
 * how many of those confirmed a payment error. Not case data — only counts,
 * stored locally in the browser (localStorage). Turns the strike rate from
 * a single global assumption (DEFAULT_NATIONAL_STRIKE_RATE) into a measured
 * figure once an authority has sampled cases, tier by tier.
 *
 * This is display-only: nothing here is read by computeYield(),
 * computeSelectionYield(), the KPI cards, the league table, or any export.
 * calculatorParams.strikeRate remains the single input those calculations
 * use; realisedStrikeRate() below is a separate, informational figure shown
 * alongside it.
 */

import { ScopeTierId } from './cmeScope';

export interface OutcomeEntry {
  /** Cases actually worked by the authority for this tier. */
  worked: number;
  /** Of those, how many confirmed a Child Benefit payment error. */
  confirmed: number;
}

export type OutcomeStore = Record<string, OutcomeEntry>;

const STORAGE_KEY = 'cme-dashboard-outcome-tracking-v1';

function keyFor(laCode: string, tierId: ScopeTierId): string {
  return `${laCode}::${tierId}`;
}

export function loadOutcomeStore(): OutcomeStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Returns the updated store; caller is responsible for putting it in state. */
export function saveOutcomeEntry(
  store: OutcomeStore,
  laCode: string,
  tierId: ScopeTierId,
  entry: OutcomeEntry
): OutcomeStore {
  const next = { ...store, [keyFor(laCode, tierId)]: entry };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, quota) — keep in-memory only.
  }
  return next;
}

export function getOutcomeEntry(store: OutcomeStore, laCode: string, tierId: ScopeTierId): OutcomeEntry | null {
  return store[keyFor(laCode, tierId)] ?? null;
}

/**
 * National default strike rate, shown — and labelled as a default, not a
 * measurement — wherever no local outcome data exists yet. Matches
 * DEFAULT_CALCULATOR_PARAMS.strikeRate in stratosCalculations.ts; kept as
 * its own constant here so this file has no dependency on that one.
 */
export const DEFAULT_NATIONAL_STRIKE_RATE = 0.75;

export interface RealisedRate {
  /** False when falling back to the national default. */
  measured: boolean;
  rate: number;
  /** Cases worked backing this rate. 0 when using the default. */
  worked: number;
}

export function realisedStrikeRate(entry: OutcomeEntry | null): RealisedRate {
  if (!entry || entry.worked <= 0) {
    return { measured: false, rate: DEFAULT_NATIONAL_STRIKE_RATE, worked: 0 };
  }
  return { measured: true, rate: entry.confirmed / entry.worked, worked: entry.worked };
}
