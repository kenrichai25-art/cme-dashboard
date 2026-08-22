import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  PoundSterling, 
  ArrowRight, 
  Compass, 
  Users, 
  Building2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  FileText,
  ChevronRight,
  ChevronDown,
  Scale,
  Clock,
  Sliders,
  Calendar,
  Zap
} from 'lucide-react';
import { 
  AcademicTerm, 
  AggregatedStats, 
  CalculatorParams, 
  FilterState, 
  LocalAuthority, 
  MainDashboardTab, 
  Region 
} from '../types';
import { 
  ACADEMIC_TERMS, 
  ALL_REGIONS, 
  LOCAL_AUTHORITIES_DATA, 
  calculateAggregate, 
  formatUKNumber, 
  formatUKCurrency,
  REASON_LABELS 
} from '../data/cmeData';

interface ExecutiveOverviewProps {
  currentStats: AggregatedStats;
  nationalStats: AggregatedStats;
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSelectLA: (code: string) => void;
  onNavigateTab: (tab: MainDashboardTab) => void;
  calculatorParams: CalculatorParams;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  currentStats,
  nationalStats,
  filters,
  onFilterChange,
  onSelectLA,
  onNavigateTab,
  calculatorParams,
}) => {
  const effectiveValPerCase = calculatorParams.recoveryPerCase * calculatorParams.strikeRate;

  // 1. National Longitudinal Trajectory across terms
  const chronologicalTerms = [...ACADEMIC_TERMS].reverse();
  const trajectoryData = chronologicalTerms.map((term) => {
    const agg = calculateAggregate(LOCAL_AUTHORITIES_DATA, term, 'England National', !!filters.excludeSEN);
    const shortTerm = term
      .replace('2023/24 Autumn', 'Aut 23')
      .replace('2023/24 Spring', 'Spr 24')
      .replace('2023/24 Summer', 'Sum 24')
      .replace('2024/25 Autumn', 'Aut 24')
      .replace('2024/25 Spring', 'Spr 25')
      .replace('2024/25 Summer', 'Sum 25')
      .replace('2025/26 Autumn', 'Aut 25')
      .replace('2025/26 Spring', 'Spr 26')
      .replace('2025/26 Summer', 'Sum 26');

    return {
      term,
      shortTerm,
      totalCME: agg.totalCME,
      weeks12Plus: agg.durationWeeks.weeks12Plus,
      weeks8To12: agg.durationWeeks.weeks8To12,
      weeks1To8: agg.durationWeeks.weeks1To8,
      ratePer1000: agg.ratePer1000,
    };
  });

  // 2. Regional Rollup Data for Executive Comparison
  const regionalSummary = ALL_REGIONS.map((reg) => {
    const regLAs = LOCAL_AUTHORITIES_DATA.filter((la) => la.region === reg);
    const agg = calculateAggregate(regLAs, filters.selectedTerm, reg, !!filters.excludeSEN);
    const target8Plus = agg.durationWeeks.weeks8To12 + agg.durationWeeks.weeks12Plus;
    const estRecovery = Math.round(target8Plus * effectiveValPerCase);

    return {
      region: reg,
      totalCME: agg.totalCME,
      ratePer1000: agg.ratePer1000,
      longTermPct: agg.longTermMissingPercent,
      target8Plus,
      estRecovery,
      laCount: regLAs.length,
    };
  }).sort((a, b) => b.totalCME - a.totalCME);

  // 3. Top High-Volume Local Authorities (Show 9 to match 9 Government Regions height)
  const topLAs = [...LOCAL_AUTHORITIES_DATA]
    .map((la) => {
      const d = la.termsData[filters.selectedTerm];
      const count = typeof d?.totalCME === 'number' ? d.totalCME : 0;
      const w8_12 = typeof d?.durationWeeks?.weeks8To12 === 'number' ? d.durationWeeks.weeks8To12 : 0;
      const w12p = typeof d?.durationWeeks?.weeks12Plus === 'number' ? d.durationWeeks.weeks12Plus : 0;
      const target8p = w8_12 + w12p;
      const recovery = Math.round(target8p * effectiveValPerCase);
      return {
        code: la.code,
        name: la.name,
        region: la.region,
        totalCME: count,
        ratePer1000: typeof d?.ratePer1000 === 'number' ? d.ratePer1000 : 0,
        target8Plus: target8p,
        recovery,
      };
    })
    .sort((a, b) => b.totalCME - a.totalCME)
    .slice(0, 9);

  // 4. Statutory Reason Breakdown for national
  const reasonsData = (Object.entries(currentStats.reasons) as [keyof typeof REASON_LABELS, number][])
    .map(([key, count]) => {
      const numericCount = typeof count === 'number' ? count : 0;
      return {
        key,
        label: REASON_LABELS[key]?.label || key,
        color: REASON_LABELS[key]?.color || '#FE5729',
        count: numericCount,
        percent: currentStats.totalCME > 0 ? ((numericCount / currentStats.totalCME) * 100).toFixed(1) : '0',
      };
    })
    .sort((a, b) => b.count - a.count);

  const nationalTarget8Plus = nationalStats.durationWeeks.weeks8To12 + nationalStats.durationWeeks.weeks12Plus;
  const nationalTotalYield = nationalTarget8Plus * effectiveValPerCase;

  return (
    <div className="space-y-6">
      {/* Top Banner: Clean Executive Briefing Scope & Solid Orange Pill Switcher */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FE5729]/10 border border-[#FE5729]/20 text-[#FE5729] text-[10px] font-extrabold tracking-wider uppercase">
              Executive Briefing
            </span>
            <span className="text-neutral-300 text-xs">•</span>
            <span className="text-xs text-neutral-500 font-medium">153 English Local Authorities</span>
          </div>
          <h2 className="text-xl font-bold text-[#1C1C1C] tracking-tight mt-1">
            England Children Missing Education (CME) Overview
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official DfE statutory statistics, longitudinal trends, and modelled Child Benefit compliance exposure.
          </p>
        </div>

        {/* Term & Scope Selectors (Polished & Structured Control Group) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-[#F4F4F6] p-1.5 rounded-2xl border border-neutral-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider pl-2 hidden sm:inline">
              Census:
            </span>
            <div className="relative">
              <select
                id="executive-census-term-select"
                value={filters.selectedTerm}
                onChange={(e) => onFilterChange({ selectedTerm: e.target.value as AcademicTerm })}
                className="text-xs pl-8 pr-8 py-2 bg-[#FE5729] hover:bg-[#E0461B] text-white rounded-xl focus:ring-2 focus:ring-[#1C1C1C] focus:outline-none font-bold shadow-xs cursor-pointer appearance-none transition-colors"
              >
                <option value="2025/26 Summer" className="text-[#1C1C1C] font-medium bg-white">2025/26 Summer (Latest)</option>
                <option value="2025/26 Spring" className="text-[#1C1C1C] font-medium bg-white">2025/26 Spring</option>
                <option value="2025/26 Autumn" className="text-[#1C1C1C] font-medium bg-white">2025/26 Autumn</option>
                <option value="2024/25 Summer" className="text-[#1C1C1C] font-medium bg-white">2024/25 Summer</option>
                <option value="2024/25 Spring" className="text-[#1C1C1C] font-medium bg-white">2024/25 Spring</option>
                <option value="2024/25 Autumn" className="text-[#1C1C1C] font-medium bg-white">2024/25 Autumn</option>
                <option value="2023/24 Spring" className="text-[#1C1C1C] font-medium bg-white">2023/24 Spring</option>
              </select>
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-white/80 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('dfe-intelligence')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#1C1C1C] hover:bg-neutral-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Deep Census Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FE5729]" />
          </button>
        </div>
      </div>

      {/* 4 Hero Strategic Metric Cards (Dark Obsidian & Spotlight Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total CME (Dark Obsidian) */}
        <div className="bg-[#1C1C1C] text-white p-5 sm:p-6 rounded-3xl shadow-md border border-neutral-800/90 hover:border-neutral-700 transition-all relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#FE5729]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#FE5729]/20 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Total Active CME
              </span>
              <div className="p-2 rounded-xl bg-neutral-800 text-neutral-200 shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-white tracking-tight leading-none">
              {formatUKNumber(nationalStats.totalCME)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Rate per 1k pupils:</span>
            <span className="font-semibold text-white">{nationalStats.ratePer1000.toFixed(2)} / 1,000</span>
          </div>
        </div>

        {/* Card 2: Persistent 12+ Weeks Cohort (Urgent Risk Orange) */}
        <div className="bg-[#1C1C1C] text-white p-5 sm:p-6 rounded-3xl shadow-md border border-neutral-800/90 hover:border-neutral-700 transition-all relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#FE5729]/15 rounded-full blur-xl pointer-events-none group-hover:bg-[#FE5729]/25 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Missing 12+ Weeks
              </span>
              <div className="p-2 rounded-xl bg-[#FE5729]/20 text-[#FE5729] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-white tracking-tight leading-none">
              {formatUKNumber(nationalStats.durationWeeks.weeks12Plus)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-1.5 text-xs text-[#FE5729] font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Primary risk pool ({nationalStats.longTermMissingPercent.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Card 3: Identified SEN / EHCP */}
        <div className="bg-[#1C1C1C] text-white p-5 sm:p-6 rounded-3xl shadow-md border border-neutral-800/90 hover:border-neutral-700 transition-all relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                SEN / EHCP Cohort
              </span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-white tracking-tight leading-none">
              {nationalStats.senProportionPercent.toFixed(1)}%
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Specialist provision:</span>
            <span className="font-semibold text-purple-300">~{formatUKNumber(Math.round(nationalStats.totalCME * (nationalStats.senProportionPercent / 100)))}</span>
          </div>
        </div>

        {/* Card 4: Spotlight Hero Metric Card (Modelled Recovery Yield) */}
        <div className="bg-[#1C1C1C] text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-[#FE5729]/40 hover:border-[#FE5729]/70 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#FE5729]/25 rounded-full blur-xl pointer-events-none group-hover:bg-[#FE5729]/35 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                CME Financial Impact Potential
              </span>
              <div className="px-2.5 py-0.5 rounded-full bg-[#FE5729] text-white text-[10px] font-extrabold tracking-wide shadow-2xs">
                SPOTLIGHT
              </div>
            </div>
            <p className="text-3xl sm:text-4xl lg:text-[2.6rem] font-semibold text-[#FE5729] tracking-tight leading-none">
              {formatUKCurrency(nationalTotalYield)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-300 font-medium">
            <span>Actionable ({formatUKNumber(nationalTarget8Plus)} cases)</span>
            <TrendingUp className="w-4 h-4 text-[#FE5729]" />
          </div>
        </div>

      </div>

      {/* Main Grid: 2 High-Impact Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Longitudinal England Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C]">
                  National CME Longitudinal Trajectory (2023/24 – 2025/26)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Official census progression showing total pupils missing education vs persistent 12+ week cases.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold border border-neutral-200">
                9 Terms
              </span>
            </div>

            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="execTotalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1C1C1C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1C1C1C" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="exec12PlusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FE5729" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FE5729" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="shortTerm" 
                    tick={{ fontSize: 11, fill: '#737373' }} 
                    axisLine={{ stroke: '#E5E7EB' }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#737373' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#1C1C1C] text-white p-3 rounded-2xl shadow-xl text-xs border border-neutral-800 space-y-1">
                            <div className="font-bold text-white">{d.term}</div>
                            <div className="text-neutral-300">Total CME: <strong className="text-white">{formatUKNumber(d.totalCME)}</strong></div>
                            <div className="text-[#FE5729]">12+ Weeks: <strong className="text-[#FE5729]">{formatUKNumber(d.weeks12Plus)}</strong></div>
                            <div className="text-neutral-400">Rate: <strong className="text-neutral-200">{d.ratePer1000.toFixed(2)}/1k</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCME"
                    name="Total CME"
                    stroke="#1C1C1C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#execTotalGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="weeks12Plus"
                    name="12+ Weeks Persistent"
                    stroke="#FE5729"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#exec12PlusGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-neutral-800 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1C1C1C]" /> Total CME
              </span>
              <span className="flex items-center gap-1.5 text-[#FE5729] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FE5729]" /> 12+ Weeks Persistent
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('dfe-intelligence')}
              className="text-[#FE5729] hover:text-[#E0461B] font-bold hover:underline cursor-pointer"
            >
              Full Cohort Analysis →
            </button>
          </div>
        </div>

        {/* Right: Statutory Root Causes Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1C1C1C]">
                Statutory Reasons for Missing Education
              </h3>
              <span className="text-xs text-neutral-400 font-medium">DfE Census</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Official statutory categorization of missing children across England.
            </p>

            {/* Visual list of reasons */}
            <div className="mt-4 space-y-3">
              {reasonsData.slice(0, 5).map((r, index) => (
                <div key={r.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-neutral-800 truncate max-w-[240px]" title={r.label}>
                      {r.label}
                    </span>
                    <span className="font-semibold text-[#1C1C1C]">
                      {formatUKNumber(r.count)} <span className="text-neutral-400 font-normal">({r.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#F4F4F6] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        index === 0 ? 'bg-[#FE5729]' : index === 1 ? 'bg-amber-500' : 'bg-neutral-600'
                      }`}
                      style={{
                        width: `${r.percent}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Primary Driver: <strong className="text-[#1C1C1C]">{reasonsData[0]?.label || 'Awaiting School Place'}</strong></span>
            <button
              onClick={() => onNavigateTab('dfe-intelligence')}
              className="text-[#FE5729] hover:text-[#E0461B] font-bold hover:underline cursor-pointer"
            >
              View All 7 Causes →
            </button>
          </div>
        </div>

      </div>

      {/* Regional Exposure & Top Authorities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Regional Ranking (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C]">
                  Regional Distribution of Children Missing Education
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Total cases & modelled recovery exposure across all 9 English Government Regions.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('la-explorer')}
                className="text-xs font-bold text-[#FE5729] hover:text-[#E0461B] hover:underline cursor-pointer"
              >
                Explore 153 LAs →
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {regionalSummary.map((reg) => (
                <div 
                  key={reg.region}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl hover:bg-[#F4F4F6] transition-colors border border-neutral-100"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FE5729] shrink-0" />
                    <div>
                      <span className="font-bold text-[#1C1C1C] text-sm sm:text-base">{reg.region}</span>
                      <span className="text-xs text-neutral-400 block sm:inline sm:ml-2 font-normal">({reg.laCount} LAs)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 sm:space-x-5 shrink-0">
                    <div className="text-right">
                      <span className="font-semibold text-[#1C1C1C] text-sm sm:text-base block">{formatUKNumber(reg.totalCME)}</span>
                      <span className="text-xs text-neutral-400 block font-normal">{reg.ratePer1000.toFixed(2)}/1k</span>
                    </div>
                    <div className="text-right min-w-[105px]">
                      <span className="font-semibold text-emerald-700 text-sm sm:text-base block">{formatUKCurrency(reg.estRecovery)}</span>
                      <span className="text-[10px] text-neutral-400 block font-normal">Financial Impact</span>
                    </div>
                    <button
                      onClick={() => {
                        onFilterChange({ selectedRegion: reg.region, selectedLACode: null });
                        onNavigateTab('la-explorer');
                      }}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-[#FE5729] transition-colors cursor-pointer"
                      title={`Filter by ${reg.region}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top High-Exposure Local Authorities Spotlight (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C]">
                  High-Exposure Authority Spotlight
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Top authorities with highest active CME caseloads.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FE5729]/10 text-[#FE5729] text-[10px] font-extrabold uppercase border border-[#FE5729]/20">
                Top {topLAs.length}
              </span>
            </div>

            <div className="space-y-2 mt-3">
              {topLAs.map((la, index) => (
                <div
                  key={la.code}
                  onClick={() => onSelectLA(la.code)}
                  className="p-3 sm:p-3.5 rounded-2xl border border-neutral-100 hover:border-[#FE5729]/40 hover:bg-[#FFF3F0]/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 text-xs font-bold flex items-center justify-center group-hover:bg-[#FE5729] group-hover:text-white transition-colors shrink-0">
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <h4 className="text-sm sm:text-base font-bold text-[#1C1C1C] group-hover:text-[#FE5729] transition-colors truncate">
                        {la.name}
                      </h4>
                      <span className="text-xs text-neutral-400 block truncate">{la.region}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-semibold text-[#1C1C1C] text-sm sm:text-base block">
                      {formatUKNumber(la.totalCME)} CME
                    </span>
                    <span className="font-semibold text-emerald-700 text-xs sm:text-sm block">
                      {formatUKCurrency(la.recovery)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500">Ranked by total pupils missing education</span>
            <button
              onClick={() => onNavigateTab('la-explorer')}
              className="text-xs font-bold text-[#FE5729] hover:text-[#E0461B] flex items-center gap-1 cursor-pointer"
            >
              <span>View Full League (153)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3 Interactive Pathway Action Tiles (Clean Executive Pathways) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        
        {/* Pathway 1: LA Explorer */}
        <div 
          onClick={() => onNavigateTab('la-explorer')}
          className="bg-white p-6 rounded-3xl border border-neutral-200/90 hover:border-[#FE5729]/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#FE5729]/10 text-[#FE5729] group-hover:bg-[#FE5729] group-hover:text-white transition-colors border border-[#FE5729]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#FE5729] group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-bold text-[#1C1C1C] mt-4 group-hover:text-[#FE5729] transition-colors">
            153 Local Authority League Table
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            Search, filter by region, sort statutory ratios, and inspect individual council histories.
          </p>
        </div>

        {/* Pathway 2: STRATOS Modeler */}
        <div 
          onClick={() => onNavigateTab('stratos-recovery')}
          className="bg-white p-6 rounded-3xl border border-neutral-200/90 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-200">
              <PoundSterling className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-bold text-[#1C1C1C] mt-4 group-hover:text-emerald-600 transition-colors">
            CME Financial Impact Modeller
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            Adjust strike rates, recovery amounts (£1k–£6k), and calculate net Child Benefit savings.
          </p>
        </div>

        {/* Pathway 3: Compliance & Legal */}
        <div 
          onClick={() => onNavigateTab('compliance-guide')}
          className="bg-white p-6 rounded-3xl border border-neutral-200/90 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors border border-purple-200">
              <Scale className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="text-sm font-bold text-[#1C1C1C] mt-4 group-hover:text-purple-600 transition-colors">
            Statutory Compliance & Legal Guide
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            Review Children Act 1996 s.436A, DfE guidance, and data sharing legal bases.
          </p>
        </div>

      </div>

    </div>
  );
};
