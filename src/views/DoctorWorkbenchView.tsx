import React, { useEffect, useRef, useState } from "react";
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
import { ICD10_COMMON, ICD10_GROUPS, findIcd10 } from "../services/icd10";
import { clearSoapDraft, loadSoapDraft, saveSoapDraft } from "../services/soapDraft";
import { dt } from "../services/time";
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
import { uid, localDate, timestamp } from "../services/ids";

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
  /** View only: consultations, medicines, labs and claims without any way to add or change them. */
  readOnly?: boolean;
}

interface SoapForm {
  /** Set while editing a signed note. */
  editingId?: string;
  visitType: HealthRecord["type"];
  diagnosis: string;
  icd10Code: string;
  differentialDiagnosis: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  internalNotes: string;
}

const BLANK_SOAP: SoapForm = {
  visitType: "OPD Visit",
  diagnosis: "",
  icd10Code: "",
  differentialDiagnosis: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  internalNotes: "",
};

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
  readOnly = false,
}: Props) {
  const { claims = [], addClaim: contextAddClaim, treatments, updateRecord } = useOpdData();
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

  // SOAP form: starts empty (examples are shown as placeholders). Unsaved typing is kept per patient
  // in a draft, so leaving the page or switching patients does not lose it.
  const [form, setForm] = useState<SoapForm>(BLANK_SOAP);
  const [draftRestored, setDraftRestored] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const draft = loadSoapDraft<SoapForm>(user.id, selectedPatientId);
    setForm(draft ? { ...BLANK_SOAP, ...draft } : BLANK_SOAP);
    setDraftRestored(!!draft);
  }, [user.id, selectedPatientId]);
  const update = (patch: Partial<SoapForm>) =>
    setForm(prev => {
      const next = { ...prev, ...patch };
      saveSoapDraft(user.id, selectedPatientId, next);
      return next;
    });
  const field =
    (k: keyof SoapForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update({ [k]: e.target.value } as Partial<SoapForm>);
  const resetForm = () => {
    clearSoapDraft(user.id, selectedPatientId);
    setForm(BLANK_SOAP);
    setDraftRestored(false);
  };
  const hasDraft = JSON.stringify(form) !== JSON.stringify(BLANK_SOAP);
  const editingRecord = form.editingId ? records.find(r => r.id === form.editingId) : undefined;
  const icdKnown = !form.icd10Code || !!findIcd10(form.icd10Code);
  const [icdOther, setIcdOther] = useState(false);
  useEffect(() => setIcdOther(!icdKnown), [icdKnown, selectedPatientId]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  /** Latest vitals recorded for the patient (Vitals & BMI), used in the signed note. */
  const latestVitals = (): HealthRecord["vitals"] => {
    const v = treatments
      .filter(t => t.patientId === selectedPatient.id && t.structuredVitals)
      .sort((x, y) => (y.timestamp || "").localeCompare(x.timestamp || ""))[0]?.structuredVitals;
    if (!v) return { bp: "", hr: "", temp: "", wt: "" };
    return {
      bp: `${v.systolicBp}/${v.diastolicBp} mmHg`,
      hr: `${v.heartRate} bpm`,
      temp: `${v.temperature} °C`,
      wt: v.weightKg ? `${v.weightKg} kg` : "",
      spo2: `${v.spo2}%`,
      rr: `${v.respiratoryRate} cpm`,
      bmi: v.bmi ? String(v.bmi) : undefined,
      bmiCategory: v.bmiCategory,
    };
  };

  // Submit SOAP Note (new note, or changes to a signed one)
  const handleSaveSoapRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      type: form.visitType,
      diagnosis: form.diagnosis.trim(),
      icd10Code: form.icd10Code.trim() || undefined,
      differentialDiagnosis: form.differentialDiagnosis
        .split(",")
        .map(d => d.trim())
        .filter(Boolean),
      subjective: form.subjective.trim(),
      objective: form.objective.trim(),
      assessment: form.assessment.trim(),
      plan: form.plan.trim(),
      notes: form.assessment.trim(),
      internalClinicianNotes: form.internalNotes.trim() || undefined,
    };
    if (editingRecord) {
      updateRecord({
        ...editingRecord,
        ...fields,
        amendedAt: timestamp().slice(0, 16),
        amendedBy: user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name,
      });
      notify(`Changes to the consultation of ${editingRecord.date} saved for ${selectedPatient.name}.`);
    } else {
      onAddRecord({
        id: `REC-2026-${uid()}`,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        date: localDate(),
        doctor: user.name,
        doctorLicense: user.licenseNumber || "PRC-MD-AUTH",
        ...fields,
        vitals: latestVitals(),
      });
      notify(`SOAP Clinical Encounter note officially signed and archived for ${selectedPatient.name}.`);
    }
    resetForm();
  };

  const startEdit = (rec: HealthRecord) => {
    update({
      editingId: rec.id,
      visitType: rec.type,
      diagnosis: rec.diagnosis,
      icd10Code: rec.icd10Code || "",
      differentialDiagnosis: (rec.differentialDiagnosis || []).join(", "),
      subjective: rec.subjective,
      objective: rec.objective,
      assessment: rec.assessment,
      plan: rec.plan,
      internalNotes: rec.internalClinicianNotes || "",
    });
    setDraftRestored(false);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            {readOnly ? (
              <p className="text-xs font-semibold text-amber-800 mt-0.5">View only — only doctors can write consultations, prescriptions, lab orders and claims.</p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">
                Attending: <span className="font-semibold text-slate-800">{user.name}</span>
                <span className="font-mono"> • {user.licenseNumber || "PRC Verified"}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label htmlFor="patient-select" className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {readOnly ? "Patient" : "Active Consultation"}
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
      {!readOnly && (
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
      )}

      {/* Main Clinical Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: SOAP Clinical Encounter Workspace (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {!readOnly && (
          <form ref={formRef} onSubmit={handleSaveSoapRecord} className={`bg-white rounded-2xl border p-6 shadow-xs space-y-5 ${editingRecord ? "border-amber-300" : "border-slate-200/80"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {editingRecord ? "Edit Consultation Note" : "Clinical Consultation & SOAP Notes"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Encounter Type:</label>
                <select
                  value={form.visitType}
                  onChange={field("visitType")}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-700"
                >
                  <option value="OPD Visit">OPD Visit</option>
                  <option value="Inpatient Progress">Inpatient Progress</option>
                  <option value="Emergency Consultation">Emergency Consultation</option>
                  <option value="Specialist Follow-up">Specialist Follow-up</option>
                </select>
              </div>
            </div>

            {editingRecord && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span>
                  Editing the consultation of <b>{editingRecord.date}</b> by {editingRecord.doctor}. Saving keeps a note of who edited it and when.
                </span>
                <button type="button" onClick={resetForm} className="font-bold text-amber-800 hover:underline cursor-pointer">
                  Cancel edit
                </button>
              </div>
            )}
            {!editingRecord && hasDraft && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-900">
                <span>{draftRestored ? "Your unsaved notes for this patient were restored." : "Unsaved notes are kept for this patient if you leave this page."}</span>
                <button type="button" onClick={resetForm} className="font-bold text-sky-800 hover:underline cursor-pointer">
                  Clear form
                </button>
              </div>
            )}

            {/* Diagnosis & ICD-10 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Primary Working Diagnosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.diagnosis}
                  onChange={field("diagnosis")}
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
                  aria-label="ICD-10 code"
                  value={icdOther ? "__other" : form.icd10Code}
                  onChange={e => {
                    const code = e.target.value;
                    if (code === "__other") {
                      setIcdOther(true);
                      return update({ icd10Code: "" });
                    }
                    setIcdOther(false);
                    const entry = findIcd10(code);
                    // Fill the diagnosis only if it is empty or still the previous code's name
                    const prev = findIcd10(form.icd10Code);
                    const fillName = entry && (!form.diagnosis.trim() || form.diagnosis === prev?.name);
                    update({ icd10Code: code, ...(fillName ? { diagnosis: entry.name } : {}) });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                >
                  <option value="">— Select a code —</option>
                  {ICD10_GROUPS.map(group => (
                    <optgroup key={group} label={group}>
                      {ICD10_COMMON.filter(c => c.group === group).map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__other">Other code (type it)…</option>
                </select>
                {icdOther && (
                  <input
                    aria-label="Other ICD-10 code"
                    value={form.icd10Code}
                    onChange={e => update({ icd10Code: e.target.value.toUpperCase() })}
                    placeholder="e.g. K35.8"
                    className="mt-1.5 w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  />
                )}
              </div>
            </div>

            {/* Differential Diagnosis */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Differential Diagnosis
              </label>
              <input
                type="text"
                value={form.differentialDiagnosis}
                onChange={field("differentialDiagnosis")}
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
                value={form.subjective}
                onChange={field("subjective")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="e.g. Recurring dull occipital headaches for 2 weeks, worse when stressed. Denies chest pain, palpitations or visual changes."
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
                value={form.objective}
                onChange={field("objective")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="e.g. Alert, oriented x3, no distress. BP 145/92. S1/S2 regular, no murmurs. Lungs clear."
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
                value={form.assessment}
                onChange={field("assessment")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="e.g. Essential (primary) hypertension, Stage 1, uncomplicated."
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
                value={form.plan}
                onChange={field("plan")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden leading-relaxed"
                placeholder="e.g. Amlodipine 5 mg once daily; low-salt diet; home BP log twice daily; follow up in 2 weeks."
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
                value={form.internalNotes}
                onChange={field("internalNotes")}
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
                <span>{editingRecord ? "Save Changes" : "Save & Sign SOAP Encounter"}</span>
              </button>
            </div>
          </form>
          )}

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
                    {readOnly ? (
                      <div className="grid sm:grid-cols-2 gap-2 pt-1">
                        {(
                          [
                            ["Subjective", rec.subjective],
                            ["Objective", rec.objective],
                            ["Assessment", rec.assessment],
                            ["Plan", rec.plan],
                          ] as const
                        ).map(([k, v]) =>
                          v ? (
                            <div key={k}>
                              <div className="text-[10px] font-bold uppercase text-slate-400">{k}</div>
                              <p className="text-slate-700 whitespace-pre-line">{v}</p>
                            </div>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-600 line-clamp-2">{rec.assessment}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-slate-400">
                      <span>
                        Attending: {rec.doctor}
                        {rec.amendedAt && (
                          <span className="text-amber-700">
                            {" "}
                            • Edited {dt(rec.amendedAt)} by {rec.amendedBy}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {rec.icd10Code && <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">{rec.icd10Code}</span>}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => startEdit(rec)}
                            disabled={form.editingId === rec.id}
                            className="px-2 py-0.5 rounded-md border border-slate-300 bg-white hover:bg-teal-50 hover:text-teal-800 text-slate-600 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-default"
                          >
                            {form.editingId === rec.id ? "Editing…" : "Edit"}
                          </button>
                        )}
                      </span>
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ New Rx</span>
                </button>
              )}
            </div>

            {patientMeds.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No active medications prescribed for {selectedPatient.name}.</p>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsRxModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Issue e-Prescription</span>
                  </button>
                )}
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200 transition-colors cursor-pointer"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ Order Lab</span>
                </button>
              )}
            </div>

            {patientLabs.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No laboratory or imaging orders recorded for this patient.</p>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsLabModalOpen(true)}
                    className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Order Diagnostic Test</span>
                  </button>
                )}
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
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ File eClaim</span>
                </button>
              )}
            </div>

            {patientClaims.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs space-y-2">
                <p className="italic">No eClaims filed yet for this patient encounter.</p>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Transmit CF2 eClaim</span>
                  </button>
                )}
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
