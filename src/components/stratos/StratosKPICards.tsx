import React from 'react';
import { 
  PoundSterling, 
  Users, 
  Clock, 
  ShieldAlert, 
  Building
} from 'lucide-react';
import { StratosNationalAggregate } from '../../types';
import { formatGBP } from '../../utils/stratosCalculations';
import { EstimateMarker } from './EstimateMarker';

interface StratosKPICardsProps {
  stats: StratosNationalAggregate;
  termLabel: string;
}

export const StratosKPICards: React.FC<StratosKPICardsProps> = ({ stats, termLabel }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. Total Projected Recovery Potential */}
      <div className="bg-[#1C1C1C] text-white rounded-3xl p-5 relative overflow-hidden border border-neutral-800 shadow-md group hover:border-[#FE5729]/50 transition-all">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#FE5729]/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            Total Recovery Potential
            <EstimateMarker />
          </span>
          <div className="w-8 h-8 rounded-full bg-[#FE5729]/20 text-[#FE5729] flex items-center justify-center border border-[#FE5729]/30">
            <PoundSterling className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold text-white tracking-tight leading-none">
            {formatGBP(stats.total_projected_potential, true)}
          </span>
        </div>
        <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2.5 relative z-10">
          <span>Full Value:</span>
          <span className="font-semibold text-[#FE5729]">{formatGBP(stats.total_projected_potential)}</span>
        </div>
      </div>

      {/* 2. Target Actionable Cases Pool */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all hover:border-[#FE5729]/40 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            Actionable Target Pool
            <EstimateMarker />
          </span>
          <div className="w-8 h-8 rounded-full bg-[#F4F4F6] text-[#1C1C1C] flex items-center justify-center border border-neutral-200">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold text-[#1C1C1C] tracking-tight leading-none">
            {stats.total_target_cases.toLocaleString('en-GB')}
          </span>
          <span className="text-xs text-neutral-400 font-medium">cases</span>
        </div>
        <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-2.5">
          <span>Share of Census CME:</span>
          <span className="font-semibold text-[#1C1C1C]">
            {stats.total_cme > 0 ? Math.round((stats.total_target_cases / stats.total_cme) * 100) : 0}% of {stats.total_cme.toLocaleString('en-GB')}
          </span>
        </div>
      </div>

      {/* 3. 12+ Weeks Primary Risk Pool */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all hover:border-rose-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            12+ Weeks High Risk
          </span>
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold text-rose-600 tracking-tight leading-none">
            {formatGBP(stats.total_w12_plus_value, true)}
          </span>
        </div>
        <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-2.5">
          <span>{stats.total_w12_plus_count.toLocaleString('en-GB')} Cases:</span>
          <span className="font-semibold text-rose-600">Statutory Breach</span>
        </div>
      </div>

      {/* 4. 8-12 Weeks Early Alert Pool */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all hover:border-amber-300 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            8–12 Wks Travel Expiry
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold text-amber-600 tracking-tight leading-none">
            {formatGBP(stats.total_w8_12_value, true)}
          </span>
        </div>
        <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-2.5">
          <span>{stats.total_w8_12_count.toLocaleString('en-GB')} Cases:</span>
          <span className="font-semibold text-amber-600">Early Intervention</span>
        </div>
      </div>

      {/* 5. Critical & High Priority Authorities */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden transition-all hover:border-neutral-400 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Priority Authorities
          </span>
          <div className="w-8 h-8 rounded-full bg-[#F4F4F6] text-[#1C1C1C] flex items-center justify-center border border-neutral-200">
            <Building className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl lg:text-[2.25rem] font-semibold text-[#1C1C1C] tracking-tight leading-none">
            {stats.critical_leas_count + stats.high_leas_count}
          </span>
          <span className="text-xs text-neutral-400 font-medium">of {stats.total_leas} LEAs</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 pt-2.5">
          <span className="text-rose-600 font-semibold">{stats.critical_leas_count} Critical</span>
          <span className="text-amber-600 font-semibold">{stats.high_leas_count} High</span>
        </div>
      </div>
    </div>
  );
};
