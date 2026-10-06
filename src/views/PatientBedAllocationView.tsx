import React, { useState } from "react";
import { User, Patient, AdmissionEntry, TriageTier } from "../types";
import { timestamp, uid } from "../services/ids";
import { useOpdData } from "../context/OpdDataContext";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import {
  Bed,
  UserPlus,
  Users,
  Search,
  Check,
  Activity,
  AlertTriangle,
  FileCheck,
  Plus,
  Building2,
} from "../components/Icons";
import { dt } from "../services/time";
import { useConfirm } from "../components/ConfirmDialog";
import ConditionBadge from "../components/ConditionBadge";

interface Props {
  user: User;
  patients: Patient[];
  admissions: AdmissionEntry[];
  onAddAdmission: (admission: AdmissionEntry) => void;
  onUpdatePatientStatus: (patientId: string, status: Patient["admissionStatus"], ward?: string, bed?: string) => void;
  onSignOut?: () => void;
}

const WARDS = [
  "Medical Ward (4th Floor)",
  "Surgical Ward (3rd Floor)",
  "Intensive Care Unit (ICU)",
  "Pediatric Ward (2nd Floor)",
  "OB-GYN Ward (5th Floor)",
  "OPD Ward (Minor Cases)",
];

export default function PatientBedAllocationView({
  user,
  patients,
  admissions,
  onAddAdmission,
  onUpdatePatientStatus,
}: Props) {
  const { usersList, transferPatient, vacateBed } = useOpdData();
  const confirm = useConfirm();
  const doctors = usersList.filter(u => u.role === "doctor" && u.status !== "suspended");
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<AdmissionEntry | null>(null);
  const [transferWard, setTransferWard] = useState("");
  const [transferBed, setTransferBed] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [wardFilter, setWardFilter] = useState("all");

  // Form State for Bed Allocation
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [admitWard, setAdmitWard] = useState(WARDS[0]);
  const [admitBed, setAdmitBed] = useState("");
  const [admitDoctor, setAdmitDoctor] = useState("");
  const [admitReason, setAdmitReason] = useState("");
  const [admitStatus, setAdmitStatus] = useState<"Admitted" | "Observation">("Admitted");

  // Tally & Metrics
  const activeAdmissions = admissions.filter(a => a.status === "Admitted" || a.status === "Observation");
  const occupiedCount = activeAdmissions.length;
  const totalBeds = 48; // Total hospital ward capacity
  const availableBeds = Math.max(0, totalBeds - occupiedCount);
  const occupancyPercentage = Math.round((occupiedCount / totalBeds) * 100);
  const criticalCount = activeAdmissions.filter(a => a.triageTier === "critical").length;

  /** Active admission already using this ward + bed (beds are compared ignoring case and spaces). */
  const bedKey = (w: string, b: string) => `${w}|${b.replace(/\s+/g, "").toLowerCase()}`;
  const occupiedBy = (ward: string, bed: string, exceptId?: string) =>
    activeAdmissions.find(a => a.id !== exceptId && bedKey(a.ward, a.bed) === bedKey(ward, bed));

  const handleAdmitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return setFormError("Select the patient.");
    if (!admitBed.trim()) return setFormError("Enter the bed / room number.");
    if (!admitDoctor) return setFormError("Select the attending doctor.");
    const already = activeAdmissions.find(a => a.patientId === patient.id);
    if (already) return setFormError(`${patient.name} already occupies ${already.ward} • ${already.bed}. Use Transfer to move the patient.`);
    const taken = occupiedBy(admitWard, admitBed.trim());
    if (taken) return setFormError(`${admitWard} • ${taken.bed} is occupied by ${taken.patientName}. Choose another bed.`);

    const newAdmission: AdmissionEntry = {
      id: `ADM-${uid()}`,
      patientId: patient.id,
      patientName: patient.name,
      admissionDate: timestamp().slice(0, 16),
      ward: admitWard,
      bed: admitBed.trim(),
      attendingPhysician: admitDoctor,
      admittingStaff: `${user.name} (${user.title})`,
      reason: admitReason || patient.chiefComplaint || "Inpatient continuous monitoring and management",
      triageTier: patient.triageTier,
      status: admitStatus,
    };

    onAddAdmission(newAdmission);
    onUpdatePatientStatus(patient.id, admitStatus, admitWard, admitBed.trim());
    setNotification(
      `Patient ${patient.name} (${patient.id}) successfully assigned to ${admitWard} • ${admitBed}.`
    );
    setAdmitReason("");
    setAdmitBed("");
    setSelectedPatientId("");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDischargePatient = async (admission: AdmissionEntry) => {
    const duplicate = activeAdmissions.some(a => a.id !== admission.id && a.patientId === admission.patientId);
    const ok = await confirm({
      title: `Vacate ${admission.bed}?`,
      message: duplicate ? (
        <>
          <b>{admission.patientName}</b> has another active bed record. This removes only this duplicate entry ({admission.ward} • {admission.bed}); the
          patient stays admitted.
        </>
      ) : (
        <>
          <b>{admission.ward} • {admission.bed}</b> will be freed and <b>{admission.patientName}</b> marked <b>Discharged</b> and <b>Stable</b>.
          <br />
          <br />
          Only do this after the doctor has cleared the patient for discharge.
        </>
      ),
      confirmText: duplicate ? "Remove Duplicate" : "Vacate Bed",
      tone: "danger",
    });
    if (!ok) return;
    vacateBed(admission, "Bed vacated after doctor's clearance");
    setNotification(`Bed ${admission.bed} in ${admission.ward} vacated. ${admission.patientName} discharged.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const openTransfer = (adm: AdmissionEntry) => {
    setTransferError(null);
    setTransferWard(adm.ward);
    setTransferBed("");
    setTransferReason("");
    setTransferring(adm);
  };

  const submitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferring) return;
    const bed = transferBed.trim();
    if (!bed) return setTransferError("Enter the new bed / room.");
    if (bedKey(transferWard, bed) === bedKey(transferring.ward, transferring.bed)) return setTransferError("That is the patient's current bed.");
    const taken = occupiedBy(transferWard, bed, transferring.id);
    if (taken) return setTransferError(`${transferWard} • ${taken.bed} is occupied by ${taken.patientName}.`);
    if (!transferReason.trim()) return setTransferError("Enter the reason for the transfer.");
    transferPatient(transferring, transferWard, bed, transferReason.trim());
    setNotification(`${transferring.patientName} transferred to ${transferWard} • ${bed}.`);
    setTransferring(null);
    setTimeout(() => setNotification(null), 5000);
  };

  // Filtered admissions list
  const filteredAdmissions = activeAdmissions.filter(adm => {
    const matchesSearch =
      adm.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.bed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.attendingPhysician.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (wardFilter === "all") return true;
    return adm.ward.toLowerCase().includes(wardFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      {/* Header Banner (Medzone Hospital Emerald Theme) */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <Bed size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Inpatient Ward & Bed Allocation</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time telemetry of occupied hospital units, vacant beds, and acute ward transfers.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-emerald-700 border border-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {availableBeds} Beds Vacant
          </span>
        </div>
      </div>

      {/* Ward Occupancy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ward Capacity</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalBeds} Beds</div>
            <span className="text-[10px] text-slate-500">Certified Inpatient Units</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Occupied Units</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{occupiedCount} Beds</div>
            <span className="text-[10px] font-semibold text-emerald-600">{occupancyPercentage}% Occupancy Rate</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bed size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Available Beds</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{availableBeds} Vacant</div>
            <span className="text-[10px] text-slate-500">Ready for immediate intake</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Critical Acuity Watch</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{criticalCount} Inpatients</div>
            <span className="text-[10px] text-rose-600 font-semibold">Tier 1 Intensive Monitoring</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Bed Allocation Intake Form (Left) & Active Ward Roster Table (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Direct Inpatient Bed Allocation Form (5 Cols) */}
        <div className="xl:col-span-5">
          <form onSubmit={handleAdmitSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Bed size={18} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  New Bed Allocation Intake Form
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Inpatient Admission
              </span>
            </div>

            <div className="space-y-3">
              {/* Select Patient */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Select Registered Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  required
                >
                  <option value="">— Select patient —</option>
                  {patients
                    .filter(p => !activeAdmissions.some(a => a.patientId === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {p.admissionStatus}
                      </option>
                    ))}
                </select>
              </div>

              {/* Ward & Bed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Assigned Ward <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={admitWard}
                    onChange={e => setAdmitWard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    {WARDS.map(w => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Bed / Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={admitBed}
                    onChange={e => setAdmitBed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    placeholder="e.g. Bed 401-A"
                    required
                  />
                </div>
              </div>

              {/* Attending Physician */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Attending Physician <span className="text-rose-500">*</span>
                </label>
                <select
                  value={admitDoctor}
                  onChange={e => setAdmitDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                >
                  <option value="">— Select doctor —</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.licenseNumber ? `${d.name} (${d.licenseNumber})` : d.name}>
                      {d.name}
                      {d.department ? ` — ${d.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Triage Acuity & Admission Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Patient Condition
                  </label>
                  {selectedPatientId ? (
                    <ConditionBadge patientId={selectedPatientId} />
                  ) : (
                    <span className="text-[11px] text-slate-400">Select a patient</span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Set by the doctor</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Admission Status
                  </label>
                  <select
                    value={admitStatus}
                    onChange={e => setAdmitStatus(e.target.value as "Admitted" | "Observation")}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Admitted">Formally Admitted</option>
                    <option value="Observation">Ward Observation</option>
                  </select>
                </div>
              </div>

              {/* Admission Reason */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Clinical Indication & Diagnosis
                </label>
                <textarea
                  rows={2}
                  value={admitReason}
                  onChange={e => setAdmitReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  placeholder="e.g. Inpatient IV antibiotic management and continuous cardiopulmonary monitoring..."
                />
              </div>

              {formError && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{formError}</div>}
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                <span>Confirm Bed Allocation & Admit</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Inpatient Ward Allocation Table (7 Cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Users size={16} className="text-slate-600" />
                  <span>Active Inpatient Bed Allocation Directory ({filteredAdmissions.length})</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search patient or bed..."
                    className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 focus:outline-hidden focus:bg-white"
                  />
                </div>

                {/* Ward Filter */}
                <select
                  value={wardFilter}
                  onChange={e => setWardFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="all">All Wards</option>
                  <option value="medical">Medical</option>
                  <option value="surgical">Surgical</option>
                  <option value="icu">ICU</option>
                </select>
              </div>
            </div>

            {filteredAdmissions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No active inpatient bed allocations found matching the filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2.5 px-3">Patient & MRN</th>
                      <th className="py-2.5 px-3">Ward & Bed</th>
                      <th className="py-2.5 px-3">Admission Time</th>
                      <th className="py-2.5 px-3">Acuity</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmissions.map(adm => (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{adm.patientName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{adm.patientId}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block border border-emerald-200 text-[11px]">
                            {adm.bed}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{adm.ward}</div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          <div>{dt(adm.admissionDate)}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{adm.attendingPhysician}</div>
                        </td>
                        <td className="py-3 px-3">
                          <ConditionBadge patientId={adm.patientId} fallback={adm.triageTier} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openTransfer(adm)}
                            className="text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer mr-1.5"
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => handleDischargePatient(adm)}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Vacate Bed
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {transferring && (
        <Modal
          title={`Transfer ${transferring.patientName}`}
          subtitle={`Currently in ${transferring.ward} • ${transferring.bed}`}
          onClose={() => setTransferring(null)}
          footer={
            <>
              <button type="button" onClick={() => setTransferring(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="transfer-form" className={ui.primaryBtn}>
                Confirm Transfer
              </button>
            </>
          }
        >
          <form id="transfer-form" onSubmit={submitTransfer} className="space-y-3">
            {transferError && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{transferError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>New ward *</label>
                <select value={transferWard} onChange={e => setTransferWard(e.target.value)} className={ui.input}>
                  {WARDS.map(w => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>New bed / room *</label>
                <input value={transferBed} onChange={e => setTransferBed(e.target.value)} placeholder="e.g. Bed 402-B" className={ui.input} />
              </div>
            </div>
            <div>
              <label className={ui.label}>Reason for transfer *</label>
              <input value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="e.g. Needs ICU monitoring; isolation" className={ui.input} />
            </div>
            <p className="text-slate-500">The transfer is saved in the patient's Transfer &amp; Discharge History.</p>
          </form>
        </Modal>
      )}
    </div>
  );
}
