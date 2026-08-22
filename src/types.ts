import type { ScopeTierId, DurationThreshold } from './data/cmeScope';

export type Region =
  | 'All England'
  | 'North East'
  | 'North West'
  | 'Yorkshire and The Humber'
  | 'East Midlands'
  | 'West Midlands'
  | 'East of England'
  | 'Inner London'
  | 'Outer London'
  | 'South East'
  | 'South West';

export type AcademicTerm =
  | '2025/26 Autumn'
  | '2024/25 Summer'
  | '2024/25 Spring'
  | '2024/25 Autumn';

export type OfficialDfeReason =
  | 'Believed to have moved to another country'
  | 'Believed to have moved to another local authority'
  | 'Challenging school attendance order'
  | 'Did not apply for school place at compulsory school age'
  | 'Did not get school preference'
  | 'Difficulty accessing suitable school place'
  | 'Mental health'
  | 'Moved in from another country'
  | 'Moved in from another local authority'
  | 'Not recorded'
  | 'Offered school place but not yet accepted'
  | 'Other'
  | 'Parental decision not to register at school'
  | 'Physical health'
  | 'School application awaiting outcome'
  | 'School dissatisfaction SEND'
  | 'School dissatisfaction general'
  | 'Unknown'
  | 'Unsuitable elective home education'
  | 'Waiting school start';

export type OfficialDfeDuration =
  | 'Less than 2 weeks'
  | '2 to 4 weeks'
  | '4 to 8 weeks'
  | '8 to 12 weeks'
  | '12 to 26 weeks'
  | '26 to 52 weeks'
  | 'Over 52 weeks'
  | 'Unknown';

export type DurationBracket = 'all' | '1-8' | '8-12' | '12+';

export interface AgeCohortBreakdown {
  primaryKS1_KS2: number; // Compulsory primary (age 5-11)
  secondaryKS3_KS4: number; // Compulsory secondary (age 11-16)
  unknownAge: number;
}

export interface DurationBreakdown {
  weeks1To8: number | 'c'; // 1 to 8 weeks (Less than 2w + 2-4w + 4-8w)
  weeks8To12: number | 'c'; // 8 to 12 weeks
  weeks12Plus: number | 'c'; // 12+ weeks (12-26w + 26-52w + Over 52w)
  rawLess2Weeks?: number | string;
  raw2To4Weeks?: number | string;
  raw4To8Weeks?: number | string;
  raw8To12Weeks?: number | string;
  raw12To26Weeks?: number | string;
  raw26To52Weeks?: number | string;
  rawOver52Weeks?: number | string;
  rawUnknown?: number | string;
}

export interface TermDataPoint {
  term: AcademicTerm;
  totalCME: number | 'c'; // 'c' is DfE confidential/suppressed <5
  totalRaw?: string; // verbatim DfE string (e.g. '30', 'low', 'x')
  compulsoryPupils: number;
  ratePer1000: number | 'c';
  ratePer100Published?: string; // e.g. '0.4000000' or 'x'
  longTermMissingCount: number | 'c'; // > 12 weeks
  longTermMissingPercent: number; // calculated % of CME
  durationWeeks: DurationBreakdown;
  senSupportCount: number | 'c';
  ehcpCount: number | 'c';
  senProportionPercent: number; // % of CME with identified SEN/EHCP
  officialReasons?: Record<string, { count: string | number; percent: string | number }>;
  officialDurations?: Record<string, { count: string | number; percent: string | number }>;
  officialSex?: Record<string, { count: string | number; percent: string | number }>;
  officialYearGroups?: Record<string, { count: string | number; percent: string | number }>;
  ageCohorts: AgeCohortBreakdown;
}

export interface LocalAuthority {
  code: string; // ONS code (e.g. E08000035)
  name: string;
  region: Region;
  tier: 'Metropolitan District' | 'London Borough' | 'Unitary Authority' | 'County Council';
  termsData: Record<AcademicTerm, TermDataPoint>;
  contactDepartment?: string;
  dfeRegionLead?: string;
}

