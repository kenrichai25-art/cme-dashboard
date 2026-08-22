import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Layers, 
  ArrowUpDown, 
  MapPin, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  AcademicTerm, 
  CalculatorParams, 
  FilterState, 
  LocalAuthority, 
  Region 
} from '../types';
import {
  ALL_REGIONS,
  LOCAL_AUTHORITIES_DATA,
  TOTAL_AUTHORITIES_COUNT,
} from '../data/cmeData';
import { DataTable } from './DataTable';

interface LocalAuthorityExplorerProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSelectLA: (code: string) => void;
  onOpenLADetail: (la: LocalAuthority) => void;
  onExportCSV: () => void;
  calculatorParams: CalculatorParams;
}

type QuickPreset = 'all' | 'top-volume' | 'highest-rate' | 'highest-persistent' | 'highest-recovery';

export const LocalAuthorityExplorer: React.FC<LocalAuthorityExplorerProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onSelectLA,
  onOpenLADetail,
  onExportCSV,
  calculatorParams,
}) => {
  const [activePreset, setActivePreset] = useState<QuickPreset>('all');

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FFF3F0] border border-[#FFE4DC] text-[#FE5729] text-[11px] font-bold tracking-wide uppercase">
                {TOTAL_AUTHORITIES_COUNT} Upper Tier Authorities
              </span>
              <span className="text-neutral-300 text-xs">•</span>
              <span className="text-xs text-neutral-500 font-medium">100% England Geographic Coverage</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1C1C1C] tracking-tight mt-1.5 font-display">
              Local Authority CME League Table & Explorer
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
              Compare statutory ratios, persistent duration cohorts (8-12 wks, 12+ wks), and CME financial impact yields across all English councils.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FE5729] hover:bg-[#E0461B] text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
              title="Download filtered dataset as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export League Table (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Ribbon: Search + Region + Term + Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-neutral-100 items-center">
          
          {/* 1. Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search council or code (e.g. Birmingham)..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full bg-[#F4F4F6] border border-neutral-200 rounded-full pl-9 pr-8 py-2.5 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] focus:bg-white transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Region Selector */}
          <div className="sm:col-span-3">
            <select
              value={filters.selectedRegion}
              onChange={(e) => onFilterChange({ selectedRegion: e.target.value as Region, selectedLACode: null })}
              className="w-full bg-[#F4F4F6] border border-neutral-200 rounded-full px-4 py-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] focus:bg-white cursor-pointer"
            >
              <option value="All England">All England ({TOTAL_AUTHORITIES_COUNT} Authorities)</option>
              {ALL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r} Region
                </option>
              ))}
            </select>
          </div>

          {/* 3. Census Term Selector */}
          <div className="sm:col-span-3">
            <select
              value={filters.selectedTerm}
              onChange={(e) => onFilterChange({ selectedTerm: e.target.value as AcademicTerm })}
              className="w-full bg-[#F4F4F6] border border-neutral-200 rounded-full px-4 py-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] focus:bg-white cursor-pointer"
            >
              <option value="2025/26 Autumn">2025/26 Autumn Census (Latest)</option>
              <option value="2024/25 Summer">2024/25 Summer Census</option>
              <option value="2024/25 Spring">2024/25 Spring Census</option>
              <option value="2024/25 Autumn">2024/25 Autumn Census</option>
            </select>
          </div>

          {/* 4. Reset Button */}
          <div className="sm:col-span-1 flex justify-end">
            {(filters.selectedRegion !== 'All England' || filters.searchQuery) && (
              <button
                onClick={onResetFilters}
                className="p-2.5 rounded-full bg-[#F4F4F6] hover:bg-neutral-200/80 border border-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Master Data Table */}
      <DataTable
        localAuthorities={LOCAL_AUTHORITIES_DATA}
        filters={filters}
        onSelectLA={onSelectLA}
        onOpenLADetail={onOpenLADetail}
        onExportCSV={onExportCSV}
        onReset={onResetFilters}
        calculatorParams={calculatorParams}
      />
    </div>
  );
};
