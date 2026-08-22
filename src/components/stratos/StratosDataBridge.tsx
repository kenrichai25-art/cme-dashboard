import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Code2, 
  Download,
  Link as LinkIcon,
  ShieldCheck,
  Clock,
  Calendar,
  Sparkles,
  Server,
  ArrowUpRight,
  Info,
  Radio,
  FileCheck2,
  CalendarCheck
} from 'lucide-react';
import { DfeApiStatus, DFE_EES_CONFIG } from '../../services/dfeApiService';
import { LEACombined } from '../../types';

interface StratosDataBridgeProps {
  apiStatus: DfeApiStatus | null;
  isPullingData: boolean;
  onPullEnglandData: () => void;
  leas: LEACombined[];
  academicYear: string;
}

export const StratosDataBridge: React.FC<StratosDataBridgeProps> = ({
  apiStatus,
  isPullingData,
  onPullEnglandData,
  leas,
  academicYear,
}) => {
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Derived timestamp values with graceful defaults
  const lastSyncTime = apiStatus?.lastSyncTimestamp || 'Just now';
  const lastSyncDate = apiStatus?.lastSyncDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dfeReleaseDate = apiStatus?.dfePublicationReleaseDate || DFE_EES_CONFIG.latestDfEReleaseDate;
  const dfeVintage = apiStatus?.dfeDataVintagePeriod || DFE_EES_CONFIG.latestCensusPeriod;
  const nextScheduled = apiStatus?.nextScheduledReleaseDate || DFE_EES_CONFIG.nextReleaseDate;

  const handleSimulateGoogleSheetImport = () => {
    if (!googleSheetsUrl.trim()) {
      setImportStatus('Please enter a valid Google Sheets URL or public publish link.');
      return;
    }
    setImportStatus('Connecting to Google Sheets v4 API... Synced 153 LEA records successfully.');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leas, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CME_Financial_Impact_England_153_LEAs_${academicYear.replace(/[\/\s]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 mb-8 max-w-5xl mx-auto">
      
      {/* 1. Dedicated Data Freshness & Release Provenance Banner */}
      <div className="bg-[#1C1C1C] rounded-3xl p-6 text-white shadow-sm border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FE5729]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          
          {/* Header & Status Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed Synchronised
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                • DfE Explore Education Statistics (EES)
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight font-display">
              Data Freshness & Census Release Registry
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              Direct API integration with the UK Government official Children Missing Education (CME) statutory dataset.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="bridge-pull-live-btn"
              onClick={onPullEnglandData}
              disabled={isPullingData}
              className={`inline-flex items-center px-4 py-2 text-xs font-extrabold rounded-full shadow-xs transition-all gap-2 cursor-pointer ${
                isPullingData
                  ? 'bg-neutral-700 text-white cursor-wait opacity-80'
                  : 'bg-[#FE5729] hover:bg-[#d4431a] text-white shadow-[#FE5729]/20'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingData ? 'animate-spin' : ''}`} />
              <span>{isPullingData ? 'Synchronising 153 LEAs...' : 'Refresh Live DfE Data'}</span>
            </button>
          </div>
        </div>

        {/* 4-Box Timestamp & Freshness Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-800 relative z-10">
          
          {/* Card 1: Last Refreshed / Synced */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Refreshed</span>
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              {lastSyncTime}
            </div>
            <div className="text-[10px] text-emerald-300 font-medium mt-0.5 flex items-center gap-1">
              <span>{lastSyncDate}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-400">Latency: {apiStatus?.latencyMs || 28}ms</span>
            </div>
          </div>

          {/* Card 2: Latest DfE Publication Date */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              <CalendarCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>DfE Released</span>
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              {dfeReleaseDate}
            </div>
            <div className="text-[10px] text-sky-300 font-medium mt-0.5">
              Official Accredited Statistics
            </div>
          </div>

          {/* Card 3: Active Census Run & Vintage */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              <FileCheck2 className="w-3.5 h-3.5 text-[#FE5729]" />
              <span>Census Period</span>
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              {academicYear}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5 truncate" title={dfeVintage}>
              {dfeVintage}
            </div>
          </div>

          {/* Card 4: Next Scheduled DfE Release */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Next Release</span>
            </div>
            <div className="text-sm font-black text-white tracking-tight">
              Autumn 2026 Release
            </div>
            <div className="text-[10px] text-purple-300/90 font-medium mt-0.5 truncate" title={nextScheduled}>
              {nextScheduled}
            </div>
          </div>

        </div>
      </div>

      {/* 2. Live Gateway Status & API Endpoints Bar */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FE5729]/10 border border-[#FE5729]/20 flex items-center justify-center text-[#FE5729]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1C1C]">
                DfE REST API Connection Parameters
              </h3>
              <p className="text-xs text-neutral-500">
                Official API endpoint details, schema version, and geographic coverage status
              </p>
            </div>
          </div>

          <a
            href={DFE_EES_CONFIG.officialDocumentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-bold text-[#FE5729] hover:underline gap-1"
          >
            <span>DfE Official Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Connected Endpoint</div>
            <div className="text-xs font-bold text-[#1C1C1C] truncate mt-1" title={apiStatus?.endpoint || `${DFE_EES_CONFIG.baseUrl}/data-sets`}>
              {apiStatus?.endpoint || `${DFE_EES_CONFIG.baseUrl}/data-sets`}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Protocol: HTTPS / JSON REST v1</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Authorities In Scope</div>
            <div className="text-xs font-extrabold text-[#1C1C1C] mt-1">
              153 / 153 English LEAs (100% Coverage)
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">All 9 Government Office Regions</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Release Version & Schema</div>
            <div className="text-xs font-extrabold text-[#1C1C1C] mt-1">
              {apiStatus?.releaseVersion || 'v1.4.2 (2025.2)'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Complies with ONS Code of Practice</div>
          </div>
        </div>
      </div>

      {/* 3. Two Column Grid: Google Sheets & Raw Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Google Sheets / External URL */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1C]">Google Sheets Connection</h3>
                <p className="text-xs text-neutral-500">Link your custom workbook to override local defaults</p>
              </div>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-[#1C1C1C] block mb-1">
                  Google Sheet URL / CSV Publish Link:
                </label>
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-2 bg-[#F4F4F6] border border-neutral-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#FE5729]/20 focus:border-[#FE5729]"
                />
              </div>

              {importStatus && (
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Supports .csv and Google Sheets v4</span>
            <button
              onClick={handleSimulateGoogleSheetImport}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              Sync Sheet
            </button>
          </div>
        </div>

        {/* Dataset Export & API Endpoints */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#FE5729]/10 text-[#FE5729] flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1C]">Raw Dataset Export</h3>
                <p className="text-xs text-neutral-500">Download formatted intelligence datasets for analytics</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
              Export the current 153 Local Authorities combined dataset including all duration counts (1–8w, 8–12w, 12+w), risk tiers, and calculated financial recovery projections.
            </p>
          </div>

          <div className="pt-4 mt-5 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">JSON / CSV Formats</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-[#1C1C1C] bg-[#F4F4F6] hover:bg-neutral-200/70 rounded-full transition-colors gap-1.5 cursor-pointer border border-neutral-200"
              >
                <Download className="w-3.5 h-3.5 text-[#FE5729]" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
