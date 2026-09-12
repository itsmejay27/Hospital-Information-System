import { useState } from "react";
import { User, Patient, MedicationOrder, TreatmentLog, AdmissionEntry } from "../types";
import BackButton from "../components/BackButton";
import {
  Syringe,
  Stethoscope,
  Pill,
  Bed,
  ClipboardList,
  Plus,
  Clock,
  Check,
  X,
  Activity,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  medications: MedicationOrder[];
  onAdministerMedication: (medId: string, nurseName: string) => void;
  treatments: TreatmentLog[];
  onAddTreatment: (treatment: TreatmentLog) => void;
  admissions: AdmissionEntry[];
  onSignOut: () => void;
}

type NurseTab = "mar" | "beds" | "treatments" | "vitals";

export default function NurseStation({
  user,
  patients,
  medications,
  onAdministerMedication,
  treatments,
  onAddTreatment,
  admissions,
}: Props) {
  const [activeTab, setActiveTab] = useState<NurseTab>("mar");
  const [notification, setNotification] = useState<string | null>(null);

  // Treatment Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "P-2024-001");
  const [procedureName, setProcedureName] = useState("Peripheral IV Site Assessment & Flush");
  const [category, setCategory] = useState<TreatmentLog["category"]>("IV Therapy");
  const [vitalsString, setVitalsString] = useState("BP 124/80 mmHg, HR 74 bpm, SpO2 99%");
  const [notes, setNotes] = useState("Aseptic protocol maintained, no redness or infiltration.");

  const handleRecordTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === selectedPatientId) || patients[0];

    const newTrt: TreatmentLog = {
      id: `TRT-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: patientObj.name,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      treatmentName: procedureName,
      category: category,
      performedBy: user.name,
      role: "Senior Charge Nurse",
      vitalsAtTreatment: vitalsString,
      notes: notes,
    };

    onAddTreatment(newTrt);
    setNotification(`Treatment '${procedureName}' recorded for ${patientObj.name}!`);
    setProcedureName("");
    setNotes("");
    setActiveTab("treatments");
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Nurse Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Nursing Station & Ward Administration
                </span>
                <span className="text-xs text-slate-300">License: <strong>{user.id}</strong></span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1">
                {user.title} · {user.department}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("mar")}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Syringe size={16} strokeWidth={2} />
              <span>Open MAR Record</span>
            </button>
            <button
              onClick={() => setActiveTab("vitals")}
              className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Stethoscope size={16} strokeWidth={2} />
              <span>Record Treatment</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("mar")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "mar"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Pill size={16} strokeWidth={2} className="text-slate-300" />
            <span>Medication Administration Record (MAR)</span>
          </button>
          <button
            onClick={() => setActiveTab("beds")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "beds"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Bed size={16} strokeWidth={2} className="text-slate-300" />
            <span>Ward Bed Management ({admissions.filter(a => a.status === "Admitted").length} Occupied)</span>
          </button>
          <button
            onClick={() => setActiveTab("treatments")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "treatments"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ClipboardList size={16} strokeWidth={2} className="text-slate-300" />
            <span>Bedside Treatment Logs ({treatments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("vitals")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "vitals"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Plus size={16} strokeWidth={2} className="text-slate-300" />
            <span>Log Vitals / Treatment</span>
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

      {/* SUB-VIEW 1: MAR */}
      {activeTab === "mar" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Pill size={20} strokeWidth={2} className="text-slate-500" />
                  <span>Scheduled Medication Administration Record (MAR)</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Verify patient identity (two-patient identifiers) prior to administering doses. Click "Mark as Administered" to record nurse execution.
                </p>
              </div>
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-semibold">
                Shift: Morning (07:00 – 15:00)
              </span>
            </div>

            <div className="space-y-4">
              {medications.map(m => (
                <div key={m.id} className="border border-[var(--border)] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-purple-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-base text-[var(--foreground)]">{m.name}</h3>
                      <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                        {m.dose}
                      </span>
                      <span className="text-xs text-slate-600">Route: <strong>{m.route}</strong></span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Patient: <strong>{m.patientName}</strong>
                      </span>
                    </div>

                    <div className="text-xs text-[var(--muted-foreground)]">
                      Schedule: <strong>{m.freq}</strong> · Prescribed by {m.prescribedBy}
                    </div>

                    {m.lastAdministered ? (
                      <div className="text-xs text-purple-700 font-semibold mt-2 flex items-center gap-1.5">
                        <Clock size={14} strokeWidth={2} className="text-purple-600" />
                        <span>Last administered: {m.lastAdministered} by {m.administeredBy || user.name}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 font-medium mt-2 flex items-center gap-1.5">
                        <Clock size={14} strokeWidth={2} className="text-amber-500" />
                        <span>Dose due for administration on this shift</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onAdministerMedication(m.id, user.name);
                      setNotification(`Recorded administration of ${m.name} to ${m.patientName}!`);
                      setTimeout(() => setNotification(null), 5000);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 self-end md:self-center flex-shrink-0"
                  >
                    <Check size={16} strokeWidth={2} />
                    <span>Mark as Administered</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: WARD BED MANAGEMENT */}
      {activeTab === "beds" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg text-[var(--foreground)] mb-1 flex items-center gap-2">
              <Bed size={20} strokeWidth={2} className="text-slate-500" />
              <span>Inpatient Ward Bed Allocation & Patient Status</span>
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Bedside monitoring, nursing shift handover, and inpatient room occupancy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map(p => (
                <div key={p.id} className="border border-[var(--border)] rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-700 inline-flex items-center gap-1.5">
                      <Bed size={16} strokeWidth={2} className="text-slate-500" />
                      <span>{p.bed || "OPD Chair"}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.admissionStatus === "Admitted" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                    }`}>
                      {p.admissionStatus}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-[var(--foreground)]">{p.name}</h3>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {p.id} · {p.age}y/o {p.gender} · Blood: {p.bloodType}
                  </div>
                  <div className="text-xs text-slate-700 mt-2">
                    <strong>Ward:</strong> {p.ward || "Outpatient Clinic"}
                  </div>
                  <div className="text-xs text-rose-600 mt-1">
                    <strong>Allergies:</strong> {p.allergies.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: BEDSIDE TREATMENTS LOG */}
      {activeTab === "treatments" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <ClipboardList size={20} strokeWidth={2} className="text-slate-500" />
                  <span>Bedside Nursing Execution & Treatment Log</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Verified record of nursing interventions, IV cannulations, dressings, and respiratory therapy.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("vitals")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Record Treatment</span>
              </button>
            </div>

            <div className="space-y-4">
              {treatments.map(t => (
                <div key={t.id} className="border-l-4 border-purple-600 pl-4 py-2 bg-slate-50 rounded-r-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">{t.treatmentName}</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{t.timestamp}</span>
                  </div>
                  <div className="text-xs text-slate-700 mb-1">
                    Patient: <strong>{t.patientName}</strong> · Performed by: <strong>{t.performedBy}</strong> ({t.role})
                  </div>
                  {t.vitalsAtTreatment && (
                    <div className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1 inline-flex items-center gap-1.5">
                      <Activity size={14} strokeWidth={2} className="text-slate-500" />
                      <span><strong>Observed Vitals:</strong> {t.vitalsAtTreatment}</span>
                    </div>
                  )}
                  {t.notes && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 italic">"{t.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: LOG VITALS & PROCEDURES */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <form onSubmit={handleRecordTreatment} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-5">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                <Syringe size={20} strokeWidth={2} className="text-slate-500" />
                <span>Record Nursing Procedure / Vitals</span>
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Execute bedside documentation with nurse electronic verification
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Patient</label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white"
                >
                  <option value="Bedside Nursing">Bedside Nursing & Routine Vitals</option>
                  <option value="IV Therapy">IV Therapy & Line Insertion</option>
                  <option value="Wound Care">Wound Dressing & Debridement</option>
                  <option value="Respiratory Therapy">Respiratory & Nebulization</option>
                  <option value="Physiotherapy">Physiotherapy & Mobility</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Procedure Title</label>
                <input
                  type="text"
                  required
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  placeholder="e.g. Sterile Foley catheter care, Wound dressing"
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Vitals Measurement</label>
                <input
                  type="text"
                  value={vitalsString}
                  onChange={e => setVitalsString(e.target.value)}
                  placeholder="e.g. BP 120/80 mmHg, HR 72 bpm, SpO2 98%"
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Nursing Notes & Observations</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Patient response, site appearance..."
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab("mar")}
                className="px-5 py-2.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5"
              >
                <ClipboardList size={16} strokeWidth={2} />
                <span>Save Bedside Record</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
