import React, { useState } from 'react';
import {
  HelpCircle,
  Activity,
  BarChart3,
  Building2,
  PoundSterling,
  ShieldCheck,
  Scale,
  Database,
  Search,
  Sliders,
  Download,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ShieldAlert,
  Layers,
  BookOpen,
  Compass,
  Lightbulb
} from 'lucide-react';
import { TOTAL_AUTHORITIES_COUNT } from '../data/cmeData';
import { MainDashboardTab } from '../types';

interface HelpGuideProps {
  onNavigateTab: (tab: MainDashboardTab) => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ onNavigateTab }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeWalkthroughTab, setActiveWalkthroughTab] = useState<MainDashboardTab>('executive-overview');

  const tabGuides: {
    id: MainDashboardTab;
    name: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderClass: string;
    bgClass: string;
    oneLiner: string;
    purpose: string;
    whatYouSee: string[];
    howToUse: string[];
  }[] = [
    {
      id: 'executive-overview',
      name: 'Overview',
      badge: 'Executive Briefing',
      icon: Activity,
      accentColor: 'text-[#FE5729]',
      borderClass: 'border-[#FE5729]/30 hover:border-[#FE5729]',
      bgClass: 'bg-[#FE5729]/10 text-[#FE5729]',
      oneLiner: 'The high-level macro view of England’s missing education statistics and key national totals.',
      purpose: 'Gives managers, directors, and policy leads an instant snapshot of national figures without needing to dig into technical spreadsheets.',
      whatYouSee: [
        `Total Active CME count across all ${TOTAL_AUTHORITIES_COUNT} English Local Authorities.`,
        'High-risk 12+ weeks persistent absences and the compliance scope tiers.',
        'National 4-term historical trajectory chart (from 2024/25 to 2025/26).',
        'Top 10 English Government Regions breakdown and Top High-Exposure Councils.',
      ],
      howToUse: [
        'Use the top orange dropdown to change the Academic Term (e.g. 2025/26 Summer or Spring).',
        'Click on any Region row or Local Authority card to immediately filter and inspect.',
        'Review the statutory causes progress bars to see why pupils are out of school.',
      ],
    },
    {
      id: 'dfe-intelligence',
      name: 'CME Analytics',
      badge: 'Deep Visual Analytics',
      icon: BarChart3,
      accentColor: 'text-[#FE5729]',
      borderClass: 'border-neutral-200 hover:border-[#FE5729]/50',
      bgClass: 'bg-neutral-100 text-neutral-800',
      oneLiner: 'Deep-dive charts and benchmark comparisons across durations, causes, and age groups.',
      purpose: 'Allows analysts and education officers to benchmark any local council against regional and national averages.',
      whatYouSee: [
        'Duration Breakdown (1–8 weeks, 8–12 weeks, 12+ weeks).',
        'Benchmark Comparison bars showing how a council compares to the England average.',
        'Statutory Reason categories (e.g., Awaiting School Place, Moved Abroad, Untraceable).',
        'Age Group distributions (Primary Key Stage 1–2 vs. Secondary Key Stage 3–4).',
      ],
      howToUse: [
        'Use the Duration Pills (1–8w, 8–12w, 12+w) to focus charts on specific absence lengths.',
        'Click on any bar chart or local authority to inspect individual trends.',
      ],
    },
    {
      id: 'la-explorer',
      name: 'LA Table',
      badge: `${TOTAL_AUTHORITIES_COUNT} Council League`,
      icon: Building2,
      accentColor: 'text-[#FE5729]',
      borderClass: 'border-neutral-200 hover:border-[#FE5729]/50',
      bgClass: 'bg-neutral-100 text-neutral-800',
      oneLiner: `The complete searchable, sortable master league table of all ${TOTAL_AUTHORITIES_COUNT} English Education Authorities.`,
      purpose: 'The central directory for finding specific councils, sorting by caseload or recovery potential, and downloading official data.',
      whatYouSee: [
        'Every English council ranked by Total CME, 8–12 Weeks, 12+ Weeks, and Modelled Yield.',
        'Colour-coded duration columns (Amber for 8–12w, Rose for 12+w, Green for Target Cohort).',
        'Live search bar for typing any council name, region, or ONS code.',
        'An "Inspect" button on every row for opening an in-depth audit window.',
      ],
      howToUse: [
        'Type your council name (e.g. "Birmingham", "Kent", "Leeds") in the search box.',
        'Click any column header (like Modelled Yield or 12+ Weeks) to sort from highest to lowest.',
        'Click "Export CSV" to download the filtered table directly into Excel or Google Sheets.',
      ],
    },
    {
      id: 'stratos-recovery',
      name: 'Financial Impact',
      badge: 'Interactive Modeller',
      icon: PoundSterling,
      accentColor: 'text-emerald-600',
      borderClass: 'border-emerald-200 hover:border-emerald-500',
      bgClass: 'bg-emerald-100 text-emerald-800',
      oneLiner: 'Interactive calculation engine that models public funds recoverable from improper Child Benefit payments.',
      purpose: 'Equips finance teams and audit officers with mathematical models to estimate financial recoveries when families move abroad or drop off school rolls.',
      whatYouSee: [
        'Target Actionable Cohort (8+ weeks unverified absences where benefit rules apply).',
        'Interactive Sliders for "Average Recovery per Case" (£1,000 to £6,000) and "Investigation Strike Rate" (10% to 100%).',
        'Modelled England Financial Yield summary card.',
        'Master Financial Table showing exact projected savings council by council.',
      ],
      howToUse: [
        'Drag the "Average Recovery (£)" slider to test different recovery amounts (default is £2,800).',
        'Drag the "Strike Rate (%)" slider to adjust expected investigation success (default is 75%).',
        'Watch all financial yield numbers update in real-time across the entire platform.',
      ],
    },
    {
      id: 'risk-matrix',
      name: 'Risk Matrix',
      badge: 'Priority Tiers',
      icon: ShieldCheck,
      accentColor: 'text-rose-600',
      borderClass: 'border-rose-200 hover:border-rose-500',
      bgClass: 'bg-rose-100 text-rose-800',
      oneLiner: `Categorises all ${TOTAL_AUTHORITIES_COUNT} councils into 4 risk tiers (Critical, High, Medium, Low) for prioritized casework.`,
      purpose: 'Helps compliance teams immediately identify which councils require urgent intervention and support.',
      whatYouSee: [
        '4 Tier Cards: Critical (500+ cases), High (250–499 cases), Medium (100–249 cases), Low (<100 cases).',
        'Total financial exposure mapped out for each risk tier.',
        'Card grid displaying all local authorities assigned to the selected tier.',
      ],
      howToUse: [
        'Click on any Tier card (e.g. "Critical Priority") to filter the grid below to just those authorities.',
        'Use the tier search box to quickly find a specific authority within that tier.',
        'Click "Inspect" on any authority card to view its full dossier.',
      ],
    },
    {
      id: 'compliance-guide',
      name: 'Compliance',
      badge: 'Statutory Manual',
      icon: Scale,
      accentColor: 'text-purple-600',
      borderClass: 'border-purple-200 hover:border-purple-500',
      bgClass: 'bg-purple-100 text-purple-800',
      oneLiner: 'The legal and regulatory framework governing Children Missing Education and Child Benefit entitlement.',
      purpose: 'Provides officers, legal teams, and auditors with the exact statutory citations and data sharing authorizations.',
      whatYouSee: [
        'Section 436A of the Education Act 1996 duties on Local Authorities.',
        'Child Benefit (General) Regulations 2006 (specifically the 8-week temporary absence rule).',
        'Digital Economy Act 2017 (Part 5) multi-agency data-sharing legal bases.',
        'Step-by-step statutory compliance & audit workflow checklists.',
      ],
      howToUse: [
        'Refer to this tab when writing compliance briefs, audit justifications, or legal memos.',
        'Review the data protection guidelines before initiating multi-agency data matching.',
      ],
    },
    {
      id: 'data-bridge',
      name: 'API',
      badge: 'Technical Integration',
      icon: Database,
      accentColor: 'text-sky-600',
      borderClass: 'border-sky-200 hover:border-sky-500',
      bgClass: 'bg-sky-100 text-sky-800',
      oneLiner: 'Technical connectivity showing live sync status with the DfE Open Data API and REST endpoints.',
      purpose: 'For IT professionals and developers integrating this data into external council systems, PowerBI, or databases.',
      whatYouSee: [
        `Live synchronization status across all ${TOTAL_AUTHORITIES_COUNT} authorities.`,
        'REST API endpoints with copyable code snippets (cURL, Python, JavaScript).',
        'Interactive JSON data tester to view raw DfE census responses.',
      ],
      howToUse: [
        `Click "Synchronise ${TOTAL_AUTHORITIES_COUNT} LAs" to refresh local datasets against DfE census returns.`,
        'Copy API sample endpoints to integrate into external dashboards or analytics pipelines.',
      ],
    },
  ];

  const faqs = [
    {
      question: 'What is Children Missing Education (CME) in simple terms?',
      answer:
        'CME refers to children of compulsory school age (5 to 16) in England who are not registered on a school roll and are not receiving a suitable education elsewhere (e.g. registered home education or private schooling). These children are at high risk of educational disadvantage and safeguarding concerns.',
    },
    {
      question: 'Why is there a focus on 8+ weeks and 12+ weeks of absence?',
      answer:
        'Under UK Child Benefit regulations, families who travel abroad or leave the country can only continue receiving Child Benefit for up to 8 weeks. Once a child is missing from education for 8 to 12 weeks (or 12+ weeks), there is a strong likelihood that the family has permanently relocated or is abroad without informing authorities. These cases represent the prime target for compliance checks and recovery of improper payments.',
    },
    {
      question: 'How is the "Modelled Yield" or "Financial Impact" calculated?',
      answer:
        'The formula multiplies the number of actionable cases (pupils missing 8+ weeks) by the Average Recovery per Case (£2,800 standard) and the Strike Rate (75% standard). For example, 100 actionable cases × £2,800 × 75% = £210,000 in projected recoverable public funds.',
    },
    {
      question: 'Where does the data come from?',
      answer:
        `All statistics are derived from official statutory census returns submitted by all ${TOTAL_AUTHORITIES_COUNT} English Local Authorities to the Department for Education (DfE) under Section 436A of the Education Act 1996 and published via the DfE Explore Education Statistics (EES) portal.`,
    },
    {
      question: 'How can I find my local council and export its data?',
      answer:
        `Go to the "LA Table" tab, type your council’s name into the search bar, and click "Inspect" on the right. You can also click the orange "Export CSV" button at the top right to download data for all ${TOTAL_AUTHORITIES_COUNT} councils into an Excel spreadsheet.`,
    },
  ];

  const jargonTerms = [
    {
      term: 'CME (Children Missing Education)',
      definition: 'Compulsory school-age pupils (5–16) not registered on any school roll and not receiving suitable alternative education.',
      icon: Users,
      color: 'bg-[#FE5729]/10 text-[#FE5729]',
    },
    {
      term: '12+ Weeks (Chronic Risk)',
      definition: 'Pupils absent from education for nearly a full academic term or longer. The highest priority pool for safeguarding and benefit reviews.',
      icon: Clock,
      color: 'bg-rose-50 text-rose-700',
    },
    {
      term: 'Target Cohort (8+ Weeks)',
      definition: 'The combined total of 8–12 weeks and 12+ weeks absences. This is the actionable cohort where statutory benefit eligibility has likely ended.',
      icon: ShieldAlert,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      term: 'Strike Rate',
      definition: 'The percentage of audited cases expected to yield confirmed recoveries (e.g. 75% default based on historical multi-agency audits).',
      icon: Sliders,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      term: 'Modelled Yield (£)',
      definition: 'The estimated recoverable public funds from improper Child Benefit disbursements that can be identified and reclaimed.',
      icon: PoundSterling,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Hero Welcome Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#FE5729]/10 border border-[#FE5729]/20 text-[#FE5729] text-xs font-bold uppercase tracking-wider">
              Help &amp; User Guide
            </span>
            <span className="text-neutral-300 text-xs">•</span>
            <span className="text-xs text-neutral-500 font-medium">Plain-English Overview for All Users</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1C1C] tracking-tight">
            How to Use the CME Intelligence &amp; Compliance Platform
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mt-2 leading-relaxed">
            Welcome! This platform brings together official Department for Education (DfE) census data and financial recovery modeling across all <strong>{TOTAL_AUTHORITIES_COUNT} English Local Authorities</strong>. You don’t need to be a data scientist or spreadsheet expert to find the insights you need.
          </p>

          {/* 3 Quick Action Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-neutral-100">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F4F4F6]">
              <span className="w-6 h-6 rounded-full bg-[#1C1C1C] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <h4 className="text-xs font-bold text-[#1C1C1C]">Pick a Census Term</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">Use the orange dropdown in the header to switch terms (e.g. 2025/26 Summer or Spring).</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F4F4F6]">
              <span className="w-6 h-6 rounded-full bg-[#FE5729] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <h4 className="text-xs font-bold text-[#1C1C1C]">Find Your Authority</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">Use the "LA Table" tab to search any council name and click "Inspect" for its full report.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F4F4F6]">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <h4 className="text-xs font-bold text-[#1C1C1C]">Model Financial Impact</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">Visit "Financial Impact" to test recovery values and see potential public savings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tab-by-Tab Interactive Walkthrough */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#FE5729]" />
              <h3 className="text-lg sm:text-xl font-bold text-[#1C1C1C]">
                Platform Tour: What Each Tab Does
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Select any tab below to learn what information it provides and how to get the most out of it.
            </p>
          </div>

          <span className="text-xs text-neutral-400 font-medium">7 Modular Sections</span>
        </div>

        {/* Tab Selection Pills */}
        <div className="flex flex-wrap gap-2 pt-6">
          {tabGuides.map((t) => {
            const Icon = t.icon;
            const isSelected = activeWalkthroughTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveWalkthroughTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C1C1C] text-white shadow-xs ring-2 ring-neutral-800'
                    : 'bg-[#F4F4F6] text-neutral-700 hover:bg-neutral-200/80 border border-neutral-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FE5729]' : 'text-neutral-500'}`} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Walkthrough Details Card */}
        {(() => {
          const guide = tabGuides.find((g) => g.id === activeWalkthroughTab) || tabGuides[0];
          const Icon = guide.icon;

          return (
            <div className="mt-6 p-6 sm:p-7 rounded-3xl border border-neutral-200/90 bg-[#FAF9FB] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-2xl ${guide.bgClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-bold text-[#1C1C1C]">{guide.name} Tab</h4>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600">
                        {guide.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{guide.oneLiner}</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab(guide.id)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1C1C1C] hover:bg-neutral-800 text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Open {guide.name} Tab</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FE5729]" />
                </button>
              </div>

              {/* Detail Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                <div>
                  <h5 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Info className="w-3.5 h-3.5 text-[#FE5729]" />
                    <span>What You'll See Here</span>
                  </h5>
                  <ul className="space-y-2">
                    {guide.whatYouSee.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-neutral-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>How to Use It</span>
                  </h5>
                  <ul className="space-y-2">
                    {guide.howToUse.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs text-neutral-600">
                        <ArrowRight className="w-3.5 h-3.5 text-[#FE5729] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Jargon Buster & Key Concepts */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-[#FE5729]" />
          <h3 className="text-lg sm:text-xl font-bold text-[#1C1C1C]">
            Jargon Buster: Key Metrics Explained
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mb-6">
          Simple definitions for the standard terms and metrics used across the dashboard.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jargonTerms.map((j, idx) => {
            const Icon = j.icon;
            return (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-[#FAF9FB] border border-neutral-200/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <div className={`p-2 rounded-xl ${j.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-[#1C1C1C]">{j.term}</h4>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed mt-1">{j.definition}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Frequently Asked Questions (Accordion) */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-1">
          <HelpCircle className="w-5 h-5 text-[#FE5729]" />
          <h3 className="text-lg sm:text-xl font-bold text-[#1C1C1C]">
            Frequently Asked Questions
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mb-6">
          Common questions about data interpretation, statutory rules, and practical tips.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200/80 overflow-hidden transition-all bg-white"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-[#F4F4F6] transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#1C1C1C] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FE5729]/10 text-[#FE5729] text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-[#FAF9FB]">
                    <p className="pl-7">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Direct Quick Jump Shortcuts */}
      <div className="bg-[#1C1C1C] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FE5729] text-white text-[10px] font-extrabold uppercase tracking-wider">
            Ready to Explore?
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight mt-2">
            Jump Directly to Any Section of the Platform
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Choose where you'd like to start. You can return to this Help guide at any time by clicking the Help tab in the top navigation bar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('executive-overview')}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
          >
            Overview
          </button>
          <button
            onClick={() => onNavigateTab('la-explorer')}
            className="px-4 py-2 rounded-full bg-[#FE5729] hover:bg-[#E0461B] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            LA Table ({TOTAL_AUTHORITIES_COUNT} Councils)
          </button>
          <button
            onClick={() => onNavigateTab('stratos-recovery')}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Financial Impact
          </button>
        </div>
      </div>

    </div>
  );
};
