import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Patient, TriageTier } from "../types";
import {
  UserPlus,
  Check,
  ShieldCheck,
  FileCheck,
  Phone,
  AlertCircle,
  Clock,
  HeartPulse,
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

  // Column 1: Patient Demographics Form State
  const [regName, setRegName] = useState("");
  const [regDob, setRegDob] = useState("1995-06-15");
  const [regGender, setRegGender] = useState<"Female" | "Male" | "Other">("Female");
  const [regCivilStatus, setRegCivilStatus] = useState("Single");
  const [regContact, setRegContact] = useState("0917-555-0192");
  const [regAddress, setRegAddress] = useState("CarePoint Community, Pasig City");
  const [regBloodType, setRegBloodType] = useState("O+");
  const [regAllergies, setRegAllergies] = useState("None reported");

  // Column 2: Emergency Contact & Initial Visit Reason
  const [regEmergName, setRegEmergName] = useState("");
  const [regEmergRel, setRegEmergRel] = useState("Spouse");
  const [regEmergPhone, setRegEmergPhone] = useState("");
  const [regComplaint, setRegComplaint] = useState("");
  const [regDepartmentTriage, setRegDepartmentTriage] = useState("Outpatient Department (OPD)");
  const [regTriageTier, setRegTriageTier] = useState<TriageTier>("stable");
  const [regTriageReason, setRegTriageReason] = useState("");

  // Digital Consents
  const [regConsentTreatment, setRegConsentTreatment] = useState(true);
  const [regConsentPrivacy, setRegConsentPrivacy] = useState(true);

  // Dynamic Age calculation
  const calculatedAge = regDob
    ? Math.max(0, new Date().getFullYear() - new Date(regDob).getFullYear())
    : 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    const newId = `P-2026-${String(patients.length + 1).padStart(3, "0")}`;

    const newPatient: Patient = {
      id: newId,
      name: regName.trim(),
      dob: regDob || "1995-01-01",
      age: calculatedAge,
      gender: regGender,
      civilStatus: regCivilStatus,
      contact: regContact || "09XX-XXX-XXXX",
      address: regAddress || "Metro Manila, Philippines",
      bloodType: regBloodType,
      allergies: regAllergies ? regAllergies.split(",").map(a => a.trim()) : ["None reported"],
      chiefComplaint: regComplaint || "Routine clinical consultation / Outpatient intake",
      triageTier: regTriageTier,
      triageReason: regTriageReason || `Triage to ${regDepartmentTriage}`,
      emergencyContact: {
        name: regEmergName.trim() || "Designated Relative",
        relationship: regEmergRel,
        phone: regEmergPhone.trim() || regContact || "N/A",
      },
      admissionStatus: "Outpatient",
      ward: regDepartmentTriage,
      bed: "Waiting Area",
      registeredAt: new Date().toISOString().split("T")[0],
      consents: {
        treatmentCareConsent: regConsentTreatment,
        healthInfoSharingConsent: regConsentPrivacy,
        contactNoticeConsent: true,
        signedDate: new Date().toISOString().split("T")[0],
        witnessStaff: `${user.name} (${user.licenseNumber || user.id})`,
      },
      medicalHistory: {
        pastMedical: ["None reported"],
        pastSurgical: ["None"],
        familyHistory: ["Non-contributory"],
        chronicConditions: [],
      },
    };

    onAddPatient(newPatient);
    setNotification(
      `Patient ${newPatient.name} successfully admitted to active queue! Assigned Hospital MRN: ${newId}.`
    );

    // Reset Form
    setRegName("");
    setRegEmergName("");
    setRegEmergPhone("");
    setRegComplaint("");
    setRegTriageReason("");

    setTimeout(() => {
      setNotification(null);
      navigate("/registration/directory");
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner (Medzone Emerald Hospital Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <UserPlus size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Patient Registration & Intake</h1>
            <p className="text-xs text-slate-500 mt-0.5">Intake Officer: <span className="font-semibold text-slate-800">{user.name}</span> ({user.department || user.title})</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/registration/directory")}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
          >
            <span>Master Directory</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Card Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN 1: PATIENT DEMOGRAPHICS */}
          <div className="bg-white rounded-3xl border border-slate-100/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Patient Demographics</h2>
                <p className="text-[11px] text-slate-500">Essential identity and contact data</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Maria Clara Santos"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={e => setRegDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Calculated Age
                  </label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold">
                    {calculatedAge} years old
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Sex / Gender
                  </label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    placeholder="0917-123-4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Blood Type
                  </label>
                  <select
                    value={regBloodType}
                    onChange={e => setRegBloodType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
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

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  placeholder="Unit, Street, Barangay, City, Province"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  value={regAllergies}
                  onChange={e => setRegAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, NSAIDs, Shellfish (or 'None reported')"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* COLUMN 2: EMERGENCY CONTACT & INITIAL VISIT REASON */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Emergency Contact & Visit Reason</h2>
                <p className="text-[11px] text-slate-500">Next-of-kin, chief complaint, and triage</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Emergency Contact Sub-group */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase text-teal-800 flex items-center gap-1.5">
                  <Phone size={14} className="text-teal-700" />
                  <span>Emergency Contact Person</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regEmergName}
                    onChange={e => setRegEmergName(e.target.value)}
                    placeholder="e.g. Juan Santos"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-teal-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Relationship
                    </label>
                    <select
                      value={regEmergRel}
                      onChange={e => setRegEmergRel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:border-teal-500 outline-hidden"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Legal Guardian</option>
                      <option value="Other">Other Relative</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={regEmergPhone}
                      onChange={e => setRegEmergPhone(e.target.value)}
                      placeholder="0918-444-9876"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-teal-500 outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Reason & Triage */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Initial Chief Complaint / Presenting Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={regComplaint}
                  onChange={e => setRegComplaint(e.target.value)}
                  placeholder="Describe main symptoms, onset, and chief complaint (e.g. Persistent fever and non-productive cough x 3 days with fatigue)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Department Triage
                  </label>
                  <select
                    value={regDepartmentTriage}
                    onChange={e => setRegDepartmentTriage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden font-medium"
                  >
                    <option value="Outpatient Department (OPD)">Outpatient Dept (OPD)</option>
                    <option value="Internal Medicine Specialty">Internal Medicine</option>
                    <option value="General & Minor Surgery">General Surgery</option>
                    <option value="Pediatrics Clinic">Pediatrics</option>
                    <option value="Emergency & Trauma Unit">Emergency Unit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                    Initial Acuity Priority
                  </label>
                  <select
                    value={regTriageTier}
                    onChange={e => setRegTriageTier(e.target.value as TriageTier)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                  >
                    <option value="stable">Green: Tier 3 Stable</option>
                    <option value="observation">Yellow: Tier 2 Observation</option>
                    <option value="critical">Red: Tier 1 Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Triage Assessment Notes
                </label>
                <input
                  type="text"
                  value={regTriageReason}
                  onChange={e => setRegTriageReason(e.target.value)}
                  placeholder="e.g. Vitals stable upon arrival; ambulatory without assistance"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Digital Consents & Submit Bar */}
        <div className="bg-white rounded-3xl border border-slate-100/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={regConsentTreatment}
                onChange={e => setRegConsentTreatment(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 border-slate-300"
              />
              <span>Patient authorizes clinical evaluation, nursing care, and emergency procedures.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={regConsentPrivacy}
                onChange={e => setRegConsentPrivacy(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 border-slate-300"
              />
              <span>DPA 2012 Consent for electronic health record processing at CarePoint Medical Center.</span>
            </label>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/registration/directory")}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-full text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} strokeWidth={2} />
              <span>Enroll Patient & Enqueue</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
