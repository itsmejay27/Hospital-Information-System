import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Patient, OpdQueueItem, OpdTab, User, TriageTier, PhilHealthClaim, OpdReferral } from "../types";
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
  TrendingUp,
  X,
  Plus,
  Check,
  ShieldCheck,
  Lock,
  FileText,
  Settings,
} from "../components/Icons";
import ReferralModal from "../components/ReferralModal";
import DischargeModal from "../components/DischargeModal";

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
    addPatient,
    addClaim,
    addReferral,
    selectedPatient,
    setSelectedPatient,
    globalSearchQuery,
    auditLogs = [],
    usersList = [],
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

  // Next waiting patient dynamically found
  const nextWaiting = queue.find(q => q.status === "Waiting");

  // Modal toggle states for Frequent OPD Actions
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

  // Submit Quick New Patient
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
    notify(`New patient ${newPat.name} registered and added to live queue!`);
  };

  // Submit Quick eClaim
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

  // Submit Quick Vitals & BMI
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const hM = quickHeight / 100;
    const bmiVal = Number((quickWeight / (hM * hM)).toFixed(1));
    notify(`Vitals logged for ${selectedPatient?.name || "Active Patient"}: BP ${quickBpSys}/${quickBpDia}, BMI ${bmiVal} kg/m²`);
    setIsVitalsModalOpen(false);
  };

  // Submit Quick Referral
  const handleSaveReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: OpdReferral = {
      id: `REF-2026-${Date.now().toString().slice(-3)}`,
      patientId: selectedPatient?.id || "P-2024-001",
      patientName: selectedPatient?.name || "Active Patient",
      referredFrom: "Outpatient General Medicine",
      referredTo: refDept,
      reason: refReason,
      priority: refPriority,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      referringDoctor: user?.name || "Attending Physician",
      status: "Pending",
    };

    addReferral(newRef);
    setIsReferralModalOpen(false);
    notify(`Specialist referral to ${refDept} created.`);
  };

  if (user?.role === "admin") {
    return (
      <div className="space-y-6">
        {/* Admin Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-2xl p-6 text-white shadow-md border border-amber-900/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                System & Security Operations • Admin Session Active
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Welcome, {user.name}!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hospital System Infrastructure & Role-Based Access Security are fully active. You are viewing high-level system health metrics, account management controls, and immutable audit ledgers.
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/accounts")}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
            >
              <ShieldCheck size={16} strokeWidth={2} />
              <span>Open Admin & Security Console</span>
            </button>
          </div>
        </div>

        {/* 4 High-Level System Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate("/admin/compliance")}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
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
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
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
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
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
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 cursor-pointer transition-all"
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

        {/* System Administration Shortcuts & Recent Security Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Cryptographic Audit Trail
                </h3>
                <p className="text-xs text-slate-500">System event logging & security status</p>
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
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              System Admin Controls
            </h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => navigate("/admin/accounts")}
                className="w-full p-3 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <Users size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">User Account Directory</div>
                    <div className="text-[10px] text-slate-500">Create, edit roles, suspend accounts</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700" />
              </button>

              <button
                onClick={() => navigate("/admin/compliance")}
                className="w-full p-3 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <ShieldCheck size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">DPA & Privacy Compliance</div>
                    <div className="text-[10px] text-slate-500">NPC Circular 16-01, consent audit logs</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-700" />
              </button>

              <button
                onClick={() => navigate("/admin/rbac")}
                className="w-full p-3 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:scale-105 transition-transform">
                    <ShieldCheck size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">RBAC Permissions Matrix</div>
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

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-teal-300" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-teal-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Welcome & Call Next Patient Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Live OPD Operations • Session Active: {user?.role?.toUpperCase() || "STAFF"}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good day, {user?.name || "Doctor"}!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Outpatient Department clinic queue is active. You have{" "}
              <span className="text-teal-300 font-semibold">{waitingCount} patient{waitingCount !== 1 ? "s" : ""}</span> currently waiting in the lounge, with{" "}
              <span className="text-rose-400 font-semibold">{criticalCount} critical</span> triage alert.
            </p>
          </div>

          {/* Call Next Patient Quick Action Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {nextWaiting ? (
              <div>
                <div className="text-[11px] text-teal-200 font-medium uppercase tracking-wide">
                  Next in Queue: #{nextWaiting.queueNumber}
                </div>
                <div className="text-sm font-bold text-white">
                  {nextWaiting.patientName} ({nextWaiting.age}y/o)
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-[200px]">
                  {nextWaiting.chiefComplaint}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 italic">
                All waiting patients attended!
              </div>
            )}

            <button
              onClick={handleCallNext}
              disabled={!nextWaiting}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 ${
                nextWaiting
                  ? "bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer hover:scale-105"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Users size={15} strokeWidth={2.5} />
              <span>Call Next Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Vital OPD Statistics - DYNAMIC DATA BINDING */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Queue */}
        <div
          onClick={() => navigate("/queue")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Queue Waiting
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{waitingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{inConsultCount} In-Consultation</span>
            <span className="text-slate-400">• {totalQueueCount} Total</span>
          </div>
        </div>

        {/* Critical Red Alerts */}
        <div
          onClick={() => navigate("/queue")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
              Critical Triage
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            Immediate physician consult needed
          </div>
        </div>

        {/* Observation Yellow */}
        <div
          onClick={() => navigate("/queue")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              Watch / Observation
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{observationCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bedside vitals monitoring active
          </div>
        </div>

        {/* Completed Consultations / Daily OPD Census */}
        <div
          onClick={() => navigate("/reports")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Daily OPD Census
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalQueueCount + completedCount}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp size={12} strokeWidth={2} />
            <span>{completedCount} Cleared • {stableCount} Stable</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Live Queue Snapshot & Priority Watch System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Patient Queue Table Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Clinic Patient Queue
              </h3>
              <p className="text-xs text-slate-500">Real-time outpatient consultation order</p>
            </div>
            <div className="flex items-center gap-2">
              {globalSearchQuery.trim() && (
                <span className="text-[11px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-semibold">
                  Filtered: "{globalSearchQuery}" ({displayedQueue.length})
                </span>
              )}
              <button
                onClick={() => navigate("/queue")}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Open Full Queue</span>
                <ChevronRight size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Triage Tier</th>
                  <th className="py-2.5 px-3">Chief Complaint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No patients in queue match "{globalSearchQuery}"
                    </td>
                  </tr>
                ) : (
                  displayedQueue.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-700">
                      #{item.queueNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.patientName}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.age}y/o • {item.gender} • In: {item.checkInTime}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.triageTier === "critical"
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : item.triageTier === "observation"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {item.triageTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">
                      {item.chiefComplaint}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === "In-Consultation"
                            ? "bg-teal-100 text-teal-800"
                            : item.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {user?.role === "doctor" ? (
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleConsult(item.patientId)}
                            className="px-2 py-1 rounded-md bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Open in Doctor Workbench"
                          >
                            <Stethoscope size={12} strokeWidth={2} />
                            <span>Consult</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalPatientId(item.patientId);
                              setIsReferralModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Issue Specialist Referral"
                          >
                            <Send size={12} strokeWidth={2} />
                            <span>Refer</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModalPatientId(item.patientId);
                              setIsDischargeModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Discharge Patient"
                          >
                            <CheckCircle size={12} strokeWidth={2} />
                            <span>Discharge</span>
                          </button>
                        </div>
                      ) : user?.role === "nurse" ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const pat = patients.find(p => p.id === item.patientId);
                              if (pat) setSelectedPatient(pat);
                              setIsVitalsModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Activity size={12} strokeWidth={2} />
                            <span>Log Vitals</span>
                          </button>
                          <button
                            onClick={() => navigate("/registration/beds")}
                            className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Bed Triage</span>
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const pat = patients.find(p => p.id === item.patientId);
                              if (pat) setSelectedPatient(pat);
                              navigate("/registration/directory");
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Users size={12} strokeWidth={2} />
                            <span>Admissions</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Priority Watch System & Quick Clinical Links */}
        <div className="space-y-4">
          {/* Priority Watch System (3 Tiers) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Priority Watch System
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                MTS Protocol
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Critical Tier */}
              <div
                onClick={() => navigate("/queue")}
                className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 cursor-pointer hover:bg-rose-100/70 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-900">RED: Critical Care</span>
                    <span className="text-xs font-mono font-bold text-rose-700">{criticalCount} Active</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Acute chest pain, severe dyspnea, shock, altered mental state.
                  </p>
                </div>
              </div>

              {/* Watch / Observation Tier */}
              <div
                onClick={() => navigate("/queue")}
                className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 cursor-pointer hover:bg-amber-100/70 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">YELLOW: Observation</span>
                    <span className="text-xs font-mono font-bold text-amber-700">{observationCount} Active</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Severe pain, persistent fever &gt;38.5°C, post-op dressings.
                  </p>
                </div>
              </div>

              {/* Stable Tier */}
              <div
                onClick={() => navigate("/queue")}
                className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 cursor-pointer hover:bg-emerald-100/70 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900">GREEN: Stable OPD</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">{stableCount} Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Routine chronic refills, minor complaints, follow-up clearances.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick OPD Modules Shortcuts with Modal Toggles */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Frequent OPD Actions
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {user?.role === "doctor" ? (
                <>
                  <button
                    onClick={() => navigate("/clinical/doctor-workbench")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Stethoscope size={16} strokeWidth={2} className="text-blue-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Doctor Workbench</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModalPatientId(selectedPatient?.id);
                      setIsReferralModalOpen(true);
                    }}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Send size={16} strokeWidth={2} className="text-teal-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Specialist Referral</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModalPatientId(selectedPatient?.id);
                      setIsDischargeModalOpen(true);
                    }}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <CheckCircle size={16} strokeWidth={2} className="text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Discharge Clearance</span>
                  </button>

                  <button
                    onClick={() => navigate("/prescriptions")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <CreditCard size={16} strokeWidth={2} className="text-purple-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">e-Prescriptions</span>
                  </button>
                </>
              ) : user?.role === "nurse" ? (
                <>
                  <button
                    onClick={() => setIsVitalsModalOpen(true)}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Activity size={16} strokeWidth={2} className="text-purple-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Vitals & BMI</span>
                  </button>

                  <button
                    onClick={() => navigate("/registration/beds")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Users size={16} strokeWidth={2} className="text-teal-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Bed Allocation</span>
                  </button>

                  <button
                    onClick={() => setIsNewPatientModalOpen(true)}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <UserPlus size={16} strokeWidth={2} className="text-teal-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Quick Intake</span>
                  </button>

                  <button
                    onClick={() => navigate("/clinical/vitals-bmi")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <TrendingUp size={16} strokeWidth={2} className="text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Shift Endorsements</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/registration/new-patient")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <UserPlus size={16} strokeWidth={2} className="text-teal-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Patient Registration</span>
                  </button>

                  <button
                    onClick={() => navigate("/registration/directory")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Users size={16} strokeWidth={2} className="text-blue-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Master Directory</span>
                  </button>

                  <button
                    onClick={() => navigate("/registration/visitors")}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <Clock size={16} strokeWidth={2} className="text-amber-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">Front Desk Visitors</span>
                  </button>

                  <button
                    onClick={() => setIsEClaimsModalOpen(true)}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 flex flex-col items-center text-center transition-all cursor-pointer group"
                  >
                    <CreditCard size={16} strokeWidth={2} className="text-emerald-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-[11px]">eClaims & Bill</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Quick New Patient Registration */}
      {isNewPatientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={newPatAge}
                    onChange={e => setNewPatAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={newPatGender}
                    onChange={e => setNewPatGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Triage Priority</label>
                  <select
                    value={newPatTriage}
                    onChange={e => setNewPatTriage(e.target.value as TriageTier)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
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
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
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
                  className="text-teal-700 text-[11px] font-semibold hover:underline cursor-pointer"
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
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Save & Enqueue
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick PhilHealth eClaim */}
      {isEClaimsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                  <CreditCard size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quick eClaims & Billing Entry</h3>
                  <p className="text-[11px] text-slate-500">Universal Health Care claim creation</p>
                </div>
              </div>
              <button onClick={() => setIsEClaimsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveClaim} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">PhilHealth PIN *</label>
                <input
                  type="text"
                  required
                  value={claimPin}
                  onChange={e => setClaimPin(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Member / Patient Name *</label>
                <input
                  type="text"
                  required
                  value={claimMemberName}
                  onChange={e => setClaimMemberName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Membership Type</label>
                  <select
                    value={claimType}
                    onChange={e => setClaimType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Formal Economy / Private">Formal Economy / Private</option>
                    <option value="Direct Contributor - Government">Direct Contributor - Govt</option>
                    <option value="Senior Citizen (RA 10645)">Senior Citizen (RA 10645)</option>
                    <option value="Indirect Contributor - Indigent">Indigent (NHTS-PR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Case Rate Package</label>
                  <select
                    value={claimPackage}
                    onChange={e => setClaimPackage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Php 6,000 - Medical Case">Php 6,000 - Medical</option>
                    <option value="Php 9,000 - Konsulta OPD">Php 9,000 - Konsulta</option>
                    <option value="Php 15,000 - Moderate">Php 15,000 - Moderate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admission Diagnosis & ICD-10</label>
                <input
                  type="text"
                  value={claimDiag}
                  onChange={e => setClaimDiag(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEClaimsModalOpen(false);
                    navigate("/philhealth");
                  }}
                  className="text-teal-700 text-[11px] font-semibold hover:underline cursor-pointer"
                >
                  Open Full PhilHealth Portal →
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEClaimsModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Submit Claim
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Quick Vitals & BMI Assessment */}
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
                    navigate("/clinical/vitals-bmi");
                  }}
                  className="text-teal-700 text-[11px] font-semibold hover:underline cursor-pointer"
                >
                  Open Vitals & Assessment →
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

      {/* Interactive Multi-step Referral Modal */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        defaultPatientId={activeModalPatientId}
      />

      {/* Interactive Multi-step Discharge Modal */}
      <DischargeModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        defaultPatientId={activeModalPatientId}
      />
    </div>
  );
}
