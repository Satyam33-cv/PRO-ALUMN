"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Send,
  Briefcase,
  ChevronRight,
  Check,
  Sparkles,
  Search,
  ArrowUpDown,
  X,
  Building2,
  Calendar,
  GripVertical,
  Kanban,
  List as ListIcon,
  MousePointerClick,
  Info,
  Lightbulb,
  Mail,
  FileText,
  Copy,
  CheckSquare,
  Square,
  MessageSquare,
  Share2,
  Award,
  Zap,
  ArrowUpRight,
  Sparkle,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type ReferralStatus = "pending" | "accepted" | "referred" | "hired";
type FilterType = ReferralStatus | "all" | "archived";

type Referral = {
  id: string;
  alumniName: string;
  alumniInitials: string;
  company: string;
  role: string;
  status: ReferralStatus;
  date: string;
  note: string;
  isArchived?: boolean;
};

type SortOption = "date-desc" | "date-asc" | "company-asc" | "company-desc" | "name-asc";
type ViewMode = "board" | "list";

const statusConfig: Record<
  ReferralStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    columnBg: string;
    activeBorder: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
    border: "border-amber-200 dark:border-amber-800/60",
    columnBg: "bg-amber-500/5 dark:bg-amber-950/20",
    activeBorder: "border-amber-400 bg-amber-500/10 shadow-amber-500/10",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60",
    border: "border-indigo-200 dark:border-indigo-800/60",
    columnBg: "bg-indigo-500/5 dark:bg-indigo-950/20",
    activeBorder: "border-indigo-400 bg-indigo-500/10 shadow-indigo-500/10",
    icon: CheckCircle2,
  },
  referred: {
    label: "Referred",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60",
    border: "border-cyan-200 dark:border-cyan-800/60",
    columnBg: "bg-cyan-500/5 dark:bg-cyan-950/20",
    activeBorder: "border-cyan-400 bg-cyan-500/10 shadow-cyan-500/10",
    icon: Send,
  },
  hired: {
    label: "Hired",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    border: "border-emerald-200 dark:border-emerald-800/60",
    columnBg: "bg-emerald-500/5 dark:bg-emerald-950/20",
    activeBorder: "border-emerald-400 bg-emerald-500/10 shadow-emerald-500/10",
    icon: Briefcase,
  },
};

interface SuggestedStepConfig {
  badge: string;
  badgeBg: string;
  actionTitle: string;
  actionSubtitle: string;
  btnLabel: string;
  icon: typeof Mail;
  modalHeader: string;
  modalSubheader: string;
  typeLabel: string;
  defaultSubject: (r: Referral) => string;
  defaultContent: (r: Referral) => string;
  checklist: string[];
}

