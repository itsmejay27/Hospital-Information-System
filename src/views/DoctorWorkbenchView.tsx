import React, { useState } from "react";
import {
  User,
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
} from "../types";
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
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || "P-2024-001"
  );
  const [notification, setNotification] = useState<string | null>(null);

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

  // e-Prescription Quick Order State
  const [rxMedName, setRxMedName] = useState("");
  const [rxDose, setRxDose] = useState("");
  const [rxRoute, setRxRoute] = useState("Oral (PO)");
  const [rxFreq, setRxFreq] = useState("Once daily (OD) in morning");
  const [rxNotes, setRxNotes] = useState("Take with or without food. Maintain hydration.");

  // Lab Quick Order State
  const [labOrderName, setLabOrderName] = useState("12-Lead Electrocardiogram (ECG)");
  const [labCategory, setLabCategory] = useState<DiagnosticResult["category"]>("Cardiology");
  const [labSpecimen, setLabSpecimen] = useState("Surface Electrode Tracing");
  const [labIndication, setLabIndication] = useState("Baseline cardiac evaluation for stage 1 hypertension");

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

  // Submit Prescription
  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxMedName.trim() || !rxDose.trim()) return;

    const newMed: MedicationOrder = {
      id: `RX-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      name: rxMedName,
      dose: rxDose,
      route: rxRoute,
      freq: rxFreq,
      start: new Date().toISOString().split("T")[0],
      prescribedBy: user.name,
      prescribedByLicense: user.licenseNumber || "PRC Lic. #0084721",
      status: "Active",
      refillable: true,
      notes: rxNotes,
    };

    onAddMedication(newMed);
    setRxMedName("");
    setRxDose("");
    notify(`e-Prescription for ${rxMedName} successfully transmitted for ${selectedPatient.name}.`);
  };

  // Submit Lab Order
  const handleOrderLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labOrderName.trim()) return;

    const newLab: DiagnosticResult = {
      id: `LAB-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      test: labOrderName,
      category: labCategory,
      date: new Date().toISOString().split("T")[0],
      status: "In-Progress",
      specimenType: labSpecimen,
      orderingPhysician: user.name,
      orderingPhysicianLicense: user.licenseNumber || "PRC-MD-001",
      releasedBy: "OPD Central Pathology & Diagnostic Center",
      summary: labIndication,
      items: [
        {
          name: labOrderName,
          value: "Processing Analysis",
          ref: "Standard Laboratory Protocol",
          flag: null,
          unit: "Ref Range",
        },
      ],
    };

    onAddLabResult(newLab);
    notify(`Diagnostic order for "${labOrderName}" successfully dispatched to laboratory queue.`);
  };

  // Filtered lists for selected patient
  const patientRecords = records.filter(r => r.patientId === selectedPatient.id);
  const patientMeds = medications.filter(m => m.patientId === selectedPatient.id && m.status === "Active");
  const patientLabs = labResults.filter(l => l.patientId === selectedPatient.id);

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

      {/* Header & Attending Doctor Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Clinical Care • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/clinical/doctor-workbench</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope size={24} className="text-teal-600" />
            <span>Doctor Workbench & Clinical Encounters</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attending Clinician: <span className="font-semibold text-slate-800">{user.name}</span> •{" "}
            <span className="font-mono text-slate-600">{user.licenseNumber || "PRC Physician"}</span> ({user.department})
          </p>
        </div>

        {/* Patient Switcher Dropdown */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <UserIcon size={16} className="text-slate-500 shrink-0" />
          <div className="text-left">
            <label htmlFor="patient-select" className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
              Active Patient:
            </label>
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) — {p.triageTier.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Patient Demographics Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 font-bold flex items-center justify-center text-lg shrink-0">
              {selectedPatient.name
                .split(" ")
                .map(n => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{selectedPatient.name}</h2>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {selectedPatient.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedPatient.triageTier === "critical"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : selectedPatient.triageTier === "observation"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {selectedPatient.triageTier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {selectedPatient.age} yrs old • {selectedPatient.gender} • Blood Type:{" "}
                <span className="text-teal-300 font-semibold">{selectedPatient.bloodType}</span> • PhilHealth PIN:{" "}
                <span className="font-mono text-slate-200">{selectedPatient.philhealth?.pin || "Registered"}</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Chief Complaint</span>
            <p className="text-xs font-semibold text-slate-100 mt-1 line-clamp-2">
              "{selectedPatient.chiefComplaint || "General checkup & clinical evaluation"}"
            </p>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Known Allergies</span>
            <p className="text-xs font-semibold text-rose-300 mt-1">
              {selectedPatient.allergies?.join(", ") || "No known drug allergies (NKDA)"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Clinical Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SOAP Clinical Encounter Workspace (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveSoapRecord} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

        {/* Right Column: Direct Clinical Order Action Panels (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick e-Prescription (Rx) Order Form */}
          <form onSubmit={handleAddPrescription} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Pill size={18} className="text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Direct e-Prescription (Rx) Order
                </h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                PhilHealth Konsulta
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Medication Generic / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={rxMedName}
                  onChange={e => setRxMedName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="e.g. Amlodipine Besylate"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Dosage & Strength <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rxDose}
                    onChange={e => setRxDose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    placeholder="e.g. 5mg Tablet"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Route
                  </label>
                  <select
                    value={rxRoute}
                    onChange={e => setRxRoute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Oral (PO)">Oral (PO)</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Sublingual (SL)">Sublingual (SL)</option>
                    <option value="Inhalation">Inhalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Frequency / Sig
                </label>
                <input
                  type="text"
                  value={rxFreq}
                  onChange={e => setRxFreq(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  placeholder="e.g. Once daily in the morning"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Patient Instructions & Dispensing Notes
                </label>
                <input
                  type="text"
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  placeholder="e.g. Take after meal, maintain hydration"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Issue & Sign e-Prescription</span>
              </button>
            </div>

            {/* Active Meds Summary */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Active Regimens ({patientMeds.length})
              </span>
              {patientMeds.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active medications currently ordered.</p>
              ) : (
                <div className="space-y-1.5">
                  {patientMeds.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>{" "}
                        <span className="text-slate-500 font-mono">({m.dose})</span>
                        <div className="text-[10px] text-slate-500">{m.freq}</div>
                      </div>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Quick Diagnostic / Lab Order Form */}
          <form onSubmit={handleOrderLab} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Diagnostic & Pathology Request
                </h3>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Central Lab Dispatch
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Test / Diagnostic Procedure <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={labOrderName}
                  onChange={e => setLabOrderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
                  placeholder="e.g. 12-Lead ECG, Complete Blood Count"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Category
                  </label>
                  <select
                    value={labCategory}
                    onChange={e => setLabCategory(e.target.value as DiagnosticResult["category"])}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Clinical Chemistry">Clinical Chemistry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Specimen / Method
                  </label>
                  <input
                    type="text"
                    value={labSpecimen}
                    onChange={e => setLabSpecimen(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                    placeholder="e.g. Venous Blood"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Clinical Indication / Reason
                </label>
                <input
                  type="text"
                  value={labIndication}
                  onChange={e => setLabIndication(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  placeholder="e.g. Screen for hypertensive end-organ damage"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Transmit Diagnostic Order</span>
              </button>
            </div>

            {/* Diagnostic Results Summary */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Recent Diagnostic Orders ({patientLabs.length})
              </span>
              {patientLabs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No laboratory tests on record for this patient.</p>
              ) : (
                <div className="space-y-1.5">
                  {patientLabs.slice(0, 3).map(l => (
                    <div key={l.id} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{l.test}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.date} • {l.category}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === "Ready" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
