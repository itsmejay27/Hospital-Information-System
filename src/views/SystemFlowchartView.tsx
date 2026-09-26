import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";
import PageHeader from "../components/PageHeader";
import { Activity } from "../components/Icons";

type Tone = "entry" | "check" | "admin" | "doctor" | "nurse" | "staff" | "end";

const toneStyle: Record<Tone, string> = {
  entry: "bg-slate-900 text-white border-slate-900",
  check: "bg-amber-50 text-amber-900 border-amber-300",
  admin: "bg-violet-50 text-violet-900 border-violet-300",
  doctor: "bg-sky-50 text-sky-900 border-sky-300",
  nurse: "bg-emerald-50 text-emerald-900 border-emerald-300",
  staff: "bg-orange-50 text-orange-900 border-orange-300",
  end: "bg-slate-100 text-slate-800 border-slate-300",
};

interface Step {
  title: string;
  detail?: string;
  tone: Tone;
  path?: string;
  roles?: Role[];
}

function Node({ step }: { step: Step }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canOpen = step.path && (!step.roles || (user && step.roles.includes(user.role)));
  const Tag = canOpen ? "button" : "div";
  return (
    <Tag
      onClick={canOpen ? () => navigate(step.path!) : undefined}
      className={`w-full rounded-xl border-2 px-3 py-2 text-center ${toneStyle[step.tone]} ${
        step.tone === "check" ? "rounded-3xl border-dashed" : ""
      } ${canOpen ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""}`}
    >
      <div className="text-xs font-bold leading-tight">{step.title}</div>
      {step.detail && <div className="text-[10px] opacity-80 mt-0.5 leading-snug">{step.detail}</div>}
    </Tag>
  );
}

const Arrow = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center py-1" aria-hidden="true">
    <div className="w-0.5 h-4 bg-slate-300" />
    {label && <div className="text-[10px] font-bold text-slate-500 my-0.5">{label}</div>}
    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[7px] border-l-transparent border-r-transparent border-t-slate-400" />
  </div>
);

function Flow({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-col items-stretch">
      {steps.map((s, i) => (
        <React.Fragment key={s.title}>
          {i > 0 && <Arrow />}
          <Node step={s} />
        </React.Fragment>
      ))}
    </div>
  );
}

const LANES: { role: Role; title: string; tone: Tone; steps: Step[] }[] = [
  {
    role: "admin",
    title: "Administrator",
    tone: "admin",
    steps: [
      { title: "System Console", detail: "Hospital-wide overview", tone: "admin", path: "/dashboard" },
      { title: "Account Directory", detail: "Create staff logins, suspend accounts", tone: "admin", path: "/admin/accounts", roles: ["admin"] },
      { title: "Duty Shifts", detail: "Assign Morning / Afternoon / Night shifts", tone: "admin", path: "/shifts" },
      { title: "Audit Ledger & RBAC", detail: "Review access logs and permissions", tone: "admin", path: "/admin/audit-ledger", roles: ["admin"] },
    ],
  },
  {
    role: "staff",
    title: "Front Desk / Staff",
    tone: "staff",
    steps: [
      { title: "Patient Registration", detail: "Demographics, PhilHealth, consent", tone: "staff", path: "/registration/new-patient", roles: ["staff"] },
      { title: "Live Queue", detail: "Assign queue number & doctor", tone: "staff", path: "/queue", roles: ["doctor", "nurse", "staff"] },
      { title: "Bed Allocation", detail: "Admit to ward / bed", tone: "staff", path: "/registration/beds", roles: ["staff", "nurse"] },
      { title: "PhilHealth eClaims", detail: "Benefit claims & billing", tone: "staff", path: "/philhealth", roles: ["doctor", "staff"] },
    ],
  },
  {
    role: "nurse",
    title: "Nurse",
    tone: "nurse",
    steps: [
      { title: "Chief Complaint & Vitals", detail: "Triage, VS, BMI", tone: "nurse", path: "/nursing?tab=complaint", roles: ["doctor", "nurse"] },
      { title: "Carry Out Doctor's Orders", tone: "nurse", path: "/nursing?tab=orders", roles: ["doctor", "nurse"] },
      { title: "Nursing Care Plan (ADPIE)", detail: "Assessment → Diagnosis → Planning → Intervention → Evaluation", tone: "nurse", path: "/nursing?tab=careplan", roles: ["doctor", "nurse"] },
      { title: "Nurses' Notes & Laboratory", detail: "FDAR charting, lab results", tone: "nurse", path: "/nursing?tab=notes", roles: ["doctor", "nurse"] },
      { title: "Shift Endorsement", detail: "SBAR handover to incoming nurse", tone: "nurse", path: "/nursing?tab=endorsement", roles: ["doctor", "nurse"] },
    ],
  },
  {
    role: "doctor",
    title: "Doctor",
    tone: "doctor",
    steps: [
      { title: "Doctor Workbench", detail: "SOAP consultation, ICD-10 diagnosis", tone: "doctor", path: "/clinical?tab=workbench", roles: ["doctor"] },
      { title: "Doctor's Orders", detail: "Medication, lab, diet, monitoring", tone: "doctor", path: "/nursing?tab=orders", roles: ["doctor", "nurse"] },
      { title: "e-Prescriptions & Labs", tone: "doctor", path: "/clinical?tab=prescriptions", roles: ["doctor"] },
      { title: "Referral / Discharge", detail: "Clearance and follow-up", tone: "doctor", path: "/queue", roles: ["doctor", "nurse", "staff"] },
    ],
  },
];

