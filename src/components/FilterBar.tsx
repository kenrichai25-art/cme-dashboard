import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Scale, 
  RotateCcw, 
  X, 
  Check, 
  ChevronDown,
  SlidersHorizontal,
  Building,
  Info,
  Layers,
  Filter,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { AcademicTerm, LocalAuthority, Region, FilterState, DurationBracket } from '../types';
import { ALL_REGIONS, ACADEMIC_TERMS, DURATION_CONFIG } from '../data/cmeData';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  localAuthorities: LocalAuthority[];
  currentLA: LocalAuthority | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  localAuthorities,
  currentLA,
}) => {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Filter LAs for autocomplete based on combobox search and selected region
  const filteredLAList = localAuthorities.filter((la) => {
    const matchesRegion =
      filters.selectedRegion === 'All England' || la.region === filters.selectedRegion;
    const q = comboboxSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      la.name.toLowerCase().includes(q) ||
      la.code.toLowerCase().includes(q) ||
      la.tier.toLowerCase().includes(q);

    return matchesRegion && matchesSearch;
  });

  // Handle outside click for combobox
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFiltered =
    filters.selectedRegion !== 'All England' ||
    filters.selectedLACode !== null ||
    filters.selectedTerm !== '2025/26 Autumn' ||
    filters.durationFilter !== 'all' ||
    filters.searchQuery !== '';

  const durationOptions: { id: DurationBracket; label: string; countHint?: string }[] = [
    { id: 'all', label: 'All Durations (1+ wks)' },
    { id: '8-12', label: '8–12 Weeks' },
    { id: '12+', label: '12+ Weeks (Persistent)' },
  ];

  return (
    <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
      {/* Top Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        
        {/* 1. Searchable LA Combobox */}
        <div className="md:col-span-5 relative" ref={comboboxRef}>
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
            Local Authority Search
          </label>

          <div
            id="la-combobox-trigger"
            onClick={() => setComboboxOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-2xl border bg-white cursor-pointer transition-all ${
              comboboxOpen
                ? 'border-[#FE5729] ring-2 ring-[#FE5729]/20'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <Building className="w-3.5 h-3.5 text-[#FE5729] shrink-0" />
              <span className={`truncate font-medium ${currentLA ? 'text-[#1C1C1C] font-bold' : 'text-neutral-500'}`}>
                {currentLA ? `${currentLA.name} (${currentLA.code})` : 'All Local Authorities (England)'}
              </span>
            </div>
            <div className="flex items-center space-x-1 pl-1">
              {currentLA && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange({ selectedLACode: null });
                  }}
                  className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors"
                  title="Clear selected LA"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* Combobox Dropdown */}
          {comboboxOpen && (
            <div className="absolute z-50 mt-1.5 w-full sm:w-88 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-100">
              <div className="p-2.5 border-b border-neutral-100 bg-[#F4F4F6]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    id="la-search-input"
                    type="text"
                    placeholder="Search by name or ONS code..."
                    value={comboboxSearch}
                    onChange={(e) => setComboboxSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100">
                <div
                  onClick={() => {
                    onFilterChange({ selectedLACode: null });
                    setComboboxOpen(false);
                    setComboboxSearch('');
                  }}
                  className={`px-3.5 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    filters.selectedLACode === null ? 'bg-[#FFF3F0] text-[#FE5729] font-bold' : 'text-neutral-700 hover:bg-[#F4F4F6]'
                  }`}
                >
                  <span>All Local Authorities (National Scope)</span>
                  {filters.selectedLACode === null && <Check className="w-4 h-4 text-[#FE5729]" />}
                </div>

                {filteredLAList.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-neutral-400">
                    No Local Authorities found matching "{comboboxSearch}"
                  </div>
                ) : (
                  filteredLAList.map((la) => (
                    <div
                      key={la.code}
                      onClick={() => {
                        onFilterChange({ 
                          selectedLACode: la.code,
                        });
                        setComboboxOpen(false);
                        setComboboxSearch('');
                      }}
                      className={`px-3.5 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        filters.selectedLACode === la.code
                          ? 'bg-[#FFF3F0] text-[#FE5729] font-bold'
                          : 'text-neutral-700 hover:bg-[#F4F4F6]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-[#1C1C1C]">{la.name}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                          <span>{la.region}</span>
                          <span>•</span>
                          <span>{la.code}</span>
                        </div>
                      </div>
                      {filters.selectedLACode === la.code && (
                        <Check className="w-4 h-4 text-[#FE5729] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Regional Selector */}
        <div className="md:col-span-3">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
            Region
          </label>
          <select
            id="region-selector-dropdown"
            value={filters.selectedRegion}
            onChange={(e) => {
              const newRegion = e.target.value as Region;
              let newLACode = filters.selectedLACode;
              if (newRegion !== 'All England' && currentLA && currentLA.region !== newRegion) {
                newLACode = null;
              }
              onFilterChange({
                selectedRegion: newRegion,
                selectedLACode: newLACode,
              });
            }}
            className="w-full border border-neutral-200 rounded-2xl px-3 py-2 text-xs text-[#1C1C1C] focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] outline-none bg-white font-semibold cursor-pointer"
          >
            <option value="All England">All England (National)</option>
            {ALL_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Academic Year & Census Term (including 25/26 data) */}
        <div className="md:col-span-4">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Academic Census Term</span>
            <div className="flex items-center gap-2">
              <span className="text-[#FE5729] font-bold text-[10px]">2025/26 active</span>
              {isFiltered && (
                <button
                  id="quick-reset-filters-btn"
                  onClick={onResetFilters}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Reset all filters back to All England view"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </label>
          <select
            id="term-selector-dropdown"
            value={filters.selectedTerm}
            onChange={(e) => onFilterChange({ selectedTerm: e.target.value as AcademicTerm })}
            className="w-full border border-neutral-200 rounded-2xl px-3 py-2 text-xs text-[#1C1C1C] focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] outline-none bg-white font-semibold cursor-pointer"
          >
            <optgroup label="Academic Year 2025/26 (Latest Census)">
              <option value="2025/26 Autumn">2025/26 Autumn Census</option>
            </optgroup>
            <optgroup label="Academic Year 2024/25">
              <option value="2024/25 Summer">2024/25 Summer Census</option>
              <option value="2024/25 Spring">2024/25 Spring Census</option>
              <option value="2024/25 Autumn">2024/25 Autumn Census</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Duration Filter Strip - Seamlessly Grouped & Aligned */}
      <div className="pt-3.5 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-[#FE5729]/10 border border-[#FE5729]/20 flex items-center justify-center text-[#FE5729]">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#1C1C1C] whitespace-nowrap">
            Duration Cohort:
          </span>
        </div>

        {/* Duration Segmented Button Bar sitting directly next to the label */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F4F6] p-1 rounded-2xl sm:rounded-full border border-neutral-200/80">
          {durationOptions.map((opt) => {
            const isSelected = filters.durationFilter === opt.id;
            let activeStyle = 'bg-[#1C1C1C] text-white font-bold shadow-xs';
            if (opt.id === '8-12') activeStyle = 'bg-amber-600 text-white font-bold shadow-xs';
            if (opt.id === '12+') activeStyle = 'bg-rose-600 text-white font-bold shadow-xs';

            return (
              <button
                key={opt.id}
                id={`duration-filter-${opt.id}`}
                onClick={() => onFilterChange({ durationFilter: opt.id })}
                className={`px-3.5 py-1 text-xs rounded-full transition-all border cursor-pointer active:scale-95 ${
                  isSelected
                    ? `${activeStyle} border-transparent`
                    : 'bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border-neutral-200 font-semibold'
                }`}
                title={DURATION_CONFIG[opt.id]?.filterDescription}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {filters.durationFilter !== 'all' && (
          <button
            id="clear-duration-filter-btn"
            onClick={() => onFilterChange({ durationFilter: 'all' })}
            className="text-[11px] font-bold text-neutral-400 hover:text-neutral-700 underline cursor-pointer sm:ml-auto"
          >
            Clear Duration
          </button>
        )}
      </div>
    </div>
  );
};
