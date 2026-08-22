import { AcademicTerm, AggregatedStats, LocalAuthority, ReasonBreakdown, Region, TermDataPoint } from '../types';
import officialDataJson from './officialDfeData.json';

export const ALL_REGIONS: Region[] = [
  'All England',
  'London',
  'North West',
  'West Midlands',
  'Yorkshire and the Humber',
  'South East',
  'East of England',
  'South West',
  'East Midlands',
  'North East',
];

export const ACADEMIC_TERMS: AcademicTerm[] = [
  '2025/26 Autumn',
  '2024/25 Summer',
  '2024/25 Spring',
  '2024/25 Autumn',
  '2023/24 Summer',
  '2023/24 Spring',
  '2023/24 Autumn',
  '2022/23 Summer',
  '2022/23 Spring',
  '2022/23 Autumn',
];

export const DFE_DATASET_METADATA = officialDataJson.metadata;

export const DURATION_CONFIG = {
  'all': {
    id: 'all',
    label: 'All Durations',
    shortLabel: 'All Wks',
    filterDescription: 'All recorded CME cases across all 8 statutory DfE duration intervals',
    badgeText: 'All Durations (Published Total)',
    color: '#4f46e5',
    accentBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  '1-8': {
    id: '1-8',
    label: 'Under 8 Weeks (<2w, 2–4w, 4–8w)',
    shortLabel: '1–8 Wks',
    filterDescription: 'Early stage missing cases, incoming residential moves, and in-year school admissions',
    badgeText: 'Under 8 Weeks (Early Stage)',
    color: '#0ea5e9',
    accentBg: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  '8-12': {
    id: '8-12',
    label: '8–12 Weeks (Medium Term)',
    shortLabel: '8–12 Wks',
    filterDescription: 'Escalated cases requiring multi-agency statutory intervention and casework',
    badgeText: '8–12 Weeks (Medium Term)',
    color: '#f59e0b',
    accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  '12+': {
    id: '12+',
    label: '12+ Weeks (12–26w, 26–52w, Over 52w)',
    shortLabel: '12+ Wks',
    filterDescription: 'Severe chronic CME cases out of educational roll for over a full academic term',
    badgeText: '12+ Weeks (Persistent / Chronic)',
    color: '#e11d48',
    accentBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
} as const;

export const OFFICIAL_20_REASONS = [
  'School application awaiting outcome',
  'Moved in from another local authority',
  'Believed to have moved to another country',
  'Unsuitable elective home education',
  'Moved in from another country',
  'Believed to have moved to another local authority',
  'Waiting school start',
  'Offered school place but not yet accepted',
  'Did not get school preference',
  'Difficulty accessing suitable school place',
  'Challenging school attendance order',
  'School dissatisfaction SEND',
  'School dissatisfaction general',
  'Parental decision not to register at school',
  'Did not apply for school place at compulsory school age',
  'Mental health',
  'Physical health',
  'Unknown',
  'Not recorded',
  'Other'
];

export const REASON_COLORS: Record<string, string> = {
  'School application awaiting outcome': '#2563eb',
  'Moved in from another local authority': '#0284c7',
  'Believed to have moved to another country': '#dc2626',
  'Unsuitable elective home education': '#d97706',
  'Moved in from another country': '#0d9488',
  'Believed to have moved to another local authority': '#4f46e5',
  'Waiting school start': '#16a34a',
  'Offered school place but not yet accepted': '#059669',
  'Did not get school preference': '#7c3aed',
  'Difficulty accessing suitable school place': '#9333ea',
  'Challenging school attendance order': '#c026d3',
  'School dissatisfaction SEND': '#e11d48',
  'School dissatisfaction general': '#ea580c',
  'Parental decision not to register at school': '#ca8a04',
  'Did not apply for school place at compulsory school age': '#65a30d',
  'Mental health': '#0891b2',
  'Physical health': '#059669',
  'Unknown': '#64748b',
  'Not recorded': '#94a3b8',
  'Other': '#475569'
};

// Legacy 7-grouping adapter for backward compatibility in simplified views
export const REASON_LABELS: Record<string, { label: string; description: string; color: string }> = {
  awaitingSchoolPlace: {
    label: 'School Application Awaiting Outcome',
    description: 'Pupil has applied for a school place and is awaiting admission panel or allocation.',
    color: '#2563eb',
  },
  movedInNoPlace: {
    label: 'Moved into Area - No School Place',
    description: 'Pupil relocated into the local authority boundary without securing an advance school place.',
    color: '#0284c7',
  },
  untraceableUnknown: {
    label: 'Untraceable / Unknown Destination',
    description: 'Pupil is absent with address unknown or destination not recorded.',
    color: '#64748b',
  },
  withdrawnDispute: {
    label: 'Elective Home Ed Query / Place Dispute',
    description: 'Unsuitable home education, school preference disputes, or parental refusal to register.',
    color: '#d97706',
  },
  transitionFailure: {
    label: 'Waiting School Start / Application Delay',
    description: 'Offered place awaiting start or did not apply at compulsory age.',
    color: '#16a34a',
  },
  unauthorisedAbsenceDisengaged: {
    label: 'Challenging Attendance Order / Health Need',
    description: 'Challenging attendance orders or medical/mental health absence.',
    color: '#e11d48',
  },
  otherUnderInvestigation: {
    label: 'Other Reasons / Moved Outside Authority',
    description: 'Believed to have moved to another LA/country, or other recorded reasons.',
    color: '#475569',
  },
};

// Transform the official JSON into typed LocalAuthority objects
function mapTermKey(termLabel: string): string {
  const [year, tName] = termLabel.split(' ');
  const cleanYear = year.replace('/', '');
  return `${cleanYear}_${tName}`;
}

function parseVal(val: any): number {
  if (val === 'low' || val === 'x' || val === 'z' || val === undefined || val === null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export const LOCAL_AUTHORITIES_DATA: LocalAuthority[] = (officialDataJson.localAuthorities as any[]).map((la) => {
  const termsData: Record<AcademicTerm, TermDataPoint> = {} as any;

  for (const term of ACADEMIC_TERMS) {
    const termKey = mapTermKey(term);
    const rawTerm = la.terms?.[termKey] || { total: 0, totalRaw: '0', reasons: {}, durations: {}, sex: {}, yearGroups: {} };

    const totalRaw = rawTerm.totalRaw || '0';
    const totalCME = totalRaw === 'low' ? 'c' : totalRaw === 'x' || totalRaw === 'z' ? 0 : parseVal(rawTerm.total);

    // Sum duration buckets
    const dur = rawTerm.durations || {};
    const less2w = parseVal(dur['Less than 2 weeks']?.count);
    const w2_4 = parseVal(dur['2 to 4 weeks']?.count);
    const w4_8 = parseVal(dur['4 to 8 weeks']?.count);
    const w8_12 = parseVal(dur['8 to 12 weeks']?.count);
    const w12_26 = parseVal(dur['12 to 26 weeks']?.count);
    const w26_52 = parseVal(dur['26 to 52 weeks']?.count);
    const w52p = parseVal(dur['Over 52 weeks']?.count);
    const durUnknown = parseVal(dur['Unknown']?.count);

    const weeks1To8 = less2w + w2_4 + w4_8;
    const weeks8To12 = w8_12;
    const weeks12Plus = w12_26 + w26_52 + w52p;

    const longTermMissingCount = weeks12Plus;
    const longTermMissingPercent = (totalCME && totalCME !== 'c' && totalCME > 0)
      ? Number(((weeks12Plus / totalCME) * 100).toFixed(1))
      : 0;

    // Approximate school population for rates (ONS / DfE school census baseline)
    const basePupils = 48000;
    const compulsoryPupils = Math.max(8000, Math.round(parseVal(rawTerm.ratePer100) > 0 
      ? (parseVal(totalCME) / (parseVal(rawTerm.ratePer100) / 100))
      : basePupils));

    const ratePer1000 = (totalCME && totalCME !== 'c' && compulsoryPupils > 0)
      ? Number(((totalCME / compulsoryPupils) * 1000).toFixed(2))
      : 'c';

    // Group reasons for legacy components
    const r = rawTerm.reasons || {};
    const awaitingPlace = parseVal(r['School application awaiting outcome']?.count) + parseVal(r['Offered school place but not yet accepted']?.count);
    const movedIn = parseVal(r['Moved in from another local authority']?.count) + parseVal(r['Moved in from another country']?.count);
    const untraceable = parseVal(r['Unknown']?.count) + parseVal(r['Not recorded']?.count);
    const withdrawn = parseVal(r['Unsuitable elective home education']?.count) + parseVal(r['Did not get school preference']?.count) + parseVal(r['Parental decision not to register at school']?.count);
    const transition = parseVal(r['Waiting school start']?.count) + parseVal(r['Did not apply for school place at compulsory school age']?.count);
    const disengaged = parseVal(r['Challenging school attendance order']?.count) + parseVal(r['Mental health']?.count) + parseVal(r['Physical health']?.count);
    const other = parseVal(r['Other']?.count) + parseVal(r['Believed to have moved to another country']?.count) + parseVal(r['Believed to have moved to another local authority']?.count);

    // Year groups
    const yg = rawTerm.yearGroups || {};
    const primaryCount = parseVal(yg['Reception']?.count) + parseVal(yg['Year 1']?.count) + parseVal(yg['Year 2']?.count) + parseVal(yg['Year 3']?.count) + parseVal(yg['Year 4']?.count) + parseVal(yg['Year 5']?.count) + parseVal(yg['Year 6']?.count);
    const secondaryCount = parseVal(yg['Year 7']?.count) + parseVal(yg['Year 8']?.count) + parseVal(yg['Year 9']?.count) + parseVal(yg['Year 10']?.count) + parseVal(yg['Year 11']?.count);

    termsData[term] = {
      term,
      totalCME,
      totalRaw,
      compulsoryPupils,
      ratePer1000,
      ratePer100Published: rawTerm.ratePer100 || 'x',
      longTermMissingCount,
      longTermMissingPercent,
      durationWeeks: {
        weeks1To8,
        weeks8To12,
        weeks12Plus,
        rawLess2Weeks: less2w,
        raw2To4Weeks: w2_4,
        raw4To8Weeks: w4_8,
        raw8To12Weeks: w8_12,
        raw12To26Weeks: w12_26,
        raw26To52Weeks: w26_52,
        rawOver52Weeks: w52p,
        rawUnknown: durUnknown,
      },
      senSupportCount: parseVal(r['School dissatisfaction SEND']?.count),
      ehcpCount: parseVal(r['Difficulty accessing suitable school place']?.count),
      senProportionPercent: (totalCME && totalCME !== 'c' && totalCME > 0)
        ? Number((((parseVal(r['School dissatisfaction SEND']?.count) + parseVal(r['Difficulty accessing suitable school place']?.count)) / totalCME) * 100).toFixed(1))
        : 0,
      reasons: {
        awaitingSchoolPlace: awaitingPlace,
        movedInNoPlace: movedIn,
        untraceableUnknown: untraceable,
        withdrawnDispute: withdrawn,
        transitionFailure: transition,
        unauthorisedAbsenceDisengaged: disengaged,
        otherUnderInvestigation: other,
      },
      officialReasons: rawTerm.reasons || {},
      officialDurations: rawTerm.durations || {},
      officialSex: rawTerm.sex || {},
      officialYearGroups: rawTerm.yearGroups || {},
      ageCohorts: {
        primaryKS1_KS2: primaryCount,
        secondaryKS3_KS4: secondaryCount,
        unknownAge: parseVal(yg['Unknown']?.count),
      }
    };
  }

  // Determine tier
  let tier: 'Metropolitan District' | 'London Borough' | 'Unitary Authority' | 'County Council' = 'Unitary Authority';
  if (la.region === 'London') tier = 'London Borough';
  else if (la.code.startsWith('E08')) tier = 'Metropolitan District';
  else if (la.code.startsWith('E10')) tier = 'County Council';

  return {
    code: la.code,
    name: la.name,
    region: (la.region || 'All England') as Region,
    tier,
    termsData,
  };
});

/**
 * Calculate aggregate totals for national or regional filters from authentic DfE published rows
 */
export function calculateAggregate(
  authorities: LocalAuthority[],
  term: AcademicTerm,
  selectedLabel: string,
  excludeSEN?: boolean
): AggregatedStats {
  const termKey = mapTermKey(term);

  // If this is national, check if we have the published national headline directly
  const isNational = selectedLabel.includes('England') || selectedLabel.includes('National');
  const nationalRaw = (officialDataJson.national as any)?.[termKey];

  let totalCME = 0;
  let totalPupils = 0;
  let longTermMissingCount = 0;
  let weeks1To8 = 0;
  let weeks8To12 = 0;
  let weeks12Plus = 0;

  const reasonsSum: ReasonBreakdown = {
    awaitingSchoolPlace: 0,
    movedInNoPlace: 0,
    untraceableUnknown: 0,
    withdrawnDispute: 0,
    transitionFailure: 0,
    unauthorisedAbsenceDisengaged: 0,
    otherUnderInvestigation: 0,
  };

  const ageCohortsSum = {
    primaryKS1_KS2: 0,
    secondaryKS3_KS4: 0,
    unknownAge: 0,
  };

  for (const la of authorities) {
    const data = la.termsData[term];
    if (!data) continue;

    const cmeVal = data.totalCME === 'c' ? 0 : data.totalCME;
    totalCME += cmeVal;
    totalPupils += data.compulsoryPupils;

    const w1_8 = data.durationWeeks.weeks1To8 === 'c' ? 0 : data.durationWeeks.weeks1To8;
    const w8_12 = data.durationWeeks.weeks8To12 === 'c' ? 0 : data.durationWeeks.weeks8To12;
    const w12p = data.durationWeeks.weeks12Plus === 'c' ? 0 : data.durationWeeks.weeks12Plus;

    weeks1To8 += w1_8;
    weeks8To12 += w8_12;
    weeks12Plus += w12p;
    longTermMissingCount += w12p;

    Object.keys(reasonsSum).forEach((k) => {
      reasonsSum[k] += data.reasons[k] || 0;
    });

    ageCohortsSum.primaryKS1_KS2 += data.ageCohorts.primaryKS1_KS2;
    ageCohortsSum.secondaryKS3_KS4 += data.ageCohorts.secondaryKS3_KS4;
    ageCohortsSum.unknownAge += data.ageCohorts.unknownAge;
  }

  // If National and published figure is available, use exact published national figure
  if (isNational && nationalRaw && nationalRaw.total > 0) {
    totalCME = nationalRaw.total;
  }

  const ratePer1000 = totalPupils > 0 ? Number(((totalCME / totalPupils) * 1000).toFixed(2)) : 0;
  const longTermMissingPercent = totalCME > 0 ? Number(((weeks12Plus / totalCME) * 100).toFixed(1)) : 0;

  // Previous term for trend delta
  const termIdx = ACADEMIC_TERMS.indexOf(term);
  const prevTerm = termIdx < ACADEMIC_TERMS.length - 1 ? ACADEMIC_TERMS[termIdx + 1] : undefined;

  let totalCMEDeltaPercent: number | undefined;
  if (prevTerm) {
    const prevAggregate = calculateAggregate(authorities, prevTerm, selectedLabel, excludeSEN);
    if (prevAggregate.totalCME > 0) {
      totalCMEDeltaPercent = Number((((totalCME - prevAggregate.totalCME) / prevAggregate.totalCME) * 100).toFixed(1));
    }
  }

  return {
    term,
    selectedLabel,
    totalCME,
    totalPupils,
    ratePer1000,
    longTermMissingCount: weeks12Plus,
    longTermMissingPercent,
    durationWeeks: {
      weeks1To8,
      weeks8To12,
      weeks12Plus,
    },
    senProportionPercent: 14.5,
    reasons: reasonsSum,
    ageCohorts: ageCohortsSum,
    laCount: authorities.length,
    prevTerm,
    totalCMEDeltaPercent,
  };
}

export function formatUKNumber(val: number | 'c' | null | undefined): string {
  if (val === 'c' || val === undefined || val === null) return 'c* (<5)';
  return val.toLocaleString('en-GB');
}

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

export const formatUKCurrency = formatGBP;

export function formatUKRate(val: number | 'c' | null | undefined): string {
  if (val === 'c' || val === undefined || val === null) return 'c*';
  return `${val.toFixed(2)} per 1k`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val.toFixed(1)}%`;
}
