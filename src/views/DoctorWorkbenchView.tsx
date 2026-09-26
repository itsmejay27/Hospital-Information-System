import React, { useState } from "react";
import PatientInfoBar from "../components/PatientInfoBar";
import {
  User,
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  PhilHealthClaim,
} from "../types";
import { useOpdData } from "../context/OpdDataContext";
import { ICD10_CATALOG } from "../mockData";
import {
  Stethoscope,
  FileText,
  FlaskConical,
  Pill,
  User as UserIcon,
  Search,
  Plus,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  Activity,
  CreditCard,
  ChevronRight,
  History,
} from "../components/Icons";
import PrescriptionModal from "../components/PrescriptionModal";
import LabOrderModal from "../components/LabOrderModal";
import EClaimModal from "../components/EClaimModal";
import PatientHistoryTimeline from "../components/PatientHistoryTimeline";

interface Props {
  user: User;
  patients: Patient[];
  records: HealthRecord[];
  onAddRecord: (record: HealthRecord) => void;
  labResults: DiagnosticResult[];
  onAddLabResult: (result: DiagnosticResult) => void;
  medications: MedicationOrder[];
  onAddMedication: (med: MedicationOrder) => void;
  initialPatientId?: string;
  onSignOut?: () => void;
}

export default function DoctorWorkbenchView({
  user,
  patients,
  records,
  onAddRecord,
  labResults,
  onAddLabResult,
  medications,
  onAddMedication,
  initialPatientId,
}: Props) {
  const { claims = [], addClaim: contextAddClaim } = useOpdData();
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || "P-2024-001"
  );
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Pop-up States for De-cluttered Clinical Actions
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);

  const selectedPatient =
    patients.find(p => p.id === selectedPatientId) || patients[0] || {
      id: "P-2024-001",
      name: "Patient",
      age: 35,
      gender: "Female",
      triageTier: "stable",
      bloodType: "O+",
      chiefComplaint: "General Outpatient Checkup",
      admissionStatus: "Outpatient",
      registeredAt: "2026-03-01",
    };

  // SOAP State
  const [visitType, setVisitType] = useState<HealthRecord["type"]>("OPD Visit");
  const [diagnosis, setDiagnosis] = useState("Essential Hypertension Stage 1");
  const [icd10Code, setIcd10Code] = useState("I10");
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState("White coat hypertension, Renovascular disease");
  const [subjective, setSubjective] = useState(
    "Patient reports recurring dull headaches in occipital region over past 2 weeks, exacerbated during stressful work hours. Denies chest pain, palpitations, or visual changes."
  );
  const [objective, setObjective] = useState(
    "Alert, oriented x 3, in no acute respiratory distress. S1/S2 distinct, regular rhythm, no murmurs. Lungs clear to auscultation bilaterally. Abdomen soft, non-tender, no organomegaly. Extremities warm with no peripheral edema."
  );
  const [assessment, setAssessment] = useState(
    "1. Essential (primary) hypertension, Stage 1 - uncomplicated\n2. Tension-type occipital headaches secondary to elevated BP"
  );
  const [plan, setPlan] = useState(
    "1. Start Amlodipine 5mg OD orally every morning\n2. Low sodium DASH diet (<2g NaCl/day), 30 mins moderate daily aerobic exercise\n3. Home BP monitoring log twice daily (AM/PM)\n4. Follow-up consultation in 2 weeks with repeat BP log"
  );
  const [internalNotes, setInternalNotes] = useState(
    "Patient is motivated and compliant. PhilHealth Konsulta package covers generic anti-hypertensive medications."
  );

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  // Submit SOAP Note
  const handleSaveSoapRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: HealthRecord = {
      id: `REC-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      date: new Date().toISOString().split("T")[0],
      type: visitType,
      doctor: user.name,
      doctorLicense: user.licenseNumber || "PRC-MD-AUTH",
      diagnosis: diagnosis,
      icd10Code: icd10Code,
      differentialDiagnosis: differentialDiagnosis.split(",").map(d => d.trim()),
      subjective: subjective,
      objective: objective,
      assessment: assessment,
      plan: plan,
      notes: assessment,
      internalClinicianNotes: internalNotes,
      vitals: {
        bp: "128/82 mmHg",
        hr: "76 bpm",
        temp: "36.8 °C",
        wt: "68.5 kg",
        spo2: "99%",
        rr: "18 cpm",
      },
    };

    onAddRecord(newRecord);
    notify(`SOAP Clinical Encounter note officially signed and archived for ${selectedPatient.name}.`);
  };

  // Filtered lists for selected patient
  const patientRecords = records.filter(r => r.patientId === selectedPatient.id);
  const patientMeds = medications.filter(m => m.patientId === selectedPatient.id && m.status === "Active");
  const patientLabs = labResults.filter(l => l.patientId === selectedPatient.id);
  const patientClaims = claims.filter(c => c.patientId === selectedPatient.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-teal-900 text-teal-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-teal-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header & Attending Doctor Strip (Emerald Hospital Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Doctor Workbench & Encounters</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Attending: <span className="font-semibold text-slate-800">{user.name}</span>
              <span className="font-mono"> • {user.licenseNumber || "PRC Verified"}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label htmlFor="patient-select" className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Active Consultation
          </label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-emerald-500 outline-hidden cursor-pointer"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.triageTier.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Patient Demographics Strip */}
      <PatientInfoBar
        patient={selectedPatient}
        actions={
          <button
            type="button"
            onClick={() => setShowHistoryTimeline(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
          >
            <History size={14} />
            <span>View Patient History</span>
          </button>
        }
      />

      {/* Prominent Clinical Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rapid Clinical Actions
          </span>
          <p className="text-xs text-slate-600 font-medium">
            Launch focused clinical dialogs without leaving the patient's encounter
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowHistoryTimeline(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            <History size={15} strokeWidth={2.5} />
            <span>Full History</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRxModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            <Pill size={15} strokeWidth={2.5} />
            <span>+ e-Prescription</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLabModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            <FlaskConical size={15} strokeWidth={2.5} />
            <span>+ Diagnostic Lab</span>
          </button>
          <button
            type="button"
            onClick={() => setIsClaimModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            <CreditCard size={15} strokeWidth={2.5} />
            <span>+ PhilHealth eClaim</span>
          </button>
        </div>
      </div>

      {/* Main Clinical Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: SOAP Clinical Encounter Workspace (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={handleSaveSoapRecord} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Clinical Consultation & SOAP Notes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Encounter Type:</label>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value as HealthRecord["type"])}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-700"
                >
                  <option value="OPD Visit">OPD Visit</option>
                  <option value="Inpatient Progress">Inpatient Progress</option>
                  <option value="Emergency Consultation">Emergency Consultation</option>
                  <option value="Specialist Follow-up">Specialist Follow-up</option>
                </select>
              </div>
            </div>

            {/* Diagnosis & ICD-10 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Primary Working Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  placeholder="e.g. Essential Hypertension Stage 1"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  ICD-10 Code
                </label>
                <select
                  value={icd10Code}
                  onChange={e => {
                    setIcd10Code(e.target.value);
                    const matched = ICD10_CATALOG.find(c => c.code === e.target.value);
                    if (matched) setDiagnosis(matched.name);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                >
                  {ICD10_CATALOG.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Differential Diagnosis */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Differential Diagnosis
              </label>
              <input
                type="text"
                value={differentialDiagnosis}
                onChange={e => setDifferentialDiagnosis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                placeholder="Separate with commas..."
              />
            </div>

            {/* S - Subjective */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                    S
                  </span>
                  <span>Subjective (Patient Narrative, Symptoms & HPI)</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={subjective}
                onChange={e => setSubjective(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="Patient history of present illness..."
                required
              />
            </div>

            {/* O - Objective */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                    O
                  </span>
                  <span>Objective (Physical Exam, Systemic Findings & Vitals)</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={objective}
                onChange={e => setObjective(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="Physical examination notes..."
                required
              />
            </div>

            {/* A - Assessment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                    A
                  </span>
                  <span>Assessment (Clinical Impression & Severity Grading)</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={assessment}
                onChange={e => setAssessment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="Clinical assessment..."
                required
              />
            </div>

            {/* P - Plan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                    P
                  </span>
                  <span>Plan (Treatment, Medications, Diet, Monitoring & Follow-up)</span>
                </label>
              </div>
              <textarea
                rows={3}
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="Actionable care plan..."
                required
              />
            </div>

            {/* Clinician Internal Notes */}
            <div>
              <label className="text-[11px] font-bold uppercase text-amber-700 flex items-center gap-1 mb-1">
                <ShieldCheck size={14} className="text-amber-600" />
                <span>Confidential Internal Clinician Notes (Privileged Record)</span>
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                className="w-full bg-amber-50/60 border border-amber-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-hidden"
                placeholder="Private clinical thoughts or insurance compliance details..."
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Timestamp: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • PRC Certified
              </span>
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Save & Sign SOAP Encounter</span>
              </button>
            </div>
          </form>

          {/* Consultation History for this Patient */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock size={16} className="text-slate-500" />
              <span>Prior Consultation Encounters for {selectedPatient.name} ({patientRecords.length})</span>
            </h3>

            {patientRecords.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">No prior consultation records recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {patientRecords.map(rec => (
                  <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rec.diagnosis}</span>
                      <span className="text-[10px] font-mono text-slate-500">{rec.date} • {rec.type}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{rec.assessment}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>Attending: {rec.doctor}</span>
                      {rec.icd10Code && <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">{rec.icd10Code}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: De-cluttered Clinical Overview & Modals Triggers (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Card 1: Active Regimens & e-Prescriptions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Active Medications ({patientMeds.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>+ New Rx</span>
              </button>
            </div>

            {patientMeds.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No active medications prescribed for {selectedPatient.name}.</p>
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Issue e-Prescription</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Medication</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Route / Frequency</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientMeds.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 align-top">
                      <td className="px-2 py-2">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-indigo-700 font-mono font-semibold">{m.dose}</div>
                        {m.notes && <div className="text-[10px] text-slate-500 mt-0.5">{m.notes}</div>}
                      </td>
                      <td className="px-2 py-2 text-slate-600">
                        {m.route}
                        <div>{m.freq}</div>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Card 2: Diagnostic Laboratory Orders & Results */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Diagnostic Orders ({patientLabs.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLabModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200 transition-colors cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>+ Order Lab</span>
              </button>
            </div>

            {patientLabs.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No laboratory or imaging orders recorded for this patient.</p>
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(true)}
                  className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Order Diagnostic Test</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Test</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Category / Specimen</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientLabs.map(l => (
                    <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-amber-50/40 align-top">
                      <td className="px-2 py-2">
                        <div className="font-bold text-slate-900">{l.test}</div>
                        {l.summary && <div className="text-[10px] text-slate-500 mt-0.5">{l.summary}</div>}
                      </td>
                      <td className="px-2 py-2 text-slate-600 font-mono text-[10px]">
                        {l.category}
                        <div>{l.specimenType}</div>
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            l.status === "Ready" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Card 3: PhilHealth eClaims & Coverage */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  PhilHealth eClaims ({patientClaims.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>+ File eClaim</span>
              </button>
            </div>

            {patientClaims.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No eClaims filed yet for this patient encounter.</p>
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Transmit CF2 eClaim</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Diagnosis / PIN</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Benefit</th>
                    <th className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientClaims.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-emerald-50/40 align-top">
                      <td className="px-2 py-2">
                        <div className="font-bold text-slate-900">{c.diagnosisWithIcd}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          PIN: {c.pin} • {c.membershipType}
                        </div>
                        <div className="text-[10px] text-slate-500">{c.caseRateAmount}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                        ₱{c.philhealthBenefit.toLocaleString()}
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                          {c.claimStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlays for De-cluttered Clinical Care */}
      <PrescriptionModal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        patient={selectedPatient}
        doctorUser={user}
        onAddMedication={(newMed) => {
          onAddMedication(newMed);
          notify(`e-Prescription for ${newMed.name} successfully issued.`);
        }}
      />

      <LabOrderModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        patient={selectedPatient}
        doctorUser={user}
        onAddLabResult={(newLab) => {
          onAddLabResult(newLab);
          notify(`Diagnostic order for "${newLab.test}" dispatched to laboratory queue.`);
        }}
      />

      <EClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        patient={selectedPatient}
        doctorUser={user}
        onAddClaim={(newClaim) => {
          if (contextAddClaim) {
            contextAddClaim(newClaim);
          }
          notify(`PhilHealth eClaim for ${newClaim.memberName} officially transmitted.`);
        }}
      />

      {showHistoryTimeline && (
        <PatientHistoryTimeline
          patient={selectedPatient}
          records={records}
          medications={medications}
          labResults={labResults}
          onClose={() => setShowHistoryTimeline(false)}
        />
      )}
    </div>
  );
}
