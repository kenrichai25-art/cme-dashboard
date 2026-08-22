import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ExternalLink,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  PoundSterling,
  Building,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { LEACombined, Region, RiskLevel } from '../../types';
import { formatGBP, RISK_TIER_CONFIG } from '../../utils/stratosCalculations';
import { TOTAL_AUTHORITIES_COUNT } from '../../data/cmeData';

interface StratosFinancialTableProps {
  leas: LEACombined[];
  onSelectLA: (laCode: string) => void;
  academicYear: string;
}

type SortField = 
  | 'la_name' 
  | 'region' 
  | 'total_cme' 
  | 'target_cases_count' 
  | 'w8_12_value_calc' 
  | 'w12_plus_value_calc' 
  | 'total_potential_calc' 
  | 'avg_value_per_cme_case'
  | 'risk_level';

export const StratosFinancialTable: React.FC<StratosFinancialTableProps> = ({
  leas,
  onSelectLA,
  academicYear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('total_potential_calc');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Available Regions
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    leas.forEach((la) => set.add(la.region));
    return ['All', ...Array.from(set).sort()];
  }, [leas]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Filtered and Sorted Dataset
  const filteredAndSortedLEAs = useMemo(() => {
    return leas
      .filter((la) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = la.la_name.toLowerCase().includes(q);
          const matchesCode = la.code.toLowerCase().includes(q);
          const matchesRegion = la.region.toLowerCase().includes(q);
          if (!matchesName && !matchesCode && !matchesRegion) return false;
        }

        // Region filter
        if (selectedRegion !== 'All' && la.region !== selectedRegion) {
          return false;
        }

        // Risk filter
        if (selectedRisk !== 'All' && la.risk_level !== selectedRisk) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'risk_level') {
          const riskWeight: Record<RiskLevel, number> = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1,
          };
          valA = riskWeight[a.risk_level];
          valB = riskWeight[b.risk_level];
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [leas, searchQuery, selectedRegion, selectedRisk, sortField, sortDirection]);

  // Pagination Slice
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredAndSortedLEAs.length / pageSize);
  const displayedLEAs = useMemo(() => {
    if (pageSize === 0) return filteredAndSortedLEAs;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLEAs.slice(start, start + pageSize);
  }, [filteredAndSortedLEAs, currentPage, pageSize]);

  // CSV Export for Financial Table
  const exportFinancialCSV = () => {
    const headers = [
      'Local Authority',
      'ONS GSS Code',
      'Region',
      'Authority Tier',
      'Academic Census Term',
      'Total Census CME',
      'Missing 8-12 Weeks Count',
      'Missing 12+ Weeks Count',
      'Target Actionable Cases Pool',
      '8-12 Weeks Recoverable Value (£)',
      '12+ Weeks Recoverable Value (£)',
      'Total Projected Recovery Potential (£)',
      'Value per Total Census CME Child (£)',
      'Risk Tier Matrix',
    ];

    const rows = filteredAndSortedLEAs.map((la) => [
      `"${la.la_name}"`,
      `"${la.code}"`,
      `"${la.region}"`,
      `"${la.tier}"`,
      `"${academicYear}"`,
      la.total_cme,
      la.w8_12_count,
      la.w12_plus,
      la.target_cases_count,
      la.w8_12_value_calc,
      la.w12_plus_value_calc,
      la.total_potential_calc,
      la.avg_value_per_cme_case,
      `"${la.risk_level}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CME_Financial_Impact_Model_${academicYear.replace(/[\/\s]/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm mb-8 overflow-hidden">
      {/* Controls Bar */}
      <div className="p-5 border-b border-neutral-100 bg-[#F4F4F6]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Search & Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="stratos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Authority, Region, Code..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FE5729]/20 focus:border-[#FE5729] placeholder:text-neutral-400"
              />
            </div>

            {/* Region Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-500 font-medium hidden sm:inline">Region:</span>
              <select
                id="stratos-region-select"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-neutral-200 text-neutral-700 text-xs rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FE5729]/20 focus:border-[#FE5729] cursor-pointer"
              >
                {availableRegions.map((r) => (
                  <option key={r} value={r}>
                    {r === 'All' ? 'All Regions (England)' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Level Filter Tabs */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-full border border-neutral-200 shadow-2xs text-xs">
              <span className="text-[11px] font-bold text-neutral-400 px-2 hidden md:inline">Tier:</span>
              {[
                { label: 'All', color: 'brand' },
                { label: 'Critical', color: 'rose' },
                { label: 'High', color: 'amber' },
                { label: 'Medium', color: 'sky' },
                { label: 'Low', color: 'emerald' },
              ].map((item) => {
                const isSelected = selectedRisk === item.label;
                let activeStyle = 'bg-[#FE5729] text-white shadow-xs';
                if (item.label === 'Critical') activeStyle = 'bg-rose-700 text-white shadow-xs';
                if (item.label === 'High') activeStyle = 'bg-amber-600 text-white shadow-xs';
                if (item.label === 'Medium') activeStyle = 'bg-sky-600 text-white shadow-xs';
                if (item.label === 'Low') activeStyle = 'bg-emerald-700 text-white shadow-xs';

                return (
                  <button
                    key={item.label}
                    id={`filter-risk-${item.label.toLowerCase()}`}
                    onClick={() => {
                      setSelectedRisk(item.label);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? `${activeStyle}`
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Reset, Export & Count badge */}
          <div className="flex items-center space-x-2.5 justify-between lg:justify-end">
            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
              Showing <strong className="text-[#1C1C1C]">{filteredAndSortedLEAs.length}</strong> of {leas.length} Authorities
            </span>
            <button
              id="stratos-reset-table-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('All');
                setSelectedRisk('All');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-xs gap-1.5 ${
                searchQuery || selectedRegion !== 'All' || selectedRisk !== 'All'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
              title="Reset table search, region, and risk tier filters"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${searchQuery || selectedRegion !== 'All' || selectedRisk !== 'All' ? 'text-white' : 'text-neutral-500'}`} />
              <span>Reset</span>
            </button>
            <button
              id="stratos-export-csv-btn"
              onClick={exportFinancialCSV}
              className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-neutral-800 rounded-full transition-all shadow-xs gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FE5729]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200/80 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <th
                onClick={() => handleSort('la_name')}
                className="py-3.5 px-5 cursor-pointer hover:bg-neutral-100/80 transition-colors group"
              >
                <div className="flex items-center">
                  <span>Local Authority</span>
                  {getSortIcon('la_name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('region')}
                className="py-3.5 px-3 cursor-pointer hover:bg-neutral-100/80 transition-colors group hidden md:table-cell"
              >
                <div className="flex items-center">
                  <span>Region</span>
                  {getSortIcon('region')}
                </div>
              </th>
              <th
                onClick={() => handleSort('total_cme')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-neutral-100/80 transition-colors group"
              >
                <div className="flex items-center justify-end">
                  <span>Total CME</span>
                  {getSortIcon('total_cme')}
                </div>
              </th>
              <th
                onClick={() => handleSort('target_cases_count')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-neutral-100/80 transition-colors group"
              >
                <div className="flex items-center justify-end">
                  <span>Target Pool (8w+)</span>
                  {getSortIcon('target_cases_count')}
                </div>
              </th>
              <th
                onClick={() => handleSort('w8_12_value_calc')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-neutral-100/80 transition-colors group hidden sm:table-cell"
              >
                <div className="flex items-center justify-end">
                  <span>8–12w Potential</span>
                  {getSortIcon('w8_12_value_calc')}
                </div>
              </th>
              <th
                onClick={() => handleSort('w12_plus_value_calc')}
                className="py-3.5 px-3 text-right cursor-pointer hover:bg-neutral-100/80 transition-colors group hidden sm:table-cell"
              >
                <div className="flex items-center justify-end">
                  <span>12+w Potential</span>
                  {getSortIcon('w12_plus_value_calc')}
                </div>
              </th>
              <th
                onClick={() => handleSort('total_potential_calc')}
                className="py-3.5 px-5 text-right cursor-pointer hover:bg-neutral-100/80 transition-colors group bg-[#FFF3F0]/60 text-[#1C1C1C]"
              >
                <div className="flex items-center justify-end">
                  <span>Total Potential (£)</span>
                  {getSortIcon('total_potential_calc')}
                </div>
              </th>
              <th
                onClick={() => handleSort('risk_level')}
                className="py-3.5 px-4 text-center cursor-pointer hover:bg-neutral-100/80 transition-colors group"
              >
                <div className="flex items-center justify-center">
                  <span>Risk Tier</span>
                  {getSortIcon('risk_level')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm">
            {displayedLEAs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400">
                  <Building className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="font-bold text-neutral-600">No Local Authorities matching filters</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Try adjusting your search query, region, or risk tier filters.</p>
                </td>
              </tr>
            ) : (
              displayedLEAs.map((la) => {
                const riskConf = RISK_TIER_CONFIG[la.risk_level];
                return (
                  <tr
                    key={la.code}
                    onClick={() => onSelectLA(la.code)}
                    className="hover:bg-[#FFF3F0]/40 cursor-pointer transition-colors group text-xs sm:text-sm"
                  >
                    {/* Local Authority Name */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#1C1C1C] group-hover:text-[#FE5729] flex items-center gap-1.5 text-xs sm:text-sm">
                        <span>{la.la_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-neutral-400 font-normal">
                        {la.code} • {la.tier}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-3 text-neutral-600 hidden md:table-cell font-medium text-xs sm:text-sm">
                      {la.region}
                    </td>

                    {/* Total CME */}
                    <td className="py-3.5 px-3 text-right font-medium text-neutral-700 text-xs sm:text-sm">
                      {la.total_cme.toLocaleString('en-GB')}
                    </td>

                    {/* Target Cases (8w+) */}
                    <td className="py-3.5 px-3 text-right text-xs sm:text-sm">
                      <span className="font-medium text-[#1C1C1C]">
                        {la.target_cases_count.toLocaleString('en-GB')}
                      </span>
                      <span className="text-[11px] text-neutral-400 block font-normal">
                        {la.w12_plus} in 12+w
                      </span>
                    </td>

                    {/* 8-12w Value */}
                    <td className="py-3.5 px-3 text-right text-amber-900 font-medium hidden sm:table-cell text-xs sm:text-sm">
                      {formatGBP(la.w8_12_value_calc)}
                    </td>

                    {/* 12+w Value */}
                    <td className="py-3.5 px-3 text-right text-rose-800 font-medium hidden sm:table-cell text-xs sm:text-sm">
                      {formatGBP(la.w12_plus_value_calc)}
                    </td>

                    {/* Total Potential (ONLY THIS IN BOLD) */}
                    <td className="py-3.5 px-5 text-right font-bold text-[#1C1C1C] bg-[#FFF3F0]/30 group-hover:bg-[#FFF3F0]/60">
                      <span className="text-[#FE5729] font-black text-sm sm:text-base tracking-tight">
                        {formatGBP(la.total_potential_calc)}
                      </span>
                      <span className="text-[11px] text-neutral-400 block font-normal">
                        ~{formatGBP(la.avg_value_per_cme_case)}/child
                      </span>
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskConf.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${riskConf.dotClass}`} />
                        {la.risk_level}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-neutral-100 bg-[#F4F4F6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-neutral-200 rounded-full px-2.5 py-1 text-neutral-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#FE5729] cursor-pointer"
          >
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={0}>All rows ({TOTAL_AUTHORITIES_COUNT})</option>
          </select>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className="text-neutral-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-1">
              <button
                id="pagination-prev-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="pagination-next-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
