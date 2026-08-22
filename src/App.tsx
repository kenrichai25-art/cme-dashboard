import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  FileSpreadsheet, 
  HelpCircle, 
  ExternalLink,
  Code2,
  RefreshCw,
  AlertCircle,
  Download,
  Database,
  CheckCircle2,
  Sliders,
  Scale,
  PoundSterling
} from 'lucide-react';
import { 
  AcademicTerm, 
  CalculatorParams, 
  FilterState, 
  LocalAuthority, 
  MainDashboardTab, 
  Region 
} from './types';
import {
  LOCAL_AUTHORITIES_DATA,
  calculateAggregate,
  formatUKNumber,
  TOTAL_AUTHORITIES_COUNT
} from './data/cmeData';
import { DFE_REASON_CATEGORIES, parseCell, SCOPE_TIERS } from './data/cmeScope';
import { EstimateMarker } from './components/stratos/EstimateMarker';
import { 
  DfeApiStatus, 
  testDfeApiConnection, 
  pullAllEnglandData, 
  PullProgress 
} from './services/dfeApiService';
import { 
  DEFAULT_CALCULATOR_PARAMS, 
  computeSTRATOSLEAs, 
  computeStratosNationalAggregate, 
  computeStratosRegionalRollup, 
  formatGBP 
} from './utils/stratosCalculations';
import { Header } from './components/Header';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { LocalAuthorityExplorer } from './components/LocalAuthorityExplorer';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { VisualisationSuite } from './components/VisualisationSuite';
import { DataTable } from './components/DataTable';
import { LADetailModal } from './components/LADetailModal';
import { MethodologyModal } from './components/MethodologyModal';
import { ApiExplorerModal } from './components/ApiExplorerModal';

// STRATOS Imported Components
import { StratosCalculatorSettings } from './components/stratos/StratosCalculatorSettings';
import { StratosKPICards } from './components/stratos/StratosKPICards';
import { StratosChartsSection } from './components/stratos/StratosChartsSection';
import { StratosFinancialTable } from './components/stratos/StratosFinancialTable';
import { StratosRiskMatrix } from './components/stratos/StratosRiskMatrix';
import { StratosComplianceGuide } from './components/stratos/StratosComplianceGuide';
import { StratosDataBridge } from './components/stratos/StratosDataBridge';
import { HelpGuide } from './components/HelpGuide';