export interface AggregatedStats {
  term: AcademicTerm;
  selectedLabel: string;
  totalCME: number;
  totalPupils: number;
  ratePer1000: number;
  longTermMissingCount: number;
  longTermMissingPercent: number;
  durationWeeks: {
    weeks1To8: number;
    weeks8To12: number;
    weeks12Plus: number;
  };
  senProportionPercent: number;
  ageCohorts: AgeCohortBreakdown;
  laCount: number;
  // Deltas against previous available term
  prevTerm?: AcademicTerm;
  totalCMEDeltaPercent?: number;
  ratePer1000DeltaPercent?: number;
  longTermPercentDelta?: number;
  senPercentDelta?: number;
}

export interface FilterState {
  selectedRegion: Region;
  selectedLACode: string | null; // null for National or Regional aggregate
  selectedTerm: AcademicTerm;
  durationFilter: DurationBracket; // 'all' | '1-8' | '8-12' | '12+'
  compareBenchmark: boolean;
  benchmarkType: 'national' | 'regional';
  searchQuery: string;
  excludeSEN?: boolean; // Exclude SEN/EHCP pupils from DfE Intelligence views
}

export interface TableColumnSort {
  field: 
    | 'name' 
    | 'code' 
    | 'region' 
    | 'totalCME' 
    | 'targetCases8Plus'
    | 'recoveryYield'
    | 'weeks1To8' 
    | 'weeks8To12' 
    | 'weeks12Plus' 
    | 'longTermMissingPercent' 
    | 'senProportionPercent';
  direction: 'asc' | 'desc';
}

// ==========================================
// STRATOS Child Benefit Compliance & Recovery Types
// ==========================================

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type StratosCohortMode = 'all' | 'exclude-sen';

export interface CalculatorParams {
  recoveryPerCase: number; // e.g. 2800 (Range: 1000 to 6000)
  strikeRate: number;      // e.g. 0.75 (Range: 0.10 to 1.00)
  cohortMode?: StratosCohortMode; // Target cohort filter (All, Exclude SEN)
  /** Scope tiers counted toward yield. Defaults to abroad only. */
  includeTiers?: ScopeTierId[];
  /** Duration threshold in weeks for the Child Benefit absence rule. */
  durationThreshold?: DurationThreshold;
}

export interface LEARawData {
  la_name: string;
  region: string;
  total_cme: number;
  w12_plus: number;
  w12_plus_pct: number;
  abroad: number;
  unknown: number;
  academic_year?: string;
}

export interface LEAFinancialRawData {
  la_name: string;
  w8_12_count: number;
  w12_plus_count: number;
  w12_plus_value: number;
  total_potential: number;
  academic_year?: string;
}

export interface LEACombined {
  code: string;
  la_name: string;
  region: Region;
  tier: string;
  total_cme: number;
  compulsory_pupils: number;
  cme_rate_per_1000: number;
  w1_8_count: number;
  w8_12_count: number;
  w12_plus: number;
  w12_plus_pct: number;
  abroad: number;
  unknown: number;
  dispute: number;
  academic_year: string;
  // Dynamically calculated properties via STRATOS Model:
  w8_12_value_calc: number;
  w12_plus_value_calc: number;
  total_potential_calc: number;
  target_cases_count: number;
  avg_value_per_target_case: number;
  avg_value_per_cme_case: number;
  risk_level: RiskLevel;
}

export interface StratosNationalAggregate {
  academic_year: string;
  total_leas: number;
  total_cme: number;
  total_target_cases: number; // 8-12w + 12+w
  total_w8_12_count: number;
  total_w12_plus_count: number;
  total_w8_12_value: number;
  total_w12_plus_value: number;
  total_projected_potential: number;
  avg_potential_per_lea: number;
  effective_value_per_opened_case: number;
  critical_leas_count: number;
  high_leas_count: number;
  medium_leas_count: number;
  low_leas_count: number;
}

export interface StratosRegionalRollup {
  region: Region;
  lea_count: number;
  total_cme: number;
  w8_12_count: number;
  w12_plus_count: number;
  target_cases: number;
  total_potential: number;
  avg_potential_per_lea: number;
  critical_count: number;
  high_count: number;
}

export type MainDashboardTab = 
  | 'executive-overview'
  | 'dfe-intelligence'
  | 'la-explorer'
  | 'stratos-recovery'
  | 'risk-matrix'
  | 'compliance-guide'
  | 'data-bridge'
  | 'help-guide';

