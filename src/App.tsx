import { useState, useEffect } from "react";
import { User, Page, Patient, HealthRecord, DiagnosticResult, MedicationOrder, TreatmentLog, AdmissionEntry, AuditLog } from "./types";
import {
  DEMO_USERS,
  INITIAL_PATIENTS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_LAB_RESULTS,
  INITIAL_MEDICATIONS,
  INITIAL_TREATMENTS,
  INITIAL_ADMISSIONS,
  INITIAL_AUDIT_LOGS,
} from "./mockData";
import RoleSwitcher from "./components/RoleSwitcher";
import PatientPortal from "./views/PatientPortal";
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
} from "./components/Icons";

// — Emergency Banner —
function EmergencyBanner() {
  return (
    <div className="bg-red-600 text-white text-xs sm:text-sm font-medium text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2 flex-wrap">
      <Siren size={20} strokeWidth={2} className="animate-pulse text-white flex-shrink-0" />
      <span>Emergency Hotline: <strong className="ml-1 tracking-wider">911</strong></span>
      <span className="hidden sm:inline opacity-50">|</span>
      <span className="hidden sm:inline">24/7 Emergency Department & Trauma Center — Always Open</span>
    </div>
  );
}

function getPortalInfo(role: User["role"]) {
  switch (role) {
    case "patient": return { label: "My Patient Portal", Icon: UserIcon };
    case "doctor": return { label: "Doctor Workbench", Icon: Stethoscope };
    case "nurse": return { label: "Nursing Station", Icon: Syringe };
    case "staff": return { label: "Admissions Desk", Icon: ClipboardList };
    case "admin": return { label: "Admin Console", Icon: ShieldCheck };
    default: return { label: "Dashboard", Icon: LayoutDashboard };
  }
}

