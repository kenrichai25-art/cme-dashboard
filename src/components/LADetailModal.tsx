import React, { useState } from 'react';
import { 
  X, 
  Building, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Users, 
  Clock, 
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  PoundSterling,
  Target,
  Coins,
  Scale,
  Percent,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  Area, 
  Line, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { AcademicTerm, CalculatorParams, LocalAuthority, MainDashboardTab, ReasonBreakdown, RiskLevel } from '../types';
import { 
  ACADEMIC_TERMS, 
  REASON_LABELS, 
  DURATION_CONFIG,
  OFFICIAL_20_REASONS,
  REASON_COLORS,
  formatUKNumber, 
  formatGBP
} from '../data/cmeData';
import { 
  DEFAULT_CALCULATOR_PARAMS, 
  RISK_TIER_CONFIG, 
  parseDfENumber 
} from '../utils/stratosCalculations';

interface LADetailModalProps {
  la: LocalAuthority | null;
  selectedTerm: AcademicTerm;
  calculatorParams?: CalculatorParams;
  activeTab?: MainDashboardTab;
  onClose: () => void;
}

export const LADetailModal: React.FC<LADetailModalProps> = ({
  la,
  selectedTerm,
  calculatorParams = DEFAULT_CALCULATOR_PARAMS,
  activeTab,
  onClose,
}) => {
  const [activeTermTab, setActiveTermTab] = useState<AcademicTerm>(selectedTerm);
  const [detailViewMode, setDetailViewMode] = useState<'reasons' | 'durations' | 'recovery'>('reasons');

  if (!la) return null;

  const currentTermData = la.termsData[activeTermTab];
  const chronologicalTerms = [...ACADEMIC_TERMS].reverse();

  // Financial Recovery & Yield Computations for this LA and term
  const recoveryPerCase = calculatorParams.recoveryPerCase;
  const strikeRate = calculatorParams.strikeRate;
  const cohortMode = calculatorParams.cohortMode || 'all';
  const effectiveValuePerCase = recoveryPerCase * strikeRate;

  const rawTotalCme = parseDfENumber(currentTermData?.totalCME, 0);
  const rawW8_12 = parseDfENumber(currentTermData?.durationWeeks?.weeks8To12, 0);
  const rawW12_plus = parseDfENumber(currentTermData?.durationWeeks?.weeks12Plus, 0);

  // Exact verbatim statutory counts
  const officialR = currentTermData?.officialReasons || {};
  const abroad = parseDfENumber(officialR['Believed to have moved to another country']?.count, 0);
  const unknown = parseDfENumber(officialR['Unknown']?.count, 0) + parseDfENumber(officialR['Not recorded']?.count, 0);

  let totalCme = rawTotalCme;
  let w8_12 = rawW8_12;
  let w12_plus = rawW12_plus;

  if (cohortMode === 'untraceable-abroad') {
    totalCme = abroad + unknown;
    w8_12 = Math.round(totalCme * 0.25);
    w12_plus = Math.round(totalCme * 0.45);
  }

  const targetCases = w8_12 + w12_plus;
  const w8_12_val = Math.round(w8_12 * effectiveValuePerCase);
  const w12_plus_val = Math.round(w12_plus * effectiveValuePerCase);
  const totalYieldValue = w8_12_val + w12_plus_val;

  let riskLevel: RiskLevel = 'Low';
  if (w12_plus >= 300 || totalCme >= 1000 || totalYieldValue >= 500_000) {
    riskLevel = 'Critical';
  } else if (w12_plus >= 100 || unknown >= 200 || totalYieldValue >= 200_000) {
    riskLevel = 'High';
  } else if (w12_plus >= 30 || abroad >= 30 || totalYieldValue >= 50_000) {
    riskLevel = 'Medium';
  }
  const riskConfig = RISK_TIER_CONFIG[riskLevel];

  // 4-term longitudinal series for this LA
  const laTrendData = chronologicalTerms.map((t) => {
    const d = la.termsData[t];
    const termW8_12 = parseDfENumber(d?.durationWeeks?.weeks8To12, 0);
    const termW12Plus = parseDfENumber(d?.durationWeeks?.weeks12Plus, 0);
    const termYield = Math.round((termW8_12 + termW12Plus) * effectiveValuePerCase);

    return {
      term: t,
      shortTerm: t
        .replace('2024/25 Autumn', 'Aut 24')
        .replace('2024/25 Spring', 'Spr 25')
        .replace('2024/25 Summer', 'Sum 25')
        .replace('2025/26 Autumn', 'Aut 25'),
      totalCME: typeof d?.totalCME === 'number' ? d.totalCME : 0,
      weeks1To8: typeof d?.durationWeeks?.weeks1To8 === 'number' ? d.durationWeeks.weeks1To8 : 0,
      weeks8To12: typeof d?.durationWeeks?.weeks8To12 === 'number' ? d.durationWeeks.weeks8To12 : 0,
      weeks12Plus: typeof d?.durationWeeks?.weeks12Plus === 'number' ? d.durationWeeks.weeks12Plus : 0,
      recoveryYield: termYield,
    };
  });

  // 20 Official Reasons for this LA in this term
  const officialReasonsList = OFFICIAL_20_REASONS.map((rName) => {
    const rawObj = officialR[rName];
    const countStr = rawObj?.count ?? '0';
    const num = countStr === 'low' || countStr === 'x' || countStr === 'z' ? 0 : Number(countStr);
    const pct = totalCme > 0 ? ((num / totalCme) * 100).toFixed(1) : '0.0';
    return {
      name: rName,
      rawCount: countStr,
      numCount: isNaN(num) ? 0 : num,
      percent: pct,
      color: REASON_COLORS[rName] || '#64748b'
    };
  }).sort((a, b) => b.numCount - a.numCount);

  // 8 Official Durations for this LA in this term
  const officialDurationsMap = currentTermData?.officialDurations || {};
  const durationKeys = [
    'Less than 2 weeks',
    '2 to 4 weeks',
    '4 to 8 weeks',
    '8 to 12 weeks',
    '12 to 26 weeks',
    '26 to 52 weeks',
    'Over 52 weeks',
    'Unknown'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 bg-[#F4F4F6] flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#1C1C1C] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <Building className="w-5 h-5 text-[#FE5729]" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg font-extrabold text-[#1C1C1C] font-display">{la.name}</h2>
                <span className="text-xs font-bold bg-[#FE5729]/10 text-[#FE5729] px-2.5 py-0.5 rounded-full border border-[#FE5729]/20">
                  {la.code}
                </span>
                <span className="text-xs text-neutral-600 bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full font-medium">
                  {la.tier}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 flex items-center space-x-2">
                <span className="flex items-center gap-1 font-semibold text-neutral-700">
                  <MapPin className="w-3.5 h-3.5 text-[#FE5729]" />
                  {la.region} Region
                </span>
                <span>•</span>
                <span>Verified DfE Explore Education Statistics Record</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Census Term Selector Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1 max-w-full">
              {ACADEMIC_TERMS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTermTab(t)}
                  className={`px-3.5 py-1.5 text-xs rounded-full whitespace-nowrap transition-all font-bold cursor-pointer ${
                    activeTermTab === t
                      ? 'bg-[#1C1C1C] text-white shadow-xs'
                      : 'bg-[#F4F4F6] text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-neutral-400 hidden sm:inline uppercase tracking-wider text-[10px]">
              4 Published Terms
            </span>
          </div>

          {/* Published Census Headline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Published Total CME</span>
              <p className="text-xl font-extrabold text-[#1C1C1C] mt-1 font-mono">
                {currentTermData?.totalRaw === 'low' ? 'low (<5)' : formatUKNumber(currentTermData?.totalCME)}
              </p>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Census Point-in-time
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Rate per 100 pupils</span>
              <p className="text-xl font-extrabold text-[#1C1C1C] mt-1 font-mono">
                {currentTermData?.ratePer100Published !== 'x' ? `${currentTermData?.ratePer100Published}%` : 'Not Published'}
              </p>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Published rate
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase">8–12 Weeks Caseload</span>
              <p className="text-xl font-extrabold text-amber-900 mt-1 font-mono">
                {formatUKNumber(currentTermData?.durationWeeks?.weeks8To12)}
              </p>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Medium term CME</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">12+ Weeks (Chronic)</span>
              <p className="text-xl font-extrabold text-rose-900 mt-1 font-mono">
                {formatUKNumber(currentTermData?.durationWeeks?.weeks12Plus)}
              </p>
              <span className="text-[10px] text-rose-600 mt-0.5 block">
                {currentTermData?.longTermMissingPercent}% of authority CME
              </span>
            </div>
          </div>

          {/* Subview Toggle */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center space-x-1.5 bg-[#F4F4F6] p-1 rounded-full text-xs">
              <button
                onClick={() => setDetailViewMode('reasons')}
                className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                  detailViewMode === 'reasons' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                20 DfE Reasons
              </button>
              <button
                onClick={() => setDetailViewMode('durations')}
                className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                  detailViewMode === 'durations' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                8 Duration Brackets
              </button>
              <button
                onClick={() => setDetailViewMode('recovery')}
                className={`px-3.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                  detailViewMode === 'recovery' ? 'bg-[#FE5729] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                STRATOS Yield Model
              </button>
            </div>

            <span className="text-xs text-neutral-400 font-mono">
              LA Code: {la.code}
            </span>
          </div>

          {/* View Mode 1: 20 Official Reasons */}
          {detailViewMode === 'reasons' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>All 20 Statutory Reason categories published by DfE for {activeTermTab}</span>
                <span className="font-semibold text-neutral-800">Total Classified: {formatUKNumber(totalCme)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {officialReasonsList.map((r, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="text-neutral-800 font-medium truncate" title={r.name}>{r.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 font-mono text-[11px]">
                      <span className="font-bold text-neutral-900">
                        {r.rawCount === 'low' ? 'low (<5)' : formatUKNumber(r.numCount)}
                      </span>
                      {r.rawCount !== 'low' && r.rawCount !== '0' && (
                        <span className="text-neutral-400">({r.percent}%)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Mode 2: 8 Official Durations */}
          {detailViewMode === 'durations' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>All 8 Statutory Duration categories published by DfE for {activeTermTab}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {durationKeys.map((dKey, idx) => {
                  const dObj = officialDurationsMap[dKey];
                  const rawCount = dObj?.count ?? '0';
                  const num = rawCount === 'low' || rawCount === 'x' || rawCount === 'z' ? 0 : Number(rawCount);
                  const isChronic = dKey.includes('12') || dKey.includes('26') || dKey.includes('52');
                  return (
                    <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      isChronic ? 'bg-rose-50/40 border-rose-200' : 'bg-neutral-50/80 border-neutral-200/80'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-3.5 h-3.5 ${isChronic ? 'text-rose-600' : 'text-neutral-400'}`} />
                        <span className="font-semibold text-neutral-800">{dKey}</span>
                      </div>
                      <span className="font-mono font-extrabold text-neutral-900">
                        {rawCount === 'low' ? 'low (<5)' : formatUKNumber(num)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Mode 3: STRATOS Yield Model */}
          {detailViewMode === 'recovery' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1C1C1C] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                    Projected Financial Recovery Yield
                  </span>
                  <p className="text-2xl font-extrabold text-white mt-0.5 font-mono">
                    {formatGBP(totalYieldValue)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Based on {formatUKNumber(targetCases)} persistent CME cases (8+ weeks) @ {formatGBP(recoveryPerCase)} / case ({Math.round(strikeRate * 100)}% strike rate)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskConfig.badgeClass}`}>
                    {riskConfig.label}
                  </span>
                </div>
              </div>

              {/* 4-Term Historical Trajectory */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <h4 className="text-xs font-extrabold text-neutral-800 mb-3 flex items-center gap-1.5 font-display">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FE5729]" />
                  <span>4-Term CME & Yield Trajectory for {la.name}</span>
                </h4>
                <p className="text-[11px] text-neutral-400 -mt-2 mb-3">
                  Duration breakdowns are published from 2024/25 onwards, so earlier terms are excluded.
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={laTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="shortTerm" tick={{ fontSize: 9, fill: '#737373' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#737373' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#059669' }} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                      <Bar yAxisId="left" dataKey="totalCME" name="Total CME" fill="#FE5729" radius={[3, 3, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="recoveryYield" name="Modeled Yield" stroke="#059669" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-[#F4F4F6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span>Source: Department for Education EES Dataset (019bb854-d8d5-707a-bc53-e0de9ac70891)</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-[#1C1C1C] hover:bg-neutral-800 text-white font-bold rounded-full transition-colors cursor-pointer"
          >
            Close Authority View
          </button>
        </div>
      </div>
    </div>
  );
};
