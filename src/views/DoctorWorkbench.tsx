import { useState } from "react";
import { User, Patient, HealthRecord, DiagnosticResult, MedicationOrder, LabTestItem } from "../types";
import BackButton from "../components/BackButton";
import {
  FilePlus,
  Pill,
  Users,
  ClipboardList,
  FlaskConical,
  Lock,
  Check,
  X,
  Activity,
  FileText,
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

  // New Clinical Note Form State (SOAP)
  const [visitType, setVisitType] = useState<HealthRecord["type"]>("OPD Visit");
  const [diagnosis, setDiagnosis] = useState("");
  const [icd10, setIcd10] = useState("I10");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [bp, setBp] = useState("130/85 mmHg");
  const [hr, setHr] = useState("78 bpm");
  const [temp, setTemp] = useState("36.7°C");
  const [wt, setWt] = useState("68 kg");
  const [spo2, setSpo2] = useState("99%");

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
  const [orderSummary, setOrderSummary] = useState("Normal differential count. No acute abnormalities.");

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleCreateEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    const newRecord: HealthRecord = {
      id: `EHR-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      type: visitType,
      doctor: user.name,
      diagnosis: diagnosis,
      icd10Code: icd10,
      subjective: subjective || "Patient evaluated during clinical consultation.",
      objective: objective || "Physical examination unremarkable.",
      assessment: assessment || diagnosis,
      plan: plan || "Treatment plan initiated as prescribed.",
      notes: "Clinical consultation documented and verified.",
      internalClinicianNotes: internalNotes || "CONFIDENTIAL: Standard clinical supervision applied.",
      vitals: { bp, hr, temp, wt, spo2, rr: "16 cpm" },
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
      status: "Active",
      refillable: true,
      refillStatus: "Not Requested",
      notes: medNotes || "Take with food.",
    };

    onAddMedication(newMed);
    setNotification(`Prescription for ${newMed.name} issued to ${selectedPatient.name}!`);
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
      { name: "Clinical Index 2", value: "Within Range", ref: "Negative", flag: null },
    ];

    const newLab: DiagnosticResult = {
      id: `LAB-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      test: orderTestName,
      category: orderCategory,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Ready",
      specimenType: orderSpecimen,
      orderingPhysician: user.name,
      releasedBy: "Dr. Jose Reyes / Lab Staff",
      summary: orderSummary,
      items: items,
    };

    onAddLabResult(newLab);
    setNotification(`Diagnostic test order '${orderTestName}' issued for ${selectedPatient.name}!`);
    setActiveTab("diagnostics");
    setTimeout(() => setNotification(null), 5000);
  };

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
                <span className="text-xs text-slate-300">Staff ID: <strong>{user.id}</strong></span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1">
                {user.title} · {user.department}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <span>Prescribe</span>
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
            <Users size={16} strokeWidth={2} className="text-slate-300" />
            <span>Patient Queue ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("charting")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "charting"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ClipboardList size={16} strokeWidth={2} className="text-slate-300" />
            <span>Clinical Charting (SOAP)</span>
          </button>
          <button
            onClick={() => setActiveTab("prescribe")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "prescribe"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Pill size={16} strokeWidth={2} className="text-slate-300" />
            <span>Prescription Pad</span>
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "diagnostics"
                ? "bg-blue-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FlaskConical size={16} strokeWidth={2} className="text-slate-300" />
            <span>Diagnostic Orders & Results ({labResults.length})</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2} className="text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* SUB-VIEW 1: PATIENT QUEUE & ACTIVE CASES */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Patients Table */}
            <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="font-semibold text-base text-[var(--foreground)] flex items-center gap-2">
                    <Users size={20} strokeWidth={2} className="text-slate-500" />
                    <span>Active Clinical Cases & Ward Inpatients</span>
                  </h2>
                  <p className="text-xs text-[var(--muted-foreground)]">Select a patient to review charts or start consultation</p>
                </div>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  {patients.length} Active Patients
                </span>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {patients.map(p => {
                  const isSelected = p.id === selectedPatientId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-50/70 border border-blue-300 shadow-xs"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--foreground)]">{p.name}</span>
                          <span className="text-xs text-slate-500 font-mono">({p.id})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            p.admissionStatus === "Admitted" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {p.admissionStatus}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">
                          {p.age}y/o {p.gender} · Blood: {p.bloodType} · Ward: {p.ward || "OPD"} {p.bed ? `(${p.bed})` : ""}
                        </div>
                        <div className="text-xs text-slate-700 mt-1">
                          <strong>Chief Complaint:</strong> {p.chiefComplaint}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedPatientId(p.id);
                            setActiveTab("charting");
                          }}
                          className="text-xs bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5"
                        >
                          <ClipboardList size={14} strokeWidth={2} />
                          <span>Open SOAP Chart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Selected Patient Card & Full Clinician EHR Preview */}
            <div className="space-y-6">
              <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <div className="border-b border-[var(--border)] pb-3 mb-4">
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Active Patient Selected</div>
                  <h3 className="font-serif text-xl text-[var(--foreground)] mt-0.5">{selectedPatient.name}</h3>
                  <div className="text-xs text-[var(--muted-foreground)]">{selectedPatient.id} · {selectedPatient.gender}, {selectedPatient.age} y/o</div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div><strong>Blood Type:</strong> {selectedPatient.bloodType}</div>
                  <div><strong>Known Allergies:</strong> <span className="text-rose-600 font-bold">{selectedPatient.allergies.join(", ")}</span></div>
                  <div><strong>Ward / Bed:</strong> {selectedPatient.ward || "OPD"} {selectedPatient.bed || ""}</div>
                  <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.phone})</div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab("charting")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5"
                  >
                    <FilePlus size={16} strokeWidth={2} />
                    <span>Create Encounter Note</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("prescribe")}
                    className="w-full border border-[var(--border)] hover:bg-slate-50 text-xs font-medium py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5"
                  >
                    <Pill size={16} strokeWidth={2} className="text-slate-500" />
                    <span>Issue Prescription</span>
                  </button>
                </div>
              </div>

              {/* UNLOCKED INTERNAL CLINICIAN NOTES NOTICE (DPA Item 4) */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
                <Lock size={16} strokeWidth={2} className="text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">DPA 2012 / Full Clinician Privileges</div>
                  <p className="text-blue-800 leading-relaxed mt-0.5">
                    As an authorized attending physician, you have unlocked access to internal deliberative clinical notes that are masked in the patient self-service portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CLINICAL CHARTING (SOAP) */}
      {activeTab === "charting" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          <form onSubmit={handleCreateEncounter} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-5">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                <FileText size={20} strokeWidth={2} className="text-slate-500" />
                <span>Electronic Health Record: Clinical SOAP Encounter</span>
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Standardized clinical charting for patient <strong>{selectedPatient.name}</strong> ({selectedPatient.id})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Selected Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Encounter Type
                </label>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value as any)}
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                >
                  <option value="OPD Visit">OPD Consultation</option>
                  <option value="Inpatient Progress">Inpatient Daily Progress</option>
                  <option value="Emergency Consultation">Emergency Consultation</option>
                  <option value="Specialist Follow-up">Specialist Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  ICD-10 Diagnostic Code
                </label>
                <input
                  type="text"
                  value={icd10}
                  onChange={e => setIcd10(e.target.value)}
                  placeholder="e.g. I10, E78.0, K35.8"
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                Primary Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Essential Hypertension — Stage 1"
                className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs font-semibold"
              />
            </div>

            {/* Vitals Panel */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Activity size={16} strokeWidth={2} className="text-slate-500" />
                <span>Objective Vitals</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Blood Pressure</label>
                  <input value={bp} onChange={e => setBp(e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Heart Rate</label>
                  <input value={hr} onChange={e => setHr(e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Temperature</label>
                  <input value={temp} onChange={e => setTemp(e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Weight</label>
                  <input value={wt} onChange={e => setWt(e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">SpO2</label>
                  <input value={spo2} onChange={e => setSpo2(e.target.value)} className="w-full border rounded p-1.5 bg-white text-xs" />
                </div>
              </div>
            </div>

            {/* SOAP Sections */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Subjective (S) — History of Present Illness & Symptoms
                </label>
                <textarea
                  rows={2}
                  value={subjective}
                  onChange={e => setSubjective(e.target.value)}
                  placeholder="Patient statements, symptom onset, pain scale..."
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Objective (O) — Physical Examination Findings
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="Cardiovascular auscultation, chest exam, abdomen..."
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Assessment (A) — Clinical Impression & Differential
                </label>
                <textarea
                  rows={2}
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  placeholder="Clinical evaluation, disease stage, risk stratification..."
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Plan (P) — Medical Orders & Patient Instructions
                </label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  placeholder="Medication regimen, lifestyle counseling, repeat labs, follow-up..."
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs resize-none"
                />
              </div>

              {/* DPA Item 4: Confidential Internal Doctor-to-Doctor Note */}
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl">
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock size={16} strokeWidth={2} className="text-amber-600" />
                  <span>Internal Clinician Note (DPA 2012 Confidential Deliberation)</span>
                </label>
                <p className="text-[11px] text-amber-800 mb-2">
                  This note is securely encrypted and masked from patient view under RA 10173 Section 12. Only fellow attending physicians and consultants can read this note.
                </p>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Enter private physician impressions, diagnostic hypotheses, or medication compliance concerns..."
                  className="w-full border border-amber-300 rounded-lg p-2.5 text-xs resize-none bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="px-5 py-2.5 border border-[var(--border)] rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                ← Cancel & Return
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm inline-flex items-center gap-1.5"
              >
                <FilePlus size={16} strokeWidth={2} />
                <span>Sign & Save Clinical Encounter</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 3: PRESCRIBE MEDICATION */}
      {activeTab === "prescribe" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          <form onSubmit={handlePrescribe} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-5">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                <Pill size={20} strokeWidth={2} className="text-slate-500" />
                <span>Electronic Prescription Pad</span>
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Issue verified pharmacological orders for <strong>{selectedPatient.name}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Select Patient <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Allergies: {p.allergies.join(", ")})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Medication Generic & Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                  placeholder="e.g. Amlodipine Besylate, Atorvastatin"
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Dosage & Strength <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medDose}
                  onChange={e => setMedDose(e.target.value)}
                  placeholder="e.g. 5 mg, 50 mg, 1 g"
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Route
                </label>
                <select
                  value={medRoute}
                  onChange={e => setMedRoute(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                >
                  <option value="Oral (PO)">Oral (PO)</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={medFreq}
                  onChange={e => setMedFreq(e.target.value)}
                  placeholder="e.g. Once daily, morning"
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  value={medNotes}
                  onChange={e => setMedNotes(e.target.value)}
                  placeholder="e.g. Take with food, avoid alcohol"
                  className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="px-5 py-2.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5"
              >
                <Pill size={16} strokeWidth={2} />
                <span>Sign & Issue Prescription</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 4: DIAGNOSTIC ORDERS & REVIEW */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("queue")} label="Back to Patient Queue" />

          {/* New Diagnostic Order Form */}
          <form onSubmit={handleOrderDiagnostic} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-base text-[var(--foreground)] flex items-center gap-2">
                <FlaskConical size={20} strokeWidth={2} className="text-slate-500" />
                <span>Order New Laboratory / Diagnostic Test</span>
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">Transmit diagnostic order directly to hospital laboratory</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  value={orderTestName}
                  onChange={e => setOrderTestName(e.target.value)}
                  placeholder="e.g. Fasting Blood Sugar, CBC, ECG"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Category</label>
                <select
                  value={orderCategory}
                  onChange={e => setOrderCategory(e.target.value as any)}
                  className="w-full border rounded-lg p-2 text-xs bg-white"
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Clinical Chemistry">Clinical Chemistry</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-lg inline-flex items-center gap-1.5"
              >
                <FlaskConical size={16} strokeWidth={2} />
                <span>Transmit Diagnostic Order</span>
              </button>
            </div>
          </form>

          {/* Diagnostic Results History */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-base text-[var(--foreground)] mb-4">Released Diagnostic Results</h3>
            <div className="space-y-4">
              {labResults.map(l => (
                <div key={l.id} className="border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--foreground)]">{l.test}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {l.status}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Patient: <strong>{l.patientName}</strong> · Date: {l.date} · Specimen: {l.specimenType}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">ID: {l.id}</span>
                  </div>

                  <div className="overflow-x-auto my-2">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-1.5">Parameter</th>
                          <th className="px-3 py-1.5">Value</th>
                          <th className="px-3 py-1.5">Reference</th>
                          <th className="px-3 py-1.5 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {l.items.map(item => (
                          <tr key={item.name}>
                            <td className="px-3 py-1.5 font-medium">{item.name}</td>
                            <td className={`px-3 py-1.5 font-bold ${item.flag ? "text-rose-600" : ""}`}>{item.value}</td>
                            <td className="px-3 py-1.5 text-slate-500">{item.ref}</td>
                            <td className="px-3 py-1.5 text-right">
                              {item.flag ? <span className="text-rose-600 font-bold">HIGH</span> : <span className="text-emerald-600">NORMAL</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded text-xs flex items-start gap-1.5 text-slate-600">
                    <FileText size={14} strokeWidth={2} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>Pathologist Summary: {l.summary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
