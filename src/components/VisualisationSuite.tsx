import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Info, 
  Layers, 
  Calendar, 
  Clock, 
  SlidersHorizontal,
  PoundSterling,
  AlertTriangle,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import { 
  AcademicTerm, 
  AggregatedStats, 
  FilterState, 
  LocalAuthority,
  DurationBracket,
  CalculatorParams
} from '../types';
import { 
  ACADEMIC_TERMS, 
  ALL_REGIONS, 
  LOCAL_AUTHORITIES_DATA,
  DURATION_CONFIG,
  calculateAggregate,
  formatUKNumber,
  formatGBP,
  getPublishedBreakdown,
  SCOPE_TIER_COLORS,
  TOTAL_AUTHORITIES_COUNT
} from '../data/cmeData';
import { scopeCohort, buildReasonTable, SCOPE_TIERS } from '../data/cmeScope';
import officialDataJson from '../data/officialDfeData.json';

interface VisualisationSuiteProps {
  currentStats: AggregatedStats;
  filters: FilterState;
  currentLA: LocalAuthority | null;
  nationalStats: AggregatedStats;
  onSelectLA: (code: string) => void;
  onSelectDuration?: (bracket: DurationBracket) => void;
  calculatorParams?: CalculatorParams;
}

export const VisualisationSuite: React.FC<VisualisationSuiteProps> = ({
  currentStats,
  filters,
  currentLA,
  nationalStats,
  onSelectLA,
  onSelectDuration,
  calculatorParams = { recoveryPerCase: 2800, strikeRate: 0.75 },
}) => {
  const [rankingMode, setRankingMode] = useState<'la' | 'region'>('la');
  const [activeReasonIndex, setActiveReasonIndex] = useState<number | null>(null);
  const [selectedChartTab, setSelectedChartTab] = useState<'trajectory' | 'duration' | 'reasons'>('trajectory');
  const [reasonDisplayMode, setReasonDisplayMode] = useState<'tiers' | 'all20'>('tiers');

  const durationFilter = filters.durationFilter;
  const effectiveValPerCase = calculatorParams.recoveryPerCase * calculatorParams.strikeRate;

  // 1. Prepare Trajectory Data across all 4 published terms (2024/25 Autumn through 2025/26 Autumn)
  const chronologicalTerms = [...ACADEMIC_TERMS].reverse();

  const trajectoryIsEngland = !currentLA && filters.selectedRegion === 'All England';
  const trajectoryLAs = currentLA
    ? [currentLA]
    : trajectoryIsEngland
    ? LOCAL_AUTHORITIES_DATA
    : LOCAL_AUTHORITIES_DATA.filter((la) => la.region === filters.selectedRegion);

  const trajectoryData = chronologicalTerms.map((term) => {
    const agg = calculateAggregate(trajectoryLAs, term, 'Trajectory Cohort', {
      isEngland: trajectoryIsEngland,
      region: !currentLA && !trajectoryIsEngland ? filters.selectedRegion : undefined,
    });
    const natAgg = calculateAggregate(LOCAL_AUTHORITIES_DATA, term, 'National Aggregate', { isEngland: true });

    const shortTerm = term
      .replace('2024/25 Autumn', 'Aut 24')
      .replace('2024/25 Spring', 'Spr 25')
      .replace('2024/25 Summer', 'Sum 25')
      .replace('2025/26 Autumn', 'Aut 25');

    const actionableTargetCount = agg.durationWeeks.weeks8To12 + agg.durationWeeks.weeks12Plus;
    const modeledYieldVal = Math.round(actionableTargetCount * effectiveValPerCase);

    let activeCohortCount = agg.totalCME;
    if (durationFilter === '1-8') {
      activeCohortCount = agg.durationWeeks.weeks1To8;
    } else if (durationFilter === '8-12') {
      activeCohortCount = agg.durationWeeks.weeks8To12;
    } else if (durationFilter === '12+') {
      activeCohortCount = agg.durationWeeks.weeks12Plus;
    }

    return {
      term,
      shortTerm,
      totalCME: agg.totalCME,
      activeCohortCount,
      weeks1To8: agg.durationWeeks.weeks1To8,
      weeks8To12: agg.durationWeeks.weeks8To12,
      weeks12Plus: agg.durationWeeks.weeks12Plus,
      actionableTargetCount,
      modeledYieldVal,
      longTermCount: agg.longTermMissingCount,
      nationalTotalCME: natAgg.totalCME,
    };
  });

  // 2. Prepare Regional & LA Comparison Data for selected term
  const termForComparison = filters.selectedTerm;

  const rankedLAs = LOCAL_AUTHORITIES_DATA
    .map((la) => {
      const data = la.termsData[termForComparison];
      const count = typeof data?.totalCME === 'number' ? data.totalCME : 0;
      const w1_8 = typeof data?.durationWeeks?.weeks1To8 === 'number' ? data.durationWeeks.weeks1To8 : 0;
      const w8_12 = typeof data?.durationWeeks?.weeks8To12 === 'number' ? data.durationWeeks.weeks8To12 : 0;
      const w12p = typeof data?.durationWeeks?.weeks12Plus === 'number' ? data.durationWeeks.weeks12Plus : 0;
      const target8Plus = w8_12 + w12p;
      const recoveryYield = Math.round(target8Plus * effectiveValPerCase);

      let displayCount = target8Plus;
      if (durationFilter === '1-8') {
        displayCount = w1_8;
      } else if (durationFilter === '8-12') {
        displayCount = w8_12;
      } else if (durationFilter === '12+') {
        displayCount = w12p;
      } else if (durationFilter === 'all') {
        displayCount = count;
      }

      return {
        code: la.code,
        name: la.name,
        region: la.region,
        totalCME: count,
        displayCount,
        target8Plus,
        recoveryYield,
        weeks1To8: w1_8,
        weeks8To12: w8_12,
        weeks12Plus: w12p,
        isSelected: currentLA?.code === la.code,
      };
    })
    .sort((a, b) => b.displayCount - a.displayCount);

  let displayedLAs = rankedLAs.slice(0, 10);
  if (currentLA && !displayedLAs.some((la) => la.code === currentLA.code)) {
    const selectedItem = rankedLAs.find((la) => la.code === currentLA.code);
    if (selectedItem) {
      displayedLAs = [...displayedLAs.slice(0, 9), selectedItem];
    }
  }

  const regionalData = ALL_REGIONS.map((region) => {
    const lasInReg = LOCAL_AUTHORITIES_DATA.filter((la) => la.region === region);
    const agg = calculateAggregate(lasInReg, termForComparison, region, { region });

    const target8Plus = agg.durationWeeks.weeks8To12 + agg.durationWeeks.weeks12Plus;
    const yieldVal = Math.round(target8Plus * effectiveValPerCase);

    let displayCount = target8Plus;
    if (durationFilter === '1-8') {
      displayCount = agg.durationWeeks.weeks1To8;
    } else if (durationFilter === '8-12') {
      displayCount = agg.durationWeeks.weeks8To12;
    } else if (durationFilter === '12+') {
      displayCount = agg.durationWeeks.weeks12Plus;
    } else if (durationFilter === 'all') {
      displayCount = agg.totalCME;
    }

    const yieldLabel = yieldVal >= 1_000_000 
      ? `£${(yieldVal / 1_000_000).toFixed(2)}M` 
      : yieldVal >= 1_000 
      ? `£${(yieldVal / 1_000).toFixed(0)}k` 
      : `£${yieldVal.toLocaleString('en-GB')}`;
    const barLabel = `${yieldLabel} (${formatUKNumber(displayCount)})`;

    return {
      code: region,
      name: region,
      region: region,
      totalCME: agg.totalCME,
      displayCount,
      target8Plus,
      recoveryYield: yieldVal,
      barLabel,
      weeks1To8: agg.durationWeeks.weeks1To8,
      weeks8To12: agg.durationWeeks.weeks8To12,
      weeks12Plus: agg.durationWeeks.weeks12Plus,
      isSelected: filters.selectedRegion === region,
    };
  })
    // Ordered by published caseload so the bars keep a stable position when the
    // duration or tier controls change. Sorting by displayCount reshuffled them
    // on every toggle, making regions impossible to track across changes.
    .sort((a, b) => b.totalCME - a.totalCME);

  // 3. Compliance scope tiers + full published reason table.
  // Both read the verbatim published breakdown via cmeScope.ts. No published
  // category is renamed, merged or dropped, and nothing here is an estimate:
  // these are published reason counts, not reason-by-duration figures.
  const publishedBreakdown = getPublishedBreakdown(filters.selectedTerm, {
    la: currentLA,
    region: filters.selectedRegion,
  });

  const scopedCohort = scopeCohort(
    publishedBreakdown.reasons,
    publishedBreakdown.durations,
    publishedBreakdown.totalRaw,
    8
  );

  // Scope tier view: the three in-scope tiers plus Not in scope.
  const tierData = scopedCohort.tiers.map((t) => ({
    name: t.tier.label,
    count: t.publishedCount,
    percent:
      scopedCohort.totalCME > 0
        ? Number(((t.publishedCount / scopedCohort.totalCME) * 100).toFixed(1))
        : 0,
    color: SCOPE_TIER_COLORS[t.tier.id],
    description: t.tier.rationale,
    suppressedCells: t.suppressedCells,
    inScope: t.tier.countsTowardYield,
  }));

  // Reference table: all 20 published categories, verbatim, tier-marked.
  const reasonTable = buildReasonTable(publishedBreakdown.reasons, publishedBreakdown.totalRaw);
  const tierLabelFor = (tierId: string) =>
    SCOPE_TIERS.find((t) => t.id === tierId)?.label ?? 'Not in scope';

  const reasonsData = tierData;

  // 4. Duration Breakdown Data for current active scope
  const target8to12Yield = Math.round(currentStats.durationWeeks.weeks8To12 * effectiveValPerCase);
  const target12PlusYield = Math.round(currentStats.durationWeeks.weeks12Plus * effectiveValPerCase);

  const durationCohortData = [
    {
      id: '8-12' as DurationBracket,
      name: '8–12 Weeks (Medium Term)',
      shortLabel: '8–12 Wks',
      count: currentStats.durationWeeks.weeks8To12,
      yieldVal: target8to12Yield,
      percent: currentStats.totalCME > 0 ? Number(((currentStats.durationWeeks.weeks8To12 / currentStats.totalCME) * 100).toFixed(1)) : 0,
      color: '#f59e0b',
      nationalPercent: nationalStats.totalCME > 0 ? Number(((nationalStats.durationWeeks.weeks8To12 / nationalStats.totalCME) * 100).toFixed(1)) : 0,
      description: 'Prime casework escalation — medium term non-attendance before becoming chronic',
    },
    {
      id: '12+' as DurationBracket,
      name: '12+ Weeks (Persistent / Chronic)',
      shortLabel: '12+ Wks',
      count: currentStats.durationWeeks.weeks12Plus,
      yieldVal: target12PlusYield,
      percent: currentStats.totalCME > 0 ? Number(((currentStats.durationWeeks.weeks12Plus / currentStats.totalCME) * 100).toFixed(1)) : 0,
      color: '#e11d48',
      nationalPercent: nationalStats.totalCME > 0 ? Number(((nationalStats.durationWeeks.weeks12Plus / nationalStats.totalCME) * 100).toFixed(1)) : 0,
      description: 'Severe chronic CME & untraceable cases out of school roll for over a full term',
    },
    {
      id: '1-8' as DurationBracket,
      name: 'Under 8 Weeks (<2w, 2–4w, 4–8w)',
      shortLabel: '1–8 Wks',
      count: currentStats.durationWeeks.weeks1To8,
      yieldVal: 0,
      percent: currentStats.totalCME > 0 ? Number(((currentStats.durationWeeks.weeks1To8 / currentStats.totalCME) * 100).toFixed(1)) : 0,
      color: '#0ea5e9',
      nationalPercent: nationalStats.totalCME > 0 ? Number(((nationalStats.durationWeeks.weeks1To8 / nationalStats.totalCME) * 100).toFixed(1)) : 0,
      description: 'Initial school place referral, in-year application, or recent residential move',
    },
  ];

  const activeDurationConfig = DURATION_CONFIG[durationFilter];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Visualisation 1: Trajectory & Yield Trends (7 cols) */}
      <div 
        id="chart-card-trajectory"
        className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1C1C] flex items-center gap-2 font-display">
                <TrendingUp className="w-4 h-4 text-[#FE5729]" />
                <span>
                  {durationFilter === 'all'
                    ? 'Longitudinal CME & Recovery Yield Trajectory'
                    : `Longitudinal Caseload: ${activeDurationConfig?.label}`}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Published DfE Returns (4 Terms: Autumn 2024/25 through Autumn 2025/26) • {currentStats.selectedLabel}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Duration breakdowns are published from 2024/25 onwards, so earlier terms are excluded.
              </p>
            </div>

            {/* View switcher tabs */}
            <div className="flex items-center space-x-1 bg-[#F4F4F6] p-1 rounded-full text-xs">
              <button
                onClick={() => setSelectedChartTab('trajectory')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  selectedChartTab === 'trajectory' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Actionable Yield (£)
              </button>
              <button
                onClick={() => setSelectedChartTab('duration')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  selectedChartTab === 'duration' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Duration Stack
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-5">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChartTab === 'trajectory' ? (
                <ComposedChart data={trajectoryData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cmeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={
                          durationFilter === '1-8' 
                            ? '#0ea5e9' 
                            : durationFilter === '8-12' 
                            ? '#f59e0b' 
                            : durationFilter === '12+' 
                            ? '#e11d48' 
                            : '#FE5729'
                        } 
                        stopOpacity={0.25} 
                      />
                      <stop 
                        offset="95%" 
                        stopColor={
                          durationFilter === '1-8' 
                            ? '#0ea5e9' 
                            : durationFilter === '8-12' 
                            ? '#f59e0b' 
                            : durationFilter === '12+' 
                            ? '#e11d48' 
                            : '#FE5729'
                        } 
                        stopOpacity={0.0} 
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortTerm" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#059669' }} axisLine={{ stroke: '#e5e5e5' }} tickFormatter={(val) => val >= 1000000 ? `£${(val/1000000).toFixed(1)}M` : `£${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1C1C', borderRadius: '12px', color: '#fff', fontSize: '11px', border: '1px solid #333' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FE5729', marginBottom: '4px' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    formatter={(value: any, name: string) => {
                      if (name.includes('Yield') || name.includes('Value')) return [formatGBP(Number(value)), name];
                      if (name.includes('Count') || name.includes('Cases')) return [formatUKNumber(value) + ' pupils', name];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }} />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="activeCohortCount" 
                    name={durationFilter === 'all' ? 'Total CME Cohort' : `${activeDurationConfig?.shortLabel} Caseload`} 
                    stroke={
                      durationFilter === '1-8' 
                        ? '#0ea5e9' 
                        : durationFilter === '8-12' 
                        ? '#f59e0b' 
                        : durationFilter === '12+' 
                        ? '#e11d48' 
                        : '#FE5729'
                    } 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#cmeGradient)" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="modeledYieldVal" 
                    name="STRATOS Modeled Yield" 
                    stroke="#059669" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={{ r: 3, fill: '#059669' }} 
                  />
                </ComposedChart>
              ) : (
                <BarChart data={trajectoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortTerm" tick={{ fontSize: 10, fill: '#737373' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1C1C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} 
                    formatter={(value: any) => [formatUKNumber(value) + ' pupils']}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="weeks1To8" name="Under 8 Wks" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="weeks8To12" name="8–12 Wks" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="weeks12Plus" name="12+ Wks (Chronic)" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer Insight */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-neutral-500 gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#FE5729] inline-block"></span>
            <span>Mandatory statutory data collection established by DfE across all {TOTAL_AUTHORITIES_COUNT} English LAs from Autumn 2024</span>
          </div>
          <div className="font-mono text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md text-[11px]">
            Latest DfE Benchmark: {formatUKNumber(trajectoryData[trajectoryData.length - 1]?.totalCME)} CME
          </div>
        </div>
      </div>

      {/* Visualisation 2: Ranking & Geographic Distribution (5 cols) */}
      <div 
        id="chart-card-ranking"
        className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1C1C] flex items-center gap-2 font-display">
                <BarChart3 className="w-4 h-4 text-[#FE5729]" />
                <span>Geographic Cohort Ranking</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {filters.selectedTerm} • {rankingMode === 'la' ? 'Top Authorities by Caseload' : 'All 9 English Regions'}
              </p>
            </div>

            <div className="flex items-center space-x-1 bg-[#F4F4F6] p-1 rounded-full text-xs">
              <button
                onClick={() => setRankingMode('la')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  rankingMode === 'la' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                LAs
              </button>
              <button
                onClick={() => setRankingMode('region')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  rankingMode === 'region' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Regions
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={rankingMode === 'la' ? displayedLAs : regionalData}
                margin={{ top: 0, right: 35, left: 75, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#1C1C1C', fontWeight: 600 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1C1C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  formatter={(value: any, name: string, item: any) => [
                    `${formatUKNumber(value)} pupils (STRATOS Yield: ${formatGBP(item.payload.recoveryYield)})`,
                    'CME Caseload',
                  ]}
                />
                <Bar 
                  dataKey="displayCount" 
                  radius={[0, 6, 6, 0]} 
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (rankingMode === 'la' && data?.code) {
                      onSelectLA(data.code);
                    }
                  }}
                >
                  {(rankingMode === 'la' ? displayedLAs : regionalData).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isSelected 
                          ? '#FE5729' 
                          : index === 0 
                          ? '#1C1C1C' 
                          : '#6366f1'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Click any bar to focus analysis</span>
          <span className="font-semibold text-neutral-800">
            {rankingMode === 'la' ? `${LOCAL_AUTHORITIES_DATA.length} LAs Tracked` : '9 Government Office Regions'}
          </span>
        </div>
      </div>

      {/* Visualisation 3: Published DfE Reason Breakdown (7 cols) */}
      <div 
        id="chart-card-reasons"
        className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1C1C] flex items-center gap-2 font-display">
                <PieChartIcon className="w-4 h-4 text-[#FE5729]" />
                <span>Compliance Scope Tiers</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Published DfE reason counts • {currentStats.selectedLabel} ({filters.selectedTerm})
              </p>
            </div>

            <div className="flex items-center space-x-1 bg-[#F4F4F6] p-1 rounded-full text-xs">
              <button
                onClick={() => setReasonDisplayMode('tiers')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  reasonDisplayMode === 'tiers' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Scope Tiers
              </button>
              <button
                onClick={() => setReasonDisplayMode('all20')}
                className={`px-3 py-1 rounded-full transition-all font-bold cursor-pointer ${
                  reasonDisplayMode === 'all20' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                20 DfE Categories
              </button>
            </div>
          </div>

          {reasonDisplayMode === 'all20' ? (
            /* Reference table: all 20 published categories, verbatim.
               Published counts only — no estimates and no yield. */
            <div className="mt-5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-neutral-400 border-b border-neutral-200">
                    <th className="py-1.5 pr-2 font-bold">Published category</th>
                    <th className="py-1.5 px-2 font-bold">Scope tier</th>
                    <th className="py-1.5 pl-2 font-bold text-right">Count</th>
                    <th className="py-1.5 pl-2 font-bold text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonTable.map((row) => (
                    <tr key={row.reason} className="border-b border-neutral-100 last:border-0">
                      <td className="py-1.5 pr-2 text-neutral-800 font-medium">{row.reason}</td>
                      <td className="py-1.5 px-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-neutral-600"
                          title={row.inScope ? 'Counts toward the in-scope cohort' : 'Not a Child Benefit matter'}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: SCOPE_TIER_COLORS[row.tierId] }}
                          />
                          {tierLabelFor(row.tierId)}
                        </span>
                      </td>
                      <td className="py-1.5 pl-2 text-right font-mono font-bold text-neutral-900">
                        {row.cell.marker ? row.cell.marker : formatUKNumber(row.cell.value ?? 0)}
                      </td>
                      <td className="py-1.5 pl-2 text-right font-mono text-neutral-400">
                        {row.sharePercent == null ? '—' : `${row.sharePercent}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5 items-center">
            <div className="md:col-span-5 h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    onMouseEnter={(_, index) => setActiveReasonIndex(index)}
                    onMouseLeave={() => setActiveReasonIndex(null)}
                  >
                    {reasonsData.map((entry, index) => (
                      <Cell
                        key={`cell-reason-${index}`}
                        fill={entry.color}
                        stroke={activeReasonIndex === index ? '#1C1C1C' : 'transparent'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C1C1C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(value: any, name: string, item: any) => [
                      `${formatUKNumber(value)} pupils (${item.payload.percent}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-7 max-h-56 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {reasonsData.map((reason, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveReasonIndex(idx)}
                  onMouseLeave={() => setActiveReasonIndex(null)}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    activeReasonIndex === idx ? 'bg-neutral-100 shadow-xs' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: reason.color }} />
                    <span className="text-neutral-800 font-medium truncate" title={reason.description}>
                      {reason.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 font-mono text-[11px]">
                    {reason.suppressedCells > 0 && (
                      <span className="text-neutral-400" title="Authorities reporting 'low': a count that rounds to 0 but is not 0">
                        +{reason.suppressedCells} low
                      </span>
                    )}
                    <span className="font-bold text-neutral-900">{formatUKNumber(reason.count)}</span>
                    <span className="text-neutral-400">({reason.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>Published by DfE as an independent 1D statutory distribution on census day</span>
          </span>
          <span className="font-semibold text-neutral-800">
            Published Total: {formatUKNumber(scopedCohort.totalCME)}
          </span>
        </div>
      </div>

      {/* Visualisation 4: Duration Intervals & Actionable Thresholds (5 cols) */}
      <div 
        id="chart-card-durations"
        className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#1C1C1C] flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-[#FE5729]" />
                <span>Statutory Duration Intervals</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Length of Time Out of Educational Roll • {filters.selectedTerm}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-5">
            {durationCohortData.map((cohort) => {
              const isSelected = durationFilter === cohort.id;
              return (
                <div
                  key={cohort.id}
                  onClick={() => onSelectDuration?.(isSelected ? 'all' : cohort.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#FE5729] bg-[#FE5729]/5 ring-1 ring-[#FE5729]' 
                      : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cohort.color }} />
                      <span className="text-xs font-bold text-[#1C1C1C]">{cohort.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-extrabold text-neutral-900">{formatUKNumber(cohort.count)}</span>
                      <span className="text-neutral-400 font-normal">({cohort.percent}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, cohort.percent)}%`,
                        backgroundColor: cohort.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-500">
                    <span className="line-clamp-1">{cohort.description}</span>
                    {cohort.yieldVal > 0 && (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0 ml-2">
                        {formatGBP(cohort.yieldVal, true)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Click any duration card to filter the entire dashboard</span>
          <span className="font-semibold text-neutral-800">
            Persistent (8+ Wks): {formatUKNumber(currentStats.durationWeeks.weeks8To12 + currentStats.durationWeeks.weeks12Plus)}
          </span>
        </div>
      </div>

    </div>
  );
};
