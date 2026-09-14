import { useState } from "react";
import {
  User,
  Patient,
  AdmissionEntry,
  VisitorLog,
  TriageTier,
  PhilHealthCategory,
} from "../types";
import BackButton from "../components/BackButton";
import {
  UserPlus,
  Bed,
  Users,
  Search,
  Check,
  X,
  ShieldCheck,
  Activity,
  FileCheck,
  Plus,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  admissions: AdmissionEntry[];
  onAddAdmission: (a: AdmissionEntry) => void;
  onUpdatePatientStatus: (patientId: string, status: Patient["admissionStatus"], ward?: string, bed?: string) => void;
  visitorLogs: VisitorLog[];
  onAddVisitorLog: (visitor: VisitorLog) => void;
  onCheckOutVisitor: (visitorId: string) => void;
  onSignOut: () => void;
}

type StaffTab = "register" | "admit" | "roster" | "visitors";

export default function StaffAdmissions({
  user,
  patients,
  onAddPatient,
  admissions,
  onAddAdmission,
  onUpdatePatientStatus,
  visitorLogs,
  onAddVisitorLog,
  onCheckOutVisitor,
}: Props) {
  const [activeTab, setActiveTab] = useState<StaffTab>("register");
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for Registration
  const [regName, setRegName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState<"Female" | "Male" | "Other">("Female");
  const [regCivilStatus, setRegCivilStatus] = useState("Single");
  const [regContact, setRegContact] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regBloodType, setRegBloodType] = useState("O+");
  const [regAllergies, setRegAllergies] = useState("");
  const [regComplaint, setRegComplaint] = useState("");
  const [regTriageTier, setRegTriageTier] = useState<TriageTier>("stable");
  const [regTriageReason, setRegTriageReason] = useState("");

  // PhilHealth Registration Fields
  const [regPhilHealthPin, setRegPhilHealthPin] = useState("");
  const [regPhilHealthCategory, setRegPhilHealthCategory] = useState<PhilHealthCategory>("Direct Contributor - Private");
  const [regPhilHealthCoverage, setRegPhilHealthCoverage] = useState("Standard Inpatient Case Rate & PhilHealth Konsulta OPD");

  // Digital Consents
  const [regConsentTreatment, setRegConsentTreatment] = useState(true);
  const [regConsentSharing, setRegConsentSharing] = useState(true);
  const [regConsentContact, setRegConsentContact] = useState(true);

  // Medical History
  const [regPastMedical, setRegPastMedical] = useState("");
  const [regPastSurgical, setRegPastSurgical] = useState("");
  const [regFamilyHistory, setRegFamilyHistory] = useState("");

  // Emergency Contact
  const [regEmergName, setRegEmergName] = useState("");
  const [regEmergRel, setRegEmergRel] = useState("Spouse");
  const [regEmergPhone, setRegEmergPhone] = useState("");

  // Form State for Bed Admission
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [admitWard, setAdmitWard] = useState("Medical Ward (4th Floor)");
  const [admitBed, setAdmitBed] = useState("Bed 401-A");
  const [admitDoctor, setAdmitDoctor] = useState("Attending Physician, MD (Internal Medicine)");
  const [admitReason, setAdmitReason] = useState("");
  const [admitTriage, setAdmitTriage] = useState<TriageTier>("observation");
  const [admitStatus, setAdmitStatus] = useState<"Admitted" | "Observation">("Admitted");

  // Visitor Log State
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visPatientId, setVisPatientId] = useState(patients[0]?.id || "");
  const [visName, setVisName] = useState("");
  const [visRel, setVisRel] = useState("Spouse");
  const [visPhone, setVisPhone] = useState("");
  const [visIdCard, setVisIdCard] = useState("Driver's License");
  const [visBadge, setVisBadge] = useState(`BADGE-MAIN-${Math.floor(100 + Math.random() * 900)}`);

  // Directory Search
  const [rosterSearch, setRosterSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState<TriageTier | "all">("all");

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    const newId = `P-2026-${String(patients.length + 1).padStart(3, "0")}`;
    const ageCalc = regDob ? new Date().getFullYear() - new Date(regDob).getFullYear() : 30;

    const newPatient: Patient = {
      id: newId,
      name: regName,
      dob: regDob || "1995-01-01",
      age: Math.max(1, ageCalc),
      gender: regGender,
      civilStatus: regCivilStatus,
      contact: regContact || "09XX-XXX-XXXX",
      address: regAddress || "Metro Manila, Philippines",
      bloodType: regBloodType,
      allergies: regAllergies ? regAllergies.split(",").map(a => a.trim()) : ["None reported"],
      chiefComplaint: regComplaint || "Routine consultation / admission intake",
      triageTier: regTriageTier,
      triageReason: regTriageReason || "Standard intake triage assessment.",
      emergencyContact: {
        name: regEmergName || "Guardian",
        relationship: regEmergRel,
        phone: regEmergPhone || regContact || "N/A",
      },
      admissionStatus: "Outpatient",
      registeredAt: new Date().toISOString().split("T")[0],
      philhealth: {
        pin: regPhilHealthPin || "Not Enrolled",
        category: regPhilHealthCategory,
        eligibilityStatus: regPhilHealthPin ? "Active / Eligible" : "Under Verification",
        coverageDetails: regPhilHealthCoverage,
      },
      consents: {
        treatmentCareConsent: regConsentTreatment,
        healthInfoSharingConsent: regConsentSharing,
        contactNoticeConsent: regConsentContact,
        signedDate: new Date().toISOString().split("T")[0],
        witnessStaff: `${user.name} (${user.licenseNumber || user.id})`,
      },
      medicalHistory: {
        pastMedical: regPastMedical ? regPastMedical.split(",").map(m => m.trim()) : ["None reported"],
        pastSurgical: regPastSurgical ? regPastSurgical.split(",").map(s => s.trim()) : ["None"],
        familyHistory: regFamilyHistory ? regFamilyHistory.split(",").map(f => f.trim()) : ["Non-contributory"],
        chronicConditions: [],
      },
    };

    onAddPatient(newPatient);
    setNotification(`New patient ${newPatient.name} registered successfully! Assigned Hospital ID: ${newId} with PhilHealth PIN: ${regPhilHealthPin || "N/A"}`);
    setRegName("");
    setRegDob("");
    setRegContact("");
    setRegAddress("");
    setRegAllergies("");
    setRegComplaint("");
    setRegPhilHealthPin("");
    setRegTriageReason("");
    setRegEmergName("");
    setRegEmergPhone("");
    setActiveTab("roster");
    setTimeout(() => setNotification(null), 6000);
  };

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    const newAdmission: AdmissionEntry = {
      id: `ADM-2026-${String(admissions.length + 1).padStart(3, "0")}`,
      patientId: patient.id,
      patientName: patient.name,
      admissionDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      ward: admitWard,
      bed: admitBed,
      attendingPhysician: admitDoctor,
      admittingStaff: `${user.name} (${user.title})`,
      reason: admitReason || patient.chiefComplaint || "Inpatient treatment and continuous medical monitoring",
      triageTier: admitTriage,
      status: admitStatus,
    };

    onAddAdmission(newAdmission);
    onUpdatePatientStatus(patient.id, admitStatus, admitWard, admitBed);
    setNotification(`Patient ${patient.name} admitted to ${admitWard}, ${admitBed}! Triage tier set to ${admitTriage.toUpperCase()}`);
    setAdmitReason("");
    setActiveTab("roster");
    setTimeout(() => setNotification(null), 6000);
  };

  const handleVisitorCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === visPatientId) || patients[0];
    if (!visName.trim()) return;

    const newVisitor: VisitorLog = {
      id: `VIS-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      wardBed: `${patient.ward || "Ward"}, ${patient.bed || "Bed"}`,
      visitorName: visName,
      relationship: visRel,
      contactNumber: visPhone || "09XX-XXX-XXXX",
      idPresented: visIdCard,
      badgeNumber: visBadge,
      timeIn: new Date().toISOString().replace("T", " ").substring(0, 16),
      temperatureCelsius: "36.5°C",
      purpose: "Hospital visitor entry at front admissions",
      status: "Currently Visiting",
      loggedByStaff: `${user.name} (${user.id})`,
    };

    onAddVisitorLog(newVisitor);
    setShowVisitorModal(false);
    setVisName("");
    setVisPhone("");
    setNotification(`Visitor ${visName} checked in for ${patient.name}! Assigned Badge: ${visBadge}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (p.ward && p.ward.toLowerCase().includes(rosterSearch.toLowerCase())) ||
      (p.philhealth?.pin && p.philhealth.pin.toLowerCase().includes(rosterSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (triageFilter === "all") return true;
    return p.triageTier === triageFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Staff Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Patient Admissions & Front Desk Management
                </span>
                <span className="text-xs text-slate-300">
                  Staff ID: <strong className="text-white">{user.id}</strong>
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
                    <span className="text-emerald-300 font-semibold">{user.credentials}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("register")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <UserPlus size={16} strokeWidth={2} />
              <span>Register Patient</span>
            </button>
            <button
              onClick={() => setActiveTab("admit")}
              className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Bed size={16} strokeWidth={2} />
              <span>Admit to Bed</span>
            </button>
            <button
              onClick={() => setShowVisitorModal(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Users size={16} strokeWidth={2} />
              <span>Log Visitor</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("register")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "register"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <UserPlus size={16} strokeWidth={2} />
            <span>New Patient Intake & PhilHealth Enrollment</span>
          </button>
          <button
            onClick={() => setActiveTab("admit")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "admit"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Bed size={16} strokeWidth={2} />
            <span>Inpatient Bed Allocation</span>
          </button>
          <button
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "roster"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users size={16} strokeWidth={2} />
            <span>Master Patient Directory Table ({patients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "visitors"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users size={16} strokeWidth={2} />
            <span>Front Desk Visitor Log ({visitorLogs.length})</span>
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
      {/* SUB-VIEW 1: REGISTER INTAKE FORM                                          */}
      {/* ========================================================================= */}
      {activeTab === "register" && (
        <div className="space-y-6">
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                  <UserPlus size={22} strokeWidth={2} className="text-emerald-600" />
                  <span>New Patient Demographic & Clinical Intake</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Official enrollment of patient demographics, triage priority watch, PhilHealth insurance, and legal consents.
                </p>
              </div>

              {/* Patient Basic Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Juanita Reyes Cruz"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={regDob}
                    onChange={e => setRegDob(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Civil Status</label>
                  <select
                    value={regCivilStatus}
                    onChange={e => setRegCivilStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    placeholder="0917-XXX-XXXX"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Physical Permanent Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    placeholder="House/Unit #, Street, Barangay, City, Province"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Blood Type</label>
                  <select
                    value={regBloodType}
                    onChange={e => setRegBloodType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white font-mono"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>

              {/* PRIORITY WATCH SYSTEM: TRIAGE ACUITY ASSIGNMENT */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                  <Activity size={16} strokeWidth={2} className="text-emerald-600" />
                  <span>Priority Watch System: Initial Triage Acuity Assignment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    regTriageTier === "stable"
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="regTriageTier"
                      value="stable"
                      checked={regTriageTier === "stable"}
                      onChange={() => setRegTriageTier("stable")}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Green: Stable</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Routine consultation, ambulatory, vital signs within normal parameters.
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    regTriageTier === "observation"
                      ? "bg-amber-50 border-amber-500 ring-2 ring-amber-400"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="regTriageTier"
                      value="observation"
                      checked={regTriageTier === "observation"}
                      onChange={() => setRegTriageTier("observation")}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Yellow: Watch / Observation</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Decompensated or post-trauma; requires telemetry and serial observation.
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    regTriageTier === "critical"
                      ? "bg-rose-50 border-rose-500 ring-2 ring-rose-400"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="regTriageTier"
                      value="critical"
                      checked={regTriageTier === "critical"}
                      onChange={() => setRegTriageTier("critical")}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs text-rose-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                      <span>Red: Critical Care</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Immediate attending medical intervention required (peritonitis, acute shock).
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Triage Rationale & Presenting Complaint
                  </label>
                  <input
                    type="text"
                    required
                    value={regComplaint}
                    onChange={e => setRegComplaint(e.target.value)}
                    placeholder="e.g. Acute abdominal pain right lower quadrant, high fever (38.2°C)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                  />
                </div>
              </div>

              {/* PHILHEALTH & FINANCIAL INSURANCE DATA */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} strokeWidth={2} className="text-emerald-700" />
                  <span>PhilHealth & Health Insurance Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PhilHealth Identification Number (PIN)
                    </label>
                    <input
                      type="text"
                      value={regPhilHealthPin}
                      onChange={e => setRegPhilHealthPin(e.target.value)}
                      placeholder="e.g. 12-054918234-1"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold bg-white"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">12-digit standard PhilHealth ID</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Membership Category
                    </label>
                    <select
                      value={regPhilHealthCategory}
                      onChange={e => setRegPhilHealthCategory(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white font-medium"
                    >
                      <option value="Direct Contributor - Private">Direct Contributor - Private (Formal Economy)</option>
                      <option value="Direct Contributor - Government">Direct Contributor - Government</option>
                      <option value="Direct Contributor - Self-Employed">Direct Contributor - Self-Employed / Professional</option>
                      <option value="Senior Citizen (RA 10645)">Senior Citizen (RA 10645 Mandatory)</option>
                      <option value="Indirect Contributor - Indigent">Indirect Contributor - Indigent / NHTS-PR</option>
                      <option value="PWD (RA 11228)">PWD (RA 11228 Qualified)</option>
                      <option value="Lifetime Member">Lifetime Member (Retiree)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Coverage & Benefit Package
                    </label>
                    <input
                      type="text"
                      value={regPhilHealthCoverage}
                      onChange={e => setRegPhilHealthCoverage(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* DIGITAL PATIENT CONSENTS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
                  <FileCheck size={16} strokeWidth={2} className="text-blue-600" />
                  <span>Digital Patient Consents (Mandatory Compliance)</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regConsentTreatment}
                      onChange={e => setRegConsentTreatment(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        1. Treatment & Clinical Care Consent
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Authorization for hospital clinicians to perform physical examination, diagnostic tests, and necessary bedside therapies.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regConsentSharing}
                      onChange={e => setRegConsentSharing(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        2. Sharing of Health Information Consent (RA 10173 Compliance)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Consent for processing and confidential sharing of health data between attending physicians, laboratory, and PhilHealth per DPA 2012.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regConsentContact}
                      onChange={e => setRegConsentContact(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        3. Contact & Telehealth Notice Consent
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Permission to send critical appointment updates, test readiness notices, and emergency family alerts via SMS/call.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Emergency Contact & Medical History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={regEmergName}
                    onChange={e => setRegEmergName(e.target.value)}
                    placeholder="Full name of spouse / parent / guardian"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={regEmergPhone}
                    onChange={e => setRegEmergPhone(e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={16} strokeWidth={2} />
                  <span>Register & Enroll Patient</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: INPATIENT BED ALLOCATION FORM                                */}
      {/* ========================================================================= */}
      {activeTab === "admit" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("roster")} label="Back to Master Directory" />

          <form onSubmit={handleAdmitSubmit} className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-serif text-xl text-slate-900 flex items-center gap-2">
                <Bed size={20} strokeWidth={2} className="text-emerald-600" />
                <span>Inpatient Ward & Bed Allocation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Admit an outpatient or emergency patient into a designated hospital room and bed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-xs bg-white"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — Currently {p.admissionStatus} [{p.triageTier.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Hospital Ward</label>
                <select
                  value={admitWard}
                  onChange={e => setAdmitWard(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white"
                >
                  <option value="Surgical Ward (3rd Floor)">Surgical Ward (3rd Floor)</option>
                  <option value="Medical Ward (4th Floor)">Medical Ward (4th Floor)</option>
                  <option value="Emergency Observation Unit">Emergency Observation Unit</option>
                  <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                  <option value="Pediatric Ward (2nd Floor)">Pediatric Ward (2nd Floor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Bed Number</label>
                <input
                  type="text"
                  required
                  value={admitBed}
                  onChange={e => setAdmitBed(e.target.value)}
                  placeholder="e.g. Bed 305-A"
                  className="w-full border rounded-lg p-2.5 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Attending Physician</label>
                <input
                  type="text"
                  required
                  value={admitDoctor}
                  onChange={e => setAdmitDoctor(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Admission Triage Tier</label>
                <select
                  value={admitTriage}
                  onChange={e => setAdmitTriage(e.target.value as any)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white font-bold"
                >
                  <option value="stable">Green: Stable</option>
                  <option value="observation">Yellow: Watch / Observation</option>
                  <option value="critical">Red: Critical Care</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Admission Diagnosis & Reason</label>
              <textarea
                rows={2}
                value={admitReason}
                onChange={e => setAdmitReason(e.target.value)}
                placeholder="Reason for inpatient admission, monitoring plan..."
                className="w-full border rounded-lg p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Bed size={16} strokeWidth={2} />
                <span>Confirm Bed Allocation</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: MASTER PATIENT DIRECTORY TABLE                                */}
      {/* ========================================================================= */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={20} strokeWidth={2} className="text-emerald-600" />
                  <span>Master Patient Directory Table</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Responsive structured database displaying patient records, PhilHealth PIN, triage tier, and room allocations.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search size={14} strokeWidth={2} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, ID, PIN..."
                    value={rosterSearch}
                    onChange={e => setRosterSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 sm:w-60 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={triageFilter}
                  onChange={e => setTriageFilter(e.target.value as any)}
                  className="border rounded-md px-3 py-1.5 text-xs bg-white"
                >
                  <option value="all">All Triage Tiers</option>
                  <option value="critical">🔴 Critical Care Only</option>
                  <option value="observation">🟡 Observation Only</option>
                  <option value="stable">🟢 Stable Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Patient Name & ID</th>
                    <th className="px-4 py-3">Triage Watch Tier</th>
                    <th className="px-4 py-3">PhilHealth Insurance PIN</th>
                    <th className="px-4 py-3">Demographics</th>
                    <th className="px-4 py-3">Status & Location</th>
                    <th className="px-4 py-3">Chief Complaint</th>
                    <th className="px-4 py-3">Digital Consents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.id}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.triageTier === "critical" && (
                          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                            <span>Critical Care</span>
                          </span>
                        )}
                        {p.triageTier === "observation" && (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Observation</span>
                          </span>
                        )}
                        {p.triageTier === "stable" && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Stable</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-900">
                          {p.philhealth?.pin || "— Not Enrolled —"}
                        </div>
                        <div className="text-[10px] text-slate-500">{p.philhealth?.category}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>{p.age}y/o {p.gender}</div>
                        <div className="text-[10px] text-slate-500">Blood: {p.bloodType}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.admissionStatus === "Admitted"
                            ? "bg-blue-100 text-blue-800"
                            : p.admissionStatus === "Observation"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {p.admissionStatus}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {p.ward || "OPD Clinic"} ({p.bed || "Chair"})
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 italic">"{p.chiefComplaint}"</p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Check size={12} strokeWidth={2} />
                          <span>3/3 Granted</span>
                        </span>
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
      {/* SUB-VIEW 4: FRONT DESK VISITOR LOG TABLE                                  */}
      {/* ========================================================================= */}
      {activeTab === "visitors" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("roster")} label="Back to Master Directory" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={20} strokeWidth={2} className="text-emerald-600" />
                  <span>Hospital Visitor Log & Security Badge Registry</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admissions front desk monitoring of visitor check-in, identity cards, badge numbers, and departure timestamps.
                </p>
              </div>

              <button
                onClick={() => setShowVisitorModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Log New Visitor</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Security Badge</th>
                    <th className="px-4 py-3">Patient Visited</th>
                    <th className="px-4 py-3">Visitor Name</th>
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
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${
                          v.status === "Currently Visiting"
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

      {/* MODAL: LOG NEW VISITOR */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-serif text-lg text-slate-900">Issue Visitor Security Pass</h3>
                <p className="text-xs text-slate-500">Admissions & Front Desk Verification</p>
              </div>
              <button onClick={() => setShowVisitorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleVisitorCheckIn} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Inpatient / Room</label>
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
                  value={visName}
                  onChange={e => setVisName(e.target.value)}
                  placeholder="Visitor legal name"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Relationship</label>
                  <select
                    value={visRel}
                    onChange={e => setVisRel(e.target.value)}
                    className="w-full border rounded-lg p-2.5 bg-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Legal Counsel">Legal Counsel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={visPhone}
                    onChange={e => setVisPhone(e.target.value)}
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
                    value={visIdCard}
                    onChange={e => setVisIdCard(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Visitor Badge #</label>
                  <input
                    type="text"
                    value={visBadge}
                    onChange={e => setVisBadge(e.target.value)}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Confirm & Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
