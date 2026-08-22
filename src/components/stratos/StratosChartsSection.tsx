import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldAlert,
  ArrowUpRight,
  Info,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Target,
  Users,
  PoundSterling,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LEACombined, StratosRegionalRollup, StratosNationalAggregate, RiskLevel } from '../../types';
import { formatGBP } from '../../utils/stratosCalculations';

interface StratosChartsSectionProps {
  leas: LEACombined[];
  regionalRollups: StratosRegionalRollup[];
  nationalAggregate: StratosNationalAggregate;
  onSelectLA?: (laCode: string) => void;
}

export const StratosChartsSection: React.FC<StratosChartsSectionProps> = ({
  leas,
  regionalRollups,
  nationalAggregate,
  onSelectLA,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'regional' | 'top-leas' | 'risk-distribution'>('regional');
  const [selectedRiskTier, setSelectedRiskTier] = useState<RiskLevel>('Critical');
  const [riskMetricMode, setRiskMetricMode] = useState<'value' | 'cases' | 'leas'>('value');

  // Prepare Regional Chart Data
  const regionalChartData = regionalRollups.map((r) => ({
    name: r.region.replace(' and the ', ' & ').replace(' of ', ' of '),
    fullRegion: r.region,
    w12_plus_value: r.w12_plus_count * nationalAggregate.effective_value_per_opened_case,
    w8_12_value: r.w8_12_count * nationalAggregate.effective_value_per_opened_case,
    total_potential: r.total_potential,
    target_cases: r.target_cases,
    lea_count: r.lea_count,
  }));

  // Top 10 LEAs by Potential
  const top10LEAs = [...leas]
    .sort((a, b) => b.total_potential_calc - a.total_potential_calc)
    .slice(0, 10)
    .map((la) => ({
      name: la.la_name,
      code: la.code,
      region: la.region,
      potential: la.total_potential_calc,
      targetCases: la.target_cases_count,
      w12_plus: la.w12_plus,
      w8_12: la.w8_12_count,
      risk: la.risk_level,
    }));

  // Risk Distribution Data with rich analytical metrics
  const riskDistributionData = [
    {
      name: 'Critical' as RiskLevel,
      count: nationalAggregate.critical_leas_count,
      color: '#e11d48', // rose-600
      lightBg: 'bg-rose-50 border-rose-200 text-rose-800',
      activeBorder: 'ring-2 ring-rose-500 border-rose-600 bg-rose-50/90 shadow-md shadow-rose-500/10',
      cases: leas.filter((l) => l.risk_level === 'Critical').reduce((s, c) => s + c.target_cases_count, 0),
      w12_plus: leas.filter((l) => l.risk_level === 'Critical').reduce((s, c) => s + c.w12_plus, 0),
      value: leas.filter((l) => l.risk_level === 'Critical').reduce((s, c) => s + c.total_potential_calc, 0),
      description: 'Severe 12+ week entrenchment requiring statutory multi-agency investigation and HMRC recovery audit.',
      actionPlaybook: 'Deploy immediate S.436A statutory intervention; initiate automated HMRC Child Benefit reconciliation to halt non-entitled disbursements across chronic caseloads.',
      auditExposure: 'High Statutory Default Exposure',
    },
    {
      name: 'High' as RiskLevel,
      count: nationalAggregate.high_leas_count,
      color: '#f59e0b', // amber-500
      lightBg: 'bg-amber-50 border-amber-200 text-amber-800',
      activeBorder: 'ring-2 ring-amber-500 border-amber-600 bg-amber-50/90 shadow-md shadow-amber-500/10',
      cases: leas.filter((l) => l.risk_level === 'High').reduce((s, c) => s + c.target_cases_count, 0),
      w12_plus: leas.filter((l) => l.risk_level === 'High').reduce((s, c) => s + c.w12_plus, 0),
      value: leas.filter((l) => l.risk_level === 'High').reduce((s, c) => s + c.total_potential_calc, 0),
      description: 'Significant 8–12 week intake at risk of chronic transition into unmonitored long-term absence.',
      actionPlaybook: 'Deploy dedicated attendance caseworkers for 8–12w cohort to prevent chronic duration progression before next termly return.',
      auditExposure: 'Elevated Escalation Risk',
    },
    {
      name: 'Medium' as RiskLevel,
      count: nationalAggregate.medium_leas_count,
      color: '#0ea5e9', // sky-500
      lightBg: 'bg-sky-50 border-sky-200 text-sky-800',
      activeBorder: 'ring-2 ring-sky-500 border-sky-600 bg-sky-50/90 shadow-md shadow-sky-500/10',
      cases: leas.filter((l) => l.risk_level === 'Medium').reduce((s, c) => s + c.target_cases_count, 0),
      w12_plus: leas.filter((l) => l.risk_level === 'Medium').reduce((s, c) => s + c.w12_plus, 0),
      value: leas.filter((l) => l.risk_level === 'Medium').reduce((s, c) => s + c.total_potential_calc, 0),
      description: 'Moderate caseload with baseline compliance processes; recovery concentrated in specific urban clusters.',
      actionPlaybook: 'Implement automated bi-weekly cross-referencing of admissions registers to eliminate administrative backlog lag.',
      auditExposure: 'Routine Compliance Review',
    },
    {
      name: 'Low' as RiskLevel,
      count: nationalAggregate.low_leas_count,
      color: '#10b981', // emerald-500
      lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-600 bg-emerald-50/90 shadow-md shadow-emerald-500/10',
      cases: leas.filter((l) => l.risk_level === 'Low').reduce((s, c) => s + c.target_cases_count, 0),
      w12_plus: leas.filter((l) => l.risk_level === 'Low').reduce((s, c) => s + c.w12_plus, 0),
      value: leas.filter((l) => l.risk_level === 'Low').reduce((s, c) => s + c.total_potential_calc, 0),
      description: 'High tracking precision with minimal unplaced pupil retention and rapid case resolution.',
      actionPlaybook: 'Maintain current multi-agency tracking protocols; conduct annual benchmarking audit.',
      auditExposure: 'Minimal Audit Risk',
    },
  ];

  // Active Tier Selected Metrics & LEAs
  const activeTierConfig = riskDistributionData.find((t) => t.name === selectedRiskTier) || riskDistributionData[0];
  const leasInSelectedTier = leas
    .filter((l) => l.risk_level === selectedRiskTier)
    .sort((a, b) => b.total_potential_calc - a.total_potential_calc);

  const avgPotentialPerLEAInTier = activeTierConfig.count > 0 ? activeTierConfig.value / activeTierConfig.count : 0;
  const avgCasesPerLEAInTier = activeTierConfig.count > 0 ? Math.round(activeTierConfig.cases / activeTierConfig.count) : 0;
  const severe12PlusPctInTier = activeTierConfig.cases > 0 ? Math.round((activeTierConfig.w12_plus / activeTierConfig.cases) * 100) : 0;
  const tierShareOfNationalPotential = Math.round((activeTierConfig.value / (nationalAggregate.total_projected_potential || 1)) * 100);

  // Custom high-contrast tooltips for superior legibility
  const TopLEATooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskBadgeColor = 
        data.risk === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' :
        data.risk === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
        data.risk === 'Medium' ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' :
        'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs max-w-xs backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white text-sm">{data.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${riskBadgeColor}`}>
              {data.risk} Risk
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Region</span>
            <span className="text-slate-200 font-medium">{data.region}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Actionable Cases (8+ wks)</span>
            <span className="text-slate-200 font-bold">{data.targetCases} pupils</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>12+ Wks / 8–12 Wks</span>
            <span className="text-slate-300">{data.w12_plus} / {data.w8_12}</span>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Projected Recovery:</span>
            <span className="font-bold text-emerald-400 text-sm">{formatGBP(data.potential)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const RegionalTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs max-w-xs backdrop-blur-md">
          <div className="font-bold text-white text-sm pb-1.5 border-b border-slate-800">
            {item.fullRegion} ({item.lea_count} Authorities)
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                12+ Weeks Potential:
              </span>
              <span className="font-bold text-rose-300">{formatGBP(item.w12_plus_value)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                8–12 Weeks Potential:
              </span>
              <span className="font-bold text-amber-300">{formatGBP(item.w8_12_value)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-300">Total Region Potential:</span>
              <span className="font-bold text-emerald-400 text-sm">{formatGBP(item.total_potential)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RiskPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs max-w-xs backdrop-blur-md">
          <div className="flex items-center gap-2 font-bold text-white text-sm pb-1.5 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name} Priority Tier
          </div>
          <div className="mt-2 space-y-1 text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Local Authorities:</span>
              <span className="font-semibold text-white">{item.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Target Cohort:</span>
              <span className="font-semibold text-white">{item.cases.toLocaleString('en-GB')} pupils</span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex justify-between gap-4">
              <span className="font-semibold text-slate-300">Total Potential:</span>
              <span className="font-bold text-emerald-400">{formatGBP(item.value)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 mb-6">
      {/* Chart Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-neutral-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FE5729]/10 border border-[#FE5729]/20 flex items-center justify-center text-[#FE5729]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#1C1C1C] font-display">
              Financial Recovery Distribution & Risk Analytics
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Regional aggregations, duration splits (8–12w vs 12+w), and risk tier concentration
            </p>
          </div>
        </div>

        {/* High-visibility interactive view switcher */}
        <div className="flex items-center space-x-1 bg-[#F4F4F6] p-1 rounded-full text-xs">
          <button
            id="chart-tab-regional"
            onClick={() => setActiveChartTab('regional')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeChartTab === 'regional'
                ? 'bg-[#FE5729] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${activeChartTab === 'regional' ? 'text-white' : 'text-[#FE5729]'}`} />
            <span>Regional Rollup</span>
          </button>

          <button
            id="chart-tab-top-leas"
            onClick={() => setActiveChartTab('top-leas')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeChartTab === 'top-leas'
                ? 'bg-[#FE5729] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activeChartTab === 'top-leas' ? 'text-white' : 'text-[#FE5729]'}`} />
            <span>Top 10 LEAs</span>
          </button>

          <button
            id="chart-tab-risk"
            onClick={() => setActiveChartTab('risk-distribution')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeChartTab === 'risk-distribution'
                ? 'bg-[#FE5729] text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieIcon className={`w-3.5 h-3.5 ${activeChartTab === 'risk-distribution' ? 'text-white' : 'text-[#FE5729]'}`} />
            <span>Risk Tiers Share</span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="pt-5">
        {activeChartTab === 'regional' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
              <span>Projected potential by Government Office Region (£ Value)</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center gap-1.5 font-bold text-neutral-700">
                  <span className="w-3 h-3 bg-rose-600 rounded-xs inline-block" /> 12+ Weeks Pool (Statutory Breach)
                </span>
                <span className="flex items-center gap-1.5 font-bold text-neutral-700">
                  <span className="w-3 h-3 bg-amber-500 rounded-xs inline-block" /> 8–12 Weeks Pool (Travel Expiry)
                </span>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionalChartData}
                  margin={{ top: 10, right: 10, left: 15, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: '#737373' }}
                  />
                  <YAxis
                    tickFormatter={(v) => `£${(v / 1_000_000).toFixed(1)}M`}
                    tick={{ fontSize: 11, fill: '#737373' }}
                  />
                  <Tooltip content={<RegionalTooltip />} />
                  <Bar dataKey="w12_plus_value" name="12+ Weeks Value" stackId="a" fill="#e11d48" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="w8_12_value" name="8–12 Weeks Value" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChartTab === 'top-leas' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
              <span>Top 10 English Local Authorities by total Child Benefit recovery potential</span>
              <span className="text-[11px] text-neutral-400">Click any authority for case breakdown</span>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10LEAs}
                  layout="vertical"
                  margin={{ top: 5, right: 110, left: 75, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `£${(v / 1_000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#737373' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#1C1C1C', fontWeight: 600 }}
                    width={85}
                  />
                  <Tooltip content={<TopLEATooltip />} />
                  <Bar
                    dataKey="potential"
                    fill="#FE5729"
                    radius={[0, 6, 6, 0]}
                    onClick={(data) => {
                      if (data?.code && onSelectLA) onSelectLA(data.code);
                    }}
                    className="cursor-pointer hover:opacity-90"
                  >
                    <LabelList
                      dataKey="potential"
                      position="right"
                      formatter={(val: any) => formatGBP(Number(val))}
                      style={{ fontSize: '11px', fontWeight: 800, fill: '#1C1C1C' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChartTab === 'risk-distribution' && (
          <div className="space-y-4">
            {/* Strategic Executive Summary Callout */}
            <div className="p-4 bg-[#FFF3F0] border border-[#FE5729]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#FE5729] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#1C1C1C]">
                    Pareto Risk Concentration Insight
                  </div>
                  <div className="text-xs text-neutral-700 mt-0.5">
                    <strong className="font-bold text-[#FE5729]">80.1% ({formatGBP(riskDistributionData[0].value + riskDistributionData[1].value)})</strong> of England's total recovery potential is concentrated in <strong className="font-bold text-[#1C1C1C]">{riskDistributionData[0].count + riskDistributionData[1].count} Critical & High Priority Authorities</strong>.
                  </div>
                </div>
              </div>

              {/* Toggle metric display for donut chart */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-full border border-neutral-200 shadow-2xs self-end sm:self-auto">
                <span className="text-[10px] font-bold text-neutral-400 px-1.5">Metric:</span>
                {[
                  { id: 'value', label: 'Potential (£)' },
                  { id: 'cases', label: 'Pupils' },
                  { id: 'leas', label: 'Count' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setRiskMetricMode(m.id as any)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors cursor-pointer ${
                      riskMetricMode === m.id
                        ? 'bg-[#FE5729] text-white shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Grid: Donut + Interactive Tier Selector Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              
              {/* Left: Donut Chart with Centered KPI */}
              <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={98}
                        paddingAngle={3}
                        dataKey={riskMetricMode}
                        onClick={(entry) => {
                          if (entry?.name) setSelectedRiskTier(entry.name as RiskLevel);
                        }}
                        className="cursor-pointer"
                      >
                        {riskDistributionData.map((entry) => (
                          <Cell 
                            key={`cell-${entry.name}`} 
                            fill={entry.color} 
                            stroke={selectedRiskTier === entry.name ? '#1C1C1C' : '#fff'}
                            strokeWidth={selectedRiskTier === entry.name ? 3 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<RiskPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Center Badge in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    {selectedRiskTier} Tier
                  </span>
                  <span className="text-base font-extrabold text-[#1C1C1C]">
                    {riskMetricMode === 'value' ? formatGBP(activeTierConfig.value, true) :
                     riskMetricMode === 'cases' ? `${activeTierConfig.cases.toLocaleString('en-GB')} pupils` :
                     `${activeTierConfig.count} LEAs`}
                  </span>
                  <span className="text-[10px] font-bold text-[#FE5729]">
                    {tierShareOfNationalPotential}% of National
                  </span>
                </div>
              </div>

              {/* Right: Interactive 4-Tier Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {riskDistributionData.map((item) => {
                  const isSelected = selectedRiskTier === item.name;
                  const tierPct = Math.round((item.value / (nationalAggregate.total_projected_potential || 1)) * 100);
                  const avgPerCouncil = item.count > 0 ? item.value / item.count : 0;

                  return (
                    <div
                      key={item.name}
                      onClick={() => setSelectedRiskTier(item.name)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                        isSelected 
                          ? 'ring-2 ring-[#FE5729] border-[#FE5729] bg-[#FFF3F0] shadow-sm' 
                          : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-[#F4F4F6]/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-[#1C1C1C]">{item.name} Priority</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.lightBg}`}>
                          {item.count} Councils
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-sm font-extrabold text-[#1C1C1C]">{formatGBP(item.value, true)}</span>
                        <span className="text-[11px] font-bold text-neutral-500">{tierPct}% of Total</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                        <span>{item.cases.toLocaleString('en-GB')} target pupils</span>
                        <span className="font-bold text-neutral-700">~{formatGBP(avgPerCouncil, true)} / council</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Tier Deep-Dive Analytics & Action Playbook Panel */}
            <div className="mt-4 pt-4 border-t border-neutral-200 bg-[#F4F4F6] rounded-2xl p-5 border border-neutral-200/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTierConfig.color }} />
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1C1C]">
                      {selectedRiskTier} Priority Tier Deep-Dive ({activeTierConfig.count} Local Authorities)
                    </h4>
                    <p className="text-[11px] text-neutral-500">{activeTierConfig.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-neutral-700 bg-white border border-neutral-200 px-2.5 py-1 rounded-full shadow-2xs">
                    Exposure: <span className="text-[#1C1C1C] font-extrabold">{activeTierConfig.auditExposure}</span>
                  </span>
                </div>
              </div>

              {/* 4 Deep-Dive KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="text-[10px] font-medium text-neutral-500">Avg Potential / Council</div>
                  <div className="text-xs font-extrabold text-[#1C1C1C] mt-0.5">{formatGBP(avgPotentialPerLEAInTier)}</div>
                  <div className="text-[10px] text-[#FE5729] font-bold mt-0.5">Direct recovery yield</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="text-[10px] font-medium text-neutral-500">12+ Week Severe Rate</div>
                  <div className="text-xs font-extrabold text-rose-600 mt-0.5">{severe12PlusPctInTier}%</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{activeTierConfig.w12_plus.toLocaleString('en-GB')} chronic pupils</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="text-[10px] font-medium text-neutral-500">Avg Target Cohort</div>
                  <div className="text-xs font-extrabold text-[#1C1C1C] mt-0.5">{avgCasesPerLEAInTier} pupils</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Per local authority</div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="text-[10px] font-medium text-neutral-500">National Recovery Share</div>
                  <div className="text-xs font-extrabold text-[#FE5729] mt-0.5">{tierShareOfNationalPotential}%</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{formatGBP(activeTierConfig.value, true)} of {formatGBP(nationalAggregate.total_projected_potential, true)}</div>
                </div>
              </div>

              {/* Full-width 2-column Highest Potential Authorities in Tier */}
              <div className="mt-3 pt-3 border-t border-neutral-200/80">
                <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-[#1C1C1C] mb-3 pb-2.5 border-b border-neutral-100">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[#FE5729]" />
                      <span className="text-xs sm:text-sm font-bold text-[#1C1C1C]">
                        Highest Potential Authorities in {selectedRiskTier} Tier
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FE5729]/10 text-[#FE5729]">
                        {leasInSelectedTier.length} Total Authorities
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-normal">
                      Click any authority to inspect details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {leasInSelectedTier.slice(0, 10).map((la, index) => (
                      <button
                        key={la.code}
                        onClick={() => {
                          if (onSelectLA) onSelectLA(la.code);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FFF3F0] border border-neutral-100 hover:border-[#FE5729]/30 transition-all text-left group cursor-pointer bg-neutral-50/50"
                        title={`Inspect full longitudinal data for ${la.la_name}`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-neutral-200 group-hover:border-[#FE5729]/30 text-[10px] font-bold text-neutral-600 group-hover:text-[#FE5729] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                            {index + 1}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-neutral-800 group-hover:text-[#1C1C1C] block truncate">
                              {la.la_name}
                            </span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {la.region}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-right shrink-0">
                          <span className="text-[11px] text-neutral-500 font-medium">{la.target_cases_count} pupils</span>
                          <span className="text-xs font-bold text-[#FE5729]">{formatGBP(la.total_potential_calc)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#FE5729] transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
