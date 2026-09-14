import { useState } from "react";
import {
  User,
  Patient,
  MedicationOrder,
  TreatmentLog,
  AdmissionEntry,
  ShiftEndorsement,
  VisitorLog,
  TriageTier,
} from "../types";
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
  Droplets,
  AlertTriangle,
  FileCheck,
  History,
  Users,
  Search,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  medications: MedicationOrder[];
  onAdministerMedication: (medId: string, nurseName: string) => void;
  treatments: TreatmentLog[];
  onAddTreatment: (treatment: TreatmentLog) => void;
  admissions: AdmissionEntry[];
  shiftEndorsements: ShiftEndorsement[];
  onAddShiftEndorsement: (endorsement: ShiftEndorsement) => void;
  visitorLogs: VisitorLog[];
  onAddVisitorLog: (visitor: VisitorLog) => void;
  onCheckOutVisitor: (visitorId: string) => void;
  onSignOut: () => void;
}

type NurseTab = "mar" | "beds" | "treatments" | "vitals" | "endorsements" | "visitors";

export default function NurseStation({
  user,
  patients,
  medications,
  onAdministerMedication,
  treatments,
  onAddTreatment,
  admissions,
  shiftEndorsements,
  onAddShiftEndorsement,
  visitorLogs,
  onAddVisitorLog,
  onCheckOutVisitor,
}: Props) {
  const [activeTab, setActiveTab] = useState<NurseTab>("mar");
  const [notification, setNotification] = useState<string | null>(null);
  const [triageFilter, setTriageFilter] = useState<TriageTier | "all">("all");
  const [marSearch, setMarSearch] = useState("");

  // Treatment / Expanded Vitals Form State
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "P-2024-001");
  const [procedureName, setProcedureName] = useState("Bedside Routine Vitals & Fluid Balance Check");
  const [category, setCategory] = useState<TreatmentLog["category"]>("Bedside Nursing");

  // Separate Numeric Vitals State
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(76);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(16);
  const [spo2, setSpo2] = useState<number>(99);
  const [temperature, setTemperature] = useState<number>(36.7);
  const [fluidIntake, setFluidIntake] = useState<number>(500);
  const [urineOutput, setUrineOutput] = useState<number>(450);
  const [exactTimestamp, setExactTimestamp] = useState<string>(
    new Date().toISOString().substring(0, 16)
  );
  const [notes, setNotes] = useState("Patient comfortable. Fluid balance positive, no complaints of distress.");

  // Shift Endorsement Form State
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [incomingNurseName, setIncomingNurseName] = useState("Kristine Ramos, RN");
  const [incomingNurseLicense, setIncomingNurseLicense] = useState("PRC Lic. #0095112");
  const [shiftPeriod, setShiftPeriod] = useState("Morning (07:00–15:00) to Afternoon (15:00–23:00)");
  const [endorsementWard, setEndorsementWard] = useState("Surgical & Medical Inpatient Wards");
  const [situation, setSituation] = useState("");
  const [background, setBackground] = useState("");
  const [assessment, setAssessment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [urgentTaskInput, setUrgentTaskInput] = useState("");

  // Visitor Quick-Log State
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visPatientId, setVisPatientId] = useState(patients[0]?.id || "P-2024-001");
  const [visitorName, setVisitorName] = useState("");
  const [visitorRel, setVisitorRel] = useState("Spouse");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorIdCard, setVisitorIdCard] = useState("National ID");
  const [visitorBadge, setVisitorBadge] = useState(`BADGE-WARD-${Math.floor(10 + Math.random() * 90)}`);

  // Priority Watch Tally
  const criticalCount = patients.filter(p => p.triageTier === "critical").length;
  const observationCount = patients.filter(p => p.triageTier === "observation").length;
  const stableCount = patients.filter(p => p.triageTier === "stable").length;

  const handleRecordTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === selectedPatientId) || patients[0];
    const formattedVitalsString = `BP ${systolicBp}/${diastolicBp} mmHg, HR ${heartRate} bpm, RR ${respiratoryRate} cpm, SpO2 ${spo2}%, Temp ${temperature}°C`;

    const newTrt: TreatmentLog = {
      id: `TRT-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatientId,
      patientName: patientObj.name,
      timestamp: exactTimestamp.replace("T", " "),
      treatmentName: procedureName,
      category: category,
      performedBy: user.name,
      performedByLicense: user.licenseNumber || "PRC Lic. #0093820",
      role: user.title,
      vitalsAtTreatment: formattedVitalsString,
      structuredVitals: {
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        spo2,
        temperature,
        fluidIntakeMl: fluidIntake,
        urineOutputMl: urineOutput,
        recordedAt: exactTimestamp,
        recordedBy: `${user.name} (${user.licenseNumber})`,
      },
      fluidIntakeMl: fluidIntake,
      urineOutputMl: urineOutput,
      notes: notes,
    };

    onAddTreatment(newTrt);
    setNotification(`Treatment & Fluid Balance recorded for ${patientObj.name} at ${exactTimestamp.replace("T", " ")}!`);
    setProcedureName("Bedside Routine Vitals & Fluid Balance Check");
    setNotes("");
    setActiveTab("treatments");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim() || !assessment.trim()) return;

    const newEndorsement: ShiftEndorsement = {
      id: `END-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      shiftPeriod,
      ward: endorsementWard,
      outgoingNurse: user.name,
      outgoingNurseLicense: user.licenseNumber || "PRC Lic. #0093820",
      incomingNurse: incomingNurseName,
      incomingNurseLicense: incomingNurseLicense,
      patientCensus: admissions.filter(a => a.status === "Admitted" || a.status === "Observation").length,
      situation,
      background: background || "Patients stable with continuous monitoring and IV medication compliance.",
      assessment,
      recommendation: recommendation || "Continue standard shift orders and monitor critical alerts.",
      urgentTasks: urgentTaskInput ? urgentTaskInput.split(",").map(t => t.trim()) : ["Standard shift rounds"],
    };

    onAddShiftEndorsement(newEndorsement);
    setShowEndorsementModal(false);
    setSituation("");
    setBackground("");
    setAssessment("");
    setRecommendation("");
    setUrgentTaskInput("");
    setNotification(`Shift endorsement officially signed and transferred to ${incomingNurseName}!`);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleRegisterVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find(p => p.id === visPatientId) || patients[0];
    if (!visitorName.trim()) return;

    const newVisitor: VisitorLog = {
      id: `VIS-${Date.now().toString().slice(-4)}`,
      patientId: patientObj.id,
      patientName: patientObj.name,
      wardBed: `${patientObj.ward || "Ward"}, ${patientObj.bed || "Bed"}`,
      visitorName,
      relationship: visitorRel,
      contactNumber: visitorPhone || "09XX-XXX-XXXX",
      idPresented: visitorIdCard,
      badgeNumber: visitorBadge,
      timeIn: new Date().toISOString().replace("T", " ").substring(0, 16),
      temperatureCelsius: "36.5°C",
      purpose: "Bedside family visit and care support",
      status: "Currently Visiting",
      loggedByStaff: `${user.name} (${user.licenseNumber || "RN"})`,
    };

    onAddVisitorLog(newVisitor);
    setShowVisitorModal(false);
    setVisitorName("");
    setVisitorPhone("");
    setNotification(`Visitor ${visitorName} checked in for ${patientObj.name}! Assigned Badge: ${visitorBadge}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredMeds = medications.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(marSearch.toLowerCase()) ||
      m.patientName.toLowerCase().includes(marSearch.toLowerCase()) ||
      m.dose.toLowerCase().includes(marSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (triageFilter === "all") return true;
    const patient = patients.find(p => p.id === m.patientId);
    return patient?.triageTier === triageFilter;
  });

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
                <span className="text-xs text-slate-300">
                  Worker ID: <strong className="text-white">{user.id}</strong>
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
                    <span className="text-purple-300 font-semibold">{user.credentials}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab("mar")}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Pill size={16} strokeWidth={2} />
              <span>MAR Table</span>
            </button>
            <button
              onClick={() => setActiveTab("vitals")}
              className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Droplets size={16} strokeWidth={2} />
              <span>Vitals & Fluid Entry</span>
            </button>
            <button
              onClick={() => setShowEndorsementModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <FileCheck size={16} strokeWidth={2} />
              <span>Shift Endorsement</span>
            </button>
          </div>
        </div>

        {/* PRIORITY WATCH SYSTEM: TRIAGE STATUS TIERS */}
        <div className="mt-6 pt-6 border-t border-white/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold uppercase tracking-wider">
              <Activity size={16} strokeWidth={2} className="text-purple-400" />
              <span>Ward Priority Watch System (3 Status Tiers)</span>
            </div>
            <div className="text-xs text-slate-300">
              Filter Active MAR & Patients by Acuity:
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setTriageFilter("all")}
              className={`p-3 rounded-xl border text-left transition-all ${triageFilter === "all"
                  ? "bg-white/20 border-white text-white shadow-sm ring-1 ring-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">All Patients</div>
              <div className="text-xl font-bold text-white mt-0.5">{patients.length} Registered</div>
              <div className="text-[11px] text-slate-300 mt-1">Full ward & outpatient roster</div>
            </button>

            <button
              onClick={() => setTriageFilter("critical")}
              className={`p-3 rounded-xl border text-left transition-all ${triageFilter === "critical"
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
              <div className="text-[11px] text-rose-300 mt-0.5">High-frequency vitals & stat IV meds</div>
            </button>

            <button
              onClick={() => setTriageFilter("observation")}
              className={`p-3 rounded-xl border text-left transition-all ${triageFilter === "observation"
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
              <div className="text-[11px] text-amber-300 mt-0.5">Continuous fluid chart & SpO2 watch</div>
            </button>

            <button
              onClick={() => setTriageFilter("stable")}
              className={`p-3 rounded-xl border text-left transition-all ${triageFilter === "stable"
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
              <div className="text-[11px] text-emerald-300 mt-0.5">Routine shift checks & oral meds</div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("mar")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "mar"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <Pill size={16} strokeWidth={2} />
            <span>Medication Administration Record (MAR Table)</span>
          </button>
          <button
            onClick={() => setActiveTab("beds")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "beds"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <Bed size={16} strokeWidth={2} />
            <span>Ward Bed Allocation Table ({admissions.filter(a => a.status === "Admitted").length} Beds)</span>
          </button>
          <button
            onClick={() => setActiveTab("treatments")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "treatments"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <ClipboardList size={16} strokeWidth={2} />
            <span>Bedside Treatment Logs ({treatments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("vitals")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "vitals"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <Droplets size={16} strokeWidth={2} />
            <span>Expanded Vitals & Fluid Management Form</span>
          </button>
          <button
            onClick={() => setActiveTab("endorsements")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "endorsements"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <FileCheck size={16} strokeWidth={2} />
            <span>Shift Handoff Endorsements (SBAR)</span>
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${activeTab === "visitors"
                ? "bg-purple-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            <Users size={16} strokeWidth={2} />
            <span>Ward Visitor Log ({visitorLogs.filter(v => v.status === "Currently Visiting").length} Active)</span>
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
      {/* SUB-VIEW 1: STRUCTURED MAR TABLE (MEDICATION ADMINISTRATION RECORD)      */}
      {/* ========================================================================= */}
      {activeTab === "mar" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Pill size={20} strokeWidth={2} className="text-purple-600" />
                  <span>Scheduled Medication Administration Record (MAR Table)</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Standard structured MAR per Board of Nursing regulations. Verify two patient identifiers prior to administering.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search size={14} strokeWidth={2} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter by drug, patient..."
                    value={marSearch}
                    onChange={e => setMarSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-semibold">
                  Active Shift: Morning (07:00 – 15:00)
                </span>
              </div>
            </div>

            {/* MAR Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient & Bed</th>
                    <th className="px-4 py-3">Medication & Dosage</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Schedule / Frequency</th>
                    <th className="px-4 py-3">Prescribing Physician</th>
                    <th className="px-4 py-3">Last Administered Status</th>
                    <th className="px-4 py-3 text-right">Action Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No scheduled medications match the active search/triage criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map(m => {
                      const patient = patients.find(p => p.id === m.patientId);
                      const isCritical = patient?.triageTier === "critical";

                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-purple-50/40 transition-colors ${isCritical ? "bg-rose-50/20" : ""
                            }`}
                        >
                          {/* Patient & Bed */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{m.patientName}</span>
                              {patient?.triageTier === "critical" && (
                                <span className="w-2 h-2 rounded-full bg-rose-500" title="Critical Care Tier" />
                              )}
                              {patient?.triageTier === "observation" && (
                                <span className="w-2 h-2 rounded-full bg-amber-400" title="Observation Tier" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {patient?.ward || "Outpatient"} • <strong>{patient?.bed || "OPD Chair"}</strong>
                            </div>
                          </td>

                          {/* Drug Name & Dosage */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-purple-900 text-sm">{m.name}</div>
                            <span className="inline-block mt-0.5 text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                              {m.dose}
                            </span>
                          </td>

                          {/* Route */}
                          <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                            {m.route}
                          </td>

                          {/* Schedule / Frequency */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800">{m.freq}</div>
                            <div className="text-[10px] text-slate-500">Started: {m.start}</div>
                          </td>

                          {/* Prescribing Physician */}
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-800">{m.prescribedBy}</div>
                            {m.prescribedByLicense && (
                              <div className="text-[10px] font-mono text-slate-500">{m.prescribedByLicense}</div>
                            )}
                          </td>

                          {/* Last Administered Status */}
                          <td className="px-4 py-3.5">
                            {m.lastAdministered ? (
                              <div>
                                <div className="text-purple-700 font-semibold flex items-center gap-1">
                                  <Clock size={12} strokeWidth={2} />
                                  <span>{m.lastAdministered}</span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  By {m.administeredBy || user.name}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Clock size={12} strokeWidth={2} />
                                <span>Due on this shift</span>
                              </span>
                            )}
                          </td>

                          {/* Action Controls */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                onAdministerMedication(m.id, user.name);
                                setNotification(`Recorded administration of ${m.name} (${m.dose}) to ${m.patientName}! Registered under ${user.name} (${user.licenseNumber || "RN"})`);
                                setTimeout(() => setNotification(null), 5000);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                            >
                              <Check size={14} strokeWidth={2} />
                              <span>Administer</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: TABULAR BED ALLOCATION & WARD ROSTER                          */}
      {/* ========================================================================= */}
      {activeTab === "beds" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Bed size={20} strokeWidth={2} className="text-purple-600" />
                  <span>Inpatient Ward Bed Allocation Roster</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Structured table view of active inpatient bed assignments, attending physicians, and triage watch levels.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Active Inpatient Census:</span>
                <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-md text-xs">
                  {admissions.filter(a => a.status === "Admitted" || a.status === "Observation").length} Beds Occupied
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Bed & Location</th>
                    <th className="px-4 py-3">Patient Name & ID</th>
                    <th className="px-4 py-3">Demographics & Blood</th>
                    <th className="px-4 py-3">Triage Watch Status</th>
                    <th className="px-4 py-3">Admission Reason</th>
                    <th className="px-4 py-3">Attending Physician</th>
                    <th className="px-4 py-3">Allergies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map(p => {
                    const adm = admissions.find(a => a.patientId === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-purple-900 whitespace-nowrap">
                          {p.bed || "OPD Chair 04"}
                          <div className="font-normal font-sans text-[11px] text-slate-500">
                            {p.ward || "Outpatient Clinic"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{p.id}</div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>{p.age}y/o {p.gender}</div>
                          <span className="inline-block mt-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            Blood: {p.bloodType}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {p.triageTier === "critical" && (
                            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                              <span>Critical Care</span>
                            </span>
                          )}
                          {p.triageTier === "observation" && (
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>Observation Watch</span>
                            </span>
                          )}
                          {p.triageTier === "stable" && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Stable</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-slate-800 line-clamp-2">{adm?.reason || p.chiefComplaint}</p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{p.attendingPhysician || "Attending Physician"}</div>
                          <div className="text-[10px] text-slate-500">Internal Medicine / OPD</div>
                        </td>

                        <td className="px-4 py-3">
                          {p.allergies.length > 0 && p.allergies[0] !== "None known" ? (
                            <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                              {p.allergies.join(", ")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No allergies</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: TABULAR BEDSIDE TREATMENT LOGS                                */}
      {/* ========================================================================= */}
      {activeTab === "treatments" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <ClipboardList size={20} strokeWidth={2} className="text-purple-600" />
                  <span>Bedside Nursing Treatment & Vitals Execution Table</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Verified clinical log of bedside treatments, precision vitals, and fluid management.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("vitals")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Record New Treatment</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Procedure & Category</th>
                    <th className="px-4 py-3">Performed By & License</th>
                    <th className="px-4 py-3">Vitals Observed</th>
                    <th className="px-4 py-3">Fluid Balance (mL)</th>
                    <th className="px-4 py-3">Clinical Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {treatments.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                        {t.timestamp}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                        {t.patientName}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{t.treatmentName}</div>
                        <span className="inline-block mt-0.5 text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{t.performedBy}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {t.performedByLicense || "PRC Lic. #0093820"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {t.structuredVitals ? (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <div><strong>BP:</strong> {t.structuredVitals.systolicBp}/{t.structuredVitals.diastolicBp} mmHg</div>
                            <div><strong>HR:</strong> {t.structuredVitals.heartRate} bpm • <strong>RR:</strong> {t.structuredVitals.respiratoryRate}</div>
                            <div><strong>SpO2:</strong> {t.structuredVitals.spo2}% • <strong>Temp:</strong> {t.structuredVitals.temperature}°C</div>
                          </div>
                        ) : (
                          <div className="text-slate-700">{t.vitalsAtTreatment || "Normal limits"}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {t.fluidIntakeMl !== undefined || t.urineOutputMl !== undefined ? (
                          <div className="text-[11px] font-mono">
                            <div className="text-blue-700">Intake: <strong>+{t.fluidIntakeMl || 0} mL</strong></div>
                            <div className="text-amber-700">Output: <strong>-{t.urineOutputMl || 0} mL</strong></div>
                            <div className="font-bold text-slate-800 pt-0.5 border-t border-slate-200 mt-0.5">
                              Net: {((t.fluidIntakeMl || 0) - (t.urineOutputMl || 0)) > 0 ? "+" : ""}
                              {(t.fluidIntakeMl || 0) - (t.urineOutputMl || 0)} mL
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not charted</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="text-slate-700 italic">"{t.notes}"</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: EXPANDED VITALS & FLUID MANAGEMENT FORM                       */}
      {/* ========================================================================= */}
      {activeTab === "vitals" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <form onSubmit={handleRecordTreatment} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                  <Droplets size={24} strokeWidth={2} className="text-purple-600" />
                  <span>Bedside Vitals & Fluid Management Charting</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Distinct numerical measurement fields, intake/output fluid balance, and precision timestamping.
                </p>
              </div>

              {/* Timestamp selector */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <Clock size={16} strokeWidth={2} className="text-slate-500" />
                <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Exact Date/Time:</label>
                <input
                  type="datetime-local"
                  required
                  value={exactTimestamp}
                  onChange={e => setExactTimestamp(e.target.value)}
                  className="text-xs border rounded px-2 py-1 bg-white font-mono"
                />
              </div>
            </div>

            {/* Patient & Procedure Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.ward || "OPD"} ({p.bed || "Chair"}) [{p.triageTier.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Clinical Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Bedside Nursing">Bedside Nursing & Routine Vitals</option>
                  <option value="IV Therapy">IV Therapy & Infusion Maintenance</option>
                  <option value="Wound Care">Wound Dressing & Debridement</option>
                  <option value="Respiratory Therapy">Respiratory Therapy & Nebulization</option>
                  <option value="Physiotherapy">Physiotherapy & Bed Mobility</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Procedure / Treatment Title
                </label>
                <input
                  type="text"
                  required
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  placeholder="e.g. Scheduled Ward Vitals & Intake/Output"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>

            {/* SECTION 1: SEPARATE NUMERICAL VITAL INPUTS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-2">
                <Activity size={16} strokeWidth={2} className="text-purple-600" />
                <span>1. Distinct Numerical Vital Inputs (No Combined Text Box)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Systolic BP */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Systolic BP <span className="text-slate-400">(mmHg)</span>
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={260}
                    required
                    value={systolicBp}
                    onChange={e => setSystolicBp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 90–120</div>
                </div>

                {/* Diastolic BP */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Diastolic BP <span className="text-slate-400">(mmHg)</span>
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    required
                    value={diastolicBp}
                    onChange={e => setDiastolicBp(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 60–80</div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Heart Rate <span className="text-slate-400">(bpm)</span>
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={220}
                    required
                    value={heartRate}
                    onChange={e => setHeartRate(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 60–100</div>
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resp. Rate <span className="text-slate-400">(cpm)</span>
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={60}
                    required
                    value={respiratoryRate}
                    onChange={e => setRespiratoryRate(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 12–20</div>
                </div>

                {/* Oxygen Saturation */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    SpO2 <span className="text-slate-400">(%)</span>
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    required
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 95–100%</div>
                </div>

                {/* Body Temperature */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Body Temp <span className="text-slate-400">(°C)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={34.0}
                    max={43.0}
                    required
                    value={temperature}
                    onChange={e => setTemperature(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-semibold"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5">Target: 36.5–37.5°C</div>
                </div>
              </div>
            </div>

            {/* SECTION 2: FLUID BALANCE CHARTING */}
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-2">
                <Droplets size={16} strokeWidth={2} className="text-purple-600" />
                <span>2. Fluid Balance Charting (Intake vs. Output in mL)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fluid Intake */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fluid Intake (IV / Oral in mL)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={fluidIntake}
                    onChange={e => setFluidIntake(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-blue-800 bg-white"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">Includes IV bags, piggyback, and oral fluids.</div>
                </div>

                {/* Urine Output */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urine Output (in mL)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={urineOutput}
                    onChange={e => setUrineOutput(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-amber-800 bg-white"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">Foley catheter collection or measured void.</div>
                </div>

                {/* Real-time Fluid Net Balance */}
                <div className="bg-white border border-purple-200 rounded-lg p-3 flex flex-col justify-center">
                  <div className="text-[11px] uppercase font-semibold text-slate-500">Calculated Net Fluid Balance</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${fluidIntake - urineOutput >= 0 ? "text-purple-800" : "text-amber-800"
                    }`}>
                    {fluidIntake - urineOutput >= 0 ? "+" : ""}{fluidIntake - urineOutput} mL
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {fluidIntake - urineOutput >= 0 ? "Positive balance (Surplus)" : "Negative balance (Deficit)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Verification */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                Nurse Bedside Observations & Assessment
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Patient response, puncture site condition, peripheral edema notes..."
                className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Signing Nurse: <strong className="text-slate-800">{user.name}</strong> • {user.licenseNumber || "PRC Lic. #0093820"}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("mar")}
                  className="px-5 py-2.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ClipboardList size={16} strokeWidth={2} />
                  <span>Save Bedside Vitals & Fluid Entry</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: NURSING SHIFT ENDORSEMENTS (SBAR HANDOFF)                    */}
      {/* ========================================================================= */}
      {activeTab === "endorsements" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <FileCheck size={20} strokeWidth={2} className="text-purple-600" />
                  <span>Nursing Shift Endorsement & SBAR Handoff Ledger</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Inter-shift continuity of care logs tracking outgoing nurse, incoming nurse, and active ward assignments.
                </p>
              </div>

              <button
                onClick={() => setShowEndorsementModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Create SBAR Endorsement</span>
              </button>
            </div>

            <div className="space-y-4">
              {shiftEndorsements.map(end => (
                <div key={end.id} className="border border-purple-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{end.shiftPeriod}</span>
                        <span className="text-xs font-mono bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded">
                          {end.ward}
                        </span>
                        <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">
                          Census: {end.patientCensus} Patients
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Endorsed on {end.timestamp}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 text-right">
                      <div>Outgoing: <strong>{end.outgoingNurse}</strong> ({end.outgoingNurseLicense})</div>
                      <div>Incoming: <strong>{end.incomingNurse}</strong> ({end.incomingNurseLicense})</div>
                    </div>
                  </div>

                  {/* SBAR Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-purple-700 mb-1">
                        S — Situation
                      </div>
                      <p className="text-slate-700 leading-relaxed">{end.situation}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-purple-700 mb-1">
                        B — Background
                      </div>
                      <p className="text-slate-700 leading-relaxed">{end.background}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-purple-700 mb-1">
                        A — Assessment
                      </div>
                      <p className="text-slate-700 leading-relaxed">{end.assessment}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-purple-700 mb-1">
                        R — Recommendation
                      </div>
                      <p className="text-slate-700 leading-relaxed">{end.recommendation}</p>
                    </div>
                  </div>

                  {/* Urgent Tasks */}
                  {end.urgentTasks && end.urgentTasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={14} strokeWidth={2} />
                        <span>Priority Shift Action Items / Stat Follow-ups:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {end.urgentTasks.map((task, i) => (
                          <span key={i} className="text-xs bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded font-medium">
                            • {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 6: WARD VISITOR LOGS                                             */}
      {/* ========================================================================= */}
      {activeTab === "visitors" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("mar")} label="Back to MAR" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-[var(--foreground)] flex items-center gap-2">
                  <Users size={20} strokeWidth={2} className="text-purple-600" />
                  <span>Ward Bedside Visitor Management Ledger</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Record visitors entering inpatient rooms per hospital visitation guidelines (DPA compliance & infection prevention).
                </p>
              </div>

              <button
                onClick={() => setShowVisitorModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Log Visitor Arrival</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Badge & Status</th>
                    <th className="px-4 py-3">Patient & Ward/Bed</th>
                    <th className="px-4 py-3">Visitor Full Name</th>
                    <th className="px-4 py-3">Relationship & Contact</th>
                    <th className="px-4 py-3">ID Presented</th>
                    <th className="px-4 py-3">Time In</th>
                    <th className="px-4 py-3">Time Out</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitorLogs.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{v.badgeNumber}</div>
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${v.status === "Currently Visiting"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                          }`}>
                          {v.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{v.patientName}</div>
                        <div className="text-[11px] text-slate-500">{v.wardBed}</div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {v.visitorName}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{v.relationship}</div>
                        <div className="text-[11px] text-slate-500">{v.contactNumber}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                        {v.idPresented}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                        {v.timeIn}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                        {v.timeOut || "— Active —"}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {v.status === "Currently Visiting" ? (
                          <button
                            onClick={() => onCheckOutVisitor(v.id)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded transition-colors"
                          >
                            Mark Departure
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Logged Out</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SBAR SHIFT ENDORSEMENT FORM */}
      {showEndorsementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="font-serif text-xl text-slate-900">Create Shift Endorsement (SBAR)</h3>
                <p className="text-xs text-slate-500">Official inter-shift nursing endorsement protocol</p>
              </div>
              <button onClick={() => setShowEndorsementModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateEndorsement} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Shift Transition Period</label>
                  <select
                    value={shiftPeriod}
                    onChange={e => setShiftPeriod(e.target.value)}
                    className="w-full border rounded-lg p-2.5 bg-white"
                  >
                    <option value="Morning (07:00–15:00) to Afternoon (15:00–23:00)">Morning (07:00–15:00) → Afternoon</option>
                    <option value="Afternoon (15:00–23:00) to Night (23:00–07:00)">Afternoon (15:00–23:00) → Night</option>
                    <option value="Night (23:00–07:00) to Morning (07:00–15:00)">Night (23:00–07:00) → Morning</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Inpatient Ward Assignment</label>
                  <input
                    type="text"
                    required
                    value={endorsementWard}
                    onChange={e => setEndorsementWard(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Incoming Relieving Nurse</label>
                  <input
                    type="text"
                    required
                    value={incomingNurseName}
                    onChange={e => setIncomingNurseName(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="e.g. Kristine Ramos, RN"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Incoming Nurse PRC License</label>
                  <input
                    type="text"
                    required
                    value={incomingNurseLicense}
                    onChange={e => setIncomingNurseLicense(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="e.g. PRC Lic. #0095112"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-purple-800 mb-1">Situation (S)</label>
                <textarea
                  rows={2}
                  required
                  value={situation}
                  onChange={e => setSituation(e.target.value)}
                  placeholder="Ward status, active census, admissions/discharges..."
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-purple-800 mb-1">Background (B)</label>
                <textarea
                  rows={2}
                  value={background}
                  onChange={e => setBackground(e.target.value)}
                  placeholder="Clinical history summary of acute patients..."
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-purple-800 mb-1">Assessment (A)</label>
                <textarea
                  rows={2}
                  required
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  placeholder="Observed vitals, IV lines, dressings, drains, mental status..."
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-purple-800 mb-1">Recommendation (R)</label>
                <textarea
                  rows={2}
                  value={recommendation}
                  onChange={e => setRecommendation(e.target.value)}
                  placeholder="Pending lab results, planned doctor rounds, medication orders..."
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-rose-700 mb-1">Urgent Pending Tasks (comma separated)</label>
                <input
                  type="text"
                  value={urgentTaskInput}
                  onChange={e => setUrgentTaskInput(e.target.value)}
                  placeholder="e.g. Repeat CBC Bed 204-A, strict urine output Bed 312-B"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEndorsementModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Sign & Submit Endorsement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISITOR QUICK-LOG */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-serif text-lg text-slate-900">Log Inpatient Bedside Visitor</h3>
                <p className="text-xs text-slate-500">Admissions & Ward Entry Protocol</p>
              </div>
              <button onClick={() => setShowVisitorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleRegisterVisitor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Patient Visited</label>
                <select
                  value={visPatientId}
                  onChange={e => setVisPatientId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.ward || "Ward"}, {p.bed || "Bed"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Visitor Full Name</label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  placeholder="Full name of companion/visitor"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Relationship</label>
                  <select
                    value={visitorRel}
                    onChange={e => setVisitorRel(e.target.value)}
                    className="w-full border rounded-lg p-2.5 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child / Offspring</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={visitorPhone}
                    onChange={e => setVisitorPhone(e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">ID Presented</label>
                  <input
                    type="text"
                    value={visitorIdCard}
                    onChange={e => setVisitorIdCard(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Visitor Badge #</label>
                  <input
                    type="text"
                    value={visitorBadge}
                    onChange={e => setVisitorBadge(e.target.value)}
                    className="w-full border rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowVisitorModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Issue Badge & Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
