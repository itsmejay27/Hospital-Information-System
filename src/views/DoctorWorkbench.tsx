import { useState, useMemo } from "react";
import {
  User,
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  TriageTier,
  OpdReferral,
  OpdDischarge,
} from "../types";
import { ICD10_CATALOG, INITIAL_OPD_REFERRALS, INITIAL_OPD_DISCHARGES } from "../mockData";
import {
  Stethoscope,
  Activity,
  FileText,
  FlaskConical,
  Pill,
  Send,
  User as UserIcon,
  Search,
  Plus,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Droplets,
  ChevronRight,
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
  onSignOut?: () => void;
  initialPatientId?: string;
  initialTab?: WorkbenchTab;
  referrals?: OpdReferral[];
  onAddReferral?: (ref: OpdReferral) => void;
  discharges?: OpdDischarge[];
  onAddDischarge?: (dis: OpdDischarge) => void;
}


export type WorkbenchTab =
  | "profile"
  | "vitals"
  | "soap"
  | "diagnostics"
  | "prescriptions"
  | "referral";

export default function DoctorWorkbench({
  user,
  patients,
  records,
  onAddRecord,
  labResults,
  onAddLabResult,
  medications,
  onAddMedication,
  initialPatientId,
  initialTab = "profile",
  referrals = INITIAL_OPD_REFERRALS,
  onAddReferral,
  discharges = INITIAL_OPD_DISCHARGES,
  onAddDischarge,
}: Props) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>(initialTab);
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || "P-2024-001"
  );

  const [patientSearch, setPatientSearch] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Local referrals and discharges state
  const [localReferrals, setLocalReferrals] = useState<OpdReferral[]>(referrals);
  const [localDischarges, setLocalDischarges] = useState<OpdDischarge[]>(discharges);

  // Vitals State
  const [systolicBp, setSystolicBp] = useState<number>(128);
  const [diastolicBp, setDiastolicBp] = useState<number>(82);
  const [heartRate, setHeartRate] = useState<number>(76);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [spo2, setSpo2] = useState<number>(99);
  const [weightKg, setWeightKg] = useState<number>(68.5);
  const [heightCm, setHeightCm] = useState<number>(168);
  const [fluidIntake, setFluidIntake] = useState<number>(1500);
  const [urineOutput, setUrineOutput] = useState<number>(1200);

  // BMI Calculation
  const bmiInfo = useMemo(() => {
    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { bmi: 0, category: "Normal" };
    }
    const heightM = heightCm / 100;
    const val = Number((weightKg / (heightM * heightM)).toFixed(1));
    let cat = "Normal";
    if (val < 18.5) cat = "Underweight";
    else if (val < 25.0) cat = "Normal weight";
    else if (val < 30.0) cat = "Overweight";
    else cat = "Obese";
    return { bmi: val, category: cat };
  }, [weightKg, heightCm]);

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

  // e-Prescription State
  const [rxMedName, setRxMedName] = useState("");
  const [rxDose, setRxDose] = useState("");
  const [rxRoute, setRxRoute] = useState("Oral (PO)");
  const [rxFreq, setRxFreq] = useState("Once daily (OD) in morning");
  const [rxNotes, setRxNotes] = useState("Take with or without food. Maintain hydration.");

  // Lab Order State
  const [labOrderName, setLabOrderName] = useState("12-Lead Electrocardiogram (ECG)");
  const [labCategory, setLabCategory] = useState<DiagnosticResult["category"]>("Cardiology");
  const [labSpecimen, setLabSpecimen] = useState("Surface Electrode Tracing");
  const [labIndication, setLabIndication] = useState("Baseline cardiac evaluation for stage 1 hypertension");

  // Referral State
  const [referToDept, setReferToDept] = useState("Cardiology Subspecialty Clinic");
  const [referReason, setReferReason] = useState("Specialist assessment and 2D Echocardiogram for left ventricular hypertrophy evaluation.");
  const [referPriority, setReferPriority] = useState<"Routine" | "Urgent" | "Stat Emergency">("Routine");

  // Discharge State
  const [dischargeDisposition, setDischargeDisposition] = useState<OpdDischarge["disposition"]>("Follow-up Scheduled");
  const [followUpWeeks, setFollowUpWeeks] = useState("2 Weeks (Sep 29, 2026)");
  const [dischargeInstructions, setDischargeInstructions] = useState("Continue daily Amlodipine 5mg OD. Log morning and evening blood pressures. Avoid excess salt.");

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const filteredPatients = patients.filter(
    p =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const patientRecords = records.filter(r => r.patientId === selectedPatient?.id);
  const patientMeds = medications.filter(m => m.patientId === selectedPatient?.id);
  const patientLabs = labResults.filter(l => l.patientId === selectedPatient?.id);
  const patientReferrals = localReferrals.filter(r => r.patientId === selectedPatient?.id);
  const patientDischarges = localDischarges.filter(d => d.patientId === selectedPatient?.id);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit SOAP Note
  const handleSaveSOAP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    const newRecord: HealthRecord = {
      id: `EHR-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      date: new Date().toISOString().split("T")[0],
      type: visitType,
      doctor: user.name,
      doctorLicense: user.licenseNumber || "PRC Lic. Verified",
      diagnosis: `${diagnosis} (${icd10Code})`,
      icd10Code: icd10Code,
      differentialDiagnosis: differentialDiagnosis.split(",").map(s => s.trim()),
      subjective,
      objective,
      assessment,
      plan,
      notes: assessment,
      internalClinicianNotes: internalNotes,
      vitals: {
        bp: `${systolicBp}/${diastolicBp} mmHg`,
        hr: `${heartRate} bpm`,
        temp: `${temperature}°C`,
        wt: `${weightKg} kg`,
        height: `${heightCm} cm`,
        bmi: `${bmiInfo.bmi}`,
        bmiCategory: bmiInfo.category,
        spo2: `${spo2}%`,
        rr: `${respiratoryRate} cpm`,
        systolic: systolicBp,
        diastolic: diastolicBp,
        fluidIntakeMl: fluidIntake,
        urineOutputMl: urineOutput,
      },
    };

    onAddRecord(newRecord);
    notify(`SOAP Clinical Note successfully signed and saved for ${selectedPatient.name}.`);
  };

  // Submit e-Prescription
  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxMedName.trim() || !rxDose.trim()) return;

    const newMed: MedicationOrder = {
      id: `RX-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      name: rxMedName,
      dose: rxDose,
      freq: rxFreq,
      route: rxRoute,
      start: new Date().toISOString().split("T")[0],
      status: "Active",
      refillable: true,
      prescribedBy: user.name,
      prescribedByLicense: user.licenseNumber || "PRC Lic. Verified",
      notes: rxNotes,
    };

    onAddMedication(newMed);
    setRxMedName("");
    setRxDose("");
    notify(`e-Prescription added for ${selectedPatient.name}: ${rxMedName} ${rxDose}`);
  };

  // Submit Lab Diagnostic Order
  const handleAddDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labOrderName.trim()) return;

    const newLab: DiagnosticResult = {
      id: `LAB-2026-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      test: labOrderName,
      category: labCategory,
      date: new Date().toISOString().split("T")[0],
      orderingPhysician: user.name,
      orderingPhysicianLicense: user.licenseNumber || "PRC Lic. Verified",
      releasedBy: "Clinical Pathology Laboratory",
      specimenType: labSpecimen,
      summary: labIndication,
      status: "In-Progress",
      items: [
        {
          name: labOrderName,
          value: "Pending Analysis",
          unit: "--",
          ref: "Standard Protocol",
          flag: null,
        },
      ],
    };

    onAddLabResult(newLab);
    notify(`Diagnostic test ordered for ${selectedPatient.name}: ${labOrderName}`);
  };

  // Submit Referral
  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referReason.trim()) return;

    const newRef: OpdReferral = {
      id: `REF-2026-${Date.now().toString().slice(-3)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      referredFrom: "Outpatient General Medicine",
      referredTo: referToDept,
      reason: referReason,
      priority: referPriority,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      referringDoctor: user.name,
      status: "Pending",
    };

    setLocalReferrals([newRef, ...localReferrals]);
    if (onAddReferral) onAddReferral(newRef);
    notify(`Specialist referral to ${referToDept} submitted for ${selectedPatient.name}.`);
  };

  // Submit Discharge / Clearance
  const handleCreateDischarge = (e: React.FormEvent) => {
    e.preventDefault();
    const newDis: OpdDischarge = {
      id: `DIS-2026-${Date.now().toString().slice(-3)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      dischargeDate: new Date().toISOString().split("T")[0],
      disposition: dischargeDisposition,
      followUpDate: followUpWeeks,
      instructions: dischargeInstructions,
      clearedByDoctor: `${user.name} (${user.licenseNumber || "PRC Physician"})`,
    };

    setLocalDischarges([newDis, ...localDischarges]);
    if (onAddDischarge) onAddDischarge(newDis);
    notify(`OPD Discharge & clearance issued for ${selectedPatient.name}.`);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-teal-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Patient Selector Strip & Active Demographic Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Patient Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0">
              {selectedPatient.name
                .split(" ")
                .map(n => n[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {selectedPatient.name}
                </h2>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                  {selectedPatient.id}
                </span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                    selectedPatient.triageTier === "critical"
                      ? "bg-rose-100 text-rose-700 border border-rose-300"
                      : selectedPatient.triageTier === "observation"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {selectedPatient.triageTier}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {selectedPatient.age} yrs • {selectedPatient.gender} • Blood:{" "}
                <span className="font-semibold text-slate-700">{selectedPatient.bloodType}</span> • PhilHealth:{" "}
                <span className="font-mono text-teal-800 font-semibold">{selectedPatient.philhealth?.pin || "Registered"}</span>
              </div>
            </div>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Select Patient:</span>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-teal-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.triageTier.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modern 6-Tab Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs">
        <nav className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: "profile", label: "1. Clinical Profile", icon: UserIcon },
            { id: "vitals", label: "2. Vitals & BMI Assessment", icon: Activity },
            { id: "soap", label: "3. Consultation & SOAP", icon: FileText },
            { id: "diagnostics", label: "4. Labs & Diagnostics", icon: FlaskConical },
            { id: "prescriptions", label: "5. e-Prescriptions & Rx", icon: Pill },
            { id: "referral", label: "6. Referral & Discharge", icon: Send },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkbenchTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon size={15} strokeWidth={2} className={isActive ? "text-white" : "text-slate-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Clinical Profile */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <UserIcon size={16} strokeWidth={2} className="text-teal-700" />
              <span>Demographics & Chief Complaint</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Legal Name</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedPatient.name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital MRN</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">{selectedPatient.id}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                <span className="text-rose-700 block text-[10px] uppercase font-bold">Chief Complaint (Presenting Symptom)</span>
                <span className="font-medium text-rose-950 mt-0.5 block">{selectedPatient.chiefComplaint}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">DOB</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.dob}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Blood Type</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.bloodType}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Civil Status</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.civilStatus}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Residential Address</span>
                <span className="text-slate-700">{selectedPatient.address}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                <span className="font-semibold text-slate-800">{selectedPatient.emergencyContact.name}</span>{" "}
                <span className="text-slate-500">({selectedPatient.emergencyContact.relationship}) • {selectedPatient.emergencyContact.phone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={2} className="text-amber-600" />
              <span>Allergies, Medical & Surgical History</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-xs font-semibold mb-1">Documented Drug & Food Allergies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatient.allergies.map(a => (
                    <span
                      key={a}
                      className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 text-xs"
                    >
                      ⚠️ {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Past Medical History:</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {selectedPatient.medicalHistory?.pastMedical.map(m => (
                    <li key={m}>{m}</li>
                  )) || <li>Essential Hypertension</li>}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800">Past Surgical History:</div>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {selectedPatient.medicalHistory?.pastSurgical.map(s => (
                    <li key={s}>{s}</li>
                  )) || <li>Appendectomy (2024), open approach, uncomplicated</li>}
                </ul>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-teal-800">
                <div className="font-semibold text-xs">Data Privacy Act (RA 10173) Consent:</div>
                <div className="text-[11px] text-teal-700 mt-0.5">
                  Treatment & DPA sharing consent signed on {selectedPatient.consents?.signedDate || "2026-09-14"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vitals & Assessment with Automated BMI */}
      {activeTab === "vitals" && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Vital Signs Measurement & Anthropometrics
              </h3>
              <p className="text-xs text-slate-500">
                Detailed vital parameters with automated Body Mass Index (BMI) calculator
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              Logged: {new Date().toLocaleTimeString("en-PH")}
            </div>
          </div>

          {/* Automated BMI Card Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-600 text-white font-bold text-lg shadow-xs">
                BMI
              </div>
              <div>
                <div className="text-xs font-semibold text-teal-900">Automated BMI Calculator</div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {bmiInfo.bmi} <span className="text-xs font-normal text-slate-600">kg/m²</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Category:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  bmiInfo.category === "Normal weight"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : bmiInfo.category === "Overweight"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {bmiInfo.category}
              </span>
            </div>
          </div>

          {/* Numeric Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* Height */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={e => setHeightCm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">{(heightCm / 100).toFixed(2)} meters</span>
            </div>

            {/* Weight */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={e => setWeightKg(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">{(weightKg * 2.20462).toFixed(1)} lbs</span>
            </div>

            {/* Blood Pressure Systolic */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">BP Systolic (mmHg)</label>
              <input
                type="number"
                value={systolicBp}
                onChange={e => setSystolicBp(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Target: &lt;120 mmHg</span>
            </div>

            {/* Blood Pressure Diastolic */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">BP Diastolic (mmHg)</label>
              <input
                type="number"
                value={diastolicBp}
                onChange={e => setDiastolicBp(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Target: &lt;80 mmHg</span>
            </div>

            {/* Heart Rate */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={heartRate}
                onChange={e => setHeartRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 60 - 100 bpm</span>
            </div>

            {/* Respiratory Rate */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Respiratory Rate (cpm)</label>
              <input
                type="number"
                value={respiratoryRate}
                onChange={e => setRespiratoryRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 12 - 20 cpm</span>
            </div>

            {/* Temperature */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 36.5 - 37.5°C</span>
            </div>

            {/* SpO2 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-slate-600 font-semibold mb-1">Oxygen Saturation (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={e => setSpo2(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-sm focus:border-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Normal: 95 - 100%</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => notify("Vital signs & BMI verified and logged into clinical chart.")}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
            >
              Verify & Save Vitals Record
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Consultation & SOAP Notes with ICD-10 Search */}
      {activeTab === "soap" && (
        <form onSubmit={handleSaveSOAP} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Physician SOAP Consultation Note
                </h3>
                <p className="text-xs text-slate-500">
                  Document subjective history, objective clinical exam, assessment, and care plan
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Visit Type:</span>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value as HealthRecord["type"])}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium"
                >
                  <option value="OPD Visit">OPD Visit</option>
                  <option value="Specialist Follow-up">Specialist Follow-up</option>
                  <option value="Emergency Consultation">Emergency Consultation</option>
                  <option value="Inpatient Progress">Inpatient Progress</option>
                </select>
              </div>
            </div>

            {/* ICD-10 Quick Catalog & Primary Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ICD-10 Diagnostic Code
                </label>
                <select
                  value={icd10Code}
                  onChange={e => {
                    setIcd10Code(e.target.value);
                    const matched = ICD10_CATALOG.find(c => c.code === e.target.value);
                    if (matched) setDiagnosis(matched.name);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500 font-mono"
                >
                  {ICD10_CATALOG.map(c => (
                    <option key={c.code} value={c.code}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Differential Diagnoses (Comma Separated)
              </label>
              <input
                type="text"
                value={differentialDiagnosis}
                onChange={e => setDifferentialDiagnosis(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                placeholder="e.g. Essential hypertension, Renovascular disease, Pheochromocytoma"
              />
            </div>

            {/* 4 SOAP Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Subjective */}
              <div className="space-y-1">
                <label className="block font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                  S - Subjective (History of Present Illness)
                </label>
                <textarea
                  rows={4}
                  value={subjective}
                  onChange={e => setSubjective(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-500 text-xs"
                />
              </div>

              {/* Objective */}
              <div className="space-y-1">
                <label className="block font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                  O - Objective (Physical Exam & Current Vitals)
                </label>
                <textarea
                  rows={4}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-500 text-xs"
                />
              </div>

              {/* Assessment */}
              <div className="space-y-1">
                <label className="block font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                  A - Assessment (Clinical Impression)
                </label>
                <textarea
                  rows={4}
                  value={assessment}
                  onChange={e => setAssessment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-500 text-xs"
                />
              </div>

              {/* Plan */}
              <div className="space-y-1">
                <label className="block font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                  P - Plan (Diagnostics, Rx, Counseling)
                </label>
                <textarea
                  rows={4}
                  value={plan}
                  onChange={e => setPlan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-teal-500 text-xs"
                />
              </div>
            </div>

            {/* Internal Clinician Notes (Non-Patient Facing) */}
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-600">
                Confidential Internal Clinician Notes (Protected Health Information)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Attending: <span className="font-semibold text-slate-800">{user.name}</span> ({user.licenseNumber || user.title || "PRC Physician"})
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Sign & Authorize SOAP Note
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Labs & Diagnostic Orders */}
      {activeTab === "diagnostics" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Order Diagnostic Tests & Imaging</span>
              <span className="text-xs text-teal-700 font-mono">LIS / PACS Interface</span>
            </h3>

            <form onSubmit={handleAddDiagnostic} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Diagnostic Test Name *</label>
                <select
                  value={labOrderName}
                  onChange={e => setLabOrderName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="12-Lead Electrocardiogram (ECG)">12-Lead Electrocardiogram (ECG)</option>
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                  <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS)</option>
                  <option value="Lipid Profile (Chol, HDL, LDL, Trig)">Lipid Profile</option>
                  <option value="Chest Radiograph (PA/Lateral)">Chest Radiograph (PA/Lateral)</option>
                  <option value="Serum Creatinine & eGFR">Serum Creatinine & eGFR</option>
                  <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department / Modality</label>
                <select
                  value={labCategory}
                  onChange={e => setLabCategory(e.target.value as DiagnosticResult["category"])}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Clinical Chemistry">Clinical Chemistry</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Urinalysis">Urinalysis</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Indication</label>
                <input
                  type="text"
                  value={labIndication}
                  onChange={e => setLabIndication(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Transmit Order to Laboratory
                </button>
              </div>
            </form>
          </div>

          {/* Results Table with Reference Range H/L Flags */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 font-bold text-slate-900 text-sm">
              Patient Diagnostic Reports & Reference Range H/L Flags
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Test Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Reference Range</th>
                    <th className="py-2.5 px-3">Flag</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientLabs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No laboratory records found for this patient.
                      </td>
                    </tr>
                  ) : (
                    patientLabs.map(lab => (
                      <tr key={lab.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {lab.test}
                          <span className="block text-[10px] text-slate-500">{lab.category}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{lab.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {lab.items?.[0]?.value || "13.8 g/dL"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {lab.items?.[0]?.ref || "12.0 - 16.0 g/dL"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              lab.items?.[0]?.flag === "H"
                                ? "bg-rose-100 text-rose-800"
                                : lab.items?.[0]?.flag === "L"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {lab.items?.[0]?.flag === "H" ? "High" : lab.items?.[0]?.flag === "L" ? "Low" : "Normal"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Orders & Prescriptions (e-Prescription Pad) */}
      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Electronic Prescription Pad (e-Rx)</span>
              <span className="text-xs text-teal-700 font-mono">DOH Administrative Order Compliant</span>
            </h3>

            <form onSubmit={handleAddMed} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medication Generic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amlodipine Besylate"
                  value={rxMedName}
                  onChange={e => setRxMedName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dosage & Strength *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5mg tablet"
                  value={rxDose}
                  onChange={e => setRxDose(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Frequency & Timing</label>
                <input
                  type="text"
                  value={rxFreq}
                  onChange={e => setRxFreq(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Route</label>
                <select
                  value={rxRoute}
                  onChange={e => setRxRoute(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Oral (PO)">Oral (PO)</option>
                  <option value="Sublingual (SL)">Sublingual (SL)</option>
                  <option value="Intravenous (IV)">Intravenous (IV)</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Topical">Topical</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">Patient Instructions / Sig</label>
                <input
                  type="text"
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  + Add Prescription
                </button>
              </div>
            </form>
          </div>

          {/* Active Medication List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex justify-between items-center">
              <span className="font-bold text-slate-900 text-sm">Active Patient Medication List</span>
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 border border-slate-300"
              >
                <Printer size={13} strokeWidth={2} />
                <span>Print e-Prescription Pad</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Medication & Strength</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-4">Instructions</th>
                    <th className="py-2.5 px-3">Prescriber</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientMeds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        No active medications prescribed for this patient.
                      </td>
                    </tr>
                  ) : (
                    patientMeds.map(med => (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {med.name}
                          <span className="block text-[11px] text-teal-800 font-mono font-medium">{med.dose}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{med.freq}</td>
                        <td className="py-3 px-3 text-slate-600">{med.route}</td>
                        <td className="py-3 px-4 text-slate-700">{med.notes}</td>
                        <td className="py-3 px-3 text-slate-600">{med.prescribedBy}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {med.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Referral & Discharge */}
      {activeTab === "referral" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Internal / External Referral Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Send size={16} strokeWidth={2} className="text-teal-700" />
              <span>Specialist & Departmental Referral</span>
            </h3>

            <form onSubmit={handleCreateReferral} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Department / Specialist Clinic</label>
                <select
                  value={referToDept}
                  onChange={e => setReferToDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Cardiology Subspecialty Clinic">Cardiology Subspecialty Clinic</option>
                  <option value="General Surgery Department">General Surgery Department</option>
                  <option value="Pulmonology & Respiratory Care">Pulmonology & Respiratory Care</option>
                  <option value="Endocrinology & Diabetes Clinic">Endocrinology & Diabetes Clinic</option>
                  <option value="Nephrology & Renal Medicine">Nephrology & Renal Medicine</option>
                  <option value="Tertiary Care Hospital (External)">Tertiary Care Hospital (External)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Reason for Referral *</label>
                <textarea
                  rows={3}
                  required
                  value={referReason}
                  onChange={e => setReferReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Referral Urgency Tier</label>
                <select
                  value={referPriority}
                  onChange={e => setReferPriority(e.target.value as "Routine" | "Urgent" | "Stat Emergency")}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Routine">Routine (Elective clinic appointment)</option>
                  <option value="Urgent">Urgent (Within 24 to 48 hours)</option>
                  <option value="Stat Emergency">Stat Emergency (Immediate handoff to ER)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Issue Clinical Referral
              </button>
            </form>
          </div>

          {/* Discharge Clearance & Follow-Up */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <CheckCircle size={16} strokeWidth={2} className="text-emerald-700" />
              <span>OPD Disposition & Discharge Clearance</span>
            </h3>

            <form onSubmit={handleCreateDischarge} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Disposition</label>
                <select
                  value={dischargeDisposition}
                  onChange={e => setDischargeDisposition(e.target.value as OpdDischarge["disposition"])}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Follow-up Scheduled">Follow-up Scheduled (Return to OPD)</option>
                  <option value="Treated & Sent Home">Treated & Sent Home (Fully Cleared)</option>
                  <option value="Admitted to Inpatient Ward">Admitted to Inpatient Ward</option>
                  <option value="Transferred to Tertiary Center">Transferred to Tertiary Center</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scheduled Follow-up Timeframe</label>
                <input
                  type="text"
                  value={followUpWeeks}
                  onChange={e => setFollowUpWeeks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Home Care & Discharge Instructions</label>
                <textarea
                  rows={3}
                  value={dischargeInstructions}
                  onChange={e => setDischargeInstructions(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Authorize & Clear Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
