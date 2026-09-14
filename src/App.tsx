import { useState, useEffect } from "react";
import {
  User,
  Page,
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  TreatmentLog,
  AdmissionEntry,
  AuditLog,
  VisitorLog,
  ShiftEndorsement,
  HospitalConfig,
  OpdTab,
  OpdQueueItem,
  PhilHealthClaim,
  OpdReferral,
  OpdDischarge,
} from "./types";
import {
  DEMO_USERS,
  INITIAL_PATIENTS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_LAB_RESULTS,
  INITIAL_MEDICATIONS,
  INITIAL_TREATMENTS,
  INITIAL_ADMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_VISITOR_LOGS,
  INITIAL_SHIFT_ENDORSEMENTS,
  INITIAL_HOSPITAL_CONFIG,
  INITIAL_OPD_QUEUE,
  INITIAL_PHILHEALTH_CLAIMS,
  INITIAL_OPD_REFERRALS,
  INITIAL_OPD_DISCHARGES,
} from "./mockData";
import OpdSidebar from "./components/OpdSidebar";
import OpdTopNav from "./components/OpdTopNav";
import OpdDashboardView from "./views/OpdDashboardView";
import OpdQueueView from "./views/OpdQueueView";
import PhilHealthClaimsView from "./views/PhilHealthClaimsView";
import OpdReportsView from "./views/OpdReportsView";
import RoleSwitcher from "./components/RoleSwitcher";
import DoctorWorkbench from "./views/DoctorWorkbench";
import NurseStation from "./views/NurseStation";
import StaffAdmissions from "./views/StaffAdmissions";
import AdminCompliance from "./views/AdminCompliance";
import BackButton from "./components/BackButton";

import {
  Siren,
  Activity,
  ArrowRight,
  Building2,
  Bed,
  Microscope,
  Scan,
  Pill,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  LayoutDashboard,
  LogIn,
  LogOut,
  Zap,
  X,
  AlertCircle,
  AlertTriangle,
  HeartPulse,
  FileCheck,
} from "./components/Icons";

// — Emergency Banner —
function EmergencyBanner({ config }: { config: HospitalConfig }) {
  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm font-medium text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 flex-wrap">
      <Siren size={20} strokeWidth={2} className="animate-pulse text-white flex-shrink-0" />
      <span>Emergency Hotline: <strong className="ml-1 tracking-wider text-white font-bold">{config.emergencyHotline}</strong></span>
      <span className="hidden sm:inline opacity-50">|</span>
      <span className="hidden sm:inline">24/7 Emergency & Trauma Care — {config.name}</span>
    </div>
  );
}

function getPortalInfo(role: User["role"]) {
  switch (role) {
    case "doctor": return { label: "Physician Workbench", Icon: Stethoscope };
    case "nurse": return { label: "Nursing Station & MAR", Icon: Syringe };
    case "staff": return { label: "Admissions Desk", Icon: ClipboardList };
    case "admin": return { label: "Admin & Compliance", Icon: ShieldCheck };
    default: return { label: "Staff Dashboard", Icon: LayoutDashboard };
  }
}

