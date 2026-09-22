import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { HEALTHCARE_TEAM_DIRECTORY } from "../mockData";
import BackButton from "../components/BackButton";
import AuthModal from "../components/AuthModal";
import {
  Activity,
  Siren,
  Stethoscope,
  Syringe,
  ClipboardList,
  ShieldCheck,
  LayoutDashboard,
  LogIn,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  Users,
  AlertCircle,
  Pill,
  FileCheck,
  ArrowRight,
  HeartPulse,
  Microscope,
  Scan,
  Bed,
} from "../components/Icons";
import { User } from "../types";

function getPortalInfo(role: User["role"]) {
  switch (role) {
    case "doctor":
      return { label: "Physician Workbench", Icon: Stethoscope };
    case "nurse":
      return { label: "Nursing Station & MAR", Icon: Syringe };
    case "staff":
      return { label: "Admissions Desk", Icon: ClipboardList };
    case "admin":
      return { label: "Admin & Compliance", Icon: ShieldCheck };
    default:
      return { label: "Staff Dashboard", Icon: LayoutDashboard };
  }
}

export default function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { hospitalConfig } = useOpdData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    (window as any).__openAuthModal = () => setIsAuthModalOpen(true);
    return () => {
      delete (window as any).__openAuthModal;
    };
  }, []);

  const publicLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Departments", to: "/departments" },
    { label: "Announcements", to: "/announcements" },
    { label: "Staff Directory", to: "/staff" },
    { label: "Contact", to: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-slate-800 font-sans">
      {/* Emergency Hotline Header Banner */}
      <div className="bg-rose-600 text-white text-xs sm:text-sm font-medium text-center py-2 px-4 shadow-xs flex items-center justify-center gap-2 flex-wrap select-none">
        <Siren size={18} strokeWidth={2} className="animate-pulse text-white shrink-0" />
        <span>
          Emergency Medical Hotline:{" "}
          <strong className="ml-1 tracking-wider text-white font-bold">
            {hospitalConfig.emergencyHotline}
          </strong>
        </span>
        <span className="hidden sm:inline opacity-50">|</span>
        <span className="hidden sm:inline opacity-90">
          24/7 Outpatient, Trauma & Intensive Care — {hospitalConfig.name}
        </span>
      </div>

      {/* Public Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group text-left">
              <img
                src="/carepoint-logo.png"
                alt="CarePoint Medical Center"
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-xs group-hover:scale-105 transition-transform shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div>
                <div className="font-serif text-lg font-bold text-slate-900 leading-tight">
                  CarePoint Medical Center
                </div>
                <div className="text-[10px] text-teal-600 tracking-wider uppercase font-semibold">
                  Hospital Information System (HIS)
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {publicLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                      isActive
                        ? "text-teal-700 bg-teal-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {/* Enter Clinical Workbench button if logged in */}
              {isAuthenticated && user && (() => {
                const portal = getPortalInfo(user.role);
                const PortalIcon = portal.Icon;
                return (
                  <Link
                    to="/dashboard"
                    className="ml-2 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
                  >
                    <PortalIcon size={15} strokeWidth={2} className="text-white" />
                    <span>{portal.label}</span>
                  </Link>
                );
              })()}
            </nav>

            {/* User Session or Login Button */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                    title="Go to OPD Dashboard"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {user.avatarInitials}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-semibold text-slate-900 leading-tight">
                        {user.name.split(" ")[0]}
                      </div>
                      <div className="text-[10px] text-teal-600 uppercase font-semibold">
                        {user.role}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-slate-500 hover:text-rose-600 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors ml-1 flex items-center gap-1.5 cursor-pointer hover:bg-rose-50 hover:border-rose-200"
                    title="Sign Out"
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <LogIn size={15} strokeWidth={2} className="text-white" />
                  <span>Staff Portal Sign In</span>
                </button>
              )}

              {/* Mobile menu hamburger toggle */}
              <button
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen ? (
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

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-md">
            {publicLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                    isActive ? "text-teal-700 bg-teal-50 font-semibold" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-teal-700 bg-teal-50 rounded-md mt-2 flex items-center gap-2"
              >
                <LayoutDashboard size={16} strokeWidth={2} className="text-teal-700" />
                <span>Enter OPD Clinical System</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Outlet View for Public Routes */}
      <main className="flex-1">
        <Outlet context={{ openAuthModal: () => setIsAuthModalOpen(true) }} />
      </main>

      {/* Staff Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Public Footer */}
      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Hospital Info */}
            <div>
              <div className="font-serif text-xl font-bold mb-1 text-white">{hospitalConfig.name}</div>
              <div className="text-xs text-teal-400 uppercase tracking-wider font-semibold mb-3">
                Hospital Information System (HIS)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {hospitalConfig.tagline}. Certified DOH Level 3 Tertiary Teaching Hospital and PhilHealth Center of Excellence.
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                <span className="font-bold text-teal-400">Accreditation:</span> {hospitalConfig.accreditation}
              </div>
            </div>

            {/* Clinical Workbenches */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Clinical Modules & Workbenches
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div>• Outpatient Department (OPD) Workbench</div>
                <div>• Patient Live Queue & Priority Triage</div>
                <div>• Inpatient Medication Administration (MAR)</div>
                <div>• PhilHealth eClaims & Konsulta Management</div>
                <div>• Diagnostic Laboratory & Digital Radiology</div>
                <div>• Data Privacy & Cryptographic Audit Ledger</div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Hospital Information
              </div>
              <div className="space-y-2">
                {publicLinks.map(p => (
                  <Link
                    key={p.to}
                    to={p.to}
                    className="block text-xs text-slate-300 hover:text-teal-400 transition-colors"
                  >
                    {p.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    const opener = (window as any).__openAuthModal;
                    if (opener) opener();
                  }}
                  className="block text-left text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors pt-1 cursor-pointer"
                >
                  Medical Staff Portal Login →
                </button>
              </div>
            </div>

            {/* Contact & Emergency */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Emergency & Inquiries
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <div>{hospitalConfig.address}</div>
                <div>Tel: {hospitalConfig.phone}</div>
                <div className="text-rose-400 font-bold">
                  Emergency Command: {hospitalConfig.emergencyHotline} (24/7 Available)
                </div>
                <div className="text-teal-400 font-mono text-[11px]">
                  DPO: {hospitalConfig.dpoEmail}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-xs text-slate-400 flex flex-wrap justify-between gap-3">
            <span>© 2026 {hospitalConfig.name}. All rights reserved.</span>
            <span>Data Protected under Republic Act No. 10173 (Data Privacy Act of 2012)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// — Public Home Page —
export function PublicHomePage() {
  const { user, isAuthenticated } = useAuth();
  const { hospitalConfig } = useOpdData();
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[540px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&h=750&fit=crop&auto=format"
          alt="Healthcare professionals consulting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-white">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4">
              CarePoint Medical Center
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-5 text-white font-bold">
              Compassionate Care.<br />Trusted Service.<br />Better Health.
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-8">
              A modern hospital information system integrating physician consultation workbenches, structured MAR tables, 3-tier Priority Watch triage, bedside fluid charting, and immutable cryptographic audit ledgers.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated && user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-teal-500 transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Enter Clinical Workbench</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const ctx = (window as any).__openAuthModal;
                    if (ctx) ctx();
                    else navigate("/dashboard");
                  }}
                  className="bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-teal-500 transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Staff Portal Sign In</span>
                  <LogIn size={16} strokeWidth={2} />
                </button>
              )}
              <Link
                to="/about"
                className="bg-white/10 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-1.5"
              >
                About Our Hospital
              </Link>
            </div>
          </div>
      </section>

      {/* Hospital Operational Pillars */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1">
              Standard Clinical Modules
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-900 font-bold">
              Full-Spectrum Healthcare Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-500/30 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <Stethoscope size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Priority Watch & Triage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                3-tier visual acuity categorization (Critical Care, Observation, Stable) with live count indicators and clinical filtering.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-500/30 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                <Pill size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Structured MAR & Fluid Charting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabular Medication Administration Record with route, schedule, nurse verification, and precise intake/output fluid balance.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-500/30 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">PhilHealth & Insurance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PhilHealth PIN verification, membership category tracking (Direct, Indirect, Senior, PWD), and case rate benefit management.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-teal-500/30 transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <FileCheck size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Shift Handoffs & Visitors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                SBAR nursing endorsement handoff records and hospital-wide visitor badge logging with precision check-in/out stamps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fast Clinical Portal Access */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-400 text-xs px-2.5 py-1 rounded-full font-bold mb-2">
                <Building2 size={14} strokeWidth={2} />
                <span>Outpatient Department (OPD) System</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Authorized Medical Staff Portal</h3>
              <p className="text-xs text-slate-300 max-w-md">
                Doctors, Nurses, Admissions Officers, and Hospital Administrators can authenticate to access real-time patient charts and queues.
              </p>
            </div>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate("/dashboard");
                } else {
                  const ctx = (window as any).__openAuthModal;
                  if (ctx) ctx();
                  else navigate("/dashboard");
                }
              }}
              className="shrink-0 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isAuthenticated ? "Go to Dashboard" : "Access Clinical Login"}</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* Founder & Medical Director Spotlight */}
      <section className="py-14 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-center gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-serif text-3xl sm:text-4xl font-bold shadow-lg shrink-0 border-2 border-teal-400/40">
              MJ
            </div>
            <div className="space-y-3 flex-1 text-left">
              <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-400/30 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                Founder & Medical Director
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Dr. Mark Arkiel Jacobe, MD, FACP
              </h2>
              <div className="text-xs font-mono text-teal-300">
                PRC Lic. #0089201 • Fellow, American College of Physicians (Internal Medicine)
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                "Our guiding philosophy at CarePoint Medical Center is simple yet resolute: modern clinical technology must always amplify compassion, never replace it. Every module of our digital Hospital Information System is engineered to protect patient safety, preserve clinical dignity, and elevate healthcare delivery across our community."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// — Public About Page —
export function PublicAboutPage() {
  const { hospitalConfig } = useOpdData();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Building2 size={18} strokeWidth={2} className="text-teal-600" />
          <span>About Our Institution</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold">{hospitalConfig.name}</h1>
        <p className="text-xs text-slate-500 mt-1">{hospitalConfig.accreditation}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Founder Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0 shadow-xs">
                MJ
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">
                  Founder & Medical Director
                </div>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Dr. Mark Arkiel Jacobe, MD, FACP
                </h2>
                <div className="text-[11px] font-mono text-slate-500">
                  PRC Lic. #0089201 • Internal Medicine
                </div>
              </div>
            </div>
            <p className="text-slate-600">
              Founded under the clinical leadership of Dr. Mark Arkiel Jacobe, CarePoint Medical Center was established with a singular, unwavering focus: to provide accessible, patient-first outpatient and specialized medical care backed by state-of-the-art information governance.
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                <HeartPulse size={16} className="text-teal-600" />
                <span>Our Mission</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                To deliver compassionate, evidence-based, and patient-centered outpatient and tertiary healthcare solutions through cutting-edge medical technologies, transparent clinical workflows, and uncompromising dedication to Philippine community wellness.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-600" />
                <span>Our Vision</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                To be the foremost regional benchmark in outpatient healthcare excellence and modern digital hospital information governance across the Philippines by 2030.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 text-sm">Key Hospital Statistics</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">Facility Status:</span>
              <strong className="text-teal-700">DOH Licensed Level 3</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">Authorized Bed Capacity:</span>
              <strong className="text-slate-800">250 Beds</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">Accredited Specializations:</span>
              <strong className="text-slate-800">18 Specialties</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">Active Medical Staff:</span>
              <strong className="text-slate-800">120+ Physicians</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">Nursing Staff:</span>
              <strong className="text-slate-800">240+ Registered Nurses</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-500">PhilHealth Status:</span>
              <strong className="text-emerald-700">Center of Excellence</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// — Public Departments Page —
export function PublicDepartmentsPage() {
  const navigate = useNavigate();
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
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1">Clinical Specialties</div>
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold">Medical Departments & Services</h1>
        <p className="text-xs text-slate-500 mt-1">Full-service tertiary clinical departments available 24/7.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {depts.map(d => (
          <div key={d.name} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-teal-500/40 transition-all">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center mb-3">
              <d.icon size={20} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">{d.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Public Announcements Page —
export function PublicAnnouncementsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <AlertCircle size={18} strokeWidth={2} className="text-teal-600" />
          <span>Hospital Notices</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold">Clinical & Operational Announcements</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
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

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
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

// — Public Staff Page —
export function PublicStaffPage() {
  const navigate = useNavigate();
  const [deptFilter, setDeptFilter] = useState<string>("All");

  const departments = ["All", ...Array.from(new Set(HEALTHCARE_TEAM_DIRECTORY.map(s => s.department)))];

  const filteredTeam = deptFilter === "All"
    ? HEALTHCARE_TEAM_DIRECTORY
    : HEALTHCARE_TEAM_DIRECTORY.filter(s => s.department === deptFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Users size={18} strokeWidth={2} className="text-teal-600" />
          <span>Professional Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold">
          CarePoint Healthcare Team Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          12 verified clinical leaders, attending physicians, registered nurses, and executive administrators.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                deptFilter === dept
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeam.map(s => (
          <div
            key={s.name}
            className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-xs hover:border-teal-400 hover:shadow-sm transition-all"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${s.color} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs`}
            >
              {s.name
                .replace("Dr. ", "")
                .replace("Nurse ", "")
                .split(" ")
                .map(w => w[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-slate-900 leading-tight">
                {s.name}
              </div>
              <div className="text-xs text-teal-700 font-semibold mt-0.5">
                {s.position}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {s.department}
              </div>
              <div className="text-[11px] font-mono text-slate-700 mt-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800">{s.license}</span>
                <div className="text-[10px] text-slate-500 font-sans mt-0.5">{s.credentials}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// — Public Contact Page —
export function PublicContactPage() {
  const { hospitalConfig } = useOpdData();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <MapPin size={18} strokeWidth={2} className="text-teal-600" />
          <span>Hospital Directory</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 font-bold">Contact Information</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="font-semibold text-base text-slate-900">{hospitalConfig.name} Official Lines</h2>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={1.75} className="text-slate-500 shrink-0 mt-0.5" />
              <div><strong>Address:</strong> {hospitalConfig.address}</div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} strokeWidth={1.75} className="text-slate-500 shrink-0" />
              <div><strong>Trunkline / Telephones:</strong> {hospitalConfig.phone}</div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} strokeWidth={1.75} className="text-slate-500 shrink-0" />
              <div><strong>General Inquiries:</strong> {hospitalConfig.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} strokeWidth={1.75} className="text-slate-500 shrink-0" />
              <div><strong>Data Protection Officer (DPO):</strong> {hospitalConfig.dpoEmail}</div>
            </div>
            <div className="flex items-center gap-3 text-rose-600 font-bold text-sm pt-2 border-t border-slate-100">
              <Siren size={20} strokeWidth={2} className="text-rose-600 shrink-0 animate-pulse" />
              <div>Emergency Department Hotline: {hospitalConfig.emergencyHotline} (24/7 Available)</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-3">
          <h2 className="font-semibold text-base text-slate-900 flex items-center gap-2">
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
