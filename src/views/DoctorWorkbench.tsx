import { useState } from "react";
import {
  User,
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  LabTestItem,
  TriageTier,
} from "../types";
import BackButton from "../components/BackButton";
import {
  FilePlus,
  Pill,
  Users,
  ClipboardList,
  FlaskConical,
  Check,
  X,
  Activity,
  FileText,
  Search,
  Droplets,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  records: HealthRecord[];
  onAddRecord: (record: HealthRecord) => void;
  labResults: DiagnosticResult[];
  onAddLabResult: (result: DiagnosticResult) => void;
  medications: MedicationOrder[];
  onAddMedication: (med: MedicationOrder) => void;
  onSignOut: () => void;
}

type DoctorTab = "queue" | "charting" | "prescribe" | "diagnostics";

export default function DoctorWorkbench({
  user,
  patients,
  records,
  onAddRecord,
  labResults,
  onAddLabResult,
  medications,
  onAddMedication,
}: Props) {
  const [activeTab, setActiveTab] = useState<DoctorTab>("queue");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "P-2024-001");
  const [notification, setNotification] = useState<string | null>(null);
  const [triageFilter, setTriageFilter] = useState<TriageTier | "all">("all");
  const [queueSearch, setQueueSearch] = useState("");

  // Clinical SOAP Note Form State
  const [visitType, setVisitType] = useState<HealthRecord["type"]>("OPD Visit");
  const [diagnosis, setDiagnosis] = useState("");
  const [icd10, setIcd10] = useState("I10");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Separate Numeric Vitals Inputs for Clinical Encounter
  const [systolicBp, setSystolicBp] = useState<number>(130);
  const [diastolicBp, setDiastolicBp] = useState<number>(85);
  const [hr, setHr] = useState<number>(78);
  const [temp, setTemp] = useState<number>(36.7);
  const [wt, setWt] = useState<number>(68);
  const [spo2, setSpo2] = useState<number>(99);
  const [rr, setRr] = useState<number>(16);
  const [fluidIntake, setFluidIntake] = useState<number>(1500);
  const [urineOutput, setUrineOutput] = useState<number>(1300);

  // Prescribe Form State
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medRoute, setMedRoute] = useState("Oral (PO)");
  const [medFreq, setMedFreq] = useState("Once daily, morning");
  const [medNotes, setMedNotes] = useState("");

  // Diagnostic Order Form State
  const [orderTestName, setOrderTestName] = useState("Complete Blood Count (CBC)");
  const [orderCategory, setOrderCategory] = useState<DiagnosticResult["category"]>("Hematology");
  const [orderSpecimen, setOrderSpecimen] = useState("Whole Blood (EDTA)");
  const [orderSummary, setOrderSummary] = useState("Evaluation of complete hematologic parameters.");

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Priority Watch Counts
  const criticalCount = patients.filter(p => p.triageTier === "critical").length;
  const observationCount = patients.filter(p => p.triageTier === "observation").length;
  const stableCount = patients.filter(p => p.triageTier === "stable").length;

  const handleCreateEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    const formattedVitals = {
      bp: `${systolicBp}/${diastolicBp} mmHg`,
      hr: `${hr} bpm`,
      temp: `${temp}°C`,
      wt: `${wt} kg`,
      spo2: `${spo2}%`,
      rr: `${rr} cpm`,
      systolic: systolicBp,
      diastolic: diastolicBp,
      fluidIntakeMl: fluidIntake,
      urineOutputMl: urineOutput,
    };

    const newRecord: HealthRecord = {
      id: `EHR-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      type: visitType,
      doctor: user.name,
      doctorLicense: user.licenseNumber || "PRC Lic. #0084721",
      diagnosis: diagnosis,
      icd10Code: icd10,
      subjective: subjective || "Patient presented for clinical evaluation and monitoring.",
      objective: objective || `Physical exam unremarkable. Vitals: BP ${systolicBp}/${diastolicBp}, HR ${hr}, SpO2 ${spo2}%.`,
      assessment: assessment || diagnosis,
      plan: plan || "Treatment plan initiated and patient advised on follow-up.",
      notes: "Clinical consultation documented, signed, and locked.",
      internalClinicianNotes: internalNotes || "CONFIDENTIAL: Standard clinical supervision applied.",
      vitals: formattedVitals,
    };

    onAddRecord(newRecord);
    setNotification(`Clinical encounter note signed and recorded for ${selectedPatient.name}!`);
    setDiagnosis("");
    setSubjective("");
    setObjective("");
    setAssessment("");
    setPlan("");
    setInternalNotes("");
    setActiveTab("queue");
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePrescribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const newMed: MedicationOrder = {
      id: `MED-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      name: medName,
      dose: medDose || "500 mg",
      route: medRoute,
      freq: medFreq,
      start: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      prescribedBy: user.name,
      prescribedByLicense: user.licenseNumber || "PRC Lic. #0084721",
      status: "Active",
      refillable: true,
      refillStatus: "Not Requested",
      notes: medNotes || "Take with food.",
    };

    onAddMedication(newMed);
    setNotification(`Prescription for ${newMed.name} (${newMed.dose}) issued to ${selectedPatient.name}!`);
    setMedName("");
    setMedDose("");
    setMedNotes("");
    setActiveTab("queue");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOrderDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    const items: LabTestItem[] = [
      { name: "Clinical Index 1", value: "Normal", ref: "Normal", flag: null },
      { name: "Diagnostic Parameter", value: "Pending lab run", ref: "Standard", flag: null },
    ];

    const newLab: DiagnosticResult = {
      id: `LAB-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      test: orderTestName,
      category: orderCategory,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "In-Progress",
      specimenType: orderSpecimen,
      orderingPhysician: user.name,
      orderingPhysicianLicense: user.licenseNumber || "PRC Lic. #0084721",
      releasedBy: "Awaiting Laboratory Analysis",
      summary: orderSummary,
      items: items,
    };

    onAddLabResult(newLab);
    setNotification(`Diagnostic test order '${orderTestName}' issued for ${selectedPatient.name}!`);
    setActiveTab("diagnostics");
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(queueSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (p.chiefComplaint && p.chiefComplaint.toLowerCase().includes(queueSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (triageFilter === "all") return true;
    return p.triageTier === triageFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Physician Clinical Workbench
                </span>
                <span className="text-xs text-slate-300">
                  Doctor ID: <strong className="text-white">{user.id}</strong>
                </span>
                {user.licenseNumber && (
                  <span className="text-xs bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded font-mono font-semibold">
                    {user.licenseNumber}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user.title}</span>
                <span>•</span>
                <span>{user.department}</span>
                {user.credentials && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-300 font-semibold">{user.credentials}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab("charting")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <FilePlus size={16} strokeWidth={2} />
              <span>Create SOAP Encounter</span>
            </button>
            <button
              onClick={() => setActiveTab("prescribe")}
              className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Pill size={16} strokeWidth={2} />
              <span>Prescription Pad</span>
            </button>
          </div>
        </div>

        {/* PRIORITY WATCH SYSTEM (3 STATUS TIERS) */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold uppercase tracking-wider">
              <Activity size={16} strokeWidth={2} className="text-cyan-400" />
              <span>Clinical Priority Watch System (3 Status Tiers)</span>
            </div>
            <div className="text-xs text-slate-300">
              Filter Active Queue by Triage Level:
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setTriageFilter("all")}
              className={`p-3 rounded-xl border text-left transition-all ${
                triageFilter === "all"
                  ? "bg-white/20 border-white text-white shadow-sm ring-1 ring-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">All Patients</div>
              <div className="text-xl font-bold text-white mt-0.5">{patients.length} Active</div>
              <div className="text-[11px] text-slate-300 mt-1">Full clinical cohort</div>
            </button>

            <button
              onClick={() => setTriageFilter("critical")}
              className={`p-3 rounded-xl border text-left transition-all ${
                triageFilter === "critical"
                  ? "bg-rose-950/80 border-rose-400 text-white shadow-sm ring-2 ring-rose-500"
                  : "bg-rose-950/40 border-rose-800/60 text-rose-200 hover:bg-rose-950/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span>Red: Critical Care</span>
                </span>
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tier 1
                </span>
              </div>
              <div className="text-xl font-bold text-white mt-1">{criticalCount} Inpatients</div>
              <div className="text-[11px] text-rose-300 mt-0.5">Urgent attending intervention required</div>
            </button>

            <button
              onClick={() => setTriageFilter("observation")}
              className={`p-3 rounded-xl border text-left transition-all ${
                triageFilter === "observation"
                  ? "bg-amber-950/80 border-amber-400 text-white shadow-sm ring-2 ring-amber-500"
                  : "bg-amber-950/40 border-amber-800/60 text-amber-200 hover:bg-amber-950/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Yellow: Watch / Obs</span>
                </span>
                <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tier 2
                </span>
              </div>
              <div className="text-xl font-bold text-white mt-1">{observationCount} Patients</div>
              <div className="text-[11px] text-amber-300 mt-0.5">Continuous telemetry & lab surveillance</div>
            </button>

            <button
              onClick={() => setTriageFilter("stable")}
              className={`p-3 rounded-xl border text-left transition-all ${
                triageFilter === "stable"
                  ? "bg-emerald-950/80 border-emerald-400 text-white shadow-sm ring-2 ring-emerald-500"
                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-200 hover:bg-emerald-950/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Green: Stable</span>
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tier 3
                </span>
              </div>
              <div className="text-xl font-bold text-white mt-1">{stableCount} Patients</div>
              <div className="text-[11px] text-emerald-300 mt-0.5">Routine clinic consultations & maintenance</div>
            </button>
          </div>
        </div>

        {/* Workbench Navigation Bar */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "queue"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users size={16} strokeWidth={2} />
            <span>Clinical Queue & Patient Profiles ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("charting")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "charting"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ClipboardList size={16} strokeWidth={2} />
            <span>Create EHR Encounter (SOAP)</span>
          </button>
          <button
            onClick={() => setActiveTab("prescribe")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "prescribe"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Pill size={16} strokeWidth={2} />
            <span>Prescription Pad ({medications.length} active)</span>
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "diagnostics"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FlaskConical size={16} strokeWidth={2} />
            <span>Diagnostic Orders & Lab Results</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2} className="text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: PATIENT QUEUE & COMPREHENSIVE CLINICAL PROFILE                */}
      {/* ========================================================================= */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Interactive Patient Roster */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  <Users size={16} strokeWidth={2} className="text-blue-600" />
                  <span>Clinical Patient Roster</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">{filteredPatients.length} Selected</span>
              </div>

              <div className="relative">
                <Search size={14} strokeWidth={2} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, ID, complaint..."
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPatients.map(p => {
                  const isSelected = p.id === selectedPatientId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-400"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        {p.triageTier === "critical" && (
                          <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                            Critical
                          </span>
                        )}
                        {p.triageTier === "observation" && (
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                            Watch
                          </span>
                        )}
                        {p.triageTier === "stable" && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 rounded">
                            Stable
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        {p.id} • {p.age}y/o {p.gender} • {p.ward || "OPD"}
                      </div>
                      <div className="text-[11px] text-slate-700 mt-1 line-clamp-1 italic">
                        "{p.chiefComplaint}"
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Comprehensive Patient Clinical Profile Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Patient Banner with PhilHealth & Triage Details */}
              <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-serif text-2xl text-slate-900">{selectedPatient.name}</h2>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {selectedPatient.id}
                      </span>
                      {selectedPatient.triageTier === "critical" && (
                        <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span>Tier 1: Critical Care</span>
                        </span>
                      )}
                      {selectedPatient.triageTier === "observation" && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Tier 2: Observation Watch
                        </span>
                      )}
                      {selectedPatient.triageTier === "stable" && (
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Tier 3: Stable
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      DOB: {selectedPatient.dob} ({selectedPatient.age}y/o) • {selectedPatient.gender} • Blood: <strong className="text-slate-800">{selectedPatient.bloodType}</strong> • Status: <strong className="text-blue-700">{selectedPatient.admissionStatus}</strong> ({selectedPatient.ward || "OPD Clinic"}, {selectedPatient.bed || "Chair"})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("charting")}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5"
                    >
                      <FilePlus size={14} strokeWidth={2} />
                      <span>Chart Note</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("prescribe")}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Pill size={14} strokeWidth={2} />
                      <span>Rx</span>
                    </button>
                  </div>
                </div>

                {/* PHILHEALTH & INSURANCE DATA CARD */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={16} strokeWidth={2} className="text-emerald-700" />
                      <span>PhilHealth & Insurance Benefit Integration</span>
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedPatient.philhealth?.eligibilityStatus || "Active Member"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">PhilHealth PIN:</span>
                      <strong className="font-mono text-emerald-950 font-bold">
                        {selectedPatient.philhealth?.pin || "12-XXXXXXXXX-X"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Membership Category:</span>
                      <strong className="text-slate-800">
                        {selectedPatient.philhealth?.category || "Direct Contributor"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Benefit Eligibility:</span>
                      <span className="text-emerald-800 font-medium">
                        {selectedPatient.philhealth?.coverageDetails || "All-Case Rate & Primary Care Benefit"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DIGITAL PATIENT CONSENTS & MEDICAL HISTORY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <FileCheck size={14} strokeWidth={2} className="text-blue-600" />
                      <span>Verified Digital Consents</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Treatment & Clinical Care:</span>
                        <strong className="text-emerald-700">Signed & Active</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Health Info Sharing (DPA 2012):</span>
                        <strong className="text-emerald-700">Consent Granted</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Contact & Telehealth Notice:</span>
                        <strong className="text-emerald-700">Authorized</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 mt-1">
                        Witnessed by {selectedPatient.consents?.witnessStaff || "Admissions Officer"} on {selectedPatient.consents?.signedDate || "2026-09-10"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <Activity size={14} strokeWidth={2} className="text-purple-600" />
                      <span>Known Allergies & Triage Reason</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-slate-500 text-[11px]">Allergies: </span>
                        {selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== "None known" ? (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                            {selectedPatient.allergies.join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-600">None reported</span>
                        )}
                      </div>
                      <div className="text-slate-700">
                        <span className="text-slate-500 text-[11px]">Triage Acuity Rationale: </span>
                        <span className="italic">{selectedPatient.triageReason || "Routine consultation"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Medical & Surgical History */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 text-xs mb-4">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <FileText size={14} strokeWidth={2} className="text-slate-600" />
                    <span>Comprehensive Medical History & Chronic Diagnoses</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Past Medical:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.medicalHistory?.pastMedical.join(", ") || "None recorded"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Past Surgeries:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.medicalHistory?.pastSurgical.join(", ") || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Family History:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.medicalHistory?.familyHistory.join(", ") || "Non-contributory"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinical History & EHR Encounters Table */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
                    <ClipboardList size={16} strokeWidth={2} className="text-blue-600" />
                    <span>Patient Encounter History & Clinical Notes</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Date & Type</th>
                          <th className="px-3 py-2.5">Diagnosis & ICD-10</th>
                          <th className="px-3 py-2.5">Attending Physician</th>
                          <th className="px-3 py-2.5">Observed Vitals</th>
                          <th className="px-3 py-2.5">Assessment & Plan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {records
                          .filter(r => r.patientId === selectedPatient.id)
                          .map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div className="font-bold text-slate-900">{r.date}</div>
                                <div className="text-[10px] text-blue-700">{r.type}</div>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-semibold text-slate-900">{r.diagnosis}</div>
                                <div className="text-[10px] font-mono text-slate-500">ICD-10: {r.icd10Code || "—"}</div>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <div>{r.doctor}</div>
                                <div className="text-[10px] font-mono text-slate-500">{r.doctorLicense || "PRC Lic."}</div>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                                <div>BP: {r.vitals.bp} • HR: {r.vitals.hr}</div>
                                <div className="text-[10px] text-slate-500">Temp: {r.vitals.temp} • SpO2: {r.vitals.spo2}</div>
                              </td>
                              <td className="px-3 py-2.5 max-w-xs">
                                <p className="line-clamp-2 text-slate-700">{r.plan}</p>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: CLINICAL ENCOUNTER CHARTING (EXPANDED NUMERICAL VITALS)      */}
      {/* ========================================================================= */}
      {activeTab === "charting" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          <form onSubmit={handleCreateEncounter} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-serif text-2xl text-slate-900 flex items-center gap-2">
                  <FilePlus size={24} strokeWidth={2} className="text-blue-600" />
                  <span>Create Clinical Encounter Record (SOAP Note)</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Electronic Health Record (EHR) entry compliant with clinical quality and legal documentation standards.
                </p>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono">
                Physician: <strong>{user.name}</strong> • {user.licenseNumber || "PRC Lic. #0084721"}
              </div>
            </div>

            {/* Encounter Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.ward || "OPD Clinic"}) [{p.triageTier.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Encounter Classification
                </label>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPD Visit">Outpatient Consultation (OPD)</option>
                  <option value="Inpatient Progress">Inpatient Daily Progress Note</option>
                  <option value="Emergency Consultation">Emergency Trauma Consultation</option>
                  <option value="Specialist Follow-up">Specialist Follow-up (Cardiology)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  ICD-10 Diagnostic Code
                </label>
                <input
                  type="text"
                  required
                  value={icd10}
                  onChange={e => setIcd10(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  placeholder="e.g. I10, K35.80, E78.0"
                />
              </div>
            </div>

            {/* SEPARATE NUMERICAL VITAL INPUTS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2">
                <Activity size={16} strokeWidth={2} className="text-blue-600" />
                <span>Encounter Vital Signs (Dedicated Numerical Fields)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Systolic BP</label>
                  <input
                    type="number"
                    min={40}
                    max={260}
                    value={systolicBp}
                    onChange={e => setSystolicBp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">mmHg</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Diastolic BP</label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    value={diastolicBp}
                    onChange={e => setDiastolicBp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">mmHg</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Heart Rate</label>
                  <input
                    type="number"
                    min={30}
                    max={220}
                    value={hr}
                    onChange={e => setHr(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">bpm</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Resp. Rate</label>
                  <input
                    type="number"
                    min={8}
                    max={60}
                    value={rr}
                    onChange={e => setRr(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">cpm</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">SpO2</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">%</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min={34}
                    max={43}
                    value={temp}
                    onChange={e => setTemp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">°C</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.5"
                    min={2}
                    max={300}
                    value={wt}
                    onChange={e => setWt(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">kg</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fluid Intake</label>
                  <input
                    type="number"
                    step="50"
                    value={fluidIntake}
                    onChange={e => setFluidIntake(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold text-blue-800"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">mL</div>
                </div>
              </div>
            </div>

            {/* Primary Diagnosis */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Primary Clinical Diagnosis
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Essential Hypertension Stage 1, Acute Appendicitis, CHF NYHA II"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium"
              />
            </div>

            {/* SOAP Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">
                  Subjective (S) — Patient History & Symptoms
                </label>
                <textarea
                  rows={3}
                  value={subjective}
                  onChange={e => setSubjective(e.target.value)}
                  placeholder="Patient statements, symptoms duration, compliance with medications..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">
                  Objective (O) — Physical Examination Findings
                </label>
                <textarea
                  rows={3}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="Systemic examination, auscultation, tenderness, telemetry review..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">
                  Assessment (A) — Clinical Impression & Progress
                </label>
                <textarea
                  rows={3}
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  placeholder="Differential diagnoses considered, etiology, risk tier..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">
                  Plan (P) — Diagnostic, Therapeutic & Patient Education
                </label>
                <textarea
                  rows={3}
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  placeholder="Pharmacotherapy orders, dietary guidelines, follow-up date..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>

            {/* Internal Clinician Notes (Confidential) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                <span>Confidential Clinician Notes & Peer Consultation (Internal Only)</span>
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Supervision notes, peer discussion points, confidential compliance notations..."
                className="w-full border border-amber-200 bg-amber-50/40 rounded-lg p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="px-5 py-2.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
              >
                <FileCheck size={16} strokeWidth={2} />
                <span>Sign & Save Encounter</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: PRESCRIPTION PAD                                              */}
      {/* ========================================================================= */}
      {activeTab === "prescribe" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prescription Form */}
            <form onSubmit={handlePrescribe} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-serif text-xl text-slate-900 flex items-center gap-2">
                  <Pill size={20} strokeWidth={2} className="text-blue-600" />
                  <span>Physician Electronic Prescription Pad</span>
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  FDA-compliant e-prescription issued by {user.name} ({user.licenseNumber || "PRC Lic."})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.ward || "OPD"})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Drug Name (Generic / Brand)</label>
                  <input
                    type="text"
                    required
                    value={medName}
                    onChange={e => setMedName(e.target.value)}
                    placeholder="e.g. Amlodipine, Losartan, Ceftriaxone"
                    className="w-full border rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Dosage & Strength</label>
                  <input
                    type="text"
                    required
                    value={medDose}
                    onChange={e => setMedDose(e.target.value)}
                    placeholder="e.g. 5 mg, 500 mg, 1 g"
                    className="w-full border rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Administration Route</label>
                  <select
                    value={medRoute}
                    onChange={e => setMedRoute(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Oral (PO)">Oral (PO)</option>
                    <option value="Intravenous (IVPB)">Intravenous Piggyback (IVPB)</option>
                    <option value="Intravenous (IV Push)">Intravenous Push (IV Push)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Inhalation (Neb)">Inhalation / Nebulization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Frequency Schedule</label>
                  <input
                    type="text"
                    required
                    value={medFreq}
                    onChange={e => setMedFreq(e.target.value)}
                    placeholder="e.g. Once daily, morning; Every 8 hours"
                    className="w-full border rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Dispensing & Clinical Instructions</label>
                <input
                  type="text"
                  value={medNotes}
                  onChange={e => setMedNotes(e.target.value)}
                  placeholder="e.g. Take strictly after food with full glass of water."
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("queue")}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Pill size={16} strokeWidth={2} />
                  <span>Issue & Sign Prescription</span>
                </button>
              </div>
            </form>

            {/* Active Prescriptions Table */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
                <Pill size={16} strokeWidth={2} className="text-purple-600" />
                <span>Active Prescription Registry</span>
              </h3>

              <div className="space-y-3 max-h-[450px] overflow-y-auto">
                {medications.map(m => (
                  <div key={m.id} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50/50">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{m.name} ({m.dose})</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        {m.status}
                      </span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Patient: <strong>{m.patientName}</strong> • {m.route}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Schedule: {m.freq} • Prescribed by {m.prescribedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: DIAGNOSTIC ORDERS & LAB RESULTS                               */}
      {/* ========================================================================= */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Diagnostic Form */}
            <form onSubmit={handleOrderDiagnostic} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-serif text-xl text-slate-900 flex items-center gap-2">
                  <FlaskConical size={20} strokeWidth={2} className="text-blue-600" />
                  <span>Order Diagnostic Test</span>
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Order stat laboratory, clinical pathology, or radiology exams.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.ward || "OPD"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  value={orderTestName}
                  onChange={e => setOrderTestName(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Category</label>
                  <select
                    value={orderCategory}
                    onChange={e => setOrderCategory(e.target.value as any)}
                    className="w-full border rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Clinical Chemistry">Clinical Chemistry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Specimen</label>
                  <input
                    type="text"
                    value={orderSpecimen}
                    onChange={e => setOrderSpecimen(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Clinical Indication / Notes</label>
                <textarea
                  rows={2}
                  value={orderSummary}
                  onChange={e => setOrderSummary(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <FlaskConical size={16} strokeWidth={2} />
                <span>Issue Diagnostic Order</span>
              </button>
            </form>

            {/* Diagnostic Results Table */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm lg:col-span-2">
              <h3 className="font-semibold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <FlaskConical size={18} strokeWidth={2} className="text-blue-600" />
                <span>Laboratory Diagnostic Results & Status Table</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Date & ID</th>
                      <th className="px-3 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">Test & Category</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Summary / Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {labResults.map(lab => (
                      <tr key={lab.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">
                          <div>{lab.date}</div>
                          <div className="text-[10px] text-slate-400">{lab.id}</div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {lab.patientName}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-blue-900">{lab.test}</div>
                          <div className="text-[10px] text-slate-500">{lab.category} • {lab.specimenType}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lab.status === "Ready"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {lab.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <p className="line-clamp-2">{lab.summary}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
