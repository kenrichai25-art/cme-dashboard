/**
 * DfE Explore Education Statistics (EES) Live API Client & Synchronizer
 * Official endpoint: https://api.education.gov.uk/statistics/v1
 * Dataset ID: 019bb854-d8d5-707a-bc53-e0de9ac70891
 */

import { LocalAuthority } from '../types';
import { LOCAL_AUTHORITIES_DATA, TOTAL_AUTHORITIES_COUNT } from '../data/cmeData';

export interface DfeApiStatus {
  connected: boolean;
  endpoint: string;
  releaseVersion: string;
  lastUpdated: string;
  dataSource: 'DfE EES Official Data Store' | 'Local Representative Cache';
  statusCode: number;
  latencyMs: number;
  totalLAsSynchronised?: number;
  englandCoveragePercent?: number;
  lastSyncTimestamp?: string;
  lastSyncDate?: string;
  dfePublicationReleaseDate?: string;
  dfeDataVintagePeriod?: string;
  nextScheduledReleaseDate?: string;
  dataFreshnessStatus?: 'Live & Up to Date' | 'Recent Update' | 'Awaiting DfE Term Return';
  /** Which file the server actually read this provenance from. */
  provenanceSource?: 'dfe-provenance.json' | 'officialDfeData.json';
}

export const DFE_EES_CONFIG = {
  baseUrl: 'https://api.education.gov.uk/statistics/v1',
  datasetId: '019bb854-d8d5-707a-bc53-e0de9ac70891',
  publicationSlug: 'children-missing-education',
  officialDocumentationUrl: 'https://explore-education-statistics.service.gov.uk/find-statistics/children-missing-education',
  accreditedBadgeText: 'Official Statistics (Department for Education EES)',
  totalEnglandLAs: TOTAL_AUTHORITIES_COUNT,
  latestDfEReleaseDate: '29 January 2026',
  latestCensusPeriod: '2025/26 Autumn term (Official Publication)',
  nextReleaseDate: 'October 2026',
};

function formatIsoDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Splits an ISO timestamp into the short date/time strings the "Last
 *  Refreshed" card shows. Returns {} for a missing/unparseable input so
 *  the caller can fall back to something else rather than show "Invalid Date". */
function formatIsoDateTime(iso: string | null | undefined): { date?: string; time?: string } {
  if (!iso) return {};
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return {};
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Reports the status of this app's own server (the process running
 * server.ts), not a live probe of DfE's API. `connected: true` means this
 * server responded, not that a DfE sync has happened recently — that only
 * happens when someone actually triggers pullAllEnglandData().
 */
export async function testDfeApiConnection(): Promise<DfeApiStatus> {
  const startTime = performance.now();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  try {
    const res = await fetch('/api/dfe/status');
    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json();
      // Prefer the real version number from dfe-provenance.json when the
      // server found one; otherwise fall back to the dataset id, which is
      // always present.
      const releaseVersion = data.datasetVersion
        ? `v${data.datasetVersion}${data.totalRecords ? ` (${data.totalRecords.toLocaleString()} records)` : ''}`
        : data.datasetId
          ? `${data.datasetId}${data.totalRecords ? ` (${data.totalRecords.toLocaleString()} records)` : ''}`
          : 'Unknown';
      // "Last Refreshed" must show when the cached dataset was actually
      // retrieved, not the moment this status check happened to run —
      // fall back to that moment only if the server has no retrieval
      // timestamp at all.
      const synced = formatIsoDateTime(data.lastSynced);
      return {
        connected: true,
        endpoint: data.apiEndpoint || DFE_EES_CONFIG.baseUrl,
        releaseVersion,
        lastUpdated: data.lastSynced?.split('T')[0] || 'Unknown',
        dataSource: 'DfE EES Official Data Store',
        statusCode: res.status,
        latencyMs: latency,
        // No fallback here: if the server's cache failed to load, this is
        // genuinely 0, and it must show as 0, not the reassuring full count.
        totalLAsSynchronised: data.authoritiesCount ?? 0,
        englandCoveragePercent: Math.round(((data.authoritiesCount ?? 0) / TOTAL_AUTHORITIES_COUNT) * 100),
        lastSyncTimestamp: synced.time || timeStr,
        lastSyncDate: synced.date || dateStr,
        dfePublicationReleaseDate: formatIsoDate(data.lastPublished) || DFE_EES_CONFIG.latestDfEReleaseDate,
        dfeDataVintagePeriod: DFE_EES_CONFIG.latestCensusPeriod,
        nextScheduledReleaseDate: DFE_EES_CONFIG.nextReleaseDate,
        // Descriptive only — not computed from any actual staleness check.
        dataFreshnessStatus: 'Recent Update',
        provenanceSource: data.provenanceSource === 'dfe-provenance.json' ? 'dfe-provenance.json' : 'officialDfeData.json',
      };
    }
    return {
      connected: false,
      endpoint: DFE_EES_CONFIG.baseUrl,
      releaseVersion: 'Unavailable',
      lastUpdated: 'Unknown',
      dataSource: 'Local Representative Cache',
      statusCode: res.status,
      latencyMs: latency,
    };
  } catch (err) {
    console.warn('[DfE Client] Server status check failed:', err);
    return {
      connected: false,
      endpoint: DFE_EES_CONFIG.baseUrl,
      releaseVersion: 'Unavailable',
      lastUpdated: 'Unknown',
      dataSource: 'Local Representative Cache',
      statusCode: 0,
      latencyMs: Math.round(performance.now() - startTime),
    };
  }
}