const PATIENT_JOURNEY: Step[] = [
  { title: "1. Arrival & Registration", detail: "Front desk", tone: "staff" },
  { title: "2. Queue & Triage", detail: "Stable / Observation / Critical", tone: "staff" },
  { title: "3. Chief Complaint & Vital Signs", detail: "Nurse", tone: "nurse" },
  { title: "4. Consultation", detail: "Doctor — SOAP & diagnosis", tone: "doctor" },
  { title: "5. Doctor's Orders", detail: "Meds, labs, imaging", tone: "doctor" },
  { title: "6. Nursing Care", detail: "ADPIE care plan, notes, labs", tone: "nurse" },
  { title: "7. Admission (if needed)", detail: "Ward & bed allocation", tone: "staff" },
  { title: "8. Discharge / Referral", detail: "Doctor clearance", tone: "doctor" },
  { title: "9. PhilHealth Claim & Billing", tone: "staff" },
];

export default function SystemFlowchartView() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Activity size={20} />}
        title="System Flowchart"
        description="How the CarePoint Hospital Information System works — from sign-in to each role's workflow. Click a box to open that page."
      />

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold">
        <span className="text-slate-500 uppercase tracking-wide font-bold">Legend:</span>
        {(
          [
            ["check", "Decision / check"],
            ["admin", "Administrator"],
            ["staff", "Front desk / staff"],
            ["nurse", "Nurse"],
            ["doctor", "Doctor"],
          ] as [Tone, string][]
        ).map(([tone, label]) => (
          <span key={tone} className={`px-2.5 py-1 rounded-lg border ${toneStyle[tone]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* 1. Access flow */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">1. Access &amp; Sign-in Flow</h2>
        <div className="max-w-md mx-auto">
          <Flow
            steps={[
              { title: "Public Website", detail: "Home • About • Departments • Announcements • Staff • Contact", tone: "entry", path: "/" },
              { title: "Staff Sign In", detail: "Email + password", tone: "end" },
            ]}
          />
          <Arrow />
          <Node step={{ title: "Valid password & linked staff account?", tone: "check" }} />
          <div className="grid grid-cols-2 gap-4 mt-1">
            <div>
              <Arrow label="No" />
              <Node step={{ title: "Access denied", detail: "Contact the administrator", tone: "end" }} />
            </div>
            <div>
              <Arrow label="Yes" />
              <Node step={{ title: "Account active?", detail: "Suspended accounts are blocked", tone: "check" }} />
              <Arrow label="Yes" />
              <Node step={{ title: "Role-based Dashboard", detail: "Admin • Doctor • Nurse • Staff", tone: "entry", path: "/dashboard" }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Role workflows */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">2. Workflow by Role</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {LANES.map(lane => (
            <div key={lane.role} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className={`text-center text-xs font-extrabold uppercase tracking-wide rounded-lg py-1.5 mb-3 border ${toneStyle[lane.tone]}`}>
                {lane.title}
              </div>
              <Flow steps={lane.steps} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-4">
          Every role also has <span className="font-semibold">Duty Shifts</span> (view own schedule) and{" "}
          <span className="font-semibold">Settings</span> (change password, profile picture).
        </p>
      </section>

      {/* 3. Patient journey */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-4">3. Patient Journey</h2>
        <div className="flex flex-wrap items-stretch gap-y-3">
          {PATIENT_JOURNEY.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div className="w-40">
                <Node step={s} />
              </div>
              {i < PATIENT_JOURNEY.length - 1 && <div className="text-slate-400 font-bold px-1.5" aria-hidden="true">→</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