// — Top Navigation —
function Nav({
  page,
  setPage,
  user,
  onLogin,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  user: User | null;
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
                CityCare General
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)] tracking-widest uppercase font-semibold">
                Hospital Information System
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
                <span>Portal Sign In</span>
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
}: {
  setPage: (p: Page) => void;
  onLogin: () => void;
  user: User | null;
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
              Integrated Hospital Information System
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5 text-white">
              Compassionate Care,<br />Seamless Digital Precision.
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
              A comprehensive health system integrating electronic records, real-time lab diagnostic retrieval, bedside medication administration, admissions, and strict data privacy.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <button
                  onClick={() => setPage("dashboard")}
                  className="bg-[var(--accent)] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span>Enter Portal Dashboard</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="bg-[var(--accent)] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span>Sign In to Portal</span>
                  <LogIn size={16} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={() => setPage("about")}
                className="bg-white/15 border border-white/40 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-white/25 transition-colors"
              >
                About Our Hospital
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Hospital Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-2 flex items-center justify-center gap-1.5">
            <Activity size={20} strokeWidth={2} className="text-[var(--accent)]" />
            <span>Clinical Infrastructure</span>
          </div>
          <h2 className="font-serif text-3xl text-[var(--foreground)] mb-3">
            Comprehensive Medical Services
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Equipped with modern facilities, certified specialists, and 24/7 emergency readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Siren, isEmergency: true, title: "Emergency Department", desc: "24-hour urgent care and trauma resuscitation with immediate triage readiness." },
            { icon: Building2, isEmergency: false, title: "Outpatient Services (OPD)", desc: "Specialist clinics for internal medicine, cardiology, pediatrics, and routine checkups." },
            { icon: Bed, isEmergency: false, title: "Inpatient Wards", desc: "Dedicated medical, surgical, and intensive care units with 24/7 bedside nursing." },
            { icon: Microscope, isEmergency: false, title: "Clinical Laboratory", desc: "Automated blood chemistry, hematology, urinalysis, and microbiology diagnostics." },
            { icon: Scan, isEmergency: false, title: "Radiology & Imaging", desc: "Digital X-Ray, ultrasound, and computed tomography with rapid radiologist reporting." },
            { icon: Pill, isEmergency: false, title: "Hospital Pharmacy", desc: "Dispensing of verified prescriptions, medication refills, and pharmacological counseling." },
          ].map(s => (
            <div key={s.title} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-2xs hover:shadow-md hover:border-cyan-500/40 transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${
                s.isEmergency
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                <s.icon size={24} strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-base text-[var(--foreground)] mb-2">{s.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency & Hotline Banner */}
      <section className="bg-[var(--secondary)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
              Need Immediate Attention?
            </div>
            <h3 className="font-serif text-2xl text-[var(--foreground)]">
              24-Hour Emergency & Acute Trauma Care
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Our trauma team, triage nurses, and diagnostic lab operate 24 hours a day, 365 days a year.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:911"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <Siren size={20} strokeWidth={2} className="text-white" />
              <span>Call Emergency 911</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// — About Page —
function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />

      <div className="mb-10">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-2">
          Institutional Overview
        </div>
        <h1 className="font-serif text-4xl text-[var(--foreground)]">CityCare General Hospital</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-2xl">
          A premier regional medical facility serving the community with advanced tertiary clinical care and an integrated Hospital Information System.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
        <div>
          <img
            src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=480&fit=crop&auto=format"
            alt="Hospital campus"
            className="w-full h-72 object-cover rounded-xl mb-6 shadow-sm"
          />
          <div className="space-y-4">
            <div className="border-l-4 border-[var(--accent)] pl-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">Mission</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                To deliver patient-centered, compassionate, and evidence-based clinical care through ethical practices and digital healthcare transformation.
              </p>
            </div>
            <div className="border-l-4 border-[var(--primary)] pl-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">Vision</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                To be the regional benchmark for clinical excellence, patient data confidentiality, and digital health accessibility by 2030.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-[var(--foreground)] mb-2">Hospital Values</h2>
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-3 text-xs text-slate-700">
            <div>
              <strong className="text-[var(--foreground)]">Clinical Integrity:</strong> Practicing evidence-based medicine according to national and international standards.
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Data Confidentiality:</strong> Safeguarding every medical history, diagnostic finding, and personal demographic entry under RA 10173.
            </div>
            <div>
              <strong className="text-[var(--foreground)]">Role Accountability:</strong> Strict role separation ensuring clinicians, nurses, and administrative staff carry out specialized functions safely.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// — Departments Page —
function DepartmentsPage({ onBack }: { onBack: () => void }) {
  const departments = [
    { name: "Emergency & Trauma Center", Icon: Siren, isEmergency: true, desc: "24-hour urgent and trauma care for life-threatening conditions.", hours: "24 Hours Daily", staff: 14 },
    { name: "Internal Medicine & OPD", Icon: Building2, isEmergency: false, desc: "Adult outpatient consultations, chronic disease management, and specialist care.", hours: "8:00 AM – 5:00 PM", staff: 18 },
    { name: "Inpatient Nursing Services", Icon: Stethoscope, isEmergency: false, desc: "24-hour bedside nursing care, medication administration, and monitoring.", hours: "24 Hours Daily", staff: 32 },
    { name: "Clinical Laboratory & Pathology", Icon: Microscope, isEmergency: false, desc: "Comprehensive hematology, clinical chemistry, microbiology, and urinalysis.", hours: "7:00 AM – 7:00 PM", staff: 10 },
    { name: "Radiology & Imaging", Icon: Scan, isEmergency: false, desc: "Digital X-Ray, ultrasound, CT scan, and magnetic resonance imaging.", hours: "8:00 AM – 6:00 PM", staff: 8 },
    { name: "Hospital Pharmacy", Icon: Pill, isEmergency: false, desc: "Inpatient dispensing, prescription refills, and clinical pharmacological support.", hours: "8:00 AM – 8:00 PM", staff: 8 },
    { name: "Admissions & Medical Records", Icon: ClipboardList, isEmergency: false, desc: "Patient registration, bed allocation, and Health Information Management (HIM).", hours: "8:00 AM – 5:00 PM", staff: 12 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Building2 size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Clinical Units</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Departments & Services</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {departments.map(d => (
          <div key={d.name} className="bg-white border border-[var(--border)] rounded-xl p-5 flex gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              d.isEmergency
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <d.Icon size={24} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--foreground)]">{d.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mt-1 mb-3">{d.desc}</p>
              <div className="flex items-center gap-4 text-[11px] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5">
                  <Clock size={16} strokeWidth={1.75} className="text-slate-400" />
                  <span>{d.hours}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={16} strokeWidth={1.75} className="text-slate-400" />
                  <span>{d.staff} Staff</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Announcements Page —
function AnnouncementsPage({ onBack }: { onBack: () => void }) {
  const items = [
    { tag: "Advisory", Icon: AlertTriangle, color: "bg-amber-100 text-amber-800", title: "Hand Hygiene & Infection Control", text: "Please sanitize hands before entering inpatient wards. Sanitizers available at all entry gates.", date: "Sep 12, 2026" },
    { tag: "Operations", Icon: Activity, color: "bg-blue-100 text-blue-800", title: "24/7 Emergency Services", text: "Emergency Department services remain fully operational 24 hours daily, including public holidays.", date: "Sep 10, 2026" },
    { tag: "Health Program", Icon: HeartPulse, color: "bg-green-100 text-green-800", title: "Free Health Screening Saturday", text: "Free community cardiovascular and blood sugar screening this Saturday at the OPD lobby.", date: "Sep 8, 2026" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <AlertCircle size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Advisories</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Hospital Announcements</h1>
      </div>
      <div className="space-y-4">
        {items.map(a => (
          <div key={a.title} className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${a.color}`}>
                <a.Icon size={14} strokeWidth={1.75} />
                <span>{a.tag}</span>
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">{a.date}</span>
            </div>
            <h3 className="font-semibold text-base text-[var(--foreground)] mb-1">{a.title}</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Staff Directory Page —
function StaffPage({ onBack }: { onBack: () => void }) {
  const staff = [
    { name: "Dr. Jose Reyes, MD", position: "Attending Cardiologist & Physician", dept: "Internal Medicine / OPD", initials: "JR", color: "bg-blue-600" },
    { name: "Angel Mae, RN", position: "Senior Charge Nurse", dept: "Inpatient Ward / ER", initials: "AM", color: "bg-purple-600" },
    { name: "Jendy Perez", position: "Admissions Officer", dept: "Admissions & Records", initials: "JP", color: "bg-emerald-600" },
    { name: "Atty. Roberto Ramos", position: "Data Privacy Officer", dept: "Compliance & Legal", initials: "RR", color: "bg-amber-600" },
    { name: "Jumie Palma, RMT", position: "Senior Medical Technologist", dept: "Clinical Laboratory", initials: "JP", color: "bg-teal-600" },
    { name: "Dr. Ana Cruz, MD", position: "General Surgeon", dept: "Surgical Ward", initials: "AC", color: "bg-indigo-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Users size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Our People</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Medical Staff Directory</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map(s => (
          <div key={s.name} className="bg-white border border-[var(--border)] rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${s.color} text-white flex items-center justify-center font-bold text-base flex-shrink-0`}>
              {s.initials}
            </div>
            <div>
              <div className="font-semibold text-sm text-[var(--foreground)]">{s.name}</div>
              <div className="text-xs text-[var(--accent)] font-medium">{s.position}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{s.dept}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Contact Page —
function ContactPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={onBack} label="Back to Home" />
      <div className="mb-8">
        <div className="text-[var(--accent)] text-xs font-semibold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <MapPin size={20} strokeWidth={2} className="text-[var(--accent)]" />
          <span>Get in Touch</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--foreground)]">Contact Information</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-base text-[var(--foreground)]">Hospital Locations & Contact Numbers</h2>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <div><strong>Address:</strong> 123 Main Medical Blvd, City Care District</div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>Telephone (Trunkline):</strong> (02) 8123-4567</div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>Patient Information Desk:</strong> Local 101 / 102</div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} strokeWidth={1.75} className="text-slate-500 flex-shrink-0" />
              <div><strong>Email:</strong> info@citycarehospital.com</div>
            </div>
            <div className="flex items-center gap-3 text-red-600 font-bold text-sm pt-2">
              <Siren size={20} strokeWidth={2} className="text-red-600 flex-shrink-0" />
              <div>Emergency Hotline: 911</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-base text-[var(--foreground)] flex items-center gap-2">
            <Clock size={18} strokeWidth={2} className="text-slate-500" />
            <span>Department Operating Hours</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span>Emergency Department</span>
              <span className="font-bold text-emerald-600">24 Hours Daily</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span>Outpatient Clinics (OPD)</span>
              <span>Mon–Sat, 8:00 AM – 5:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span>Diagnostic Laboratory</span>
              <span>Mon–Fri, 7:00 AM – 7:00 PM</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
              <span>Admissions Desk</span>
              <span>24 Hours Daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// — Login Modal —
function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (u: User) => void;
}) {
  const [username, setUsername] = useState("patient01");
  const [password, setPassword] = useState("pass");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = DEMO_USERS[username.trim()];
    if (found && found.password === password) {
      onSuccess(found.user);
    } else {
      setError("Invalid username or password. Select a demo account below.");
    }
  };

  const handleSelectQuickRole = (key: string) => {
    const found = DEMO_USERS[key];
    if (found) {
      onSuccess(found.user);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
            <Activity size={20} strokeWidth={2} className="text-white" />
          </div>
          <div>
            <div className="font-serif text-lg text-[var(--primary)] font-semibold">CityCare General</div>
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Hospital Portal Sign In</div>
          </div>
        </div>

        <h2 className="font-serif text-2xl text-[var(--foreground)] mb-1">Access HIS Portal</h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Select a role below or log in with authorized credentials.
        </p>

        {/* 1-Click Demo Logins */}
        <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap size={14} strokeWidth={2} className="text-amber-500" />
            <span>Quick 1-Click Role Sign In:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectQuickRole("patient01")}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors group"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <UserIcon size={16} strokeWidth={1.75} className="text-slate-500 group-hover:text-slate-700" />
                <span>Patient</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">Maria Santos</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickRole("dr.reyes")}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors group"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <Stethoscope size={16} strokeWidth={1.75} className="text-slate-500 group-hover:text-slate-700" />
                <span>Doctor</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">Dr. Jose Reyes</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickRole("nurse.angel")}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors group"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <Syringe size={16} strokeWidth={1.75} className="text-slate-500 group-hover:text-slate-700" />
                <span>Staff Nurse</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">Angel Mae, RN</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickRole("staff.admissions")}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors group"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <ClipboardList size={16} strokeWidth={1.75} className="text-slate-500 group-hover:text-slate-700" />
                <span>Admissions</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">Jendy Perez</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickRole("admin.privacy")}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors col-span-2 group"
            >
              <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-0.5">
                <ShieldCheck size={16} strokeWidth={1.75} className="text-slate-500 group-hover:text-slate-700" />
                <span>DPO / Admin</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">Atty. Roberto Ramos</div>
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
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="e.g. patient01, dr.reyes"
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
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
            <span>Sign In with Credentials</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// — Footer —
function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-[var(--primary)] text-white mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-serif text-xl mb-1">CityCare General Hospital</div>
            <div className="text-xs text-white/50 uppercase tracking-widest mb-3">Healthcare Information System</div>
            <p className="text-xs text-white/60 leading-relaxed">
              Safe, certified, and compliant health record management under RA 10173 and DOH guidelines.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Role Portals</div>
            <div className="space-y-1.5 text-xs text-white/70">
              <div>• Patient Self-Service Portal</div>
              <div>• Physician Clinical Workbench</div>
              <div>• Nursing Station & MAR</div>
              <div>• Admissions & Bed Allocation</div>
              <div>• DPA Compliance Console</div>
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
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Emergency Contact</div>
            <div className="space-y-1.5 text-xs text-white/70">
              <div>123 Main Medical Boulevard</div>
              <div>Tel: (02) 8123-4567</div>
              <div className="text-red-400 font-bold">Emergency Hotline: 911</div>
              <div className="text-emerald-400">DPO: dpo@citycarehospital.com</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-xs text-white/40 flex flex-wrap justify-between gap-3">
          <span>© 2026 CityCare General Hospital Information System (HIS). All rights reserved.</span>
          <span>Data Protected under Republic Act No. 10173 (Data Privacy Act of 2012)</span>
        </div>
      </div>
    </footer>
  );
}

// — Main Application Component —
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [historyStack, setHistoryStack] = useState<Page[]>([]);

  // Default active role: Maria Santos (Patient)
  const [user, setUser] = useState<User | null>(DEMO_USERS["patient01"].user);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    document.title = "CityCare General Hospital";
  }, []);

  // Core Hospital Shared Data States
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [labResults, setLabResults] = useState<DiagnosticResult[]>(INITIAL_LAB_RESULTS);
  const [medications, setMedications] = useState<MedicationOrder[]>(INITIAL_MEDICATIONS);
  const [treatments, setTreatments] = useState<TreatmentLog[]>(INITIAL_TREATMENTS);
  const [admissions, setAdmissions] = useState<AdmissionEntry[]>(INITIAL_ADMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

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
      action: `Portal Authentication (${u.role.toUpperCase()})`,
      targetPatient: u.role === "patient" ? u.name : "System Access",
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
    // Always navigate directly to dashboard so the role's isolated view is mounted
    setPage("dashboard");
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: u.name,
      userRole: u.role,
      action: `Demo Role Switched to ${u.role.toUpperCase()}`,
      targetPatient: u.role === "patient" ? u.name : "System Access",
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
      action: `New Patient Registered: ${p.name} (${p.id})`,
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
      action: `Inpatient Admission: ${a.patientName} to ${a.ward}, ${a.bed}`,
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
      action: `Clinical Encounter SOAP Note Created: ${record.diagnosis}`,
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
      action: `Prescription Issued: ${med.name} (${med.dose})`,
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
      action: `Medication Administered (MAR): ${med?.name || "Med"} to ${med?.patientName}`,
      targetPatient: med?.patientName || "Patient",
      patientId: med?.patientId || "P-000",
      department: "Nursing Services",
      ipAddress: "192.168.10.82",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleRequestRefill = (medId: string) => {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          return {
            ...m,
            refillStatus: "Pending Approval",
          };
        }
        return m;
      })
    );
  };

  const handleAddTreatment = (treatment: TreatmentLog) => {
    setTreatments(prev => [treatment, ...prev]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: treatment.performedBy,
      userRole: user?.role || "nurse",
      action: `Bedside Nursing Treatment Logged: ${treatment.treatmentName}`,
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
      userName: user?.name || "Physician / Lab",
      userRole: user?.role || "doctor",
      action: `Diagnostic Test Order/Result: ${res.test}`,
      targetPatient: res.patientName,
      patientId: res.patientId,
      department: "Clinical Laboratory",
      ipAddress: "192.168.10.60",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // — STRICT ROLE-BASED ISOLATED RENDERING —
  const renderRoleSpecificView = () => {
    if (!user) {
      return (
        <HomePage
          setPage={navigateTo}
          onLogin={() => setShowLogin(true)}
          user={user}
        />
      );
    }

    switch (user.role) {
      case "patient":
        return (
          <PatientPortal
            key={`portal-patient-${user.id}`}
            user={user}
            records={records}
            labResults={labResults}
            medications={medications}
            onRequestRefill={handleRequestRefill}
            onSignOut={handleLogout}
          />
        );

      case "doctor":
        return (
          <DoctorWorkbench
            key={`portal-doctor-${user.id}`}
            user={user}
            patients={patients}
            records={records}
            onAddRecord={handleAddRecord}
            labResults={labResults}
            onAddLabResult={handleAddResult}
            medications={medications}
            onAddMedication={handleAddMedication}
            onSignOut={handleLogout}
          />
        );

      case "nurse":
        return (
          <NurseStation
            key={`portal-nurse-${user.id}`}
            user={user}
            patients={patients}
            medications={medications}
            onAdministerMedication={handleAdministerMedication}
            treatments={treatments}
            onAddTreatment={handleAddTreatment}
            admissions={admissions}
            onSignOut={handleLogout}
          />
        );

      case "staff":
        return (
          <StaffAdmissions
            key={`portal-staff-${user.id}`}
            user={user}
            patients={patients}
            onAddPatient={handleAddPatient}
            admissions={admissions}
            onAddAdmission={handleAddAdmission}
            onUpdatePatientStatus={handleUpdatePatientStatus}
            onSignOut={handleLogout}
          />
        );

      case "admin":
        return (
          <AdminCompliance
            key={`portal-admin-${user.id}`}
            user={user}
            auditLogs={auditLogs}
            onSignOut={handleLogout}
          />
        );

      default:
        return (
          <HomePage
            setPage={navigateTo}
            onLogin={() => setShowLogin(true)}
            user={user}
          />
        );
    }
  };

  // Main Page Content Router
  const renderContent = () => {
    switch (page) {
      case "home":
        return (
          <HomePage
            setPage={navigateTo}
            onLogin={() => setShowLogin(true)}
            user={user}
          />
        );
      case "about":
        return <AboutPage onBack={handleBack} />;
      case "departments":
        return <DepartmentsPage onBack={handleBack} />;
      case "announcements":
        return <AnnouncementsPage onBack={handleBack} />;
      case "staff":
        return <StaffPage onBack={handleBack} />;
      case "contact":
        return <ContactPage onBack={handleBack} />;
      case "dashboard":
      default:
        return renderRoleSpecificView();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Role Switcher Toolbar for instant live role testing */}
      <RoleSwitcher
        currentUser={user}
        onSwitchUser={handleSwitchUser}
        onSignOut={handleLogout}
      />

      {/* Hospital Emergency Hotline Banner */}
      <EmergencyBanner />

      {/* Top Header Navigation */}
      <Nav
        page={page}
        setPage={navigateTo}
        user={user}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
      />

      {/* Main Page Content */}
      <main className="flex-1">{renderContent()}</main>

      {/* Footer */}
      <Footer setPage={navigateTo} />

      {/* Login / Authentication Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLogin}
        />
      )}
    </div>
  );
}
