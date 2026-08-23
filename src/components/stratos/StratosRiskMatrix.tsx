import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Globe, 
  HelpCircle, 
  Search,
  ExternalLink,
  ArrowRight,
  PoundSterling,
  Building,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { LEACombined, RiskLevel } from '../../types';
import { formatGBP, RISK_TIER_CONFIG } from '../../utils/stratosCalculations';
import { TOTAL_AUTHORITIES_COUNT } from '../../data/cmeData';
import { EstimateMarker } from './EstimateMarker';

interface StratosRiskMatrixProps {
  leas: LEACombined[];
  onSelectLA: (laCode: string) => void;
  academicYear: string;
}

export const StratosRiskMatrix: React.FC<StratosRiskMatrixProps> = ({
  leas,
  onSelectLA,
  academicYear,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<RiskLevel | 'All'>('Critical');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Counts by tier
  const criticalLEAs = leas.filter((la) => la.risk_level === 'Critical');
  const highLEAs = leas.filter((la) => la.risk_level === 'High');
  const mediumLEAs = leas.filter((la) => la.risk_level === 'Medium');
  const lowLEAs = leas.filter((la) => la.risk_level === 'Low');

  // Filtered by active tab and search query
  const displayedLEAs = leas
    .filter((la) => {
      if (selectedRiskFilter !== 'All' && la.risk_level !== selectedRiskFilter) {
        return false;
      }
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase();
        return (
          la.la_name.toLowerCase().includes(q) ||
          la.region.toLowerCase().includes(q) ||
          la.code.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => b.total_potential_calc - a.total_potential_calc);

  return (
    <div className="space-y-6 mb-8">
      {/* Matrix Header Intro Banner */}
      <div className="bg-[#1C1C1C] text-white rounded-3xl p-6 shadow-sm border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FE5729]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-xs border border-rose-500/30">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Statutory Risk Stratification
              </div>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white font-display">
              LEA Compliance Risk Tier Matrix
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl mt-1 leading-relaxed">
              Automated categorization of all {TOTAL_AUTHORITIES_COUNT} English Education Authorities based on 12+ weeks persistent absence volume, unknown trace caseload, overseas relocation indicators, and projected Child Benefit overpayment exposure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-3 bg-neutral-900/90 p-3 rounded-2xl border border-neutral-700/70">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Critical & High</div>
                <div className="text-lg sm:text-xl font-semibold text-rose-400 tracking-tight">
                  {criticalLEAs.length + highLEAs.length} Authorities
                </div>
              </div>
              <div className="h-7 w-px bg-neutral-700 mx-0.5" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium flex items-center gap-1.5">At-Risk Value <EstimateMarker /></div>
                <div className="text-lg sm:text-xl font-semibold text-[#FE5729] tracking-tight">
                  {formatGBP(
                    [...criticalLEAs, ...highLEAs].reduce((s, c) => s + c.total_potential_calc, 0),
                    true
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Risk Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical */}
        <div
          onClick={() => setSelectedRiskFilter('Critical')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
            selectedRiskFilter === 'Critical'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white border-neutral-200 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
              Critical Priority
              <EstimateMarker />
            </span>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-extrabold text-xs">
              {criticalLEAs.length} LEAs
            </span>
          </div>
          <div className="mt-2.5 text-3xl sm:text-4xl font-semibold text-rose-950 tracking-tight leading-none">
            {formatGBP(criticalLEAs.reduce((s, c) => s + c.total_potential_calc, 0), true)}
          </div>
          <p className="text-[11px] text-rose-700/90 mt-2 leading-relaxed">
            {RISK_TIER_CONFIG.Critical.description}
          </p>
        </div>

        {/* High */}
        <div
          onClick={() => setSelectedRiskFilter('High')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
            selectedRiskFilter === 'High'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-neutral-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              High Priority
              <EstimateMarker />
            </span>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-extrabold text-xs">
              {highLEAs.length} LEAs
            </span>
          </div>
          <div className="mt-2.5 text-3xl sm:text-4xl font-semibold text-amber-950 tracking-tight leading-none">
            {formatGBP(highLEAs.reduce((s, c) => s + c.total_potential_calc, 0), true)}
          </div>
          <p className="text-[11px] text-amber-700/90 mt-2 leading-relaxed">
            {RISK_TIER_CONFIG.High.description}
          </p>
        </div>

        {/* Medium */}
        <div
          onClick={() => setSelectedRiskFilter('Medium')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
            selectedRiskFilter === 'Medium'
              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20 shadow-sm'
              : 'bg-white border-neutral-200 hover:border-sky-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
              Medium Priority
              <EstimateMarker />
            </span>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full font-extrabold text-xs">
              {mediumLEAs.length} LEAs
            </span>
          </div>
          <div className="mt-2.5 text-3xl sm:text-4xl font-semibold text-sky-950 tracking-tight leading-none">
            {formatGBP(mediumLEAs.reduce((s, c) => s + c.total_potential_calc, 0), true)}
          </div>
          <p className="text-[11px] text-sky-700/90 mt-2 leading-relaxed">
            {RISK_TIER_CONFIG.Medium.description}
          </p>
        </div>

        {/* Low */}
        <div
          onClick={() => setSelectedRiskFilter('Low')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer ${
            selectedRiskFilter === 'Low'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-neutral-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              Low Priority
              <EstimateMarker />
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold text-xs">
              {lowLEAs.length} LEAs
            </span>
          </div>
          <div className="mt-2.5 text-3xl sm:text-4xl font-semibold text-emerald-950 tracking-tight leading-none">
            {formatGBP(lowLEAs.reduce((s, c) => s + c.total_potential_calc, 0), true)}
          </div>
          <p className="text-[11px] text-emerald-700/90 mt-2 leading-relaxed">
            {RISK_TIER_CONFIG.Low.description}
          </p>
        </div>
      </div>

      {/* Grid of Authorities within selected tier */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-neutral-100 gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-extrabold text-[#1C1C1C] font-display">
              {selectedRiskFilter === 'All' ? 'All Authorities' : `${selectedRiskFilter} Priority Authorities`}
            </h3>
            <span className="text-xs text-neutral-400 font-medium">({displayedLEAs.length} listed)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="matrix-search-input"
                type="text"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                placeholder="Filter tier authorities..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#F4F4F6] border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FE5729]/20 focus:border-[#FE5729]"
              />
            </div>
            <button
              onClick={() => setSelectedRiskFilter('All')}
              className={`text-xs px-3.5 py-1.5 rounded-full border font-bold transition-all cursor-pointer ${
                selectedRiskFilter === 'All'
                  ? 'bg-[#1C1C1C] text-white border-neutral-900 shadow-xs'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Show All {TOTAL_AUTHORITIES_COUNT}
            </button>
          </div>
        </div>

        {/* Authority Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
          {displayedLEAs.map((la) => {
            const riskConf = RISK_TIER_CONFIG[la.risk_level];
            return (
              <div
                key={la.code}
                onClick={() => onSelectLA(la.code)}
                className="p-5 rounded-2xl border border-neutral-200/90 hover:border-[#FE5729]/40 hover:shadow-md bg-white transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1C1C] group-hover:text-[#FE5729] transition-colors flex items-center gap-1.5">
                        <span>{la.la_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{la.region}</span>
                        <span>•</span>
                        <span className="font-medium">{la.code}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${riskConf.badgeClass}`}
                    >
                      {la.risk_level}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-2xl bg-[#F4F4F6] border border-neutral-200/60 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block tracking-wider mb-0.5">Total CME</span>
                      <span className="text-xl sm:text-2xl font-normal text-[#1C1C1C] tracking-tight block leading-tight">{la.total_cme}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block tracking-wider mb-0.5">12+ Weeks</span>
                      <span className="text-xl sm:text-2xl font-normal text-rose-600 tracking-tight block leading-tight">{la.w12_plus}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block tracking-wider mb-0.5">Unknown</span>
                      <span className="text-xl sm:text-2xl font-normal text-neutral-700 tracking-tight block leading-tight">{la.unknown}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Value & Action */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5">Projected Potential <EstimateMarker /></span>
                    <span className="text-lg sm:text-xl font-normal text-[#FE5729] tracking-tight block leading-tight">{formatGBP(la.total_potential_calc)}</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 group-hover:text-[#FE5729] flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
