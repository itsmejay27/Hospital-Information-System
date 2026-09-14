import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Patient, TriageTier, PhilHealthCategory } from "../types";
import {
  UserPlus,
  Check,
  ShieldCheck,
  FileCheck,
  CreditCard,
  Phone,
  AlertCircle,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onSignOut?: () => void;
}

export default function RegistrationNewPatientView({ user, patients, onAddPatient }: Props) {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
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

  // PhilHealth Fields
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

  const handleSubmit = (e: React.FormEvent) => {
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
      chiefComplaint: regComplaint || "Routine outpatient consultation / clinical intake",
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
    setNotification(
      `Patient ${newPatient.name} enrolled successfully! Assigned Hospital MRN: ${newId}.`
    );

    // Clear form
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

    setTimeout(() => {
      setNotification(null);
      navigate("/registration/directory");
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Registration & Intake • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/registration/new-patient</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserPlus size={24} className="text-emerald-600" />
            <span>New Patient Intake & PhilHealth Enrollment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admissions Officer: <span className="font-semibold text-slate-800">{user.name}</span> ({user.department})
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* Section 1: Demographics */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-600" />
            <span>1. Patient Personal & Contact Demographics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="e.g. Maria Clara Santos"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={regDob}
                onChange={e => setRegDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Gender
              </label>
              <select
                value={regGender}
                onChange={e => setRegGender(e.target.value as "Female" | "Male" | "Other")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Civil Status
              </label>
              <select
                value={regCivilStatus}
                onChange={e => setRegCivilStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Blood Type
              </label>
              <select
                value={regBloodType}
                onChange={e => setRegBloodType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
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

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Current Residential Address
              </label>
              <input
                type="text"
                value={regAddress}
                onChange={e => setRegAddress(e.target.value)}
                placeholder="Unit, Street, Barangay, City/Municipality, Province"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={regContact}
                onChange={e => setRegContact(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Intake & Acuity */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <FileCheck size={16} className="text-emerald-600" />
            <span>2. Intake Chief Complaint & Triage Acuity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Chief Complaint / Presenting Symptom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={regComplaint}
                onChange={e => setRegComplaint(e.target.value)}
                placeholder="Reason for consultation (e.g. Persistent fever and dry cough for 3 days)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Initial Triage Acuity Tier
              </label>
              <select
                value={regTriageTier}
                onChange={e => setRegTriageTier(e.target.value as TriageTier)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
              >
                <option value="stable">Green: Tier 3 Stable</option>
                <option value="observation">Yellow: Tier 2 Observation</option>
                <option value="critical">Red: Tier 1 Critical</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Known Drug / Food Allergies
              </label>
              <input
                type="text"
                value={regAllergies}
                onChange={e => setRegAllergies(e.target.value)}
                placeholder="e.g. Penicillin, NSAIDs, Shellfish (or leave blank if NKDA)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: PhilHealth Information */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-600" />
            <span>3. PhilHealth & Universal Health Care Coverage</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                PhilHealth PIN Number
              </label>
              <input
                type="text"
                value={regPhilHealthPin}
                onChange={e => setRegPhilHealthPin(e.target.value)}
                placeholder="e.g. 12-345678901-2"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Membership Category
              </label>
              <select
                value={regPhilHealthCategory}
                onChange={e => setRegPhilHealthCategory(e.target.value as PhilHealthCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
              >
                <option value="Direct Contributor - Private">Direct Contributor - Private Employee</option>
                <option value="Direct Contributor - Government">Direct Contributor - Government Employee</option>
                <option value="Direct Contributor - Self-Employed">Direct Contributor - Self-Employed / Professional</option>
                <option value="Indirect Contributor - Indigent">Indirect Contributor - Indigent / 4Ps</option>
                <option value="Senior Citizen (RA 10645)">Senior Citizen (RA 10645)</option>
                <option value="PWD (RA 11228)">PWD (RA 11228)</option>
                <option value="Lifetime Member">Lifetime Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: DPA Consents */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>4. Data Privacy Act (RA 10173) & Clinical Care Consents</span>
          </h3>

          <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={regConsentTreatment}
                onChange={e => setRegConsentTreatment(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">
                General Consent to Outpatient / Inpatient Medical Treatment and Diagnostic Procedures
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={regConsentSharing}
                onChange={e => setRegConsentSharing(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">
                Authorized Health Information Sharing with PhilHealth & Consulting Medical Specialists
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={regConsentContact}
                onChange={e => setRegConsentContact(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">
                SMS / Voice Contact Authorization for Lab Result Release & Appointment Reminders
              </span>
            </label>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Witnessing Staff: {user.name} ({user.licenseNumber || user.id})
          </span>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Enroll & Register Patient</span>
          </button>
        </div>
      </form>
    </div>
  );
}
