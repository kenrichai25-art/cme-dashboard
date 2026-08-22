import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Eye, 
  Filter, 
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  PoundSterling,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { AcademicTerm, FilterState, LocalAuthority, TableColumnSort, DurationBracket, CalculatorParams } from '../types';
import { formatUKNumber, formatUKCurrency, REASON_LABELS, DURATION_CONFIG } from '../data/cmeData';

interface DataTableProps {
  localAuthorities: LocalAuthority[];
  filters: FilterState;
  onSelectLA: (code: string) => void;
  onOpenLADetail: (la: LocalAuthority) => void;
  onExportCSV: () => void;
  onReset?: () => void;
  calculatorParams?: CalculatorParams;
}

export const DataTable: React.FC<DataTableProps> = ({
  localAuthorities,
  filters,
  onSelectLA,
  onOpenLADetail,
  onExportCSV,
  onReset,
  calculatorParams = { recoveryPerCase: 2800, strikeRate: 0.75 },
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<TableColumnSort>({
    field: 'recoveryYield',
    direction: 'desc',
  });

  const handleReset = () => {
    setTableSearch('');
    setCurrentPage(1);
    if (onReset) {
      onReset();
    }
  };

  const term = filters.selectedTerm;
  const durationFilter = filters.durationFilter;
  const excludeSEN = !!filters.excludeSEN;
  const effectiveValPerCase = calculatorParams.recoveryPerCase * calculatorParams.strikeRate;

  // Filter list by region and table-level search
  const filteredData = useMemo(() => {
    return localAuthorities.filter((la) => {
      const matchesRegion =
        filters.selectedRegion === 'All England' || la.region === filters.selectedRegion;
      
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        la.name.toLowerCase().includes(q) ||
        la.code.toLowerCase().includes(q) ||
        la.region.toLowerCase().includes(q) ||
        la.tier.toLowerCase().includes(q);

      return matchesRegion && matchesSearch;
    });
  }, [localAuthorities, filters.selectedRegion, tableSearch]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dataA = a.termsData[term];
      const dataB = b.termsData[term];

      const factorA = excludeSEN ? Math.max(0.1, (100 - (dataA?.senProportionPercent || 30)) / 100) : 1.0;
      const factorB = excludeSEN ? Math.max(0.1, (100 - (dataB?.senProportionPercent || 30)) / 100) : 1.0;

      const rawTotalA = typeof dataA?.totalCME === 'number' ? dataA.totalCME : 0;
      const rawTotalB = typeof dataB?.totalCME === 'number' ? dataB.totalCME : 0;
      const totalCMEA = Math.round(rawTotalA * factorA);
      const totalCMEB = Math.round(rawTotalB * factorB);

      const w8_12A = Math.round((typeof dataA?.durationWeeks?.weeks8To12 === 'number' ? dataA.durationWeeks.weeks8To12 : 0) * factorA);
      const w8_12B = Math.round((typeof dataB?.durationWeeks?.weeks8To12 === 'number' ? dataB.durationWeeks.weeks8To12 : 0) * factorB);

      const w12pA = Math.round((typeof dataA?.durationWeeks?.weeks12Plus === 'number' ? dataA.durationWeeks.weeks12Plus : 0) * factorA);
      const w12pB = Math.round((typeof dataB?.durationWeeks?.weeks12Plus === 'number' ? dataB.durationWeeks.weeks12Plus : 0) * factorB);

      const w1_8A = Math.round((typeof dataA?.durationWeeks?.weeks1To8 === 'number' ? dataA.durationWeeks.weeks1To8 : 0) * factorA);
      const w1_8B = Math.round((typeof dataB?.durationWeeks?.weeks1To8 === 'number' ? dataB.durationWeeks.weeks1To8 : 0) * factorB);

      const target8PlusA = w8_12A + w12pA;
      const target8PlusB = w8_12B + w12pB;

      const yieldA = Math.round(target8PlusA * effectiveValPerCase);
      const yieldB = Math.round(target8PlusB * effectiveValPerCase);

      let valA: any = 0;
      let valB: any = 0;

      switch (sortConfig.field) {
        case 'name':
          return sortConfig.direction === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'code':
          return sortConfig.direction === 'asc'
            ? a.code.localeCompare(b.code)
            : b.code.localeCompare(a.code);
        case 'region':
          return sortConfig.direction === 'asc'
            ? a.region.localeCompare(b.region)
            : b.region.localeCompare(a.region);
        case 'totalCME':
          valA = totalCMEA;
          valB = totalCMEB;
          break;
        case 'targetCases8Plus':
          valA = target8PlusA;
          valB = target8PlusB;
          break;
        case 'recoveryYield':
          valA = yieldA;
          valB = yieldB;
          break;
        case 'weeks8To12':
          valA = w8_12A;
          valB = w8_12B;
          break;
        case 'weeks12Plus':
          valA = w12pA;
          valB = w12pB;
          break;
        case 'weeks1To8':
          valA = w1_8A;
          valB = w1_8B;
          break;
        case 'senProportionPercent':
          valA = excludeSEN ? 0 : (dataA?.senProportionPercent || 0);
          valB = excludeSEN ? 0 : (dataB?.senProportionPercent || 0);
          break;
        default:
          valA = yieldA;
          valB = yieldB;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, term, sortConfig, excludeSEN, effectiveValPerCase]);

  // Pagination calculations
  const totalItems = sortedData.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(() => {
    if (pageSize === 0) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle sort header click
  const handleSort = (field: TableColumnSort['field']) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getSortIcon = (field: TableColumnSort['field']) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600 font-bold" />
    );
  };

  // Helper to determine primary reason for a specific LA
  const getPrimaryReason = (la: LocalAuthority) => {
    const data = la.termsData[term];
    if (!data) return '—';
    const entries = Object.entries(data.reasons) as [keyof typeof REASON_LABELS, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const topKey = entries[0]?.[0];
    return topKey ? REASON_LABELS[topKey]?.label : '—';
  };

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-extrabold text-[#1C1C1C] font-display">
              Statutory CME Register & Duration Breakdown
            </h3>
            <span className="text-[10px] font-bold text-[#FE5729] bg-[#FFF3F0] border border-[#FFE4DC] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {term}
            </span>
            {durationFilter !== 'all' && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Duration: {DURATION_CONFIG[durationFilter]?.label}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Showing {totalItems} of {localAuthorities.length} English Education Authorities • Section 436A Education Act Returns
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Table quick search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              id="table-quick-search"
              type="text"
              placeholder="Search 153 authorities..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3.5 py-2 text-xs bg-[#F4F4F6] border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] focus:bg-white w-48 sm:w-60 text-neutral-800 placeholder:text-neutral-400 font-medium transition-all"
            />
          </div>

          {/* Reset button */}
          <button
            id="table-reset-filters-btn"
            onClick={handleReset}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer shadow-2xs active:scale-95 ${
              filters.selectedLACode || filters.selectedRegion !== 'All England' || filters.durationFilter !== 'all' || tableSearch
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-500/20'
                : 'bg-[#F4F4F6] hover:bg-neutral-200/80 text-neutral-700 border-neutral-200'
            }`}
            title="Reset selected authority, search, and filters to All England view"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${filters.selectedLACode || filters.selectedRegion !== 'All England' || filters.durationFilter !== 'all' || tableSearch ? 'text-white' : 'text-neutral-500'}`} />
            <span>Reset {filters.selectedLACode ? 'Selection' : 'View'}</span>
          </button>

          {/* Export CSV button */}
          <button
            id="table-download-csv-btn"
            onClick={onExportCSV}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FE5729] hover:bg-[#E0461B] rounded-full transition-all shadow-xs hover:shadow cursor-pointer active:scale-95"
            title="Download CSV for current filtered view"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Container with 2-line narrow-column table headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-neutral-100/90 text-neutral-600 border-b border-neutral-200 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3.5 cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center space-x-1">
                  <span className="leading-tight block">Local<br />Authority</span>
                  {getSortIcon('name')}
                </div>
              </th>

              <th
                onClick={() => handleSort('region')}
                className="py-2.5 px-3 cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center space-x-1">
                  <span className="leading-tight block">Region<br />Name</span>
                  {getSortIcon('region')}
                </div>
              </th>

              <th
                onClick={() => handleSort('totalCME')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">Total<br />CME</span>
                  {getSortIcon('totalCME')}
                </div>
              </th>

              {/* 8-12 Weeks Column */}
              <th
                onClick={() => handleSort('weeks8To12')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:bg-amber-100/80 transition-colors whitespace-nowrap ${
                  durationFilter === '8-12' ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-amber-50/60 text-amber-900'
                }`}
                title="Target CME missing 8 to 12 weeks"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">8–12<br />Weeks</span>
                  {getSortIcon('weeks8To12')}
                </div>
              </th>

              {/* 12+ Weeks Column */}
              <th
                onClick={() => handleSort('weeks12Plus')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:bg-rose-100/80 transition-colors whitespace-nowrap ${
                  durationFilter === '12+' ? 'bg-rose-100 text-rose-900 font-bold' : 'bg-rose-50/60 text-rose-900'
                }`}
                title="Persistent CME missing 12+ weeks"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">12+<br />Weeks</span>
                  {getSortIcon('weeks12Plus')}
                </div>
              </th>

              {/* Actionable 8+ Weeks Cohort */}
              <th
                onClick={() => handleSort('targetCases8Plus')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap bg-emerald-50/50 text-emerald-950 font-bold"
                title="Actionable Target Cases (8-12 weeks + 12+ weeks)"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">Target<br />(8+ Wks)</span>
                  {getSortIcon('targetCases8Plus')}
                </div>
              </th>

              {/* Recovery Yield (£) Column */}
              <th
                onClick={() => handleSort('recoveryYield')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-emerald-100/80 transition-colors whitespace-nowrap bg-emerald-50/90 text-emerald-900 font-bold"
                title="Modelled Recovery Yield based on calculator parameters"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">Modelled<br />Yield (£)</span>
                  {getSortIcon('recoveryYield')}
                </div>
              </th>

              {/* Duration Breakdown Columns */}
              <th
                onClick={() => handleSort('weeks1To8')}
                className={`py-2.5 px-2.5 text-right cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap text-neutral-500 ${
                  durationFilter === '1-8' ? 'bg-sky-100 text-sky-900 font-bold' : ''
                }`}
                title="CME missing 1 to 8 weeks (Early stage)"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">1–8<br />Weeks</span>
                  {getSortIcon('weeks1To8')}
                </div>
              </th>

              <th
                onClick={() => handleSort('senProportionPercent')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-neutral-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span className="leading-tight block">SEN /<br />EHCP %</span>
                  {getSortIcon('senProportionPercent')}
                </div>
              </th>

              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                <span className="leading-tight block">Action<br />Record</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-neutral-400 font-medium">
                  No Local Authorities match the current search filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((la) => {
                const d = la.termsData[term];
                const isSelected = filters.selectedLACode === la.code;
                const isSuppressed = d?.totalCME === 'c';

                const senPercent = d?.senProportionPercent || 30;
                const factor = excludeSEN ? Math.max(0.1, (100 - senPercent) / 100) : 1.0;

                const rawTotal = typeof d?.totalCME === 'number' ? d.totalCME : 0;
                const totalCME = Math.round(rawTotal * factor);
                const rawW8_12 = typeof d?.durationWeeks?.weeks8To12 === 'number' ? d.durationWeeks.weeks8To12 : 0;
                const w8_12 = Math.round(rawW8_12 * factor);
                const rawW12p = typeof d?.durationWeeks?.weeks12Plus === 'number' ? d.durationWeeks.weeks12Plus : 0;
                const w12p = Math.round(rawW12p * factor);
                const rawW1_8 = typeof d?.durationWeeks?.weeks1To8 === 'number' ? d.durationWeeks.weeks1To8 : 0;
                const w1_8 = Math.round(rawW1_8 * factor);

                const target8Plus = w8_12 + w12p;
                const yieldVal = Math.round(target8Plus * effectiveValPerCase);

                return (
                  <tr
                    key={la.code}
                    onClick={() => onSelectLA(la.code)}
                    className={`transition-colors cursor-pointer text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-[#FFF3F0]'
                        : 'hover:bg-neutral-50/80'
                    }`}
                  >
                    {/* 1. Name and ONS Code */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2">
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#FE5729] flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-[#1C1C1C] text-xs sm:text-sm">{la.name}</span>
                          <div className="text-[11px] text-neutral-400 font-normal">
                            {la.code} • {la.tier}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Region */}
                    <td className="py-3 px-3 text-neutral-600">
                      <span className="text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                        {la.region}
                      </span>
                    </td>

                    {/* 3. Total CME */}
                    <td className="py-3 px-3 text-right">
                      {isSuppressed ? (
                        <span className="text-neutral-400 italic text-xs sm:text-sm" title="Suppressed (<5)">
                          c*
                        </span>
                      ) : (
                        <span className="font-medium text-[#1C1C1C] text-xs sm:text-sm">
                          {formatUKNumber(totalCME)}
                        </span>
                      )}
                    </td>

                    {/* 4. 8-12 Weeks Duration */}
                    <td className="py-3 px-3 text-right font-medium text-amber-900 bg-amber-50/20 text-xs sm:text-sm">
                      {formatUKNumber(w8_12)}
                    </td>

                    {/* 5. 12+ Weeks Duration */}
                    <td className="py-3 px-3 text-right font-medium text-rose-800 bg-rose-50/20 text-xs sm:text-sm">
                      {formatUKNumber(w12p)}
                    </td>

                    {/* 6. Actionable Target Cohort (8+ Wks) */}
                    <td className="py-3 px-3 text-right font-medium text-emerald-950 bg-emerald-50/20 text-xs sm:text-sm">
                      {formatUKNumber(target8Plus)}
                    </td>

                    {/* 7. Modelled Recovery Yield (£) - ONLY THIS IN BOLD */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 bg-emerald-50/40 text-xs sm:text-sm">
                      {formatUKCurrency(yieldVal)}
                    </td>

                    {/* 8. 1-8 Weeks Duration */}
                    <td className="py-3 px-2.5 text-right text-neutral-500 font-medium text-xs sm:text-sm">
                      {formatUKNumber(w1_8)}
                    </td>

                    {/* 9. SEN % */}
                    <td className="py-3 px-3 text-right text-xs sm:text-sm">
                      <span className={`text-neutral-700 font-medium ${excludeSEN ? 'text-neutral-400 italic' : ''}`}>
                        {excludeSEN ? '0% (excl)' : `${d?.senProportionPercent || 0}%`}
                      </span>
                    </td>

                    {/* 10. Actions */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLADetail(la);
                          }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold text-[#FE5729] bg-[#FFF3F0] hover:bg-[#FE5729] hover:text-white border border-[#FFE4DC] rounded-full transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                          title="Inspect full longitudinal LA record"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FE5729] group-hover:text-white transition-colors" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer Controls */}
      <div className="p-4 border-t border-neutral-200 bg-[#F4F4F6]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-neutral-300 bg-white rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-700 outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={153}>All (153 LAs)</option>
          </select>
          <span className="font-medium">
            Showing {pageSize === 0 ? totalItems : Math.min(totalItems, (currentPage - 1) * pageSize + 1)} -{' '}
            {pageSize === 0 ? totalItems : Math.min(totalItems, currentPage * pageSize)} of {totalItems}
          </span>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2.5 font-bold text-neutral-800">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
