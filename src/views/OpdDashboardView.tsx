import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Patient, OpdQueueItem, OpdTab, User, TriageTier, PhilHealthClaim, OpdReferral, QueueStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope,
  UserPlus,
  CreditCard,
  Send,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  X,
  Plus,
  Check,
  ShieldCheck,
  Lock,
  FileText,
  Settings,
  Calendar,
  MessageSquare,
  Briefcase,
  Bell,
  Droplet,
  Pill,
  Bed,
  UserCheck,
} from "../components/Icons";
import ReferralModal from "../components/ReferralModal";
import DischargeModal from "../components/DischargeModal";

function CircularProgress({
  percentage,
  size = 52,
  strokeWidth = 5,
  color = "#10B981",
  trackColor = "#E2E8F0",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-800">{percentage}%</span>
    </div>
  );
}

interface OpdDashboardViewProps {
  queue?: OpdQueueItem[];
  patients?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  onNavigateTab?: (tab: OpdTab) => void;
  onCallNextPatient?: () => void;
  currentUser?: User | null;
}

export default function OpdDashboardView({
  queue: propsQueue,
  patients: propsPatients,
  onSelectPatient: propsSelectPatient,
  onNavigateTab,
  onCallNextPatient: propsCallNext,
  currentUser: propsUser,
}: OpdDashboardViewProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const {
    queue: contextQueue,
    patients: contextPatients,
    waitingCount,
    criticalCount,
    observationCount,
    stableCount,
    completedCount,
    inConsultCount,
    totalQueueCount,
    callNextPatient,
    consultPatient,
    updateQueueStatus,
    addPatient,
    addClaim,
    addReferral,
    selectedPatient,
    setSelectedPatient,
    globalSearchQuery,
    auditLogs = [],
    usersList = [],
    admissions = [],
    visitorLogs = [],
    claims = [],
    medications = [],
    labResults = [],
    treatments = [],
    shiftEndorsements = [],
    checkOutVisitor,
  } = useOpdData();

  const user = propsUser || authUser;
  const queue = propsQueue || contextQueue;
  const patients = propsPatients || contextPatients;

  // Dynamically filter patient queue when search query is entered in header
  const displayedQueue = React.useMemo(() => {
    if (!globalSearchQuery.trim()) return queue;
    const qLower = globalSearchQuery.toLowerCase().trim();
    return queue.filter(item => {
      const pat = patients.find(p => p.id === item.patientId);
      const pin = pat?.philhealth?.pin || "";
      return (
        item.patientName.toLowerCase().includes(qLower) ||
        item.patientId.toLowerCase().includes(qLower) ||
        pin.toLowerCase().includes(qLower) ||
        item.chiefComplaint.toLowerCase().includes(qLower)
      );
    });
  }, [queue, globalSearchQuery, patients]);

  // Modal toggle states
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isEClaimsModalOpen, setIsEClaimsModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [activeModalPatientId, setActiveModalPatientId] = useState<string | undefined>(undefined);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quick New Patient Form State
  const [newPatName, setNewPatName] = useState("");
  const [newPatAge, setNewPatAge] = useState<number>(35);
  const [newPatGender, setNewPatGender] = useState<"Female" | "Male" | "Other">("Female");
  const [newPatComplaint, setNewPatComplaint] = useState("");
  const [newPatTriage, setNewPatTriage] = useState<TriageTier>("observation");
  const [newPatContact, setNewPatContact] = useState("0917-555-0192");

  // Quick eClaims Form State
  const [claimPin, setClaimPin] = useState("12-849201948-3");
  const [claimMemberName, setClaimMemberName] = useState(selectedPatient?.name || "Dela Cruz, Juan");
  const [claimType, setClaimType] = useState("Formal Economy / Private");
  const [claimDiag, setClaimDiag] = useState("Essential Hypertension - ICD-10: I10");
  const [claimPackage, setClaimPackage] = useState("Php 6,000 - Medical Case");

  // Quick Vitals Form State
  const [quickHeight, setQuickHeight] = useState(165);
  const [quickWeight, setQuickWeight] = useState(65);
  const [quickBpSys, setQuickBpSys] = useState(120);
  const [quickBpDia, setQuickBpDia] = useState(80);
  const [quickHr, setQuickHr] = useState(75);
  const [quickTemp, setQuickTemp] = useState(36.7);
  const [quickSpo2, setQuickSpo2] = useState(99);

  // Quick Referral Form State
  const [refDept, setRefDept] = useState("Cardiology Subspecialty Clinic");
  const [refReason, setRefReason] = useState("Urgent 2D Echocardiogram and specialist review.");
  const [refPriority, setRefPriority] = useState<"Routine" | "Urgent" | "Stat Emergency">("Urgent");

  const notify = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleCallNext = () => {
    if (propsCallNext) {
      propsCallNext();
    } else {
      const called = callNextPatient();
      if (called) {
        notify(`Called next patient: #${called.queueNumber} ${called.patientName}`);
        navigate("/clinical/doctor-workbench");
      }
    }
  };

  const handleConsult = (patientId: string) => {
    const pat = consultPatient(patientId);
    if (propsSelectPatient && pat) {
      propsSelectPatient(pat);
    }
    navigate("/clinical/doctor-workbench");
  };

  const handleSaveNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim() || !newPatComplaint.trim()) return;

    const newId = `P-2026-${Date.now().toString().slice(-4)}`;
    const newPat: Patient = {
      id: newId,
      name: newPatName,
      dob: "1991-05-14",
      age: newPatAge,
      gender: newPatGender,
      civilStatus: "Married",
      contact: newPatContact,
      address: "Pasig City, Metro Manila",
      emergencyContact: {
        name: "Family Guardian",
        relationship: "Spouse",
        phone: newPatContact,
      },
      bloodType: "O+",
      allergies: ["None known"],
      chiefComplaint: newPatComplaint,
      triageTier: newPatTriage,
      admissionStatus: "Outpatient",
      registeredAt: new Date().toISOString().split("T")[0],
      attendingPhysician: user?.name || "Attending Physician",
    };

    addPatient(newPat);
    setIsNewPatientModalOpen(false);
    setNewPatName("");
    setNewPatComplaint("");
    notify(`New patient ${newPat.name} registered and enqueued!`);
  };

  const handleSaveClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: PhilHealthClaim = {
      id: `CLM-2026-${Date.now().toString().slice(-3)}`,
      patientId: selectedPatient?.id || "P-2024-001",
      pin: claimPin,
      memberName: claimMemberName,
      membershipType: claimType,
      diagnosisWithIcd: claimDiag,
      caseRateAmount: claimPackage,
      claimStatus: "Ready for Submission",
      submissionDate: new Date().toISOString().split("T")[0],
      hospitalCharges: 12000,
      philhealthBenefit: 6000,
      patientPayable: 6000,
    };

    addClaim(newClaim);
    setIsEClaimsModalOpen(false);
    notify(`PhilHealth eClaim created for ${claimMemberName}.`);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const hM = quickHeight / 100;
    const bmiVal = Number((quickWeight / (hM * hM)).toFixed(1));
    notify(`Vitals logged for ${selectedPatient?.name || "Active Patient"}: BP ${quickBpSys}/${quickBpDia}, BMI ${bmiVal} kg/m²`);
    setIsVitalsModalOpen(false);
  };

  // =========================================================================
  // 1. ADMIN DASHBOARD: STRICT ZERO-PHI SYSTEM CONSOLE
  // =========================================================================
  if (user?.role === "admin") {
    return (
      <div className="space-y-6">
        {/* Admin Welcome Hero Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Welcome, {user.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              System administration: staff accounts, duty shifts, audit ledger and access control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/admin/accounts")}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} strokeWidth={2} />
              <span>Manage Accounts</span>
            </button>
            <button
              onClick={() => navigate("/shifts")}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Duty Shifts
            </button>
          </div>
        </div>

        {/* 4 High-Level System Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/admin/compliance")}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                System Status
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Activity size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">99.98%</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              Operational • DB Connected
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/accounts")}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                Staff Accounts
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Users size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{usersList.length || 4}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Doctors, Nurses & Staff Users
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/audit-ledger")}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                Cryptographic Logs
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{auditLogs.length || 8}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">
              0 Security Violations Flagged
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/compliance")}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
                Data Privacy
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Lock size={16} strokeWidth={2} />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-2">RA 10173</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">
              Zero PHI Exposure Enforced
            </div>
          </div>
        </div>

        {/* Cryptographic Audit Trail & Governance Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Cryptographic Audit Trail
                </h3>
                <p className="text-xs text-slate-500">System event logging & security verification</p>
              </div>
              <button
                onClick={() => navigate("/admin/audit-ledger")}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All Logs</span>
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User & License</th>
                    <th className="py-2.5 px-3">System Action</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.slice(0, 5).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.userLicense || log.userRole.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {log.department}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} />
                          <span>Logged</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Administration Console</h3>
            <p className="text-xs text-slate-500">
              Quick access to administrative governance and security panels:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/admin/accounts")}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <Users size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Account Directory & Roles</div>
                    <div className="text-[10px] text-slate-500">Manage clinician accounts</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700" />
              </button>

              <button
                onClick={() => navigate("/admin/audit-ledger")}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <FileText size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">Cryptographic Audit Trail</div>
                    <div className="text-[10px] text-slate-500">Immutable ledger logs</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700" />
              </button>

              <button
                onClick={() => navigate("/admin/rbac")}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <ShieldCheck size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">RBAC Permissions Matrix</div>
                    <div className="text-[10px] text-slate-500">Inspect strict role boundaries</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. NURSE DASHBOARD: NURSING CARE & BEDSIDE TRIAGE STATION
  // =========================================================================
  if (user?.role === "nurse") {
    return (
      <div className="space-y-6">
        {actionSuccessMsg && (
          <div className="bg-teal-900 text-teal-100 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
            <div className="flex items-center gap-2">
              <Check size={16} strokeWidth={2.5} className="text-teal-300" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-teal-300 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Page Header & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Hello, {user?.name ? user.name : "Nurse"}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Nursing Station, Hemodynamic Vitals Entry & Inpatient Bed Telemetry</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate("/clinical?tab=vitals")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity size={15} />
                  <span>Triage & Vitals Assessment</span>
                </button>
                <button
                  onClick={() => navigate("/registration/beds")}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bed size={15} />
                  <span>Ward Bed Telemetry</span>
                </button>
                <button
                  onClick={() => setIsVitalsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Quick Log Vitals</span>
                </button>
              </div>
        </div>

        {/* 4 Nursing Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/clinical?tab=vitals")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Awaiting Vitals</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{waitingCount} Enroute</div>
              <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">Triage Queue Active</span>
            </div>
            <CircularProgress percentage={Math.min(100, waitingCount * 25)} color="#06B6D4" trackColor="#E0F2FE" />
          </div>

          <div
            onClick={() => navigate("/queue")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Urgent (Tier 1)</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">{criticalCount} Critical</div>
              <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">Immediate Attention</span>
            </div>
            <CircularProgress percentage={criticalCount > 0 ? 95 : 10} color="#F43F5E" trackColor="#FFE4E6" />
          </div>

          <div
            onClick={() => navigate("/registration/beds")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Ward Beds Occupied</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{admissions.length} In-Use</div>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">30 Total Inpatient Capacity</span>
            </div>
            <CircularProgress percentage={Math.round((admissions.length / 30) * 100)} color="#F59E0B" trackColor="#FEF3C7" />
          </div>

          <div
            onClick={() => navigate("/reports")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Stable Acuity</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stableCount} Normal</div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Routine Consultations</span>
            </div>
            <CircularProgress percentage={78} color="#10B981" trackColor="#D1FAE5" />
          </div>
        </div>

        {/* Main Two-Column Layout (66% Left, 34% Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Bedside Triage & Vitals Queue Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bedside Triage & Hemodynamics Queue</h3>
                  <p className="text-[11px] text-slate-500">Log patient vital signs and advance triage status</p>
                </div>
                <button
                  onClick={() => navigate("/clinical?tab=vitals")}
                  className="text-xs text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Vitals Station</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Triage Tier</th>
                      <th className="py-2.5 px-3">Chief Complaint</th>
                      <th className="py-2.5 px-3">Arrival</th>
                      <th className="py-2.5 px-3 text-right">Nursing Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedQueue.slice(0, 5).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">#{item.queueNumber} • {item.gender}, {item.age}y/o</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.triageTier === "critical"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : item.triageTier === "observation"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.triageTier.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-[160px] truncate">
                          {item.chiefComplaint}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                          {item.checkInTime}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                const pat = patients.find(p => p.id === item.patientId);
                                if (pat) setSelectedPatient(pat);
                                setIsVitalsModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-full bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Activity size={12} />
                              <span>Log Vitals</span>
                            </button>
                            <button
                              onClick={() => {
                                const nextStatus: QueueStatus =
                                  item.status === "Waiting"
                                    ? "In-Consultation"
                                    : item.status === "In-Consultation"
                                    ? "Completed"
                                    : "Waiting";
                                updateQueueStatus(item.id, nextStatus);
                                notify(`Patient #${item.queueNumber} advanced to ${nextStatus}`);
                              }}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              <span>Advance</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Split Bottom Row: Rapid Alert Watch & Shift Endorsements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Rapid Hemodynamic Alerts</h3>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                    Telemetry Watch
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-rose-900">Hypertensive Triage Alert</div>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        BP 160/100 mmHg detected. Immediate physician notification recommended.
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                    <Activity size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-amber-900">SpO2 Borderline Desaturation</div>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        SpO2 at 94% on room air. Supplemental cannula check initiated.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Nursing Shift Handover</h3>
                  <span className="text-xs text-teal-700 font-bold cursor-pointer">Endorsement</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Nurse Angelmae Palma, RN</span>
                      <span className="text-[10px] text-slate-400">07:00 Shift</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Ward 4B bed 03 ready for discharge. Emergency cart verified and sealed.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Nurse Rechel Ann Perez, RN</span>
                      <span className="text-[10px] text-slate-400">06:30 Shift</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      All morning vitals logged for OPD queue patients. Oxygen cylinder verified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ward Bed Status & Duty Telemetry */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Inpatient Ward Bed Telemetry</h3>
                <button
                  onClick={() => navigate("/registration/beds")}
                  className="text-xs text-teal-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Beds</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Male Medical Ward</span>
                    <span className="font-mono text-teal-800">6 / 8 Beds (75%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Female Surgical Ward</span>
                    <span className="font-mono text-emerald-800">7 / 8 Beds (87%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Pediatric Ward</span>
                    <span className="font-mono text-blue-800">4 / 6 Beds (66%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "66%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Intensive Care Unit (ICU)</span>
                    <span className="font-mono text-rose-800">3 / 4 Beds (75%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Station Equipment Readiness</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span className="text-slate-700 font-medium">Crash Cart Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">VERIFIED & SEALED</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span className="text-slate-700 font-medium">Emergency Oxygen</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">100% PRESSURE</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span className="text-slate-700 font-medium">Glucometer Calibration</span>
                  <span className="font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full text-[10px]">CALIBRATED TODAY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Quick Vitals Entry */}
        {isVitalsModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                    <Activity size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quick Vitals & BMI Entry</h3>
                    <p className="text-[11px] text-slate-500">Patient: {selectedPatient?.name || "Active Patient"}</p>
                  </div>
                </div>
                <button onClick={() => setIsVitalsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <form onSubmit={handleSaveVitals} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={quickHeight}
                      onChange={e => setQuickHeight(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={quickWeight}
                      onChange={e => setQuickWeight(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-teal-900">Calculated BMI:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {(quickWeight / ((quickHeight / 100) * (quickHeight / 100))).toFixed(1)} kg/m²
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      value={quickBpSys}
                      onChange={e => setQuickBpSys(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      value={quickBpDia}
                      onChange={e => setQuickBpDia(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">HR (bpm)</label>
                    <input
                      type="number"
                      value={quickHr}
                      onChange={e => setQuickHr(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickTemp}
                      onChange={e => setQuickTemp(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      value={quickSpo2}
                      onChange={e => setQuickSpo2(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVitalsModalOpen(false);
                      navigate("/clinical?tab=vitals");
                    }}
                    className="text-teal-700 text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    Open Full Vitals Station →
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVitalsModalOpen(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Save Vitals
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. STAFF DASHBOARD: ADMISSIONS DESK & FRONT DESK RECEPTION
  // =========================================================================
  if (user?.role === "staff") {
    return (
      <div className="space-y-6">
        {actionSuccessMsg && (
          <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
            <div className="flex items-center gap-2">
              <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-300 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Page Header & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Hello, {user?.name ? user.name : "Staff"}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Patient Admissions, Inpatient Bed Allocations, Visitor Logs & PhilHealth eClaims</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate("/registration/new-patient")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Register New Patient</span>
                </button>
                <button
                  onClick={() => navigate("/registration/beds")}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Bed size={15} />
                  <span>Allocate Ward Bed</span>
                </button>
                <button
                  onClick={() => navigate("/registration/visitors")}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users size={15} />
                  <span>Visitor Badge Log</span>
                </button>
              </div>
        </div>

        {/* 4 Administrative Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/registration/directory")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Master Directory</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{patients.length} Records</div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Enrolled Outpatients</span>
            </div>
            <CircularProgress percentage={88} color="#10B981" trackColor="#D1FAE5" />
          </div>

          <div
            onClick={() => navigate("/registration/beds")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Ward Bed Allocation</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{admissions.length} Occupied</div>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Inpatient Capacity</span>
            </div>
            <CircularProgress percentage={Math.round((admissions.length / 30) * 100)} color="#F59E0B" trackColor="#FEF3C7" />
          </div>

          <div
            onClick={() => navigate("/registration/visitors")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">Active Visitors</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {visitorLogs.filter(v => v.status === "Currently Visiting").length} On-Site
              </div>
              <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">Security Passes</span>
            </div>
            <CircularProgress percentage={65} color="#06B6D4" trackColor="#E0F2FE" />
          </div>

          <div
            onClick={() => navigate("/philhealth")}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-500">PhilHealth eClaims</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{claims.length} Claims</div>
              <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Billing Ready</span>
            </div>
            <CircularProgress percentage={92} color="#3B82F6" trackColor="#DBEAFE" />
          </div>
        </div>

        {/* Main Two-Column Layout (66% Left, 34% Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Admissions & Registration Log Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Patient Registrations & Admissions</h3>
                  <p className="text-[11px] text-slate-500">Patient intake records and admission classifications</p>
                </div>
                <button
                  onClick={() => navigate("/registration/directory")}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Directory</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Patient MRN & Name</th>
                      <th className="py-2.5 px-3">Demographics</th>
                      <th className="py-2.5 px-3">Admission Status</th>
                      <th className="py-2.5 px-3">Registered Date</th>
                      <th className="py-2.5 px-3 text-right">Staff Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.slice(0, 5).map(pat => (
                      <tr key={pat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{pat.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pat.id}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {pat.gender}, {pat.age}y/o
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pat.admissionStatus === "Admitted"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : pat.admissionStatus === "Discharged"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {pat.admissionStatus || "Outpatient"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                          {pat.registeredAt || "2026-03-01"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setSelectedPatient(pat);
                                navigate("/registration/directory");
                              }}
                              className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck size={12} />
                              <span>Directory</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(pat);
                                navigate("/registration/beds");
                              }}
                              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              <span>Bed</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Split Bottom Row: Visitor Passes & Reception Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Front Desk Visitor Passes</h3>
                  <button
                    onClick={() => navigate("/registration/visitors")}
                    className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2.5">
                  {visitorLogs.slice(0, 3).map(vis => (
                    <div key={vis.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{vis.visitorName}</div>
                        <div className="text-[10px] text-slate-500">Badge #{vis.badgeNumber} • Visiting: {vis.patientName}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        vis.status === "Currently Visiting" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}>
                        {vis.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Reception Operations</h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Schedule
                  </span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900">Outpatient Intake Hours</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Monday - Saturday: 08:00 AM - 05:00 PM</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900">Ward Visiting Hours</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Daily: 10:00 AM - 12:00 PM & 04:00 PM - 08:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ward Bed Summary & Quick Front Desk Actions */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Inpatient Bed Logistics</h3>
                <button
                  onClick={() => navigate("/registration/beds")}
                  className="text-xs text-emerald-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Bed Map</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Total Bed Capacity:</span>
                  <span className="font-mono">30 Beds</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Currently Occupied:</span>
                  <span className="font-mono">{admissions.length} Beds</span>
                </div>
                <div className="flex justify-between font-semibold text-teal-700">
                  <span>Available for Admission:</span>
                  <span className="font-mono">{30 - admissions.length} Beds</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Front Desk Quick Actions</h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => navigate("/registration/new-patient")}
                  className="w-full p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={15} />
                    <span>New Patient Intake</span>
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => navigate("/registration/beds")}
                  className="w-full p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Bed size={15} />
                    <span>Inpatient Bed Management</span>
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => navigate("/philhealth")}
                  className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard size={15} />
                    <span>PhilHealth eClaims Portal</span>
                  </span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Quick New Patient Registration */}
        {isNewPatientModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                    <UserPlus size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quick Patient Registration</h3>
                    <p className="text-[11px] text-slate-500">Enroll new outpatient directly into queue</p>
                  </div>
                </div>
                <button onClick={() => setIsNewPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <form onSubmit={handleSaveNewPatient} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Santos, Juanito Cruz"
                    value={newPatName}
                    onChange={e => setNewPatName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={newPatAge}
                      onChange={e => setNewPatAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                    <select
                      value={newPatGender}
                      onChange={e => setNewPatGender(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chief Complaint *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute fever, productive cough x 3 days"
                    value={newPatComplaint}
                    onChange={e => setNewPatComplaint(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Triage Priority</label>
                    <select
                      value={newPatTriage}
                      onChange={e => setNewPatTriage(e.target.value as TriageTier)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="stable">Green - Stable</option>
                      <option value="observation">Yellow - Observation</option>
                      <option value="critical">Red - Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={newPatContact}
                      onChange={e => setNewPatContact(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPatientModalOpen(false);
                      navigate("/registration/new-patient");
                    }}
                    className="text-emerald-700 text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    Open Full Admissions Desk →
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewPatientModalOpen(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Save & Enqueue
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. DOCTOR DASHBOARD: PHYSICIAN CLINICAL CONSULTATION STATION (DEFAULT)
  // =========================================================================
  return (
    <div className="space-y-6">
      {actionSuccessMsg && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Page Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Hello, {user?.name ? user.name : "Doctor"}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Physician Consultation Station • Active Outpatient Care & Diagnostic Telemetry</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCallNext}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck size={15} />
                <span>Call Next Patient</span>
              </button>
              <button
                onClick={() => navigate("/clinical?tab=workbench")}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Stethoscope size={15} />
                <span>Doctor Workbench</span>
              </button>
              <button
                onClick={() => navigate("/clinical?tab=prescriptions")}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pill size={15} />
                <span>e-Prescriptions (Rx)</span>
              </button>
            </div>
      </div>

      {/* 4 Clinical Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/queue")}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">Waiting in Queue</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{waitingCount} Patients</div>
            <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">Pending Review</span>
          </div>
          <CircularProgress percentage={Math.min(100, waitingCount * 25)} color="#06B6D4" trackColor="#E0F2FE" />
        </div>

        <div
          onClick={() => navigate("/clinical?tab=workbench")}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">In Consultation</span>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">{inConsultCount} Encounters</div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Active in Booths</span>
          </div>
          <CircularProgress percentage={inConsultCount > 0 ? 80 : 15} color="#10B981" trackColor="#D1FAE5" />
        </div>

        <div
          onClick={() => navigate("/queue")}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">Tier 1 Critical</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{criticalCount} Urgent</div>
            <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">Immediate Consult</span>
          </div>
          <CircularProgress percentage={criticalCount > 0 ? 95 : 5} color="#F43F5E" trackColor="#FFE4E6" />
        </div>

        <div
          onClick={() => navigate("/reports")}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500">Completed Encounters</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount} Finished</div>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Discharged Today</span>
          </div>
          <CircularProgress percentage={Math.min(100, completedCount * 20)} color="#3B82F6" trackColor="#DBEAFE" />
        </div>
      </div>

      {/* Main Two-Column Layout (66% Left, 34% Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Doctor's Consultation Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Doctor's Active Consultation Queue</h3>
                <p className="text-[11px] text-slate-500">Live patients ready for physician clinical examination</p>
              </div>
              <button
                onClick={() => navigate("/queue")}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>See All in Queue</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Patient Name & Demographics</th>
                    <th className="py-2.5 px-3">Chief Complaint</th>
                    <th className="py-2.5 px-3">Acuity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Physician Clinical Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedQueue.slice(0, 5).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.patientName}</span>
                          <span className="text-[10px] font-mono text-slate-400">#{item.queueNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.gender}, {item.age} Years</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 max-w-[170px] truncate">
                        {item.chiefComplaint}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.triageTier === "critical"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : item.triageTier === "observation"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {item.triageTier.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "In-Consultation"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : item.status === "Completed"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleConsult(item.patientId)}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Open in Doctor Workbench"
                          >
                            <Stethoscope size={12} />
                            <span>Consult</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalPatientId(item.patientId);
                              setIsReferralModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-full bg-blue-50 hover:bg-blue-600 text-blue-800 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Issue Specialist Referral"
                          >
                            <Send size={12} />
                            <span>Refer</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalPatientId(item.patientId);
                              setIsDischargeModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Discharge Patient"
                          >
                            <CheckCircle size={12} />
                            <span>Discharge</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Split Bottom Row: Clinical Documents & Doctor's Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Clinical Documents & Orders</h3>
                <button
                  onClick={() => navigate("/clinical?tab=workbench")}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Workbench
                </button>
              </div>

              <div className="space-y-2.5">
                <div
                  onClick={() => navigate("/clinical?tab=workbench")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">SOAP Clinical Encounter</div>
                      <div className="text-[10px] text-slate-500">General Medicine Outpatient</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">Documented</span>
                </div>

                <div
                  onClick={() => navigate("/clinical?tab=labs")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Diagnostic Chemistry Panel</div>
                      <div className="text-[10px] text-slate-500">CBC & Lipid Profile Ordered</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-bold">Active Lab</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5 select-none">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Physician Consulting Schedule</h3>
                <span className="text-xs text-slate-500 font-semibold">Active Shift</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-950 flex justify-between">
                    <span>Morning Outpatient Clinic</span>
                    <span className="font-mono">08:00 - 12:00</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">Booth 01 • Internal Medicine</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-bold text-slate-900 flex justify-between">
                    <span>Afternoon Teleconsult & Ward Rounds</span>
                    <span className="font-mono">13:30 - 17:00</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Inpatient Ward Rounds & Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Patient Context & Prescriptions */}
        <div className="space-y-5">
          {/* Active Patient Chart Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Active Consultation Patient</h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Chart Ready</span>
            </div>

            {selectedPatient ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="font-bold text-sm text-slate-900">{selectedPatient.name}</div>
                <div className="text-[11px] text-slate-500">
                  {selectedPatient.gender}, {selectedPatient.age}y/o • Blood Type: {selectedPatient.bloodType || "O+"}
                </div>
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-800">Chief Complaint:</span> {selectedPatient.chiefComplaint}
                </div>
                <button
                  onClick={() => navigate("/clinical?tab=workbench")}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs text-center transition-colors cursor-pointer shadow-2xs"
                >
                  Open in Workbench →
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                <p>No patient selected.</p>
                <button
                  onClick={handleCallNext}
                  className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Call Next Patient
                </button>
              </div>
            )}
          </div>

          {/* Medical Supplements / Prescriptions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent e-Prescriptions (Rx)</h3>
              <button
                onClick={() => navigate("/clinical?tab=prescriptions")}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Rx</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
                    💊
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Amoxicillin 500mg</div>
                    <div className="text-[10px] text-slate-400">21 Capsules • TID x 7d</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-base">
                    💊
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">Losartan 50mg</div>
                    <div className="text-[10px] text-slate-400">30 Tablets • OD Morning</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>
          </div>

          {/* PhilHealth Case Rate Claims */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">PhilHealth Konsulta & Claims</h3>
              <button
                onClick={() => navigate("/philhealth")}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Claims</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Essential Hypertension (I10)</div>
                  <div className="text-[10px] text-slate-500">Case Rate: Php 6,000</div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Certified</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Acute Bronchitis (J20.9)</div>
                  <div className="text-[10px] text-slate-500">Case Rate: Php 9,000</div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        defaultPatientId={activeModalPatientId}
      />

      <DischargeModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        defaultPatientId={activeModalPatientId}
      />
    </div>
  );
}
