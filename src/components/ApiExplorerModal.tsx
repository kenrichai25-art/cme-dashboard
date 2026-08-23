import React, { useState } from 'react';
import { 
  X, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Play, 
  Layers, 
  Server,
  Sparkles
} from 'lucide-react';
import { DfeApiStatus, DFE_EES_CONFIG, buildDfeApiSnippet } from '../services/dfeApiService';
import { LocalAuthority, AcademicTerm } from '../types';

interface ApiExplorerModalProps {
  apiStatus: DfeApiStatus | null;
  currentLA: LocalAuthority | null;
  selectedTerm: AcademicTerm;
  onClose: () => void;
}

export const ApiExplorerModal: React.FC<ApiExplorerModalProps> = ({
  apiStatus,
  currentLA,
  selectedTerm,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'response' | 'docs'>('curl');

  const snippet = buildDfeApiSnippet();

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Illustrative response shape built from this session's own cached data —
  // not a captured live response. Values shown are whatever is currently
  // loaded for the selected LA/term; fields DfE hasn't published for that
  // selection are shown as undefined rather than invented.
  const sampleJsonResponse = {
    datasetId: DFE_EES_CONFIG.datasetId,
    status: 'Approved Official Statistics',
    publishedDate: apiStatus?.dfePublicationReleaseDate,
    geographicLevel: currentLA ? 'LocalAuthority' : 'National',
    query: {
      laCode: currentLA?.code || 'E92000001 (England)',
      timePeriod: selectedTerm,
    },
    meta: {
      source: 'DfE Explore Education Statistics API v1',
      // DfE's three published cell markers — see cmeScope.ts. None of these
      // is statistical disclosure control; none is imputed as zero.
      cellMarkers: { low: 'rounds to 0 but is not 0', x: 'not available', z: 'not applicable' },
      licence: 'Open Government Licence v3.0 (OGL)',
    },
    data: {
      totalCME: currentLA?.termsData[selectedTerm]?.totalCME,
      ratePer100Pupils: currentLA?.termsData[selectedTerm]?.ratePer100Published,
      longTermMissingRatio: currentLA?.termsData[selectedTerm]?.longTermMissingPercent,
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-neutral-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C1C1C] text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-[#FE5729]/10 border border-[#FE5729]/20 text-[#FE5729]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-display">
                  DfE Explore Education Statistics (EES) API
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  REST
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Official REST endpoint: <span className="text-[#FE5729] font-medium">{DFE_EES_CONFIG.baseUrl}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-[#141414] px-6 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center space-x-2.5">
            <span className={`w-2 h-2 rounded-full ${
              apiStatus === null
                ? 'bg-neutral-400 animate-pulse'
                : apiStatus.connected === false
                ? 'bg-neutral-500'
                : 'bg-emerald-400 animate-pulse'
            }`} />
            <span>Server: <strong>{apiStatus === null ? 'Checking…' : apiStatus.connected === false ? 'Unreachable' : 'Connected'}</strong></span>
            {apiStatus?.latencyMs != null && (
              <>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400">Latency: {apiStatus.latencyMs}ms</span>
              </>
            )}
          </div>

          <div className="text-[11px] text-neutral-400">
            /data-sets/{DFE_EES_CONFIG.datasetId}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 px-6 pt-3 flex space-x-4 text-xs font-bold text-neutral-600 bg-white">
          <button
            onClick={() => setActiveTab('curl')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'curl' ? 'border-[#FE5729] text-[#FE5729]' : 'border-transparent hover:text-neutral-900'
            }`}
          >
            cURL Request Snippet
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'response' ? 'border-[#FE5729] text-[#FE5729]' : 'border-transparent hover:text-neutral-900'
            }`}
          >
            API JSON Payload
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'docs' ? 'border-[#FE5729] text-[#FE5729]' : 'border-transparent hover:text-neutral-900'
            }`}
          >
            Endpoint Documentation
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'curl' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1C1C1C]">
                  Ready-to-use cURL query — the full dataset (this endpoint has no LA/term filter; use the response to find {currentLA?.name || 'All England'}, {selectedTerm} yourself):
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#F4F4F6] hover:bg-neutral-200/80 text-[#1C1C1C] rounded-full transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <div className="bg-[#1C1C1C] text-neutral-200 p-4 rounded-2xl text-xs overflow-x-auto border border-neutral-800">
                <pre>{snippet}</pre>
              </div>

              <p className="text-[11px] text-neutral-500">
                You can execute this command in your terminal or API testing tool (e.g. Postman, Insomnia) to retrieve official DfE JSON streams directly.
              </p>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1C1C1C]">Example response shape (illustrative, not a captured live response):</span>
              </div>

              <div className="bg-[#1C1C1C] text-emerald-400 p-4 rounded-2xl text-xs overflow-x-auto border border-neutral-800 max-h-72">
                <pre>{JSON.stringify(sampleJsonResponse, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4 text-neutral-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-[#1C1C1C] mb-1">DfE EES Data API Overview</h4>
                <p>
                  The Explore Education Statistics API allows researchers, data analysts, and educational professionals to programmatically query accredited official statistics releases produced by the Department for Education.
                </p>
              </div>

              <div className="p-4 bg-[#F4F4F6] border border-neutral-200 rounded-2xl space-y-1.5 text-[11px]">
                <p><strong>Base URL:</strong> <code className="text-[#FE5729]">https://api.education.gov.uk/statistics/v1</code></p>
                <p><strong>Licensing:</strong> Open Government Licence v3.0 (free for commercial and non-commercial reuse).</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#F4F4F6] border-t border-neutral-200 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Explore Education Statistics API Standard
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-[#1C1C1C] bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full transition-colors shadow-xs cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

