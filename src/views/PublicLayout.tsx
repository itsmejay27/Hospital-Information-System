import React, { useState } from "react";
import StaffAvatar from "../components/StaffAvatar";
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
  Bell,
  CheckCircle,
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
                <div className="text-lg font-bold text-slate-900 leading-tight">
                  CarePoint Medical Center
                </div>
                <div className="text-[10px] text-teal-600 tracking-wider uppercase font-semibold">
                  Quality Care. Closer to You.
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
                    <StaffAvatar user={user} size={32} />
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
                  className="hidden sm:flex bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-xs items-center gap-2 cursor-pointer"
                >
                  <LogIn size={15} strokeWidth={2} className="text-white" />
                  <span>Staff Sign In</span>
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
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-teal-700 bg-teal-50 rounded-md mt-2 flex items-center gap-2 cursor-pointer"
              >
                <LogIn size={16} strokeWidth={2} />
                <span>Staff Sign In</span>
              </button>
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
      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Hospital Info */}
            <div>
              <div className="text-xl font-bold mb-1 text-white">{hospitalConfig.name}</div>
              <div className="text-xs text-teal-400 font-semibold mb-3">{hospitalConfig.tagline}</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                DOH-licensed tertiary hospital and PhilHealth-accredited outpatient center.
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                <span className="font-bold text-teal-400">Accreditation:</span> {hospitalConfig.accreditation}
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Services</div>
              <div className="space-y-2">
                {DEPARTMENTS.map(d => (
                  <Link key={d.name} to="/departments" className="block text-xs text-slate-300 hover:text-teal-400 transition-colors">
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Quick Links
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

// Medical departments shown on the home and departments pages
const DEPARTMENTS = [
  { name: "Internal Medicine & Cardiology", short: "Cardiology", tagline: "Heart & adult medicine", desc: "Adult specialty care, hypertension, echocardiography, cardiac monitoring.", icon: HeartPulse },
  { name: "General & Laparoscopic Surgery", short: "Surgery", tagline: "Open & keyhole surgery", desc: "24/7 operating suites, minimally invasive appendectomy, wound debridement.", icon: Stethoscope },
  { name: "Emergency & Trauma Center", short: "Emergency", tagline: "24/7 trauma care", desc: "Level 3 trauma resuscitation unit, stat triage, resuscitation beds.", icon: Siren },
  { name: "Clinical Pathology & Laboratory", short: "Laboratory", tagline: "Blood & lab tests", desc: "Automated hematology, clinical chemistry, microbiology, blood banking.", icon: Microscope },
  { name: "Radiology & Diagnostic Imaging", short: "Radiology", tagline: "X-ray, CT, ultrasound", desc: "Digital PA X-ray, multi-slice CT, ultrasound sonograms.", icon: Scan },
  { name: "Inpatient Ward Administration", short: "Nursing Wards", tagline: "Inpatient bedside care", desc: "Comprehensive bedside nursing, IV therapy, SBAR shift continuity.", icon: Bed },
];

// — Public Home Page —
export function PublicHomePage() {
  const { user, isAuthenticated } = useAuth();
  const { hospitalConfig } = useOpdData();
  const navigate = useNavigate();

  const openStaffPortal = () => {
    if (isAuthenticated && user) return navigate("/dashboard");
    const open = (window as any).__openAuthModal;
    if (open) open();
  };

  const quickLinks = [
    { label: "Services", icon: Stethoscope, to: "/departments" },
    { label: "Doctors", icon: Users, to: "/staff" },
    { label: "News", icon: Bell, to: "/announcements" },
    { label: "Contact", icon: Phone, to: "/contact" },
  ];

  const benefits = [
    "Licensed doctors, nurses and specialists",
    "24/7 emergency and trauma care",
    "Laboratory and imaging on site",
    "PhilHealth-accredited — benefits applied at billing",
  ];

  const hours = [
    { day: "Monday – Friday", time: "08:00 – 17:00" },
    { day: "Saturday", time: "08:00 – 12:00" },
    { day: "Sunday & Holidays", time: "Closed" },
    { day: "Emergency Room", time: "Open 24/7" },
  ];

  return (
    <div className="bg-white">
      {/* Photo hero */}
      <section className="relative bg-teal-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1800&h=900&fit=crop&auto=format"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => ((e.target as HTMLImageElement).style.display = "none")}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-950/70 via-teal-900/60 to-teal-900/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-40 sm:pt-28 sm:pb-48 text-center text-white">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-teal-100">
            Welcome to {hospitalConfig.name}
          </p>
          <h1 className="mt-4 text-4xl sm:text-6xl font-extrabold uppercase tracking-tight leading-tight drop-shadow-sm">
            Quality Care.
            <br />
            Closer to You.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-teal-50/90 max-w-xl mx-auto">
            Outpatient clinics, emergency care, laboratory, imaging and inpatient wards — all under one roof.
          </p>

          {/* Quick-link tiles */}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {quickLinks.map(q => (
              <Link
                key={q.label}
                to={q.to}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-teal-600/90 hover:bg-teal-500 border border-white/30 flex flex-col items-center justify-center gap-2 text-xs font-bold shadow-lg transition-colors"
              >
                <q.icon size={26} strokeWidth={1.75} />
                {q.label}
              </Link>
            ))}
            <button
              onClick={openStaffPortal}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white/15 hover:bg-white/25 border border-white/40 flex flex-col items-center justify-center gap-2 text-xs font-bold shadow-lg transition-colors cursor-pointer"
            >
              <LogIn size={26} strokeWidth={1.75} />
              {isAuthenticated && user ? "Dashboard" : "Staff Login"}
            </button>
          </div>
        </div>
      </section>

      {/* Info band overlapping the hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-28 sm:-mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 bg-teal-700 text-white rounded-2xl shadow-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-teal-600">
          <div className="p-6">
            <h2 className="text-lg font-bold">Find a Doctor</h2>
            <p className="text-sm text-teal-100 mt-2 leading-relaxed">
              See our doctors and nurses by department and plan your consultation with the right specialist.
            </p>
            <Link
              to="/staff"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/70 hover:bg-white hover:text-teal-800 text-sm font-bold transition-colors"
            >
              View Doctors <ArrowRight size={15} />
            </Link>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-bold">Why CarePoint</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-teal-50">
              {benefits.map(b => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-teal-200 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 bg-teal-800/60">
            <h2 className="text-lg font-bold">Working Hours</h2>
            <p className="text-xs text-teal-200 mt-1">Outpatient department</p>
            <table className="w-full mt-3 text-sm">
              <tbody>
                {hours.map(h => (
                  <tr key={h.day} className="border-b border-teal-600/70 last:border-0">
                    <td className="py-2 text-teal-50">{h.day}</td>
                    <td className="py-2 text-right font-semibold whitespace-nowrap">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Department list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl font-light text-slate-900">
          Department <span className="font-bold text-teal-700">List</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Specialist departments ready to care for you and your family, from first consultation to recovery.
        </p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {DEPARTMENTS.map(d => (
            <Link
              key={d.name}
              to="/departments"
              className="group rounded-xl bg-teal-50/60 border border-teal-100 hover:bg-teal-700 hover:border-teal-700 p-5 transition-colors"
            >
              <d.icon size={34} strokeWidth={1.5} className="mx-auto text-teal-700 group-hover:text-white" />
              <h3 className="mt-3 text-sm font-bold text-teal-800 group-hover:text-white">{d.short}</h3>
              <p className="mt-1 text-[11px] text-slate-500 group-hover:text-teal-100 leading-snug">{d.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Emergency call-out */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Siren size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Need emergency care?</h2>
              <p className="text-sm text-slate-500">Our emergency room is open 24 hours a day, 7 days a week.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-rose-600">{hospitalConfig.emergencyHotline}</span>
            <Link to="/contact" className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold">
              Contact & Directions
            </Link>
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
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold">{hospitalConfig.name}</h1>
        <p className="text-xs text-slate-500 mt-1">{hospitalConfig.accreditation}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Founder Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-xs">
                MJ
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">
                  Founder & Medical Director
                </div>
                <h2 className="text-xl font-bold text-slate-900">
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
  const depts = DEPARTMENTS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <BackButton onBack={() => navigate("/")} label="Back to Home" />
      <div className="mb-8">
        <div className="text-teal-600 text-xs font-bold tracking-widest uppercase mb-1">Clinical Specialties</div>
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold">Medical Departments & Services</h1>
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
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold">Clinical & Operational Announcements</h1>
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
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold">
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
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold">Contact Information</h1>
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