export default function App() {
  // 1. Navigation & View State (Default to Executive Overview)
  const [activeTab, setActiveTab] = useState<MainDashboardTab>('executive-overview');

  // 2. Core Filter State
  const [filters, setFilters] = useState<FilterState>({
    selectedRegion: 'All England',
    selectedLACode: null,
    selectedTerm: '2025/26 Autumn',
    durationFilter: 'all',
    compareBenchmark: true,
    benchmarkType: 'national',
    searchQuery: '',
  });

  // 3. STRATOS Financial Calculator Parameters
  const [calculatorParams, setCalculatorParams] = useState<CalculatorParams>(DEFAULT_CALCULATOR_PARAMS);

  // 4. API & Sync State
  const [apiStatus, setApiStatus] = useState<DfeApiStatus | null>(null);
  const [isPullingData, setIsPullingData] = useState(false);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [inspectingLA, setInspectingLA] = useState<LocalAuthority | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isApiExplorerOpen, setIsApiExplorerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize DfE API status check
  useEffect(() => {
    testDfeApiConnection().then(setApiStatus);
  }, []);

  // Display brief notification toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pull all data for England handler
  const handlePullAllEnglandData = async () => {
    setIsPullingData(true);
    try {
      const result = await pullAllEnglandData((progress) => {
        setPullProgress(progress);
      });
      setApiStatus(result.status);
      setFilters((prev) => ({
        ...prev,
        selectedRegion: 'All England',
        selectedLACode: null,
      }));
      showToast(`Synchronised all ${TOTAL_AUTHORITIES_COUNT} English Local Authorities from DfE EES API (100% Coverage)`);
    } catch (err) {
      showToast('Error syncing with DfE EES API. Using verified local census cache.');
    } finally {
      setIsPullingData(false);
      setTimeout(() => setPullProgress(null), 2500);
    }
  };

  // Find currently selected Local Authority
  const currentLA = useMemo(() => {
    if (!filters.selectedLACode) return null;
    return LOCAL_AUTHORITIES_DATA.find((la) => la.code === filters.selectedLACode) || null;
  }, [filters.selectedLACode]);

  // Compute LAs in the current geographic scope
  const scopedLAs = useMemo(() => {
    if (currentLA) return [currentLA];
    if (filters.selectedRegion === 'All England') return LOCAL_AUTHORITIES_DATA;
    return LOCAL_AUTHORITIES_DATA.filter((la) => la.region === filters.selectedRegion);
  }, [currentLA, filters.selectedRegion]);

  // Compute current aggregated stats for DfE tab
  const currentStats = useMemo(() => {
    const label = currentLA
      ? currentLA.name
      : filters.selectedRegion === 'All England'
      ? 'England (National)'
      : `${filters.selectedRegion} Region`;

    return calculateAggregate(scopedLAs, filters.selectedTerm, label, !!filters.excludeSEN);
  }, [scopedLAs, filters.selectedTerm, currentLA, filters.selectedRegion, filters.excludeSEN]);

  // National benchmark for DfE tab
  const nationalStats = useMemo(() => {
    return calculateAggregate(LOCAL_AUTHORITIES_DATA, filters.selectedTerm, 'National Benchmark', !!filters.excludeSEN);
  }, [filters.selectedTerm, filters.excludeSEN]);

  // Regional benchmark (if a specific region or LA is selected)
  const regionalStats = useMemo(() => {
    const reg = currentLA ? currentLA.region : filters.selectedRegion;
    if (reg === 'All England') return undefined;
    const regLAs = LOCAL_AUTHORITIES_DATA.filter((la) => la.region === reg);
    return calculateAggregate(regLAs, filters.selectedTerm, `${reg} Region Benchmark`, !!filters.excludeSEN);
  }, [currentLA, filters.selectedRegion, filters.selectedTerm, filters.excludeSEN]);

  // =========================================================
  // STRATOS Live Model Computations (all LEAs + National + Regional)
  // =========================================================
  const stratosCombinedLEAs = useMemo(() => {
    const effectiveParams: CalculatorParams = {
      ...calculatorParams,
      cohortMode: filters.excludeSEN ? 'exclude-sen' : calculatorParams.cohortMode || 'all',
    };
    return computeSTRATOSLEAs(LOCAL_AUTHORITIES_DATA, filters.selectedTerm, effectiveParams);
  }, [filters.selectedTerm, calculatorParams, filters.excludeSEN]);

  // Human-readable summary of which tiers and threshold the yield figures reflect.
  const activeScopeSummary = useMemo(() => {
    const ids = calculatorParams.includeTiers ?? ['abroad'];
    const threshold = calculatorParams.durationThreshold ?? 8;
    const labels = SCOPE_TIERS.filter((t) => ids.includes(t.id)).map((t) => t.label);
    const tierText = labels.length === 0 ? 'no tiers selected' : labels.join(' + ');
    return `${tierText}, ${threshold} weeks+`;
  }, [calculatorParams.includeTiers, calculatorParams.durationThreshold]);

  const stratosNationalAggregate = useMemo(() => {
    return computeStratosNationalAggregate(stratosCombinedLEAs, filters.selectedTerm, calculatorParams);
  }, [stratosCombinedLEAs, filters.selectedTerm, calculatorParams]);

  const stratosRegionalRollups = useMemo(() => {
    return computeStratosRegionalRollup(stratosCombinedLEAs);
  }, [stratosCombinedLEAs]);

  // Filter change handlers
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      selectedRegion: 'All England',
      selectedLACode: null,
      selectedTerm: '2025/26 Autumn',
      durationFilter: 'all',
      compareBenchmark: true,
      benchmarkType: 'national',
      searchQuery: '',
      excludeSEN: false,
    });
    showToast(`Scope reset to All England (${TOTAL_AUTHORITIES_COUNT} Authorities)`);
  };

  const handleSelectLA = (code: string) => {
    setFilters((prev) => ({ ...prev, selectedLACode: code }));
    const la = LOCAL_AUTHORITIES_DATA.find((item) => item.code === code);
    if (la) {
      setInspectingLA(la);
      showToast(`Selected Local Authority: ${la.name}`);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const term = filters.selectedTerm;
    const lasToExport = scopedLAs;
    const effectiveValPerCase = calculatorParams.recoveryPerCase * calculatorParams.strikeRate;

    const headers = [
      'Local Authority Name',
      'ONS GSS Code',
      'Region',
      'Authority Tier',
      'Census Term',
      'Compulsory School-Age Pupils',
      'Total CME Count',
      'Target 8-12 Weeks Count',
      'Target 12+ Weeks (Persistent) Count',
      'Actionable Target Cohort (8+ Wks)',
      'Modelled Recovery Yield (£)',
      'Missing 1-8 Weeks Count',
      'Identified SEN Support Count',
      'EHCP Count',
      'Total SEN / EHCP (%)',
      'Primary Recorded Cause',
    ];

    const rows = lasToExport.map((la) => {
      const d = la.termsData[term];
      const senPercent = d?.senProportionPercent || 30;
      const factor = filters.excludeSEN ? Math.max(0.1, (100 - senPercent) / 100) : 1.0;

      const rawTotal = typeof d?.totalCME === 'number' ? d.totalCME : 0;
      const totalCME = Math.round(rawTotal * factor);
      const rawW1_8 = typeof d?.durationWeeks?.weeks1To8 === 'number' ? d.durationWeeks.weeks1To8 : 0;
      const w1_8 = Math.round(rawW1_8 * factor);
      const rawW8_12 = typeof d?.durationWeeks?.weeks8To12 === 'number' ? d.durationWeeks.weeks8To12 : 0;
      const w8_12 = Math.round(rawW8_12 * factor);
      const rawW12p = typeof d?.durationWeeks?.weeks12Plus === 'number' ? d.durationWeeks.weeks12Plus : 0;
      const w12p = Math.round(rawW12p * factor);

      const target8Plus = w8_12 + w12p;
      const recoveryYield = Math.round(target8Plus * effectiveValPerCase);

      // Largest published DfE category, named verbatim. Previously this reported
      // one of seven invented buckets, which renamed and merged published
      // categories; the published category name is the only defensible value.
      let topReason = 'Not available';
      let topReasonCount = -1;
      for (const reason of DFE_REASON_CATEGORIES) {
        const value = parseCell(d?.officialReasons?.[reason]?.count).value;
        if (value != null && value > topReasonCount) {
          topReasonCount = value;
          topReason = reason;
        }
      }

      return [
        `"${la.name}"`,
        `"${la.code}"`,
        `"${la.region}"`,
        `"${la.tier}"`,
        `"${term}"`,
        d?.compulsoryPupils || 0,
        d?.totalCME === 'c' ? '"c (<5)"' : totalCME,
        d?.durationWeeks?.weeks8To12 === 'c' ? '"c (<5)"' : w8_12,
        d?.durationWeeks?.weeks12Plus === 'c' ? '"c (<5)"' : w12p,
        target8Plus,
        recoveryYield,
        d?.durationWeeks?.weeks1To8 === 'c' ? '"c (<5)"' : w1_8,
        d?.senSupportCount === 'c' ? '"c (<5)"' : filters.excludeSEN ? 0 : d?.senSupportCount || 0,
        d?.ehcpCount === 'c' ? '"c (<5)"' : filters.excludeSEN ? 0 : d?.ehcpCount || 0,
        filters.excludeSEN ? 0 : d?.senProportionPercent || 0,
        `"${topReason}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `DfE_CME_Official_Statistics_${term.replace('/', '-').replace(' ', '_')}_${filters.selectedRegion.replace(' ', '_')}_England_${TOTAL_AUTHORITIES_COUNT}_LAs.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${lasToExport.length} Local Authorities to CSV`);
  };
  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#1C1C1C] flex flex-col font-sans selection:bg-[#FFE4DC] selection:text-[#1C1C1C]">
      {/* 1. Header with Top-Level Navigation */}
      <Header
        apiStatus={apiStatus}
        isPullingData={isPullingData}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPullEnglandData={handlePullAllEnglandData}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenApiExplorer={() => setIsApiExplorerOpen(true)}
        onExportCurrentView={handleExportCSV}
        excludeSEN={!!filters.excludeSEN}
        onToggleExcludeSEN={() => handleFilterChange({ excludeSEN: !filters.excludeSEN })}
      />

      {/* Syncing Progress Banner (if active) */}
      {pullProgress && (
        <div className="bg-[#1C1C1C] text-white px-4 py-3 shadow-md border-b border-neutral-800 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              {pullProgress.stage === 'complete' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-[#FE5729] animate-spin flex-shrink-0" />
              )}
              <span className="font-bold">{pullProgress.message}</span>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-full sm:w-56 bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700">
                <div 
                  className="bg-[#FE5729] h-full rounded-full transition-all duration-200" 
                  style={{ width: `${pullProgress.percentage}%` }}
                />
              </div>
              <span className="font-bold text-[11px] text-neutral-300 whitespace-nowrap">
                {pullProgress.loadedCount} / {pullProgress.totalCount} LAs ({pullProgress.percentage}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* ========================================================= */}
        {/* TAB 1: EXECUTIVE OVERVIEW (CLUTTER-FREE STRATEGIC SUMMARY) */}
        {/* ========================================================= */}
        {activeTab === 'executive-overview' && (
          <ExecutiveOverview
            currentStats={currentStats}
            nationalStats={nationalStats}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSelectLA={handleSelectLA}
            onNavigateTab={setActiveTab}
            calculatorParams={calculatorParams}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 2: DfE CME CENSUS & EDUCATIONAL ANALYTICS */}
        {/* ========================================================= */}
        {activeTab === 'dfe-intelligence' && (
          <div className="space-y-6">
            {/* Interactive Filter & Scope Ribbon */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              localAuthorities={LOCAL_AUTHORITIES_DATA}
              currentLA={currentLA}
            />

            {/* Active Duration Filter Notification Banner */}
            {filters.durationFilter !== 'all' && (
              <div className="bg-[#FFF3F0] border border-[#FFE4DC] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#1C1C1C] shadow-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FE5729] animate-pulse flex-shrink-0" />
                  <div>
                    <span className="font-extrabold text-[#FE5729]">
                      Duration Filter Active: {filters.durationFilter === '1-8' ? '1–8 Weeks (Initial Stage)' : filters.durationFilter === '8-12' ? '8–12 Weeks (Medium Term)' : '12+ Weeks (Persistent / Chronic)'}
                    </span>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      All case counts, longitudinal trajectory trends, regional comparisons, statutory reasons, and tables are focused on this duration cohort.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFilterChange({ durationFilter: 'all' })}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-white border border-[#FFE4DC] hover:bg-[#FFF3F0] text-[#FE5729] font-bold rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  Clear Duration Filter
                </button>
              </div>
            )}

            {/* Active SEN Excluded Notification Banner */}
            {filters.excludeSEN && (
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                  <div>
                    <span className="font-extrabold text-emerald-900">
                      SEN / EHCP Cohort Excluded: Focusing on Actionable Untraceable / Mainstream CME
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Special Educational Needs &amp; EHCP cases (~30% of statutory CME) have been filtered out to isolate mainstream, untraceable, or left-the-country cases where commercial tracing and CME financial impact yields are highest.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFilterChange({ excludeSEN: false })}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/60 text-emerald-900 font-bold rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  Re-include SEN Cases
                </button>
              </div>
            )}

            {/* Geographic Scope Badge */}
            <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FE5729]" />
                <span className="font-bold text-[#1C1C1C]">
                  Active Scope: {filters.selectedRegion === 'All England' && !currentLA ? 'All England (National Macro View)' : currentLA ? currentLA.name : `${filters.selectedRegion} Region`}
                </span>
                <span>•</span>
                <span className="font-medium">{scopedLAs.length} {scopedLAs.length === 1 ? 'Authority' : 'Authorities in Scope'}</span>
              </div>
              {filters.selectedRegion !== 'All England' || currentLA ? (
                <button
                  onClick={handleResetFilters}
                  className="text-[#FE5729] hover:underline font-bold cursor-pointer"
                >
                  ← Return to All England ({TOTAL_AUTHORITIES_COUNT} Authorities)
                </button>
              ) : (
                <span className="text-[11px] text-neutral-400 font-medium">
                  100% England Geographic Coverage ({TOTAL_AUTHORITIES_COUNT} / {TOTAL_AUTHORITIES_COUNT} Upper Tier Authorities)
                </span>
              )}
            </div>

            {/* Dynamic KPI Cards */}
            <KPICards
              stats={currentStats}
              currentLA={currentLA}
              nationalStats={nationalStats}
              regionalStats={regionalStats}
              showBenchmark={filters.compareBenchmark}
              durationFilter={filters.durationFilter}
              calculatorParams={calculatorParams}
              excludeSEN={filters.excludeSEN}
            />

            {/* Visualisations Suite (Recharts) */}
            <VisualisationSuite
              currentStats={currentStats}
              filters={filters}
              currentLA={currentLA}
              nationalStats={nationalStats}
              onSelectLA={handleSelectLA}
              onSelectDuration={(bracket) => handleFilterChange({ durationFilter: bracket })}
              calculatorParams={calculatorParams}
            />

            {/* Pathway to LA League Table */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 rounded-2xl bg-[#FFF3F0] text-[#FE5729] border border-[#FFE4DC]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#1C1C1C] font-display">
                    Want to inspect and compare individual councils?
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Explore all {TOTAL_AUTHORITIES_COUNT} English Local Authorities in the interactive League Table with sorting, searching, and CSV export.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('la-explorer')}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#1C1C1C] hover:bg-neutral-800 text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Open {TOTAL_AUTHORITIES_COUNT} LA League Table</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FE5729]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LOCAL AUTHORITY LEAGUE & EXPLORER */}
        {/* ========================================================= */}
        {activeTab === 'la-explorer' && (
          <LocalAuthorityExplorer
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onSelectLA={handleSelectLA}
            onOpenLADetail={(la) => setInspectingLA(la)}
            onExportCSV={handleExportCSV}
            calculatorParams={calculatorParams}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 4: STRATOS RECOVERY MODELER */}
        {/* ========================================================= */}
        {activeTab === 'stratos-recovery' && (
          <div className="space-y-6">
            {/* Filter & Term Selector for STRATOS */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-neutral-200/80 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-[#1C1C1C]">
                  Active Census Period:
                </span>
                <select
                  value={filters.selectedTerm}
                  onChange={(e) => handleFilterChange({ selectedTerm: e.target.value as AcademicTerm })}
                  className="bg-[#F4F4F6] border border-neutral-200 text-[#1C1C1C] text-xs font-bold rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FE5729]/30 focus:border-[#FE5729] cursor-pointer"
                >
                  <option value="2025/26 Autumn">2025/26 Autumn Census (Latest)</option>
                  <option value="2024/25 Summer">2024/25 Summer Census</option>
                  <option value="2024/25 Spring">2024/25 Spring Census</option>
                  <option value="2024/25 Autumn">2024/25 Autumn Census</option>
                </select>
              </div>

              <div className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
                <span>
                  Targeting <strong className="text-emerald-700 font-bold">{stratosNationalAggregate.total_target_cases.toLocaleString('en-GB')}</strong> Actionable Child Benefit Cases across England
                  <span className="text-neutral-400"> ({activeScopeSummary})</span>
                </span>
                <EstimateMarker />
              </div>
            </div>

            {/* Interactive Calculator Sliders */}
            <StratosCalculatorSettings
              params={calculatorParams}
              onChangeParams={setCalculatorParams}
              onResetParams={() => setCalculatorParams(DEFAULT_CALCULATOR_PARAMS)}
            />

            {/* STRATOS 5 Dynamic KPI Summary Tiles */}
            <StratosKPICards
              stats={stratosNationalAggregate}
              termLabel={filters.selectedTerm}
            />

            {/* Visual Analytics & Breakdown */}
            <StratosChartsSection
              leas={stratosCombinedLEAs}
              regionalRollups={stratosRegionalRollups}
              nationalAggregate={stratosNationalAggregate}
              onSelectLA={handleSelectLA}
            />

            {/* STRATOS Master Financial Table */}
            <StratosFinancialTable
              leas={stratosCombinedLEAs}
              onSelectLA={handleSelectLA}
              academicYear={filters.selectedTerm}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: LEA RISK TIER MATRIX */}
        {/* ========================================================= */}
        {activeTab === 'risk-matrix' && (
          <div>
            <StratosRiskMatrix
              leas={stratosCombinedLEAs}
              onSelectLA={handleSelectLA}
              academicYear={filters.selectedTerm}
              excludeSEN={filters.excludeSEN}
              onToggleExcludeSEN={(val) => {
                handleFilterChange({ excludeSEN: val });
                setCalculatorParams((prev) => ({
                  ...prev,
                  cohortMode: val ? 'exclude-sen' : 'all',
                }));
                showToast(val ? 'SEN / EHCP cases (~30%) excluded from Risk Matrix' : 'All cases included in Risk Matrix');
              }}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: STATUTORY COMPLIANCE & LEGAL MANUAL */}
        {/* ========================================================= */}
        {activeTab === 'compliance-guide' && (
          <div>
            <StratosComplianceGuide />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: LIVE API & DATA BRIDGE */}
        {/* ========================================================= */}
        {activeTab === 'data-bridge' && (
          <div>
            <StratosDataBridge
              apiStatus={apiStatus}
              isPullingData={isPullingData}
              onPullEnglandData={handlePullAllEnglandData}
              leas={stratosCombinedLEAs}
              academicYear={filters.selectedTerm}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: HELP & USER GUIDE */}
        {/* ========================================================= */}
        {activeTab === 'help-guide' && (
          <div>
            <HelpGuide onNavigateTab={(tab) => setActiveTab(tab)} />
          </div>
        )}

      </main>

      {/* Official Footer */}
      <footer className="bg-[#1C1C1C] text-neutral-400 text-xs border-t border-neutral-800 py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-neutral-800 text-[#FE5729] border border-neutral-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold">
                Department for Education • Children Missing Education (CME) Financial Impact Suite
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Contains public sector information licensed under the Open Government Licence v3.0 (OGL). Covers {TOTAL_AUTHORITIES_COUNT} English Education Authorities.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer font-medium"
            >
              Methodology &amp; Code of Practice
            </button>
            <button
              onClick={() => setIsApiExplorerOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer font-medium"
            >
              DfE EES API v1.4
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-full bg-[#FE5729] hover:bg-[#E0461B] text-white transition-colors flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Full England CSV Export</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C1C1C] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border border-neutral-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-[#FE5729] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {inspectingLA && (
        <LADetailModal
          la={inspectingLA}
          selectedTerm={filters.selectedTerm}
          calculatorParams={calculatorParams}
          activeTab={activeTab}
          onClose={() => setInspectingLA(null)}
        />
      )}

      {isMethodologyOpen && (
        <MethodologyModal onClose={() => setIsMethodologyOpen(false)} />
      )}

      {isApiExplorerOpen && (
        <ApiExplorerModal
          apiStatus={apiStatus}
          currentLA={currentLA}
          selectedTerm={filters.selectedTerm}
          onClose={() => setIsApiExplorerOpen(false)}
        />
      )}
    </div>
  );
}

