import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  HelpCircle, 
  Code2, 
  FileSpreadsheet, 
  ExternalLink,
  Info,
  Layers,
  RefreshCw,
  Database,
  PoundSterling,
  BarChart3,
  Scale,
  Activity,
  Sliders,
  Download
} from 'lucide-react';
import { DfeApiStatus } from '../services/dfeApiService';
import { MainDashboardTab, CalculatorParams } from '../types';
import { TOTAL_AUTHORITIES_COUNT } from '../data/cmeData';
import { ScopeTierToggle } from './ScopeTierToggle';

interface HeaderProps {
  apiStatus: DfeApiStatus | null;
  isPullingData?: boolean;
  activeTab: MainDashboardTab;
  onSelectTab: (tab: MainDashboardTab) => void;
  onPullEnglandData: () => void;
  onOpenMethodology: () => void;
  onOpenApiExplorer: () => void;
  onExportCurrentView: () => void;
  calculatorParams: CalculatorParams;
  onChangeCalculatorParams: (params: CalculatorParams) => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  isPullingData = false,
  activeTab,
  onSelectTab,
  onPullEnglandData,
  onOpenMethodology,
  onOpenApiExplorer,
  onExportCurrentView,
  calculatorParams,
  onChangeCalculatorParams,
}) => {
  return (
    <header className="bg-white border-b border-neutral-200/80 shadow-xs sticky top-0 z-30">
      {/* Official Gov Top Bar (Obsidian Dark) */}
      <div className="bg-[#1C1C1C] px-4 sm:px-6 py-2 text-xs text-neutral-400 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FE5729] text-white font-extrabold uppercase tracking-wider text-[10px] shadow-2xs">
              GOV.UK
            </span>
            <span className="text-white font-semibold">Department for Education</span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-neutral-400">Children Missing Education (CME) Official Portal</span>
            <span className="text-neutral-600 hidden md:inline">•</span>
            <span className="inline-flex items-center text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              CME Financial Impact Suite Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${
                apiStatus === null
                  ? 'bg-neutral-400 animate-pulse'
                  : apiStatus.connected === false
                  ? 'bg-neutral-500'
                  : 'bg-emerald-400 animate-pulse'
              }`} />
              <span className="text-[11px] text-neutral-300 font-medium">
                {apiStatus === null
                  ? 'Checking server status…'
                  : apiStatus.connected === false
                  ? 'Server unreachable'
                  : `${apiStatus.totalLAsSynchronised ?? 0} / ${TOTAL_AUTHORITIES_COUNT} English LAs Active`}
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FE5729]" />
              <span className="text-[11px]">ONS Code of Practice</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1C1C] flex items-center tracking-tight">
                <span className="bg-[#FE5729] text-white text-xs px-2.5 py-1 rounded-lg font-black mr-2.5 shadow-xs">
                  DfE
                </span>
                CME Intelligence & Compliance
              </h1>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Statutory Census Analytics & CME Financial Impact Modeller
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            <button
              id="header-pull-england-btn"
              onClick={onPullEnglandData}
              disabled={isPullingData}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shadow-xs gap-1.5 cursor-pointer ${
                isPullingData
                  ? 'bg-neutral-200 text-neutral-600 cursor-wait'
                  : 'bg-[#FE5729] hover:bg-[#E0461B] text-white'
              }`}
              title={`Pull full census dataset for all ${TOTAL_AUTHORITIES_COUNT} English Local Authorities from DfE EES API`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingData ? 'animate-spin' : ''}`} />
              <span>{isPullingData ? 'Syncing...' : 'Sync All England'}</span>
            </button>

            <button
              id="header-methodology-btn"
              onClick={onOpenMethodology}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full transition-colors shadow-2xs gap-1.5 cursor-pointer"
              title="View statutory definitions, suppression rules (<5), and calculations"
            >
              <Info className="w-3.5 h-3.5 text-neutral-400" />
              <span>Methodology</span>
            </button>

            <button
              id="header-api-btn"
              onClick={onOpenApiExplorer}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full transition-colors shadow-2xs gap-1.5 cursor-pointer"
              title="Explore DfE Explore Education Statistics (EES) API integration"
            >
              <Code2 className="w-3.5 h-3.5 text-[#FE5729]" />
              <span>DfE EES API</span>
            </button>

            <button
              id="header-export-summary-btn"
              onClick={onExportCurrentView}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-neutral-800 rounded-full transition-colors shadow-xs gap-1.5 cursor-pointer"
              title="Export complete view as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#FE5729]" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Top-Level Navigation Tabs - Style Guide Rounded-Full Architecture */}
        <div className="mt-4 pt-1">
          <nav className="flex items-center gap-1.5 bg-[#F4F4F6] p-1.5 rounded-full border border-neutral-200/80 overflow-x-auto no-scrollbar">
            <button
              id="tab-executive-overview"
              onClick={() => onSelectTab('executive-overview')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'executive-overview'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${activeTab === 'executive-overview' ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
              <span>Overview</span>
            </button>

            <button
              id="tab-dfe-intelligence"
              onClick={() => onSelectTab('dfe-intelligence')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dfe-intelligence'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'dfe-intelligence' ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
              <span>CME Analytics</span>
            </button>

            <button
              id="tab-la-explorer"
              onClick={() => onSelectTab('la-explorer')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'la-explorer'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activeTab === 'la-explorer' ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
              <span>LA Table</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeTab === 'la-explorer' ? 'bg-[#FE5729] text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {TOTAL_AUTHORITIES_COUNT} LAs
              </span>
            </button>

            <button
              id="tab-stratos-recovery"
              onClick={() => onSelectTab('stratos-recovery')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'stratos-recovery'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <PoundSterling className={`w-3.5 h-3.5 ${activeTab === 'stratos-recovery' ? 'text-emerald-400' : 'text-neutral-500'}`} />
              <span>Financial Impact</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeTab === 'stratos-recovery' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Live Model
              </span>
            </button>

            <button
              id="tab-risk-matrix"
              onClick={() => onSelectTab('risk-matrix')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'risk-matrix'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'risk-matrix' ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
              <span>Risk Matrix</span>
            </button>

            <button
              id="tab-compliance-guide"
              onClick={() => onSelectTab('compliance-guide')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'compliance-guide'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${activeTab === 'compliance-guide' ? 'text-purple-400' : 'text-neutral-500'}`} />
              <span>Compliance</span>
            </button>

            <button
              id="tab-data-bridge"
              onClick={() => onSelectTab('data-bridge')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'data-bridge'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${activeTab === 'data-bridge' ? 'text-sky-400' : 'text-neutral-500'}`} />
              <span>API</span>
            </button>

            <button
              id="tab-help-guide"
              onClick={() => onSelectTab('help-guide')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'help-guide'
                  ? 'bg-[#1C1C1C] text-white shadow-xs ring-1 ring-neutral-700'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <HelpCircle className={`w-3.5 h-3.5 ${activeTab === 'help-guide' ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
              <span>Help</span>
            </button>
          </nav>
        </div>

        {/* Persistent Scope Tier control — visible on every tab, since
            calculatorParams.includeTiers drives every £ estimate in the
            app (KPI cards, charts, LA table, Financial Impact). */}
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <ScopeTierToggle
            calculatorParams={calculatorParams}
            onChangeCalculatorParams={onChangeCalculatorParams}
          />
        </div>
      </div>
    </header>
  );
};