export interface PullProgress {
  stage: 'initiating' | 'fetching_regions' | 'aggregating_authorities' | 'validating_disclosure' | 'complete';
  percentage: number;
  message: string;
  loadedCount: number;
  totalCount: number;
}

/**
 * Ask the server to re-fetch the DfE census CSV and rewrite its cached
 * dataset file. This is a genuine network call to api.education.gov.uk, not
 * simulated. But the dashboard's figures are built from that cached file at
 * app build time (see cmeData.ts's static import) — a successful fetch here
 * updates the file on the server, not what's currently rendered in this
 * browser tab. That only happens after the app is rebuilt and reloaded, so
 * progress messaging must not claim the dashboard itself has just updated.
 */
export async function pullAllEnglandData(
  onProgress?: (progress: PullProgress) => void
): Promise<{ data: LocalAuthority[]; status: DfeApiStatus; synced: boolean }> {
  onProgress?.({
    stage: 'initiating',
    percentage: 20,
    message: 'Requesting live release stream from DfE Explore Education Statistics API...',
    loadedCount: 0,
    totalCount: TOTAL_AUTHORITIES_COUNT,
  });

  let synced = false;
  try {
    const syncRes = await fetch('/api/dfe/sync', { method: 'POST' });
    onProgress?.({
      stage: 'fetching_regions',
      percentage: 60,
      message: `Requesting published census tables across all ${TOTAL_AUTHORITIES_COUNT} Local Authorities...`,
      loadedCount: 95,
      totalCount: TOTAL_AUTHORITIES_COUNT,
    });

    if (syncRes.ok) {
      const syncResult = await syncRes.json();
      console.log('[DfE Sync Result]', syncResult);
      synced = true;
    } else {
      const errBody = await syncRes.json().catch(() => null);
      console.warn('[DfE Client] Sync request failed:', errBody?.error || syncRes.statusText);
    }
  } catch (e) {
    console.warn('[DfE Client] Sync request failed:', e);
  }

  onProgress?.(
    synced
      ? {
          stage: 'complete',
          percentage: 100,
          message: 'Server cache updated from the live DfE dataset. Rebuild the app to load these figures into the dashboard.',
          loadedCount: TOTAL_AUTHORITIES_COUNT,
          totalCount: TOTAL_AUTHORITIES_COUNT,
        }
      : {
          stage: 'complete',
          percentage: 100,
          message: 'Could not reach the DfE API — the dashboard is still showing its existing cached dataset.',
          loadedCount: 0,
          totalCount: TOTAL_AUTHORITIES_COUNT,
        }
  );

  const status = await testDfeApiConnection();
  return {
    data: LOCAL_AUTHORITIES_DATA,
    status,
    synced,
  };
}

export function buildDfeApiSnippet(laCode?: string, term?: string): string {
  const datasetId = DFE_EES_CONFIG.datasetId;
  return `curl -X GET "https://api.education.gov.uk/statistics/v1/data-sets/${datasetId}/csv" \\
  -H "Accept: text/csv" \\
  -H "User-Agent: STRATOS-CME-Analytics/1.0"`;
}

export async function fetchCensusData(academicYear?: string, localAuthorityCode?: string) {
  try {
    const res = await fetch('/api/dfe/data');
    if (res.ok) {
      const full = await res.json();
      if (localAuthorityCode) {
        return full.localAuthorities.find((la: any) => la.code === localAuthorityCode);
      }
      return full;
    }
  } catch (e) {
    console.warn('[DfE Client] Falling back to pre-bundled official data:', e);
  }
  return LOCAL_AUTHORITIES_DATA;
}
