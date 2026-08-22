import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  FileText, 
  AlertCircle, 
  Scale, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  PoundSterling,
  Building,
  Users,
  Search,
  Lock,
  FileSpreadsheet,
  Copy,
  Check,
  Award,
  AlertTriangle,
  FileCheck,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TOTAL_AUTHORITIES_COUNT } from '../../data/cmeData';

interface LegalSection {
  id: string;
  category: 'statutory' | 'hmrc' | 'data-protection' | 'clawback' | 'workflow' | 'safeguarding';
  number: string;
  title: string;
  subtitle: string;
  primaryAct: string;
  content: React.ReactNode;
}

export const StratosComplianceGuide: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'cme-statutory': true,
    'child-benefit': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyCitation = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(id);
    setTimeout(() => setCopiedCitation(null), 2500);
  };

  const sections: LegalSection[] = [
    {
      id: 'cme-statutory',
      category: 'statutory',
      number: '01',
      title: 'Statutory CME Duty & School Roll Deletion Rules',
      subtitle: 'Mandatory Local Authority duties under Section 436A Education Act 1996 and 2016 Pupil Registration amendments',
      primaryAct: 'Section 436A Education Act 1996 • Pupil Registration (England) Regulations 2006',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            Under <strong>Section 436A of the Education Act 1996</strong> (inserted by Section 4 of the Education and Inspections Act 2006), all {TOTAL_AUTHORITIES_COUNT} English Local Education Authorities (LEAs) possess an unequivocal, non-delegable statutory duty to make arrangements to enable them to establish the identities of children in their area who are of compulsory school age and:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Statutory Scope (Inclusions)
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Compulsory school-age children (aged 5 to 16) not registered at a school.</li>
                <li>Children not receiving suitable education otherwise (e.g. unverified home education).</li>
                <li>Pupils with 10+ consecutive days of unauthorised absence where whereabouts are unknown.</li>
                <li>Pupils who have moved into the Local Authority boundary without an enrolled school place.</li>
              </ul>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Statutory Exclusions
              </h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Children registered at a school with authorised temporary medical absence.</li>
                <li>Verified and evaluated Elective Home Education (EHE) under Section 7 Education Act 1996.</li>
                <li>Post-compulsory education students (having completed Year 11 / reaching age 16).</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/70 rounded-lg border border-indigo-200/80">
            <h5 className="font-bold text-indigo-950 mb-1 text-xs">
              Mandatory Joint Investigation & 20-Day Roll Deletion Protocol (Regulation 8 & 12)
            </h5>
            <p className="text-indigo-900 text-xs">
              Under Regulation 8(1)(h) of the <em>Education (Pupil Registration) (England) Regulations 2006 (as amended by 2016 Regs)</em>, a school cannot lawfully remove a pupil from roll until <strong>both the school and the Local Authority have jointly conducted reasonable enquiries for a minimum of 20 continuous school days</strong> without locating the child. Under Regulation 12, schools must notify the Local Authority within 5 days of adding or removing a pupil.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'child-benefit',
      category: 'hmrc',
      number: '02',
      title: 'HMRC Child Benefit Law & 8-Week Residence Ceiling',
      subtitle: 'Statutory basis for non-entitlement, temporary absence limits, and Section 71 overpayment recovery',
      primaryAct: 'Social Security Contributions & Benefits Act 1992 • Child Benefit (General) Regs 2006',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            Child Benefit is governed by Section 141 of the <strong>Social Security Contributions and Benefits Act 1992 (SSCBA 1992)</strong> and the <strong>Child Benefit (General) Regulations 2006 (SI 2006/223)</strong>. Entitlement is legally contingent on ongoing physical presence and ordinary residence in the United Kingdom.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Reg 23(1) Standard Rule</span>
              <h5 className="font-bold text-slate-900 mt-0.5 text-xs">8-Week Absence Ceiling</h5>
              <p className="text-slate-600 mt-1">
                Temporary absence from Great Britain is disregarded for up to <strong>8 consecutive weeks</strong>. Beyond 8 weeks without notice, entitlement is legally extinguished.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Reg 23(2) Special Extension</span>
              <h5 className="font-bold text-slate-900 mt-0.5 text-xs">12-Week Bereavement/Illness</h5>
              <p className="text-slate-600 mt-1">
                Disregard may extend to <strong>12 weeks</strong> only if absence is due to the death of a parent, sibling, or close relative abroad, subject to verified documentation.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Reg 23(3) Medical Disregard</span>
              <h5 className="font-bold text-slate-900 mt-0.5 text-xs">52-Week Medical Treatment</h5>
              <p className="text-slate-600 mt-1">
                Extended up to <strong>52 weeks</strong> solely where the child is undergoing certified NHS-referred specialised medical treatment abroad.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-lg border border-rose-200/80">
            <h5 className="font-bold text-rose-950 mb-1 text-xs">
              Section 71 Social Security Administration Act 1992 (Mandatory Recovery Duty)
            </h5>
            <p className="text-rose-900 text-xs">
              Where Child Benefit disbursements continue to be claimed for a child who has left the UK or failed to reside with the claimant, the Secretary of State has a statutory entitlement and duty under Section 71 SSAA 1992 to recover 100% of overpaid amounts resulting from a failure to disclose material changes in circumstances.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'data-protection',
      category: 'data-protection',
      number: '03',
      title: 'Digital Economy Act 2017 & Legal Data Gateways',
      subtitle: 'Statutory authority for Local Authority, DfE, HMRC, and DWP inter-agency data matching without breach of UK GDPR',
      primaryAct: 'Digital Economy Act 2017 (Part 5) • Data Protection Act 2018 • UK GDPR Art. 6(1)(e)',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            Inter-agency data triangulation between Local Authority CME registers and central government benefits systems is conducted under clear primary legislative gateways that strictly satisfy <strong>UK GDPR</strong> and the <strong>Data Protection Act 2018 (DPA 2018)</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h5 className="font-bold text-slate-900 text-xs">
                  Digital Economy Act 2017 (Part 5, Chapter 1 & 2)
                </h5>
              </div>
              <p className="text-slate-600">
                Authorises public authorities (including local councils, DfE, and HMRC) to disclose information for public service delivery and the identification/prevention of fraud and error against the public purse.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h5 className="font-bold text-slate-900 text-xs">
                  UK GDPR Lawful Basis (Article 6 & 9)
                </h5>
              </div>
              <p className="text-slate-600">
                <strong>Article 6(1)(e) (Public Task):</strong> Processing is necessary for the performance of a task carried out in the public interest. <br />
                <strong>DPA 2018 Schedule 2 Part 1:</strong> Exemption for the prevention and detection of unlawful disbursements and tax administration.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300/70 text-slate-800 text-[11px]">
            <strong>ICO Code of Practice on Data Sharing:</strong> All data transfers utilize end-to-end encrypted pseudonymised UPN/NINO matching protocols adhering to the Information Commissioner's statutory Code of Practice.
          </div>
        </div>
      ),
    },
    {
      id: 'clawback',
      category: 'clawback',
      number: '04',
      title: 'Recovery Calculation Formulas & Limitation Periods',
      subtitle: 'Exact statutory weekly rates, retrospective lookback horizons, and Limitation Act 1980 provisions',
      primaryAct: 'Limitation Act 1980 (Section 9 & 32) • Social Security (Overpayments and Recovery) Regs 2013',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            The CME Financial Impact model computes recoverable sums based on statutory weekly Child Benefit disbursement rates established by HM Treasury:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Eldest / Only Child</span>
              <div className="text-base font-bold text-slate-900 mt-1">£25.60 / wk</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">£1,331.20 per annum</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Subsequent Children</span>
              <div className="text-base font-bold text-slate-900 mt-1">£16.95 / wk</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">£881.40 per annum</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Blended Model Base</span>
              <div className="text-base font-bold text-slate-900 mt-1">£21.00 / wk</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Weighted avg per CME pupil</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-900 text-xs">
              Statutory Limitation Periods (Limitation Act 1980)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <strong>Standard Recovery (6-Year Window):</strong> Under Section 9 of the Limitation Act 1980, actions to recover sums recoverable by virtue of any enactment must be brought within 6 years from the date on which the cause of action accrued.
              </div>
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <strong>Deliberate Concealment / Fraud (Unlimited Window):</strong> Under Section 32(1)(b) Limitation Act 1980, where any fact relevant to the right of action has been deliberately concealed, the period of limitation does not begin until discovery.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'workflow',
      category: 'workflow',
      number: '05',
      title: 'End-to-End Multi-Agency Recovery Workflow',
      subtitle: 'Standard Operating Procedure (SOP) from initial CME alert through to final fund restitution',
      primaryAct: 'DfE CME Guidance 2024 • HMRC Debt Management Manual (DMM)',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'School Attendance Trigger & 10-Day Notice',
                desc: 'Pupil incurs 10 consecutive unauthorised absence days. School conducts initial contact enquiry and issues S.436A CME referral to Local Authority.',
              },
              {
                step: '2',
                title: 'LA CME Investigation & 20-Day Joint Enquiries',
                desc: 'Local Authority Education Welfare Service (EWS) initiates multi-agency enquiries (housing, health, police, neighboring LAs) for 20 continuous school days.',
              },
              {
                step: '3',
                title: 'Duration Stratification (8–12w & 12+w Flagging)',
                desc: 'Cases exceeding the 8-week statutory absence limit are stratified. Chronic 12+ week cases with unverified addresses are flagged for central HMRC matching.',
              },
              {
                step: '4',
                title: 'DEA 2017 Inter-Agency Match with HMRC Child Benefit Office',
                desc: 'Secure digital batch matching verifies if active Child Benefit disbursements continue for unlocated/departed pupils.',
              },
              {
                step: '5',
                title: 'Suspension Notice & Section 71 Formal Clawback',
                desc: 'HMRC issues formal notice of claim suspension. If non-residence is affirmed, formal repayment demand is executed with direct recovery from earnings or tax codes.',
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">{s.title}</h6>
                  <p className="text-slate-600 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'safeguarding',
      category: 'safeguarding',
      number: '06',
      title: 'Safeguarding Firewall, SEN Protections & Tribunal Appeals',
      subtitle: 'Mandatory primacy of child welfare, EHCP/SEN exemptions, and First-tier Tribunal dispute rights',
      primaryAct: 'Children Act 2004 (Section 11) • Working Together to Safeguard Children 2023 • SEND Code of Practice',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
            <h5 className="font-bold text-rose-950 flex items-center gap-1.5 text-xs mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Absolute Primacy of Child Safeguarding
            </h5>
            <p className="text-rose-900 text-xs">
              Under <strong>Section 11 of the Children Act 2004</strong> and <em>Working Together to Safeguard Children 2023</em>, the statutory duty to safeguard and promote the welfare of children strictly takes legal precedence over any financial recovery process. Financial investigations must NEVER compromise an active child protection investigation or vulnerable child placement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1 text-xs">SEND & Medical Protection</h5>
              <p className="text-slate-600">
                Pupils with an Education, Health and Care Plan (EHCP) or documented complex medical needs are subject to specialized review. Where non-attendance stems from provision failure rather than unnotified departure, benefit entitlement remains fully protected. The DfE census carries no SEND or EHCP characteristic, so this cohort cannot be sized from this data set.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1 text-xs">Appeals & Tribunal Rights</h5>
              <p className="text-slate-600">
                Claimants have a statutory right to request <strong>Mandatory Reconsideration</strong> within 30 days of any HMRC suspension notice. If unresolved, an appeal lies directly to the independent <strong>First-tier Tribunal (Social Entitlement Chamber)</strong>.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Filtering based on search query & category
  const filteredSections = sections.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.primaryAct.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 mb-8 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-[#1C1C1C] text-white rounded-3xl p-6 shadow-sm border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FE5729]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FE5729]/10 border border-[#FE5729]/20 flex items-center justify-center text-[#FE5729] shadow-inner shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display">
                  HMRC Child Benefit & DfE CME Statutory Compliance Manual
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FE5729]/20 text-[#FE5729] border border-[#FE5729]/30 hidden sm:inline">
                  Legal Reference v2.4
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Complete statutory framework, duration risk triggers (8w & 12w+), DEA 2017 legal gateways, and multi-agency audit protocols
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                const allOpen = Object.values(openSections).every(Boolean);
                const newState: Record<string, boolean> = {};
                sections.forEach((s) => { newState[s.id] = !allOpen; });
                setOpenSections(newState);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full transition-colors cursor-pointer"
            >
              {Object.values(openSections).every(Boolean) ? 'Collapse All' : 'Expand All Sections'}
            </button>
          </div>
        </div>

        {/* Quick Legal KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-800 relative z-10">
          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Primary Education Act</div>
            <div className="text-xs font-bold text-white mt-1">Section 436A EA 1996</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">{TOTAL_AUTHORITIES_COUNT} LEAs Statutory Scope</div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Benefit Absence Ceiling</div>
            <div className="text-xs font-bold text-[#FE5729] mt-1">8 Weeks (Reg 23)</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">SI 2006/223 Regulations</div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Data Sharing Gateway</div>
            <div className="text-xs font-bold text-sky-400 mt-1">DEA 2017 (Part 5)</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Public Service / Fraud</div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Recovery Limitation</div>
            <div className="text-xs font-bold text-purple-400 mt-1">6 Years / No Limit</div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Limitation Act 1980</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search legal citations, acts, regulations, or keywords (e.g. S.436A, Reg 23, DEA 2017, Tribunal)..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F4F6] border border-neutral-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#FE5729]/20 focus:border-[#FE5729]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Manuals' },
            { id: 'statutory', label: 'DfE Statutory' },
            { id: 'hmrc', label: 'HMRC / Benefits' },
            { id: 'data-protection', label: 'DEA 2017 / GDPR' },
            { id: 'clawback', label: 'Calculations' },
            { id: 'safeguarding', label: 'Safeguarding' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#1C1C1C] text-white shadow-xs'
                  : 'bg-[#F4F4F6] text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Sections List */}
      <div className="space-y-3.5">
        {filteredSections.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-neutral-200 text-neutral-500 text-xs">
            No compliance sections found matching &quot;{searchQuery}&quot;. Try adjusting your search query or selected category.
          </div>
        ) : (
          filteredSections.map((sec) => {
            const isOpen = openSections[sec.id];

            return (
              <div 
                key={sec.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isOpen ? 'border-[#FE5729]/40 shadow-sm' : 'border-neutral-200/80 shadow-2xs hover:border-neutral-300'
                }`}
              >
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full px-6 py-4.5 text-left flex items-start justify-between hover:bg-[#F4F4F6]/50 transition-colors cursor-pointer gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FE5729]/10 border border-[#FE5729]/20 text-[#FE5729] flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      {sec.number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#1C1C1C]">
                          {sec.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {sec.primaryAct}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 mt-1">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-6 border-t border-neutral-100 bg-[#F4F4F6]/40">
                    {sec.content}

                    {/* Quick Citation Snippet Card */}
                    <div className="mt-4 pt-3 border-t border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500">
                      <div className="flex items-center space-x-1.5">
                        <Scale className="w-3.5 h-3.5 text-[#FE5729]" />
                        <span>Statutory Citation: <strong className="text-[#1C1C1C] font-semibold">{sec.primaryAct}</strong></span>
                      </div>
                      <button
                        onClick={() => handleCopyCitation(sec.primaryAct, sec.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FE5729] hover:text-[#d4431a] transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        {copiedCitation === sec.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Citation Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Legal Citation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Compliance FAQ & Audit FAQ Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1C1C1C]">
              Frequently Addressed Statutory Audit & Compliance Scenarios
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Guidance for Chief Finance Officers (S.151), Directors of Children’s Services (DCS), and Audit Committees
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <h5 className="font-bold text-[#1C1C1C] mb-1.5">
              Q: What happens if parents claim Elective Home Education (EHE) after moving abroad?
            </h5>
            <p className="text-neutral-600 leading-relaxed">
              Under Section 7 Education Act 1996, EHE is only valid if education is provided in England. If the child resides outside the UK, the claimant fails the Regulation 23 residence condition of the Child Benefit Regulations 2006, rendering benefits immediately repayable under Section 71 SSAA 1992.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <h5 className="font-bold text-[#1C1C1C] mb-1.5">
              Q: Can schools remove a pupil from roll without Local Authority agreement?
            </h5>
            <p className="text-neutral-600 leading-relaxed">
              No. Under Regulation 8(1)(h) of the Education (Pupil Registration) Regulations 2006, deleting a pupil whose whereabouts are unconfirmed requires <strong>both</strong> the school and LA to have jointly completed reasonable enquiries over 20 continuous school days.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <h5 className="font-bold text-[#1C1C1C] mb-1.5">
              Q: How does this interact with Universal Credit Child Elements?
            </h5>
            <p className="text-neutral-600 leading-relaxed">
              Under Regulation 27 of the Universal Credit Regulations 2013, the child element ceases when a child leaves Great Britain for a period exceeding 1 month. The data matching gateway identifies simultaneous overpayments across both benefits.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F6] border border-neutral-200/70">
            <h5 className="font-bold text-[#1C1C1C] mb-1.5">
              Q: What is the burden of proof for HMRC clawback demands?
            </h5>
            <p className="text-neutral-600 leading-relaxed">
              The standard of proof is the balance of probabilities. Evidence from school roll registers, local housing inquiries, and border movement records provides conclusive administrative substantiation under Social Security Commissioners' precedent.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
