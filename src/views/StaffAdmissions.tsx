import { useState } from "react";
import { User, Patient, AdmissionEntry } from "../types";
import BackButton from "../components/BackButton";
import {
  UserPlus,
  Bed,
  Users,
  Search,
  Check,
  X,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  admissions: AdmissionEntry[];
  onAddAdmission: (a: AdmissionEntry) => void;
  onUpdatePatientStatus: (patientId: string, status: Patient["admissionStatus"], ward?: string, bed?: string) => void;
  onSignOut: () => void;
}

type StaffTab = "register" | "admit" | "roster";

export default function StaffAdmissions({
  user,
  patients,
  onAddPatient,
  admissions,
  onAddAdmission,
  onUpdatePatientStatus,
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
  const [regEmergName, setRegEmergName] = useState("");
  const [regEmergRel, setRegEmergRel] = useState("Spouse");
  const [regEmergPhone, setRegEmergPhone] = useState("");

  // Form State for Admission
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [admitWard, setAdmitWard] = useState("Medical Ward (4th Floor)");
  const [admitBed, setAdmitBed] = useState("Bed 401-A");
  const [admitDoctor, setAdmitDoctor] = useState("Dr. Jose Reyes, MD");
  const [admitReason, setAdmitReason] = useState("");
  const [admitStatus, setAdmitStatus] = useState<"Admitted" | "Observation">("Admitted");

  // Roster search
  const [rosterSearch, setRosterSearch] = useState("");

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
      address: regAddress || "Metro Manila",
      bloodType: regBloodType,
      allergies: regAllergies ? regAllergies.split(",").map(a => a.trim()) : ["None reported"],
      chiefComplaint: regComplaint || "Routine consultation / admission intake",
      emergencyContact: {
        name: regEmergName || "Guardian",
        relationship: regEmergRel,
        phone: regEmergPhone || regContact || "N/A",
      },
      admissionStatus: "Outpatient",
      registeredAt: new Date().toISOString().split("T")[0],
    };

    onAddPatient(newPatient);
    setNotification(`New patient registered successfully! Assigned Hospital ID: ${newId}`);
    setRegName("");
    setRegDob("");
    setRegContact("");
    setRegAddress("");
    setRegAllergies("");
    setRegComplaint("");
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
      status: admitStatus,
    };

    onAddAdmission(newAdmission);
    onUpdatePatientStatus(patient.id, admitStatus, admitWard, admitBed);
    setNotification(`Patient ${patient.name} admitted to ${admitWard}, ${admitBed}!`);
    setAdmitReason("");
    setActiveTab("roster");
    setTimeout(() => setNotification(null), 6000);
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(rosterSearch.toLowerCase()) ||
    (p.ward && p.ward.toLowerCase().includes(rosterSearch.toLowerCase()))
  );

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
              onClick={() => setActiveTab("register")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <UserPlus size={16} strokeWidth={2} />
              <span>Register New Patient</span>
            </button>
            <button
              onClick={() => setActiveTab("admit")}
              className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-white/20 transition-colors inline-flex items-center gap-1.5"
            >
              <Bed size={16} strokeWidth={2} />
              <span>Admit to Bed</span>
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
            <UserPlus size={16} strokeWidth={2} className="text-slate-300" />
            <span>New Patient Intake Registration</span>
          </button>
          <button
            onClick={() => setActiveTab("admit")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "admit"
                ? "bg-emerald-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Bed size={16} strokeWidth={2} className="text-slate-300" />
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
            <Users size={16} strokeWidth={2} className="text-slate-300" />
            <span>Master Patient Directory ({patients.length})</span>
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

      {/* SUB-VIEW 1: REGISTER INTAKE FORM */}
      {activeTab === "register" && (
        <div className="space-y-6">
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="border-b border-[var(--border)] pb-4 mb-5">
                <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                  <UserPlus size={20} strokeWidth={2} className="text-slate-500" />
                  <span>New Patient Demographic Registration</span>
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Standard demographic dataset and official patient enrollment
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Santos, Maria Cruz"
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={regDob}
                    onChange={e => setRegDob(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Sex
                  </label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value as any)}
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Civil Status
                  </label>
                  <select
                    value={regCivilStatus}
                    onChange={e => setRegCivilStatus(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    placeholder="Barangay, City, Province"
                    className="w-full border border-[var(--border)] rounded-lg p-2.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-base text-[var(--foreground)] border-b border-[var(--border)] pb-3 mb-4">
                Emergency Contact & Clinical Pre-Screening
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Emergency Contact Name</label>
                  <input value={regEmergName} onChange={e => setRegEmergName(e.target.value)} placeholder="e.g. Juan Santos" className="w-full border rounded-lg p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Relationship</label>
                  <input value={regEmergRel} onChange={e => setRegEmergRel(e.target.value)} placeholder="Spouse / Parent" className="w-full border rounded-lg p-2.5 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Emergency Phone</label>
                  <input value={regEmergPhone} onChange={e => setRegEmergPhone(e.target.value)} placeholder="0918-000-0000" className="w-full border rounded-lg p-2.5 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Blood Type</label>
                  <select value={regBloodType} onChange={e => setRegBloodType(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Known Allergies</label>
                  <input value={regAllergies} onChange={e => setRegAllergies(e.target.value)} placeholder="Penicillin, NSAIDs (or leave blank)" className="w-full border rounded-lg p-2.5 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Presenting Chief Complaint / Reason for Visit</label>
                <textarea rows={2} value={regComplaint} onChange={e => setRegComplaint(e.target.value)} placeholder="Reason for consultation, triage complaints..." className="w-full border rounded-lg p-2.5 text-xs resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-8 py-3 rounded-lg shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlus size={16} strokeWidth={2} />
                <span>Register Patient in HIS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 2: INPATIENT BED ADMISSION */}
      {activeTab === "admit" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("roster")} label="Back to Patient Directory" />

          <form onSubmit={handleAdmitSubmit} className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-sm space-y-5">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-serif text-2xl text-[var(--foreground)] flex items-center gap-2">
                <Bed size={20} strokeWidth={2} className="text-slate-500" />
                <span>Inpatient Ward Bed Allocation</span>
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Assign a hospital room/bed and admit a registered patient
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">
                  Select Registered Patient <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) — Status: {p.admissionStatus} {p.ward ? `[${p.ward}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Ward Unit <span className="text-red-500">*</span></label>
                <select value={admitWard} onChange={e => setAdmitWard(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                  <option value="Medical Ward (4th Floor)">Medical Ward (4th Floor)</option>
                  <option value="Surgical Ward (3rd Floor)">Surgical Ward (3rd Floor)</option>
                  <option value="Emergency Observation Unit">Emergency Observation Unit</option>
                  <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                  <option value="Pediatric Ward (5th Floor)">Pediatric Ward (5th Floor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Bed / Room Number <span className="text-red-500">*</span></label>
                <input type="text" required value={admitBed} onChange={e => setAdmitBed(e.target.value)} placeholder="e.g. Bed 402-A" className="w-full border rounded-lg p-2.5 text-xs" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Attending Physician <span className="text-red-500">*</span></label>
                <select value={admitDoctor} onChange={e => setAdmitDoctor(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                  <option value="Dr. Jose Reyes, MD">Dr. Jose Reyes, MD (Internal Medicine)</option>
                  <option value="Dr. Ana Cruz, MD">Dr. Ana Cruz, MD (General Surgery)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Admission Type</label>
                <select value={admitStatus} onChange={e => setAdmitStatus(e.target.value as any)} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                  <option value="Admitted">Inpatient Admission</option>
                  <option value="Observation">Short-term Observation (&lt; 24 hrs)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] mb-1">Admitting Diagnosis & Clinical Rationale <span className="text-red-500">*</span></label>
                <textarea rows={2} required value={admitReason} onChange={e => setAdmitReason(e.target.value)} placeholder="Clinical reason for admission..." className="w-full border rounded-lg p-2.5 text-xs resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab("roster")}
                className="px-5 py-2.5 border rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5"
              >
                <Bed size={16} strokeWidth={2} />
                <span>Confirm Bed Allocation & Admission</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 3: ROSTER */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm flex items-center gap-3">
            <Search size={16} strokeWidth={2} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={rosterSearch}
              onChange={e => setRosterSearch(e.target.value)}
              placeholder="Search by patient name, hospital ID, or ward..."
              className="w-full text-xs focus:outline-none"
            />
          </div>

          <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[var(--muted-foreground)] uppercase font-semibold border-b border-[var(--border)]">
                  <tr>
                    <th className="px-5 py-3.5">Patient Name & ID</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Assigned Ward & Bed</th>
                    <th className="px-4 py-3.5">Attending Physician</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-sm text-[var(--foreground)]">{p.name}</div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          {p.id} · {p.age}y/o {p.gender} · Blood: {p.bloodType}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          p.admissionStatus === "Admitted" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {p.admissionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.ward ? (
                          <div>
                            <div className="font-medium">{p.ward}</div>
                            <div className="text-[11px] text-slate-400">{p.bed}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No bed (Outpatient)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{p.attendingPhysician || "Dr. Jose Reyes"}</td>
                      <td className="px-4 py-3.5 text-right">
                        {p.admissionStatus === "Admitted" ? (
                          <button
                            onClick={() => {
                              onUpdatePatientStatus(p.id, "Discharged");
                              setNotification(`Discharge processed for ${p.name}.`);
                            }}
                            className="text-xs text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded font-semibold"
                          >
                            Discharge
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setActiveTab("admit");
                            }}
                            className="text-xs text-emerald-700 border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded font-semibold inline-flex items-center gap-1"
                          >
                            <Bed size={14} strokeWidth={2} />
                            <span>Admit to Bed</span>
                          </button>
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
    </div>
  );
}