const suggestedNextSteps: Record<ReferralStatus, SuggestedStepConfig> = {
  pending: {
    badge: "Follow-Up Recommended",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300",
    actionTitle: "Send gentle follow-up nudge",
    actionSubtitle: "A polite message keeps you top of mind after 3-5 business days.",
    btnLabel: "Draft Follow-Up",
    icon: Mail,
    modalHeader: "Draft Follow-Up Nudge",
    modalSubheader: "Polite reminder to check in with the alumni regarding your referral request.",
    typeLabel: "Follow-Up Message",
    defaultSubject: (r) => `Following up on referral request for ${r.role} at ${r.company}`,
    defaultContent: (r) =>
      `Hi ${r.alumniName},\n\nI hope you're having a great week! I wanted to briefly follow up on the referral request I sent for the ${r.role} role at ${r.company}.\n\nI've refreshed my resume and highlighted 2-3 key accomplishments directly relevant to ${r.company}'s work. I know you're busy, so I truly appreciate your time and consideration!\n\nBest regards,\n[Your Name]\n[Your Portfolio / LinkedIn]`,
    checklist: [
      "Ensure 3+ business days have passed since your initial request",
      "Attach an updated, targeted PDF resume",
      "Mention a recent company project or product release you admire",
    ],
  },
  accepted: {
    badge: "Action Required",
    badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300",
    actionTitle: "Share Job ID & tailored referral packet",
    actionSubtitle: "Provide your exact Requisition ID and 3 bullet highlights for internal submission.",
    btnLabel: "Generate Referral Packet",
    icon: FileText,
    modalHeader: "Referral Packet & Requisition Details",
    modalSubheader: "Provide everything the alumni needs to submit your referral in one message.",
    typeLabel: "Referral Packet",
    defaultSubject: (r) => `Referral Details: ${r.role} at ${r.company} (Req #[ID]) - [Your Name]`,
    defaultContent: (r) =>
      `Hi ${r.alumniName},\n\nThank you so much for agreeing to refer me! Here is everything you need for the internal portal submission:\n\n• Job Requisition Title: ${r.role}\n• Job Requisition ID: #[Enter Req ID from careers portal]\n• Job Posting URL: [Paste Job Link]\n• Full Name: [Your Full Name]\n• Email & Phone: [Your Email] | [Your Phone Number]\n• Portfolio / GitHub / LinkedIn: [Your URL]\n\nTop 3 Targeted Qualifications:\n1. 3+ years experience with key frameworks matching the role requirements.\n2. Led high-impact systems delivering 30%+ performance gains.\n3. Excited to contribute directly to ${r.company}'s engineering culture.\n\nPlease let me know once submitted so I can keep an eye on recruiter outreach. Thank you again!\n\nBest,\n[Your Name]`,
    checklist: [
      "Double-check that the Job Requisition is actively accepting applicants",
      "Format top 3 bullet achievements specifically for this role",
      "Confirm your contact information matches your portal account",
    ],
  },
  referred: {
    badge: "Key Milestone",
    badgeBg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300",
    actionTitle: "Draft email to recruiter & hiring team",
    actionSubtitle: "Reach out to the recruiter or talent team referencing your alumni referral.",
    btnLabel: "Draft Recruiter Email",
    icon: Send,
    modalHeader: "Draft Recruiter Outreach Email",
    modalSubheader: "Maximize your chances by reaching out to the recruiter or hiring manager directly.",
    typeLabel: "Recruiter Email",
    defaultSubject: (r) => `Internal Referral: ${r.role} at ${r.company} - [Your Name]`,
    defaultContent: (r) =>
      `Dear [Recruiter Name / Recruiting Team],\n\nI hope this email finds you well! I am writing to express my strong interest in the ${r.role} position at ${r.company}.\n\n${r.alumniName} recently submitted an internal employee referral on my behalf after reviewing my background and portfolio. Having led several initiatives aligned with ${r.company}'s mission, I am eager to contribute to the team.\n\nI have submitted my application through the official careers portal and attached my resume for your reference. I would welcome the opportunity to discuss how my skill set aligns with your team's goals.\n\nThank you for your time and consideration,\n\nBest regards,\n[Your Name]\n[Your Phone Number]\n[Your Portfolio/LinkedIn]`,
    checklist: [
      "Find the hiring recruiter or team lead on LinkedIn",
      "Reference your referrer by full name in the opening paragraph",
      "Mention your application confirmation number if submitted online",
      "Prepare your 90-second elevator pitch for the screening call",
    ],
  },
  hired: {
    badge: "Celebrate & Connect",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
    actionTitle: "Send thank-you letter & update network",
    actionSubtitle: "Express heartfelt gratitude to your referrer and announce your new milestone.",
    btnLabel: "Draft Thank-You Note",
    icon: Award,
    modalHeader: "Alumni Gratitude & Thank-You Note",
    modalSubheader: "Thank your alumni champion for opening the door and mentoring your success.",
    typeLabel: "Thank-You Letter",
    defaultSubject: (r) => `Exciting News & Sincere Thanks! - [Your Name] joining ${r.company}`,
    defaultContent: (r) =>
      `Dear ${r.alumniName},\n\nI have wonderful news to share — I have officially received and accepted the offer for the ${r.role} position at ${r.company}!\n\nYour internal referral, interview guidance, and encouragement made a world of difference throughout the interview loop. I could not have reached this milestone without your support.\n\nI start in a few weeks and would love to treat you to coffee or lunch to celebrate. Thank you once again for championing me!\n\nWith immense gratitude,\n[Your Name]`,
    checklist: [
      "Send a personal thank-you message or handwritten card",
      "Offer to connect in person or over virtual coffee once onboarded",
      "Update your LinkedIn profile and Alumni Network profile",
      "Consider paying it forward by mentoring junior students in the community",
    ],
  },
};

const steps: { key: ReferralStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "referred", label: "Referred" },
  { key: "hired", label: "Hired" },
];

const initialReferrals: Referral[] = [
  {
    id: "1",
    alumniName: "Priya Sharma",
    alumniInitials: "PS",
    company: "Google",
    role: "Software Engineer",
    status: "referred",
    date: "Aug 15, 2026",
    note: "Applied for L4 SWE position. Priya forwarded my resume to the hiring manager.",
  },
  {
    id: "2",
    alumniName: "Arjun Mehta",
    alumniInitials: "AM",
    company: "Microsoft",
    role: "Product Manager",
    status: "accepted",
    date: "Aug 18, 2026",
    note: "Arjun agreed to refer me for the PM role. Waiting for him to submit the internal referral.",
  },
  {
    id: "3",
    alumniName: "Sneha Reddy",
    alumniInitials: "SR",
    company: "Amazon",
    role: "Data Scientist",
    status: "pending",
    date: "Aug 20, 2026",
    note: "Request sent to Sneha for the DS role in AWS AI team.",
  },
  {
    id: "4",
    alumniName: "Vikram Patel",
    alumniInitials: "VP",
    company: "Netflix",
    role: "DevOps Engineer",
    status: "hired",
    date: "Jul 10, 2026",
    note: "Vikram referred me, cleared 5 rounds, and got the offer! Starting next month.",
  },
  {
    id: "5",
    alumniName: "Ananya Singh",
    alumniInitials: "AS",
    company: "Figma",
    role: "UX Designer",
    status: "pending",
    date: "Aug 19, 2026",
    note: "Sent referral request for the Design Systems role at Figma.",
  },
  {
    id: "6",
    alumniName: "Marcus Chen",
    alumniInitials: "MC",
    company: "Stripe",
    role: "Staff Infrastructure Engineer",
    status: "referred",
    date: "Aug 21, 2026",
    note: "Marcus submitted my referral via Stripe's internal talent portal for the Core Payments team.",
  },
  {
    id: "7",
    alumniName: "Elena Rostova",
    alumniInitials: "ER",
    company: "Apple",
    role: "Machine Learning Specialist",
    status: "accepted",
    date: "Aug 14, 2026",
    note: "Elena reviewed my portfolio and endorsed me for the Siri Natural Language processing team.",
  },
  {
    id: "8",
    alumniName: "David Kalu",
    alumniInitials: "DK",
    company: "Uber",
    role: "Backend Engineer II",
    status: "hired",
    date: "Jun 28, 2026",
    note: "Accepted the offer for Rider Logistics team after David provided mock interview mentorship.",
  },
  {
    id: "9",
    alumniName: "Sarah Jenkins",
    alumniInitials: "SJ",
    company: "Airbnb",
    role: "Senior Product Designer",
    status: "pending",
    date: "Aug 22, 2026",
    note: "Shared my case studies and requested a referral for Host Experience.",
  },
];

