import React from 'react';
import { 
  X, 
  ShieldCheck, 
  HelpCircle, 
  FileText, 
  Scale, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface MethodologyModalProps {
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ onClose }) => {
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
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display">
                DfE Statistical Methodology &amp; Disclosure Control
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Statutory framework, census collection cycles, and data suppression policy
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-neutral-700 leading-relaxed">
          {/* Statutory Definition */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#1C1C1C] flex items-center gap-2 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-[#FE5729]" />
              1. Statutory Definition of Children Missing Education (CME)
            </h3>
            <p>
              Under <strong className="text-[#1C1C1C]">Section 436A of the Education Act 1996</strong> (inserted by the Education and Inspections Act 2006), all Local Authorities in England have a statutory duty to make arrangements to establish (so far as it is possible to do so) the identities of children in their area who are of compulsory school age and not receiving suitable education.
            </p>
            <div className="p-4 bg-[#F4F4F6] border border-neutral-200/80 rounded-2xl text-[11px] text-neutral-600 space-y-1.5">
              <p><strong>CME applies to:</strong> Children of compulsory school age (5 to 16) who are not registered pupils at a school and are not receiving suitable education otherwise (for instance, not verified as receiving suitable Elective Home Education under Section 7).</p>
              <p><strong>Exclusions:</strong> Does NOT include pupils registered at a school who have low attendance (referred to as persistent or severe absentees), unless they have been formally off-rolled under the Education (Pupil Registration) Regulations.</p>
            </div>
          </div>

          {/* DfE Disclosure Control & Suppression Rules */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#1C1C1C] flex items-center gap-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              2. DfE Statistical Disclosure Control (<span className="text-[#FE5729] font-bold lowercase">c*</span> Suppression Marker)
            </h3>
            <p>
              To protect the identity and confidentiality of individual pupils in compliance with the Code of Practice for Statistics and UK GDPR:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600">
              <li>Counts of fewer than 5 pupils (values of 1 to 4) are suppressed and denoted by the symbol <strong className="text-[#1C1C1C]">c* (&lt;5)</strong>.</li>
              <li>Rates and percentages based on suppressed counts are similarly suppressed to prevent secondary disclosure.</li>
              <li>Aggregated regional and national totals are rounded to standard disclosure guidelines.</li>
            </ul>
          </div>

          {/* Rate Calculation Formula */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#1C1C1C] flex items-center gap-2 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-[#FE5729]" />
              3. Rate Calculations &amp; Standardisation Formula
            </h3>
            <div className="p-4 bg-[#1C1C1C] text-neutral-200 rounded-2xl text-xs border border-neutral-800">
              <p className="text-[#FE5729] font-bold">// DfE Standard CME Incidence Rate per 1,000 Pupils</p>
              <p className="mt-1 font-semibold">CME Rate = ( Total CME Cohort / Compulsory School-Age Population ) * 1,000</p>
            </div>
            <p className="text-[11px] text-neutral-500">
              The denominator is obtained from the DfE Schools, Pupils and their Characteristics January census publication for compulsory school-age pupils (aged 5 to 15 at the start of the academic year).
            </p>
          </div>

          {/* Termly Census Cycle */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#1C1C1C] flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              4. Termly Data Collection Frequency
            </h3>
            <p>
              Local Authorities submit termly aggregate returns to the DfE via the secure COLLECT portal:
            </p>
            <div className="grid grid-cols-3 gap-2.5 text-center text-[11px]">
              <div className="p-3 bg-[#F4F4F6] border border-neutral-200/80 rounded-2xl">
                <span className="font-bold text-[#1C1C1C] block">Autumn Census</span>
                <span className="text-neutral-500 text-[10px]">Submitted in Nov</span>
              </div>
              <div className="p-3 bg-[#F4F4F6] border border-neutral-200/80 rounded-2xl">
                <span className="font-bold text-[#1C1C1C] block">Spring Census</span>
                <span className="text-neutral-500 text-[10px]">Submitted in March</span>
              </div>
              <div className="p-3 bg-[#F4F4F6] border border-neutral-200/80 rounded-2xl">
                <span className="font-bold text-[#1C1C1C] block">Summer Census</span>
                <span className="text-neutral-500 text-[10px]">Submitted in July</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#F4F4F6] border-t border-neutral-200 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Source: Department for Education (DfE) Official Statistics
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#1C1C1C] hover:bg-neutral-800 rounded-full transition-colors shadow-xs cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