// — Top Navigation —
function Nav({
  page,
  setPage,
  user,
  config,
  onLogin,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  user: User | null;
  config: HospitalConfig;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const publicLinks: { label: string; page: Page }[] = [
    { label: "Home", page: "home" },
    { label: "About", page: "about" },
    { label: "Departments", page: "departments" },
    { label: "Announcements", page: "announcements" },
    { label: "Staff", page: "staff" },
    { label: "Contact", page: "contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setPage("home")}
            className="flex items-center gap-3 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-[#1a3a5c] transition-colors">
              <Activity size={20} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <div className="font-serif text-lg font-normal text-[var(--primary)] leading-tight">
                {config.name}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] tracking-widest uppercase font-semibold">
                Hospital Information System (HIS)
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {publicLinks.map(l => (
              <button
                key={l.page}
                onClick={() => setPage(l.page)}
                className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                  page === l.page
                    ? "text-[var(--accent)] bg-[var(--secondary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {l.label}
              </button>
            ))}

            {user && (() => {
              const portal = getPortalInfo(user.role);
              const PortalIcon = portal.Icon;
              return (
                <button
                  onClick={() => setPage("dashboard")}
                  className={`ml-2 px-3.5 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-2 ${
                    page === "dashboard"
                      ? "bg-[var(--primary)] text-white border-transparent shadow-sm"
                      : "bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100"
                  }`}
                >
                  <PortalIcon size={16} strokeWidth={2} className={page === "dashboard" ? "text-white" : "text-cyan-700"} />
                  <span>{portal.label}</span>
                </button>
              );
            })()}
          </nav>

          {/* User / Login Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage("dashboard")}
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user.avatarInitials}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-[var(--foreground)] leading-tight">{user.name.split(" ")[0]}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] capitalize">{user.role}</div>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs text-[var(--muted-foreground)] hover:text-red-600 border border-[var(--border)] px-2.5 py-1.5 rounded-md transition-colors ml-1 flex items-center gap-1.5"
                  title="Sign Out"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-[var(--primary)] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#1a3a5c] transition-colors shadow-sm flex items-center gap-2"
              >
                <LogIn size={16} strokeWidth={2} className="text-white" />
                <span>Staff Portal Sign In</span>
              </button>
            )}

            <button
              className="lg:hidden p-2 text-[var(--muted-foreground)]"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-white px-4 py-3 space-y-1">
          {publicLinks.map(l => (
            <button
              key={l.page}
              onClick={() => {
                setPage(l.page);
                setMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                page === l.page ? "text-[var(--accent)] bg-[var(--secondary)] font-semibold" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {l.label}
            </button>
          ))}
          {user && (() => {
            const portal = getPortalInfo(user.role);
            const PortalIcon = portal.Icon;
            return (
              <button
                onClick={() => {
                  setPage("dashboard");
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-[var(--accent)] bg-cyan-50 rounded-md mt-2 flex items-center gap-2"
              >
                <PortalIcon size={16} strokeWidth={2} className="text-[var(--accent)]" />
                <span>{portal.label}</span>
              </button>
            );
          })()}
        </div>
      )}
    </header>
  );
}

// — Home Page —
function HomePage({
  setPage,
  onLogin,
  user,
  config,
}: {
  setPage: (p: Page) => void;
  onLogin: () => void;
  user: User | null;
  config: HospitalConfig;
}) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[540px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&h=750&fit=crop&auto=format"
          alt="Healthcare professionals consulting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2744]/95 via-[#0f2744]/75 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-white">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4">
              {config.name} Information System
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5 text-white">
              Compassionate Care,<br />Seamless Digital Precision.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
              A healthcare information system integrating electronic health records, structured MAR tables, 3-tier Priority Watch triage, bedside fluid charting, PhilHealth integration, and strict DPA 2012 compliance.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <button
                  onClick={() => setPage("dashboard")}
                  className="bg-[var(--accent)] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span>Enter Clinical Workbench</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="bg-[var(--accent)] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span>Staff Portal Sign In</span>
                  <LogIn size={16} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={() => setPage("about")}
                className="bg-white/10 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                About Our Hospital
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Pillars */}
      <section className="py-14 bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1">
              Standard Clinical Modules
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--foreground)]">
              Full-Spectrum Hospital Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-slate-50/50 hover:bg-white transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <Stethoscope size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-[var(--foreground)] mb-1">Priority Watch & Triage</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                3-tier visual acuity categorization (Critical Care, Observation, Stable) with live count indicators and clinical filtering.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-slate-50/50 hover:bg-white transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                <Pill size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-[var(--foreground)] mb-1">Structured MAR & Fluid Charting</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Tabular Medication Administration Record with route, schedule, nurse verification, and precise intake/output fluid balance.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-slate-50/50 hover:bg-white transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-[var(--foreground)] mb-1">PhilHealth & Insurance Data</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                PhilHealth PIN verification, membership category tracking (Direct, Indirect, Senior, PWD), and case rate benefit management.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border)] bg-slate-50/50 hover:bg-white transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <FileCheck size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-[var(--foreground)] mb-1">Shift Handoffs & Visitors</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                SBAR nursing endorsement handoff records and hospital-wide visitor badge logging with precision check-in/out stamps.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// — About Page —
function AboutPage({ onBack, config }: { onBack: () => void; config: HospitalConfig }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Building2 size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>About Our Institution</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">{config.name}</h1>
        <p className="text-xs text-slate-500 mt-1">{config.accreditation}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 text-xs text-slate-700 leading-relaxed bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <h2 className="font-serif text-xl text-[var(--foreground)]">Healthcare Excellence Since 1998</h2>
          <p>
            {config.name} is a leading healthcare facility committed to delivering patient-centered, high-precision clinical services. Operating under the stringent standards of the Department of Health (DOH) and the Philippine Health Insurance Corporation (PhilHealth), our medical center blends compassionate care with cutting-edge medical technologies.
          </p>
          <p>
            Our Hospital Information System (HIS) implements strict role-based access control, cryptographic audit logging per Republic Act No. 10173 (Data Privacy Act of 2012), and structured clinical workflows designed to minimize administrative friction for clinicians and maximize patient safety.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Key Hospital Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Authorized Bed Capacity:</span>
              <strong className="text-slate-800">250 Beds</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Accredited Specializations:</span>
              <strong className="text-slate-800">18 Specialties</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Active Medical Staff:</span>
              <strong className="text-slate-800">120+ Physicians</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Nursing Staff:</span>
              <strong className="text-slate-800">240+ Registered Nurses</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// — Departments Page —
function DepartmentsPage({ onBack }: { onBack: () => void }) {
  const depts = [
    { name: "Internal Medicine & Cardiology", desc: "Adult specialty care, hypertension, echocardiography, cardiac monitoring.", icon: HeartPulse },
    { name: "General & Laparoscopic Surgery", desc: "24/7 operating suites, minimally invasive appendectomy, wound debridement.", icon: Stethoscope },
    { name: "Emergency & Trauma Center", desc: "Level 3 trauma resuscitation unit, stat triage, resuscitation beds.", icon: Siren },
    { name: "Clinical Pathology & Laboratory", desc: "Automated hematology, clinical chemistry, microbiology, blood banking.", icon: Microscope },
    { name: "Radiology & Diagnostic Imaging", desc: "Digital PA X-ray, multi-slice CT, ultrasound sonograms.", icon: Scan },
    { name: "Inpatient Ward Administration", desc: "Comprehensive bedside nursing, IV therapy, SBAR shift continuity.", icon: Bed },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1">Clinical Specialties</div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Medical Departments & Services</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {depts.map(d => (
          <div key={d.name} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center mb-3">
              <d.icon size={20} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-sm text-[var(--foreground)] mb-1">{d.name}</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Announcements Page —
function AnnouncementsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <AlertCircle size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Hospital Notices</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Clinical & Operational Announcements</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              DOH & PhilHealth Circular
            </span>
            <span className="text-xs text-slate-500 font-mono">September 14, 2026</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">PhilHealth Konsulta & Expanded Case Rates In Effect</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All registered patients with valid PhilHealth PINs are eligible for standardized package case rates including Appendectomy, CHF, and OPD Diagnostic Panels with zero balance billing for indigent categories.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
              Nursing Department
            </span>
            <span className="text-xs text-slate-500 font-mono">September 12, 2026</span>
          </div>
          <h3 className="font-bold text-base text-slate-900 mb-1">Mandatory SBAR Shift Endorsement & Fluid Charting Protocol</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All inpatient ward nurses are required to complete electronic SBAR handoffs and record separate numerical vitals with intake/output balances every shift transition.
          </p>
        </div>
      </div>
    </div>
  );
}

// — Staff Directory Page —
function StaffPage({ onBack }: { onBack: () => void }) {
  const staff = [
    { name: "Dr. Jose Reyes, MD", position: "Attending Cardiologist & Physician", dept: "Internal Medicine / OPD", license: "PRC Lic. #0084721", credentials: "MD, FPCP, FPCC", color: "bg-blue-600" },
    { name: "Angel Mae, RN", position: "Senior Charge Nurse", dept: "Medical Surgical Ward / ER", license: "PRC Lic. #0093820", credentials: "RN, MAN, CCRN", color: "bg-purple-600" },
    { name: "Jendy Perez", position: "Admissions & Records Officer", dept: "Patient Admissions & Front Desk", license: "EMP-ADM-101", credentials: "BSIT, CHIO", color: "bg-emerald-600" },
    { name: "Atty. Roberto Ramos", position: "Data Privacy Officer & Hospital Admin", dept: "Compliance, Privacy & Legal", license: "IBP Roll #54219", credentials: "JD, CIPP/A", color: "bg-amber-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Users size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Worker Transparency</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Healthcare Personnel Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Verified practitioners with active professional regulatory credentials.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {staff.map(s => (
          <div key={s.name} className="bg-white border border-[var(--border)] rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-14 h-14 rounded-2xl ${s.color} text-white flex items-center justify-center font-bold text-lg flex-shrink-0`}>
              {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{s.name}</div>
              <div className="text-xs text-[var(--accent)] font-semibold">{s.position}</div>
              <div className="text-[11px] text-slate-500">{s.dept}</div>
              <div className="text-[11px] font-mono text-slate-700 mt-1">
                <strong>{s.license}</strong> • <span className="text-slate-500">{s.credentials}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Contact Page —
function ContactPage({ onBack, config }: { onBack: () => void; config: HospitalConfig }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <MapPin size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Hospital Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Contact Information</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-base text-[var(--foreground)]">{config.name} Official Lines</h2>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <div><strong>Address:</strong> {config.address}</div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>Trunkline / Telephones:</strong> {config.phone}</div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>General Inquiries:</strong> {config.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>Data Protection Officer (DPO):</strong> {config.dpoEmail}</div>
            </div>
            <div className="flex items-center gap-3 text-red-600 font-bold text-sm pt-2 border-t border-slate-100">
              <Siren size={20} strokeWidth={2} className="text-red-600 flex-shrink-0 animate-pulse" />
              <div>Emergency Department Hotline: {config.emergencyHotline} (24/7 Available)</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-base text-[var(--foreground)] flex items-center gap-2">
            <Clock size={18} strokeWidth={2} className="text-slate-500" />
            <span>Service Schedule</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Emergency & Trauma Center</span>
              <span className="font-bold text-emerald-600">24 Hours Daily</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Inpatient Wards & MAR Administration</span>
              <span className="font-bold text-emerald-600">24 Hours Daily</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Outpatient Specialty Clinics (OPD)</span>
              <span>Mon–Sat, 8:00 AM – 5:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Clinical Diagnostic Laboratory</span>
              <span>Mon–Sat, 6:00 AM – 8:00 PM (24/7 Stat ER)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// — Footer —
function Footer({ setPage, config }: { setPage: (p: Page) => void; config: HospitalConfig }) {
  return (
    <footer className="bg-[var(--primary)] text-white mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-serif text-xl mb-1">{config.name}</div>
            <div className="text-xs text-white/50 uppercase tracking-widest mb-3">Hospital Information System (HIS)</div>
            <p className="text-xs text-white/60 leading-relaxed">
              {config.tagline}. Safe, certified, and compliant healthcare management under RA 10173 and DOH Level 3 guidelines.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Clinical Workbenches</div>
            <div className="space-y-1.5 text-xs text-white/70">
              <div>• Physician Clinical Workbench (SOAP)</div>
              <div>• Ward Nursing Station & MAR</div>
              <div>• Patient Admissions & Bed Allocation</div>
              <div>• Hospital Admin & DPA Compliance</div>
              <div>• Shift Endorsements & Visitor Logs</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Hospital Navigation</div>
            <div className="space-y-1.5">
              {(["home", "about", "departments", "announcements", "staff", "contact"] as Page[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="block text-xs text-white/70 hover:text-white capitalize transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Emergency & Contact</div>
            <div className="space-y-1.5 text-xs text-white/70">
              <div>{config.address}</div>
              <div>Tel: {config.phone}</div>
              <div className="text-red-400 font-bold">Emergency Hotline: {config.emergencyHotline}</div>
              <div className="text-emerald-400">DPO: {config.dpoEmail}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-white/40 flex flex-wrap justify-between gap-3">
          <span>© 2026 {config.name}. All rights reserved.</span>
          <span>Data Protected under Republic Act No. 10173 (Data Privacy Act of 2012)</span>
        </div>
      </div>
    </footer>
  );
}

// — Staff Login Modal (No Patient Accounts) —
function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (u: User) => void;
}) {
  const [username, setUsername] = useState("dr.reyes");
  const [password, setPassword] = useState("pass");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = DEMO_USERS[username.trim()];
    if (found && found.password === password) {
      if (found.user.status === "suspended") {
        setError("This account is currently suspended by hospital administration.");
        return;
      }
      onSuccess(found.user);
    } else {
      setError("Invalid hospital worker credentials. Use password 'pass'.");
    }
  };

  const handleSelectQuickRole = (key: string) => {
    setUsername(key);
    setPassword("pass");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
              <Activity size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-serif text-lg text-[var(--foreground)]">Staff Portal Sign In</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Authorized Healthcare Workers Only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Notice of Patient Access Removal */}
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <strong>Security Policy Notice:</strong> Patient accounts and self-service logins are disabled. All patient records are managed strictly by authorized healthcare professionals.
        </div>

        {/* Quick Role Selection for Clinical Testing */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2">Select Staff Account for Testing:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectQuickRole("dr.reyes")}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                username === "dr.reyes" ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <Stethoscope size={16} strokeWidth={1.75} className="text-blue-600" />
                <span>Doctor</span>
              </div>
              <div className="text-[10px] text-slate-500">Dr. Jose Reyes, MD</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuickRole("nurse.angel")}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                username === "nurse.angel" ? "bg-purple-50 border-purple-400 ring-1 ring-purple-400" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <Syringe size={16} strokeWidth={1.75} className="text-purple-600" />
                <span>Senior Nurse</span>
              </div>
              <div className="text-[10px] text-slate-500">Angel Mae, RN</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuickRole("staff.admissions")}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                username === "staff.admissions" ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <ClipboardList size={16} strokeWidth={1.75} className="text-emerald-600" />
                <span>Admissions</span>
              </div>
              <div className="text-[10px] text-slate-500">Jendy Perez</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuickRole("admin.privacy")}
              className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                username === "admin.privacy" ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <ShieldCheck size={16} strokeWidth={1.75} className="text-amber-600" />
                <span>Hospital Admin</span>
              </div>
              <div className="text-[10px] text-slate-500">Atty. Ramos</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
              placeholder="e.g. dr.reyes, nurse.angel"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-mono"
              placeholder="Password (default: pass)"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--primary)] text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-[#1a3a5c] transition-colors shadow-md mt-2 flex items-center justify-center gap-2"
          >
            <LogIn size={16} strokeWidth={2} className="text-white" />
            <span>Sign In to Healthcare Console</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// — Main Application Component —
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [historyStack, setHistoryStack] = useState<Page[]>([]);

  // Dynamic Hospital Configuration State
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>(INITIAL_HOSPITAL_CONFIG);

  // Default active role: Dr. Jose Reyes, MD (Physician)
  const [user, setUser] = useState<User | null>(DEMO_USERS["dr.reyes"].user);
  const [showLogin, setShowLogin] = useState(false);

  // Authorized Users Directory State
  const [usersList, setUsersList] = useState<User[]>(
    Object.values(DEMO_USERS).map(u => u.user)
  );

  useEffect(() => {
    document.title = hospitalConfig.name;
  }, [hospitalConfig.name]);

  // Core Hospital Shared Data States
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [labResults, setLabResults] = useState<DiagnosticResult[]>(INITIAL_LAB_RESULTS);
  const [medications, setMedications] = useState<MedicationOrder[]>(INITIAL_MEDICATIONS);
  const [treatments, setTreatments] = useState<TreatmentLog[]>(INITIAL_TREATMENTS);
  const [admissions, setAdmissions] = useState<AdmissionEntry[]>(INITIAL_ADMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>(INITIAL_VISITOR_LOGS);
  const [shiftEndorsements, setShiftEndorsements] = useState<ShiftEndorsement[]>(INITIAL_SHIFT_ENDORSEMENTS);


  // OPD System State
  const [opdTab, setOpdTab] = useState<OpdTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(INITIAL_PATIENTS[0]);
  const [opdQueue, setOpdQueue] = useState<OpdQueueItem[]>(INITIAL_OPD_QUEUE);
  const [philHealthClaims, setPhilHealthClaims] = useState<PhilHealthClaim[]>(INITIAL_PHILHEALTH_CLAIMS);
  const [opdReferrals, setOpdReferrals] = useState<OpdReferral[]>(INITIAL_OPD_REFERRALS);
  const [opdDischarges, setOpdDischarges] = useState<OpdDischarge[]>(INITIAL_OPD_DISCHARGES);
  const [viewPublicSite, setViewPublicSite] = useState(false);

  const handleCallNextPatient = () => {
    const nextIdx = opdQueue.findIndex(q => q.status === "Waiting");
    if (nextIdx !== -1) {
      const updated = [...opdQueue];
      updated[nextIdx] = {
        ...updated[nextIdx],
        status: "In-Consultation",
        roomOrBooth: "Consultation Room 1",
      };
      setOpdQueue(updated);

      const patient = patients.find(p => p.id === updated[nextIdx].patientId);
      if (patient) {
        setSelectedPatient(patient);
        setOpdTab("workbench");
      }
    }
  };


  const navigateTo = (newPage: Page) => {
    if (page !== newPage) {
      setHistoryStack(prev => [...prev, page]);
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack(prevStack => prevStack.slice(0, -1));
      setPage(prev);
    } else {
      if (user) {
        setPage("dashboard");
      } else {
        setPage("home");
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (u: User) => {
    setUser(u);
    setShowLogin(false);
    navigateTo("dashboard");
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: u.name,
      userRole: u.role,
      userLicense: u.licenseNumber,
      action: `Clinical Staff Authentication: ${u.name} (${u.role.toUpperCase()})`,
      targetPatient: "System Access",
      patientId: u.id,
      department: u.department,
      ipAddress: "192.168.10.40",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = () => {
    setUser(null);
    setHistoryStack([]);
    setPage("home");
  };

  const handleSwitchUser = (u: User) => {
    setUser(u);
    setPage("dashboard");
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: u.name,
      userRole: u.role,
      userLicense: u.licenseNumber,
      action: `Staff Role Switched: ${u.name} (${u.role.toUpperCase()})`,
      targetPatient: "System Access",
      patientId: u.id,
      department: u.department,
      ipAddress: "192.168.10.40",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // State update handlers
  const handleAddPatient = (p: Patient) => {
    setPatients(prev => [p, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Staff",
      userRole: user?.role || "staff",
      userLicense: user?.licenseNumber,
      action: `Patient Registered & Enrolled: ${p.name} (${p.id}) [Triage: ${p.triageTier.toUpperCase()}]`,
      targetPatient: p.name,
      patientId: p.id,
      department: "Admissions Desk",
      ipAddress: "192.168.10.12",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddAdmission = (a: AdmissionEntry) => {
    setAdmissions(prev => [a, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Staff",
      userRole: user?.role || "staff",
      userLicense: user?.licenseNumber,
      action: `Inpatient Bed Allocated: ${a.patientName} to ${a.ward}, ${a.bed}`,
      targetPatient: a.patientName,
      patientId: a.patientId,
      department: "Admissions Desk",
      ipAddress: "192.168.10.12",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdatePatientStatus = (
    patientId: string,
    status: Patient["admissionStatus"],
    ward?: string,
    bed?: string
  ) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            admissionStatus: status,
            ward: ward !== undefined ? ward : p.ward,
            bed: bed !== undefined ? bed : p.bed,
          };
        }
        return p;
      })
    );
  };

  const handleAddRecord = (record: HealthRecord) => {
    setRecords(prev => [record, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Physician",
      userRole: user?.role || "doctor",
      userLicense: user?.licenseNumber,
      action: `Clinical SOAP Note Signed: ${record.diagnosis} (ICD-10: ${record.icd10Code || "N/A"})`,
      targetPatient: record.patientName,
      patientId: record.patientId,
      department: user?.department || "Internal Medicine",
      ipAddress: "192.168.10.45",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddMedication = (med: MedicationOrder) => {
    setMedications(prev => [med, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Physician",
      userRole: user?.role || "doctor",
      userLicense: user?.licenseNumber,
      action: `Prescription Issued: ${med.name} (${med.dose}) via ${med.route}`,
      targetPatient: med.patientName,
      patientId: med.patientId,
      department: user?.department || "Internal Medicine",
      ipAddress: "192.168.10.45",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAdministerMedication = (medId: string, nurseName: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          return {
            ...m,
            lastAdministered: `Today, ${timeNow}`,
            administeredBy: nurseName,
            administeredByLicense: user?.licenseNumber || "PRC Lic. #0093820",
          };
        }
        return m;
      })
    );
    const med = medications.find(m => m.id === medId);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: nurseName,
      userRole: "nurse",
      userLicense: user?.licenseNumber,
      action: `Medication Administered (MAR Table): ${med?.name || "Med"} to ${med?.patientName}`,
      targetPatient: med?.patientName || "Patient",
      patientId: med?.patientId || "P-000",
      department: "Nursing Station",
      ipAddress: "192.168.10.82",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddTreatment = (treatment: TreatmentLog) => {
    setTreatments(prev => [treatment, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: treatment.performedBy,
      userRole: user?.role || "nurse",
      userLicense: treatment.performedByLicense,
      action: `Bedside Nursing Vitals & Fluid Entry: ${treatment.treatmentName}`,
      targetPatient: treatment.patientName,
      patientId: treatment.patientId,
      department: "Nursing Station",
      ipAddress: "192.168.10.82",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddResult = (res: DiagnosticResult) => {
    setLabResults(prev => [res, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Physician",
      userRole: user?.role || "doctor",
      userLicense: user?.licenseNumber,
      action: `Diagnostic Order Issued: ${res.test} (${res.category})`,
      targetPatient: res.patientName,
      patientId: res.patientId,
      department: "Clinical Laboratory",
      ipAddress: "192.168.10.60",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddVisitorLog = (visitor: VisitorLog) => {
    setVisitorLogs(prev => [visitor, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Staff",
      userRole: user?.role || "staff",
      userLicense: user?.licenseNumber,
      action: `Visitor Checked In: ${visitor.visitorName} for ${visitor.patientName} (${visitor.badgeNumber})`,
      targetPatient: visitor.patientName,
      patientId: visitor.patientId,
      department: "Admissions & Security",
      ipAddress: "192.168.10.12",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleCheckOutVisitor = (visitorId: string) => {
    const timeNow = new Date().toISOString().replace("T", " ").substring(0, 16);
    setVisitorLogs(prev =>
      prev.map(v => {
        if (v.id === visitorId) {
          return {
            ...v,
            timeOut: timeNow,
            status: "Departed",
          };
        }
        return v;
      })
    );
  };

  const handleAddShiftEndorsement = (endorsement: ShiftEndorsement) => {
    setShiftEndorsements(prev => [endorsement, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: endorsement.outgoingNurse,
      userRole: "nurse",
      userLicense: endorsement.outgoingNurseLicense,
      action: `Nursing Shift Endorsement (SBAR) Transferred to ${endorsement.incomingNurse}`,
      targetPatient: "Ward Inpatients",
      patientId: endorsement.ward,
      department: "Nursing Services",
      ipAddress: "192.168.10.82",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddUser = (newUser: User, password: string) => {
    setUsersList(prev => [...prev, newUser]);
    const usernameKey = newUser.username || newUser.id.toLowerCase();
    DEMO_USERS[usernameKey] = {
      password: password || "pass",
      user: newUser,
    };
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Admin",
      userRole: "admin",
      userLicense: user?.licenseNumber,
      action: `Admin Provisioned Staff Account: ${newUser.name} (${newUser.role.toUpperCase()} - ${newUser.licenseNumber || "N/A"})`,
      targetPatient: "Hospital System Users",
      patientId: newUser.id,
      department: "Administration",
      ipAddress: "192.168.10.5",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newStatus = u.status === "suspended" ? "active" : "suspended";
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleUpdateHospitalConfig = (newConfig: HospitalConfig) => {
    setHospitalConfig(newConfig);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user?.name || "Admin",
      userRole: "admin",
      userLicense: user?.licenseNumber,
      action: `Hospital Branding & Configuration Updated: ${newConfig.name}`,
      targetPatient: "System Wide Config",
      patientId: "SYS-CONFIG",
      department: "Hospital Administration",
      ipAddress: "192.168.10.5",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // — 11 OPD CORE MODULES ROUTER —
  const renderOpdTabContent = () => {
    switch (opdTab) {
      case "dashboard":
        return (
          <OpdDashboardView
            queue={opdQueue}
            patients={patients}
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setOpdTab("workbench");
            }}
            onNavigateTab={(tab) => setOpdTab(tab)}
            onCallNextPatient={handleCallNextPatient}
            currentUser={user}
          />
        );

      case "queue":
        return (
          <OpdQueueView
            queue={opdQueue}
            onUpdateQueue={setOpdQueue}
            patients={patients}
            onSelectPatient={(p) => setSelectedPatient(p)}
            onNavigateToWorkbench={() => setOpdTab("workbench")}
          />
        );

      case "registration":
        return (
          <StaffAdmissions
            user={user?.role === "staff" ? user : DEMO_USERS["staff.jendy"].user}
            patients={patients}
            onAddPatient={handleAddPatient}
            admissions={admissions}
            onAddAdmission={handleAddAdmission}
            onUpdatePatientStatus={handleUpdatePatientStatus}
            visitorLogs={visitorLogs}
            onAddVisitorLog={handleAddVisitorLog}
            onCheckOutVisitor={handleCheckOutVisitor}
            onSignOut={handleLogout}
          />
        );

      case "workbench":
        return (
          <DoctorWorkbench
            user={user?.role === "doctor" ? user : DEMO_USERS["dr.reyes"].user}
            patients={patients}
            records={records}
            onAddRecord={handleAddRecord}
            labResults={labResults}
            onAddLabResult={handleAddResult}
            medications={medications}
            onAddMedication={handleAddMedication}
            initialPatientId={selectedPatient?.id}
            referrals={opdReferrals}
            onAddReferral={(ref) => setOpdReferrals(prev => [ref, ...prev])}
            discharges={opdDischarges}
            onAddDischarge={(dis) => setOpdDischarges(prev => [dis, ...prev])}
            onSignOut={handleLogout}
          />
        );

      case "vitals":
        return (
          <NurseStation
            user={user?.role === "nurse" ? user : DEMO_USERS["nurse.angel"].user}
            patients={patients}
            medications={medications}
            onAdministerMedication={handleAdministerMedication}
            treatments={treatments}
            onAddTreatment={handleAddTreatment}
            admissions={admissions}
            shiftEndorsements={shiftEndorsements}
            onAddShiftEndorsement={handleAddShiftEndorsement}
            visitorLogs={visitorLogs}
            onAddVisitorLog={handleAddVisitorLog}
            onCheckOutVisitor={handleCheckOutVisitor}
            onSignOut={handleLogout}
          />
        );

      case "prescriptions":
        return (
          <DoctorWorkbench
            key="wb-rx"
            user={user?.role === "doctor" ? user : DEMO_USERS["dr.reyes"].user}
            patients={patients}
            records={records}
            onAddRecord={handleAddRecord}
            labResults={labResults}
            onAddLabResult={handleAddResult}
            medications={medications}
            onAddMedication={handleAddMedication}
            initialPatientId={selectedPatient?.id}
            referrals={opdReferrals}
            discharges={opdDischarges}
            onSignOut={handleLogout}
          />
        );

      case "diagnostics":
        return (
          <DoctorWorkbench
            key="wb-diag"
            user={user?.role === "doctor" ? user : DEMO_USERS["dr.reyes"].user}
            patients={patients}
            records={records}
            onAddRecord={handleAddRecord}
            labResults={labResults}
            onAddLabResult={handleAddResult}
            medications={medications}
            onAddMedication={handleAddMedication}
            initialPatientId={selectedPatient?.id}
            referrals={opdReferrals}
            discharges={opdDischarges}
            onSignOut={handleLogout}
          />
        );

      case "philhealth":
        return (
          <PhilHealthClaimsView
            claims={philHealthClaims}
            onUpdateClaims={setPhilHealthClaims}
            hospitalConfig={hospitalConfig}
          />
        );

      case "referrals":
        return (
          <DoctorWorkbench
            key="wb-ref"
            user={user?.role === "doctor" ? user : DEMO_USERS["dr.reyes"].user}
            patients={patients}
            records={records}
            onAddRecord={handleAddRecord}
            labResults={labResults}
            onAddLabResult={handleAddResult}
            medications={medications}
            onAddMedication={handleAddMedication}
            initialPatientId={selectedPatient?.id}
            referrals={opdReferrals}
            onAddReferral={(ref) => setOpdReferrals(prev => [ref, ...prev])}
            discharges={opdDischarges}
            onAddDischarge={(dis) => setOpdDischarges(prev => [dis, ...prev])}
            onSignOut={handleLogout}
          />
        );

      case "reports":
        return (
          <OpdReportsView
            patients={patients}
            claims={philHealthClaims}
            hospitalConfig={hospitalConfig}
          />
        );

      case "admin":
        return (
          <AdminCompliance
            user={user?.role === "admin" ? user : DEMO_USERS["admin.ramos"].user}
            auditLogs={auditLogs}
            hospitalConfig={hospitalConfig}
            onUpdateHospitalConfig={handleUpdateHospitalConfig}
            usersList={usersList}
            onAddUser={handleAddUser}
            onToggleUserStatus={handleToggleUserStatus}
            onSignOut={handleLogout}
          />
        );

      default:
        return (
          <OpdDashboardView
            queue={opdQueue}
            patients={patients}
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setOpdTab("workbench");
            }}
            onNavigateTab={(tab) => setOpdTab(tab)}
            onCallNextPatient={handleCallNextPatient}
            currentUser={user}
          />
        );
    }
  };

  // If user is not logged in or chose public site view
  if (viewPublicSite || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <RoleSwitcher
          currentUser={user}
          onSwitchUser={(u) => {
            handleSwitchUser(u);
            setViewPublicSite(false);
          }}
          onSignOut={handleLogout}
        />
        <EmergencyBanner config={hospitalConfig} />
        <Nav
          page={page}
          setPage={navigateTo}
          user={user}
          config={hospitalConfig}
          onLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1">
          {page === "home" ? (
            <div className="p-6 text-center space-y-4">
              <HomePage
                setPage={navigateTo}
                onLogin={() => setShowLogin(true)}
                user={user}
                config={hospitalConfig}
              />
              <div className="py-6">
                <button
                  onClick={() => {
                    if (!user) setUser(DEMO_USERS["dr.reyes"].user);
                    setViewPublicSite(false);
                  }}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg text-sm"
                >
                  Enter OPD Clinical System Workbench →
                </button>
              </div>
            </div>
          ) : page === "about" ? (
            <AboutPage onBack={handleBack} config={hospitalConfig} />
          ) : page === "departments" ? (
            <DepartmentsPage onBack={handleBack} />
          ) : page === "announcements" ? (
            <AnnouncementsPage onBack={handleBack} />
          ) : page === "staff" ? (
            <StaffPage onBack={handleBack} />
          ) : (
            <ContactPage onBack={handleBack} config={hospitalConfig} />
          )}
        </main>
        <Footer setPage={navigateTo} config={hospitalConfig} />
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onSuccess={(u) => {
              handleLogin(u);
              setViewPublicSite(false);
            }}
          />
        )}
      </div>
    );
  }

  // — MAIN PROFESSIONAL FULL-WIDTH OPD WORKSPACE —
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 font-sans text-slate-800 antialiased">
      {/* Persistent Collapsible Sidebar */}
      <OpdSidebar
        currentTab={opdTab}
        onSelectTab={setOpdTab}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentUser={user}
        queueCount={opdQueue.filter(q => q.status === "Waiting").length}
      />

      {/* Main Content Workspace Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Compact Top Navigation Bar */}
        <OpdTopNav
          currentUser={user}
          onSwitchUser={handleSwitchUser}
          onSignOut={handleLogout}
          patients={patients}
          onSelectPatient={(p) => {
            setSelectedPatient(p);
            setOpdTab("workbench");
          }}
          selectedPatient={selectedPatient}
          emergencyHotline={hospitalConfig.emergencyHotline}
        />

        {/* Dynamic OPD Tab Workspace — Utilizes full screen width with zero wasted margins */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          {renderOpdTabContent()}
        </main>
      </div>

      {/* Login / Auth Modal if triggered */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLogin}
        />
      )}
    </div>
  );

}