function StatusBadge({ status }: { status: ReferralStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.bg} ${config.color}`}
    >
      <Icon className="size-3.5" />
      {config.label}
    </motion.span>
  );
}

function StepIndicator({
  current,
  onSelectStep,
}: {
  current: ReferralStatus;
  onSelectStep?: (status: ReferralStatus) => void;
}) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-0 w-full max-w-lg">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step Node */}
            <div className="flex flex-col items-center relative group">
              <button
                type="button"
                onClick={() => onSelectStep?.(step.key)}
                className={`relative flex items-center justify-center rounded-full focus:outline-none transition-transform active:scale-95 ${
                  onSelectStep ? "cursor-pointer" : "cursor-default"
                }`}
                title={`Click to set status to ${step.label}`}
                aria-label={`Step ${i + 1}: ${step.label} (${isCurrent ? "Current step" : isPast ? "Completed" : "Upcoming"})`}
              >
                {/* Active Pulsing Halo */}
                {isCurrent && (
                  <motion.div
                    layoutId={`pulse-ring-${step.key}`}
                    className="absolute -inset-1.5 rounded-full bg-indigo-500/25 dark:bg-indigo-400/30"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.75, 0.15, 0.75],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Step Circle */}
                <motion.div
                  layout
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCurrent
                      ? "#4f46e5"
                      : isPast
                      ? "#10b981"
                      : "#e2e8f0",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 26,
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm relative z-10 transition-shadow ${
                    isCurrent
                      ? "shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                      : ""
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPast ? (
                      <motion.span
                        key="completed-check"
                        initial={{ scale: 0, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 45, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        className="flex items-center justify-center"
                      >
                        <Check className="size-4 stroke-[2.5]" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key={`step-num-${i}-${isCurrent}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={isCompleted ? "text-white" : "text-slate-500 dark:text-slate-400"}
                      >
                        {i + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>

              {/* Step Label */}
              <motion.span
                layout
                animate={{
                  color: isCurrent
                    ? "#4f46e5"
                    : isPast
                    ? "#059669"
                    : "#94a3b8",
                  fontWeight: isCurrent ? 700 : 500,
                  y: isCurrent ? 1 : 0,
                }}
                transition={{ duration: 0.25 }}
                className="mt-1.5 text-[11px] font-medium tracking-tight text-center whitespace-nowrap"
              >
                {step.label}
              </motion.span>
            </div>

            {/* Connecting Progress Bar */}
            {i < steps.length - 1 && (
              <div className="relative mx-1.5 sm:mx-2.5 h-1 flex-1 -mt-5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden min-w-[24px] sm:min-w-[44px]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-full"
                  initial={false}
                  animate={{
                    width: i < currentIndex ? "100%" : "0%",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 26,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SuggestedStepModal({
  referral,
  onClose,
  onUpdateStatus,
}: {
  referral: Referral | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: ReferralStatus) => void;
}) {
  if (!referral) return null;
  const config = suggestedNextSteps[referral.status];
  const Icon = config.icon;
  const [activeTab, setActiveTab] = useState<"draft" | "checklist">("draft");
  const [subject, setSubject] = useState(config.defaultSubject(referral));
  const [content, setContent] = useState(config.defaultContent(referral));
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleChecklist = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const currentIndex = steps.findIndex((s) => s.key === referral.status);
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Suggested Next Action
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.badgeBg}`}>
                  {config.badge}
                </span>
              </div>
              <h3 className="font-outfit text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {config.modalHeader}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                For {referral.alumniName} • {referral.role} at {referral.company}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "draft"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <Mail className="size-3.5" />
            {config.typeLabel} Template
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("checklist")}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "checklist"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <CheckSquare className="size-3.5" />
            Preparation Checklist ({Object.values(checkedItems).filter(Boolean).length}/{config.checklist.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "draft" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Message Body (Editable)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Tailor bracketed [details] before sending
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs font-mono leading-relaxed px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recommended action items for the <strong className="text-slate-800 dark:text-slate-200 capitalize">{referral.status}</strong> stage:
              </p>
              <div className="space-y-2">
                {config.checklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleChecklist(idx)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isChecked
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className={`mt-0.5 flex size-4 items-center justify-center rounded-md border shrink-0 ${
                        isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}>
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span className={`text-xs ${isChecked ? "line-through text-slate-400" : ""}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-slate-500" />
                <span>Copy Draft</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {nextStep && (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(referral.id, nextStep.key);
                  onClose();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <span>Mark Done & Advance to {nextStep.label}</span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<ReferralStatus | null>(null);
  const [statusToast, setStatusToast] = useState<{ name: string; message: string } | null>(null);
  const [selectedActionReferral, setSelectedActionReferral] = useState<Referral | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Multi-select & Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);

  const handleUpdateStatus = (id: string, newStatus: ReferralStatus) => {
    const target = referrals.find((r) => r.id === id);
    if (target && target.status !== newStatus) {
      setReferrals((prev) =>
        prev.map((ref) => (ref.id === id ? { ...ref, status: newStatus } : ref))
      );
      setStatusToast({
        name: target.alumniName,
        message: `Status updated to ${statusConfig[newStatus]?.label || newStatus}`,
      });
      setTimeout(() => setStatusToast(null), 3200);
    }
  };

  const handleAdvanceStatus = (id: string, currentStatus: ReferralStatus) => {
    const currentIndex = steps.findIndex((s) => s.key === currentStatus);
    if (currentIndex < steps.length - 1) {
      handleUpdateStatus(id, steps[currentIndex + 1].key);
    }
  };

  const handleExportCSV = () => {
    if (filteredAndSorted.length === 0) return;

    setIsExporting(true);

    try {
      const headers = [
        "Referral ID",
        "Alumni Name",
        "Company",
        "Role",
        "Status",
        "Date Requested",
        "Notes",
        "Archived",
      ];

      const rows = filteredAndSorted.map((r) => [
        r.id,
        r.alumniName,
        r.company,
        r.role,
        statusConfig[r.status]?.label || r.status,
        r.date,
        r.note,
        r.isArchived ? "Yes" : "No",
      ]);

      const csvContent = [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
        ...rows.map((row) =>
          row
            .map((field) => {
              const str = String(field ?? "");
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `referrals_export_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusToast({
        name: "Export Successful",
        message: `Downloaded ${filteredAndSorted.length} referral${filteredAndSorted.length === 1 ? "" : "s"} to CSV`,
      });
      setTimeout(() => setStatusToast(null), 3200);
    } finally {
      setTimeout(() => setIsExporting(false), 900);
    }
  };

  // Bulk Operations
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredAndSorted.map((r) => r.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setBulkStatusOpen(false);
  };

  const handleBulkArchive = (archive: boolean) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setReferrals((prev) =>
      prev.map((ref) => (selectedIds.includes(ref.id) ? { ...ref, isArchived: archive } : ref))
    );
    setSelectedIds([]);
    setStatusToast({
      name: archive ? "Archived Referrals" : "Restored Referrals",
      message: archive
        ? `Marked ${count} referral${count === 1 ? "" : "s"} as archived`
        : `Restored ${count} referral${count === 1 ? "" : "s"} to active pipeline`,
    });
    setTimeout(() => setStatusToast(null), 3200);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setReferrals((prev) => prev.filter((ref) => !selectedIds.includes(ref.id)));
    setSelectedIds([]);
    setIsDeleteModalOpen(false);
    setStatusToast({
      name: "Deleted Referrals",
      message: `Permanently removed ${count} referral${count === 1 ? "" : "s"}`,
    });
    setTimeout(() => setStatusToast(null), 3200);
  };

  const handleBulkChangeStatus = (newStatus: ReferralStatus) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setReferrals((prev) =>
      prev.map((ref) => (selectedIds.includes(ref.id) ? { ...ref, status: newStatus } : ref))
    );
    setBulkStatusOpen(false);
    setSelectedIds([]);
    setStatusToast({
      name: "Status Updated",
      message: `Moved ${count} referral${count === 1 ? "" : "s"} to ${statusConfig[newStatus]?.label || newStatus}`,
    });
    setTimeout(() => setStatusToast(null), 3200);
  };

  const handleExportSelectedCSV = () => {
    const selectedReferrals = referrals.filter((r) => selectedIds.includes(r.id));
    if (selectedReferrals.length === 0) return;

    const headers = [
      "Referral ID",
      "Alumni Name",
      "Company",
      "Role",
      "Status",
      "Date Requested",
      "Notes",
      "Archived",
    ];

    const rows = selectedReferrals.map((r) => [
      r.id,
      r.alumniName,
      r.company,
      r.role,
      statusConfig[r.status]?.label || r.status,
      r.date,
      r.note,
      r.isArchived ? "Yes" : "No",
    ]);

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row
          .map((field) => {
            const str = String(field ?? "");
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `referrals_selected_${selectedReferrals.length}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusToast({
      name: "Export Complete",
      message: `Downloaded ${selectedReferrals.length} selected referral${selectedReferrals.length === 1 ? "" : "s"} to CSV`,
    });
    setTimeout(() => setStatusToast(null), 3200);
  };

  // Drag handlers
  const handleDrag = (_: any, info: { point: { x: number; y: number } }) => {
    // Find drop zone element under current cursor
    const element = document.elementFromPoint(info.point.x, info.point.y);
    const dropZone = element?.closest("[data-drop-zone]") as HTMLElement | null;
    if (dropZone) {
      const zoneStatus = dropZone.getAttribute("data-drop-zone") as ReferralStatus;
      if (zoneStatus && zoneStatus !== hoveredDropZone) {
        setHoveredDropZone(zoneStatus);
      }
    } else {
      if (hoveredDropZone !== null) {
        setHoveredDropZone(null);
      }
    }
  };

  const handleDragEnd = (
    id: string,
    _: any,
    info: { point: { x: number; y: number } }
  ) => {
    const element = document.elementFromPoint(info.point.x, info.point.y);
    const dropZone = element?.closest("[data-drop-zone]") as HTMLElement | null;

    if (dropZone) {
      const targetStatus = dropZone.getAttribute("data-drop-zone") as ReferralStatus;
      if (targetStatus) {
        handleUpdateStatus(id, targetStatus);
      }
    }

    setDraggingId(null);
    setHoveredDropZone(null);
  };

  const activeReferralsCount = useMemo(
    () => referrals.filter((r) => !r.isArchived).length,
    [referrals]
  );
  const archivedReferralsCount = useMemo(
    () => referrals.filter((r) => r.isArchived).length,
    [referrals]
  );

  const filteredAndSorted = useMemo(() => {
    let result = referrals;

    // 1. Status / Archive Filter
    if (viewMode === "list") {
      if (filter === "archived") {
        result = result.filter((r) => r.isArchived);
      } else if (filter !== "all") {
        result = result.filter((r) => !r.isArchived && r.status === filter);
      } else {
        result = result.filter((r) => !r.isArchived);
      }
    } else {
      // Board view only shows active referrals
      result = result.filter((r) => !r.isArchived);
    }

    // 2. Search Query (Matches Alumni Name, Company, Role, Note)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.alumniName.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.note.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "company-asc") {
        return a.company.localeCompare(b.company);
      }
      if (sortBy === "company-desc") {
        return b.company.localeCompare(a.company);
      }
      if (sortBy === "name-asc") {
        return a.alumniName.localeCompare(b.alumniName);
      }
      return 0;
    });
  }, [referrals, filter, searchQuery, sortBy, viewMode]);

  const visibleIds = useMemo(() => filteredAndSorted.map((r) => r.id), [filteredAndSorted]);
  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.includes(id)).length,
    [visibleIds, selectedIds]
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const hasActiveFilters =
    (filter !== "all" && viewMode === "list") ||
    searchQuery.trim() !== "" ||
    sortBy !== "date-desc";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative selection:bg-indigo-500/20">
      {/* Toast Notification */}
      <AnimatePresence>
        {statusToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 shadow-xl border border-slate-700 dark:border-slate-200"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="text-xs">
              <p className="font-semibold">{statusToast.name}</p>
              <p className="text-slate-300 dark:text-slate-600">
                {statusToast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Drag Drop Bar (Active while dragging in any view) */}
      <AnimatePresence>
        {draggingId && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-500/40 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-2xl w-[92%]"
          >
            <div className="hidden sm:flex items-center gap-1 px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="size-3.5" />
              <span>Drop Target:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
              {steps.map((step) => {
                const config = statusConfig[step.key];
                const isHovered = hoveredDropZone === step.key;
                return (
                  <div
                    key={`floating-drop-${step.key}`}
                    data-drop-zone={step.key}
                    className={`py-3 px-2 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      isHovered
                        ? `${config.activeBorder} scale-105 ring-2 ring-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/60`
                        : `${config.bg} border-dashed border-slate-300 dark:border-slate-700 opacity-80`
                    }`}
                  >
                    <span className={`text-xs font-bold ${config.color}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400">Drop here</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-outfit text-2xl sm:text-3xl font-bold tracking-tight">
                  My Referrals
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <GripVertical className="size-3.5" /> Interactive Drag & Drop
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Drag and drop cards across columns or stages to instantly update referral status.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode("board")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "board"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="Kanban Board View"
                >
                  <Kanban className="size-3.5" />
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                  title="List View"
                >
                  <ListIcon className="size-3.5" />
                  List
                </button>
              </div>

              <Link
                href="/directory"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
              >
                Find Alumni
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Search, Sort & Filter Bar */}
          <div className="mt-6 space-y-4">
            {/* Search Input & Sort Dropdown Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by alumni, company, role, or notes..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown & Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <div className="relative flex items-center">
                  <ArrowUpDown className="absolute left-3 size-4 text-slate-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort referrals"
                    className="appearance-none pl-9 pr-8 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="date-desc">Newest Date</option>
                    <option value="date-asc">Oldest Date</option>
                    <option value="company-asc">Company (A-Z)</option>
                    <option value="company-desc">Company (Z-A)</option>
                    <option value="name-asc">Alumni Name (A-Z)</option>
                  </select>
                  <ChevronRight className="absolute right-2.5 size-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>

                {/* Export to CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={filteredAndSorted.length === 0 || isExporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Download current filtered referrals as CSV"
                >
                  <Download className={`size-3.5 text-indigo-600 dark:text-indigo-400 ${isExporting ? "animate-bounce" : ""}`} />
                  <span>{isExporting ? "Exporting..." : "Export to CSV"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    {filteredAndSorted.length}
                  </span>
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilter("all");
                      setSearchQuery("");
                      setSortBy("date-desc");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                    title="Reset all filters"
                  >
                    <X className="size-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* In List View: Filter Tabs */}
            {viewMode === "list" && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setFilter("all")}
                    className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === "all"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    All Active ({activeReferralsCount})
                  </button>
                  {steps.map((step) => {
                    const count = referrals.filter((r) => !r.isArchived && r.status === step.key).length;
                    return (
                      <button
                        key={step.key}
                        onClick={() => setFilter(step.key)}
                        className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          filter === step.key
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {step.label} ({count})
                      </button>
                    );
                  })}
                  {archivedReferralsCount > 0 && (
                    <button
                      onClick={() => setFilter("archived")}
                      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        filter === "archived"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-800/60"
                      }`}
                    >
                      <Archive className="size-3" />
                      Archived ({archivedReferralsCount})
                    </button>
                  )}
                </div>

                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <span>
                    Showing <strong className="text-slate-700 dark:text-slate-200">{filteredAndSorted.length}</strong> referral{filteredAndSorted.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            )}

            {/* In Board View: Drag Guide Helper */}
            {viewMode === "board" && (
              <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <GripVertical className="size-3" />
                  </span>
                  <span>
                    <strong>Drag any card</strong> by its handle or body to move it to another column.
                  </span>
                </div>
                <span>{filteredAndSorted.length} total referrals</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ======================= KANBAN BOARD VIEW ======================= */}
        {viewMode === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {steps.map((step) => {
              const config = statusConfig[step.key];
              const StepIcon = config.icon;
              const columnReferrals = filteredAndSorted.filter((r) => r.status === step.key);
              const isHovered = hoveredDropZone === step.key;

              return (
                <div
                  key={`column-${step.key}`}
                  data-drop-zone={step.key}
                  className={`rounded-2xl border-2 transition-all duration-200 flex flex-col min-h-[550px] p-4 ${
                    isHovered
                      ? `${config.activeBorder} ring-4 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]`
                      : `${config.border} ${config.columnBg} bg-opacity-40`
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${config.bg}`}>
                        <StepIcon className={`size-4 ${config.color}`} />
                      </div>
                      <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {step.label}
                      </h2>
                    </div>
                    <span className="inline-flex items-center justify-center size-6 rounded-full bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {columnReferrals.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-3.5 flex-1">
                    <AnimatePresence mode="popLayout">
                      {columnReferrals.map((referral) => {
                        const isBeingDragged = draggingId === referral.id;

                        return (
                          <motion.div
                            key={referral.id}
                            layout
                            drag
                            dragSnapToOrigin
                            onDragStart={() => setDraggingId(referral.id)}
                            onDrag={handleDrag}
                            onDragEnd={(e, info) => handleDragEnd(referral.id, e, info)}
                            whileDrag={{
                              scale: 1.05,
                              rotate: 1.8,
                              zIndex: 60,
                              boxShadow: "0 22px 35px -5px rgba(0,0,0,0.25), 0 10px 10px -5px rgba(0,0,0,0.1)",
                              cursor: "grabbing",
                            }}
                            initial={{ opacity: 0, scale: 0.92, y: 12 }}
                            animate={{ opacity: isBeingDragged ? 0.6 : 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -8 }}
                            transition={{
                              opacity: { duration: 0.2 },
                              scale: { type: "spring", stiffness: 380, damping: 28 },
                              layout: { type: "spring", stiffness: 350, damping: 30 },
                            }}
                            className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
                          >
                            {/* Card Top Row: Initials + Name + Drag Handle */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-xs font-bold text-white shadow-sm">
                                  {referral.alumniInitials}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-outfit font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {referral.alumniName}
                                  </h3>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {referral.company}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <GripVertical className="size-4" />
                              </div>
                            </div>

                            {/* Role */}
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 line-clamp-1">
                              {referral.role}
                            </p>

                            {/* Note snippet */}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 mb-3">
                              {referral.note}
                            </p>

                            {/* Suggested Next Step Indicator */}
                            {(() => {
                              const nextStep = suggestedNextSteps[referral.status];
                              const NextStepIcon = nextStep.icon;
                              return (
                                <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-cyan-50/70 dark:from-indigo-950/40 dark:to-cyan-950/30 border border-indigo-100 dark:border-indigo-800/60">
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                      <Lightbulb className="size-3 text-amber-500 fill-amber-500/20" />
                                      Suggested Next Step
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${nextStep.badgeBg}`}>
                                      {nextStep.badge}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedActionReferral(referral);
                                    }}
                                    className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-indigo-200/60 dark:border-indigo-700/60 shadow-2xs transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 group/btn cursor-pointer"
                                  >
                                    <span className="truncate flex items-center gap-1.5">
                                      <NextStepIcon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                      <span className="truncate">{nextStep.actionTitle}</span>
                                    </span>
                                    <ChevronRight className="size-3.5 shrink-0 text-slate-400 group-hover/btn:translate-x-0.5 group-hover/btn:text-indigo-600 transition-all" />
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Footer: Date & Quick Next Step */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="size-3" /> {referral.date}
                              </span>

                              {step.key !== "hired" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdvanceStatus(referral.id, referral.status);
                                  }}
                                  className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Advance <ChevronRight className="size-3" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Empty Drop Placeholder */}
                    {columnReferrals.length === 0 && (
                      <div
                        className={`h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-colors ${
                          isHovered
                            ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600"
                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        <p className="text-xs font-medium">No referrals in {step.label}</p>
                        <p className="text-[10px] mt-1 text-slate-400">Drag a card here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================= LIST VIEW ======================= */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {/* Multi-Select Header Toolbar */}
            {filteredAndSorted.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="flex items-center gap-2.5 font-semibold text-xs text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group cursor-pointer"
                  >
                    <div
                      className={`flex size-5 items-center justify-center rounded-lg border transition-all ${
                        allVisibleSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : someVisibleSelected
                          ? "bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400"
                      }`}
                    >
                      {allVisibleSelected ? (
                        <Check className="size-3.5 stroke-[3]" />
                      ) : someVisibleSelected ? (
                        <div className="w-2.5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                      ) : null}
                    </div>
                    <span>
                      {allVisibleSelected
                        ? `All ${filteredAndSorted.length} items in view selected`
                        : someVisibleSelected
                        ? `${visibleSelectedCount} of ${filteredAndSorted.length} selected in view`
                        : `Select all (${filteredAndSorted.length})`}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Clear Selection ({selectedIds.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* List Cards */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredAndSorted.map((referral) => {
                  const currentIndex = steps.findIndex((s) => s.key === referral.status);
                  const canAdvance = currentIndex < steps.length - 1;
                  const isBeingDragged = draggingId === referral.id;
                  const isSelected = selectedIds.includes(referral.id);

                  return (
                    <motion.div
                      key={referral.id}
                      layout
                      drag
                      dragSnapToOrigin
                      onDragStart={() => setDraggingId(referral.id)}
                      onDrag={handleDrag}
                      onDragEnd={(e, info) => handleDragEnd(referral.id, e, info)}
                      whileDrag={{
                        scale: 1.03,
                        rotate: 1.2,
                        zIndex: 60,
                        boxShadow:
                          "0 22px 35px -5px rgba(0,0,0,0.25), 0 10px 10px -5px rgba(0,0,0,0.1)",
                        cursor: "grabbing",
                      }}
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: isBeingDragged ? 0.6 : 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{
                        opacity: { duration: 0.22, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 380, damping: 28 },
                        y: { type: "spring", stiffness: 380, damping: 28 },
                        layout: { type: "spring", stiffness: 350, damping: 30 },
                      }}
                      className={`group rounded-2xl border transition-all relative p-6 ${
                        isSelected
                          ? "border-indigo-500 dark:border-indigo-500/80 bg-indigo-50/25 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30 shadow-md"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Checkbox & Drag Handle & Avatar */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {/* Multi-Select Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(referral.id);
                            }}
                            className={`flex size-6 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs scale-105"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500 text-transparent"
                            }`}
                            aria-label={
                              isSelected
                                ? `Deselect referral from ${referral.alumniName}`
                                : `Select referral from ${referral.alumniName}`
                            }
                          >
                            <Check
                              className={`size-4 stroke-[3] ${
                                isSelected ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </button>

                          <div
                            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Drag to update category"
                          >
                            <GripVertical className="size-5" />
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
                            {referral.alumniInitials}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-outfit text-lg font-bold text-slate-900 dark:text-slate-100">
                                {referral.alumniName}
                              </h3>
                              <StatusBadge status={referral.status} />
                              {referral.isArchived && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Archive className="size-3" />
                                  Archived
                                </span>
                              )}
                            </div>

                            {/* Quick Status Advance / Switcher */}
                            <div className="flex items-center gap-2">
                              {canAdvance && !referral.isArchived && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceStatus(referral.id, referral.status)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                  Advance to {steps[currentIndex + 1].label}
                                  <ChevronRight className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                            <span>{referral.role}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                              <Building2 className="size-3.5 text-slate-400" />
                              {referral.company}
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono flex items-center gap-1">
                            <Calendar className="size-3" /> {referral.date}
                          </p>

                          {/* Step Indicator with Framer Motion transitions */}
                          <div className="mt-5 py-2.5 px-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Referral Progression Flow
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Click or drag card to update status
                              </span>
                            </div>
                            <StepIndicator
                              current={referral.status}
                              onSelectStep={(newStatus) => handleUpdateStatus(referral.id, newStatus)}
                            />
                          </div>

                          {/* Note */}
                          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/60">
                            {referral.note}
                          </p>

                          {/* Suggested Next Step Indicator Banner */}
                          {(() => {
                            const nextStep = suggestedNextSteps[referral.status];
                            const NextStepIcon = nextStep.icon;
                            return (
                              <div className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-cyan-50/70 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-cyan-950/30 border border-indigo-100 dark:border-indigo-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3.5 min-w-0">
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-indigo-100 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <NextStepIcon className="size-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                        <Lightbulb className="size-3.5 text-amber-500 fill-amber-500/20" />
                                        Suggested Next Step
                                      </span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${nextStep.badgeBg}`}>
                                        {nextStep.badge}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                                      {nextStep.actionTitle}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {nextStep.actionSubtitle}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedActionReferral(referral)}
                                  className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                                >
                                  <span>{nextStep.btnLabel}</span>
                                  <ChevronRight className="size-3.5" />
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
              <Search className="size-7 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No referrals found</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No results match "${searchQuery}"${filter !== "all" ? ` with status "${filter}"` : ""}. Try adjusting your keywords or clearing filters.`
                : filter === "archived"
                ? "No archived referrals at the moment."
                : filter !== "all"
                ? `No referrals currently in the "${filter}" stage.`
                : "Start by finding alumni to request a referral."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearchQuery("");
                    setSortBy("date-desc");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-sm"
                >
                  <X className="size-4" />
                  Clear Search & Filters
                </button>
              ) : (
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
                >
                  Browse Alumni Directory
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-2rem)] sm:w-auto bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-2.5 sm:px-4 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 sm:gap-3"
          >
            {/* Selected Counter & Quick Selection */}
            <div className="flex items-center gap-2.5 pr-2 sm:border-r sm:border-slate-700/80">
              <span className="flex items-center justify-center size-6 rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-sm">
                {selectedIds.length}
              </span>
              <span className="text-xs font-semibold whitespace-nowrap text-slate-200">
                Selected
              </span>
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline whitespace-nowrap hidden sm:inline"
              >
                {allVisibleSelected ? "Deselect view" : "Select all in view"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Archive / Unarchive */}
              <button
                type="button"
                onClick={() => handleBulkArchive(filter !== "archived")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
                title={
                  filter === "archived"
                    ? "Restore selected to active pipeline"
                    : "Move selected to archive"
                }
              >
                {filter === "archived" ? (
                  <>
                    <ArchiveRestore className="size-3.5 text-emerald-400" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="size-3.5 text-amber-400" />
                    <span>Archive</span>
                  </>
                )}
              </button>

              {/* Change Status Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkStatusOpen(!bulkStatusOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-indigo-400" />
                  <span>Set Status</span>
                  <ChevronRight
                    className={`size-3 transition-transform ${
                      bulkStatusOpen ? "-rotate-90" : "rotate-90"
                    }`}
                  />
                </button>

                {bulkStatusOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1.5 z-50">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Move to Status
                    </div>
                    {steps.map((step) => {
                      const config = statusConfig[step.key];
                      const StepIcon = config.icon;
                      return (
                        <button
                          key={step.key}
                          type="button"
                          onClick={() => handleBulkChangeStatus(step.key)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 text-left transition-colors cursor-pointer"
                        >
                          <StepIcon className={`size-3.5 ${config.color}`} />
                          <span>{step.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Export Selected CSV */}
              <button
                type="button"
                onClick={handleExportSelectedCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
                title="Download only selected referrals as CSV"
              >
                <Download className="size-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export Selected</span>
                <span className="sm:hidden">Export</span>
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Delete selected referrals"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
              aria-label="Clear selection"
              title="Deselect all"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-outfit text-lg font-bold text-slate-900 dark:text-slate-100">
                    Delete {selectedIds.length} Referral{selectedIds.length === 1 ? "" : "s"}?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete the {selectedIds.length} selected referral request{selectedIds.length === 1 ? "" : "s"}? They will be removed from your tracking pipeline.
              </p>

              <div className="max-h-32 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
                {referrals
                  .filter((r) => selectedIds.includes(r.id))
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <span className="truncate">{r.alumniName}</span>
                      <span className="text-slate-400 text-[11px] shrink-0">{r.company}</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suggested Step Contextual Modal */}
      <AnimatePresence>
        {selectedActionReferral && (
          <SuggestedStepModal
            referral={selectedActionReferral}
            onClose={() => setSelectedActionReferral(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

