import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import { DiagnosticResult, DoctorOrder, MedicationOrder, OpdCase, OpdCaseType, OpdCaseVitals, Patient, TriageTier } from "../types";
import { localDate, timestamp, uid } from "../services/ids";
import { dt } from "../services/time";
import { CASE_TEMPLATES, evaluateRedFlags, suggestedTriage, templateFor, VITAL_LABELS, VitalKey } from "../services/opdCases";
import { useCollection } from "../hooks/useCollection";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConditionBadge from "../components/ConditionBadge";
import * as ui from "../components/tableStyles";
import { AlertTriangle, Search, Stethoscope } from "../components/Icons";

export const OPD_WARD = "OPD Ward (Minor Cases)";
const ALL_VITALS: VitalKey[] = ["bp", "hr", "rr", "temp", "spo2", "bloodSugar", "weight", "stools"];
type Tab = "active" | "released" | "all";

const ageFrom = (dob: string) => {
  const d = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return Math.max(0, a);
};

interface IntakeDraft {
  mode: "existing" | "new";
  patientId: string;
  name: string;
  dob: string;
  gender: Patient["gender"];
  contact: string;
  allergies: string;
  caseType: OpdCaseType;
  symptoms: string[];
  complaint: string;
  doctorName: string;
  vitals: Partial<OpdCaseVitals>;
  triage: TriageTier;
  triageTouched: boolean;
}

/**
 * OPD Ward — minor cases (URTI/flu, hypertension, diabetes, asthma/bronchitis, UTI, AGE).
 * Nurses add the patient, take vital signs and give care; doctors sign the standard orders
 * and decide: send home, admit, or refer/transfer. Every step is kept in the patient's history.
 */
export default function OpdWardView() {
  const { user } = useAuth();
  const {
    patients,
    usersList,
    addPatient,
    checkInPatient,
    updatePatientAdmissionStatus,
    updatePatientCondition,
    recordMovement,
    addMedication,
    addLabResult,
    dischargePatient,
  } = useOpdData();
  const { saveDoctorOrder } = useWardData();
  const cases = useCollection<OpdCase>("opd_cases");
  const navigate = useNavigate();
  const isDoctor = user?.role === "doctor";

  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [intake, setIntake] = useState<IntakeDraft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Case dialog state
  const [recheck, setRecheck] = useState<Partial<OpdCaseVitals>>({});
  const [careText, setCareText] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [plan, setPlan] = useState("");
  const [dispo, setDispo] = useState<null | "home" | "admit" | "refer">(null);
  const [homeInstructions, setHomeInstructions] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [referTo, setReferTo] = useState("");
  const [referReason, setReferReason] = useState("");
  const [stableConfirmed, setStableConfirmed] = useState(false);

  const doctors = usersList.filter(u => u.role === "doctor" && u.status !== "suspended");
  const today = localDate();
  const current = cases.items.find(c => c.id === openId) || null;

  const q = search.toLowerCase();
  const rows = useMemo(
    () =>
      cases.items
        .filter(c => (tab === "active" ? c.status === "In OPD Ward" : tab === "released" ? c.status !== "In OPD Ward" : true))
        .filter(c => !q || [c.patientName, c.patientId, c.caseType, c.complaint].some(v => v.toLowerCase().includes(q)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [cases.items, tab, q]
  );
  const counts = {
    active: cases.items.filter(c => c.status === "In OPD Ward").length,
    released: cases.items.filter(c => c.status !== "In OPD Ward").length,
    all: cases.items.length,
  };
  const activeByType = (t: OpdCaseType) => cases.items.filter(c => c.status === "In OPD Ward" && c.caseType === t).length;

  if (!user) return null;
  const signature = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 5000);
  };

  // ---------------- Intake ----------------
  const startIntake = (caseType: OpdCaseType = "URTI / Common Cold / Flu") => {
    setError(null);
    setIntake({
      mode: "existing",
      patientId: "",
      name: "",
      dob: "",
      gender: "Female",
      contact: "",
      allergies: "",
      caseType,
      symptoms: [],
      complaint: "",
      doctorName: isDoctor ? user.name : doctors[0]?.name || "",
      vitals: {},
      triage: "stable",
      triageTouched: false,
    });
  };

  const intakeFlags = intake ? evaluateRedFlags(intake.caseType, intake.symptoms, intake.vitals) : [];
  const setIntakeField = (patch: Partial<IntakeDraft>) =>
    setIntake(d => {
      if (!d) return d;
      const next = { ...d, ...patch };
      if (!next.triageTouched) next.triage = suggestedTriage(evaluateRedFlags(next.caseType, next.symptoms, next.vitals));
      return next;
    });

  const submitIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intake) return;
    const tpl = templateFor(intake.caseType);
    const complaint = intake.complaint.trim() || [intake.caseType, ...intake.symptoms].join(" — ");
    if (intake.symptoms.length === 0 && !intake.complaint.trim()) return setError("Tick the symptoms or type the complaint.");
    if (!intake.doctorName) return setError("Choose the doctor who will see the patient.");
    const hasVitals = Object.values(intake.vitals).some(v => String(v || "").trim());
    if (!hasVitals) return setError("Enter at least one vital sign (BP, temperature, SpO2…).");

    let patient: Patient | undefined;
    if (intake.mode === "new") {
      if (!intake.name.trim() || !intake.dob) return setError("Enter the patient's name and date of birth.");
      if (intake.dob > today) return setError("Date of birth cannot be in the future.");
      patient = {
        id: `P-${new Date().getFullYear()}-${uid()}`,
        name: intake.name.trim(),
        dob: intake.dob,
        age: ageFrom(intake.dob),
        gender: intake.gender,
        civilStatus: "Not provided",
        contact: intake.contact.trim() || "Not provided",
        address: "Not provided",
        emergencyContact: { name: "Not provided", relationship: "", phone: "" },
        bloodType: "Unknown",
        allergies: intake.allergies.trim() ? intake.allergies.split(",").map(a => a.trim()).filter(Boolean) : ["None reported"],
        chiefComplaint: complaint,
        triageTier: intake.triage,
        triageReason: intakeFlags.length ? `OPD Ward: ${intakeFlags.join("; ")}` : `OPD Ward: ${tpl.short}`,
        admissionStatus: "Outpatient",
        ward: OPD_WARD,
        attendingPhysician: intake.doctorName,
        registeredAt: today,
      };
    } else {
      patient = patients.find(p => p.id === intake.patientId);
      if (!patient) return setError("Select the patient (or choose New patient).");
      if (cases.items.some(c => c.patientId === patient!.id && c.status === "In OPD Ward")) return setError(`${patient.name} is already in the OPD Ward.`);
    }

    setBusy(true);
    const vitals: OpdCaseVitals = { ...(intake.vitals as OpdCaseVitals), at: timestamp().slice(0, 16), by: signature };
    const record: OpdCase = {
      id: `OPDC-${uid()}`,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      gender: patient.gender,
      caseType: intake.caseType,
      symptoms: intake.symptoms,
      complaint,
      vitals: [vitals],
      redFlags: intakeFlags,
      care: [],
      status: "In OPD Ward",
      createdAt: timestamp().slice(0, 16),
      createdBy: signature,
    };
    const err = await cases.save(record, `Added to OPD Ward: ${intake.caseType}${intakeFlags.length ? ` (red flags: ${intakeFlags.join(", ")})` : ""}`, {
      patientId: patient.id,
      patientName: patient.name,
    });
    setBusy(false);
    if (err) return setError(err);

    if (intake.mode === "new") {
      addPatient(patient); // registers and puts the patient in the doctor's queue
    } else {
      checkInPatient(patient.id, intake.doctorName, complaint); // ignored if already in the queue
      updatePatientAdmissionStatus(patient.id, "Outpatient", OPD_WARD, "");
      if (patient.triageTier !== intake.triage) updatePatientCondition(patient.id, intake.triage, intakeFlags.length ? `OPD Ward: ${intakeFlags.join("; ")}` : "OPD Ward intake");
    }
    recordMovement({
      patientId: patient.id,
      patientName: patient.name,
      type: "Moved to OPD Ward",
      from: intake.mode === "new" ? "New patient" : patient.ward || "OPD",
      to: OPD_WARD,
      conditionAfter: intake.triage,
      details: `${intake.caseType}${intakeFlags.length ? ` • Red flags: ${intakeFlags.join(", ")}` : ""}`,
      sourceId: record.id,
    });
    setIntake(null);
    flash(`${patient.name} added to the OPD Ward (${tpl.short}) and sent to ${intake.doctorName}'s queue.`);
  };

  // ---------------- Case actions ----------------
  const openCase = (c: OpdCase) => {
    const tpl = templateFor(c.caseType);
    setError(null);
    setRecheck({});
    setCareText("");
    setSelectedOrders(new Set(tpl.orders.map((o, i) => (o.preselect ? i : -1)).filter(i => i >= 0)));
    setPlan(c.doctorPlan || "");
    setDispo(null);
    setHomeInstructions(tpl.homeAdvice);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFollowUp(localDate(d));
    setReferTo("");
    setReferReason("");
    setStableConfirmed(false);
    setOpenId(c.id);
  };

  const saveCase = async (c: OpdCase, action: string) => {
    setBusy(true);
    const err = await cases.save(c, action, { patientId: c.patientId, patientName: c.patientName });
    setBusy(false);
    if (err) setError(err);
    return !err;
  };

  const addVitals = async () => {
    if (!current) return;
    if (!Object.values(recheck).some(v => String(v || "").trim())) return setError("Enter at least one value.");
    const entry: OpdCaseVitals = { ...(recheck as OpdCaseVitals), at: timestamp().slice(0, 16), by: signature };
    const flags = evaluateRedFlags(current.caseType, current.symptoms, entry);
    const ok = await saveCase(
      { ...current, vitals: [...current.vitals, entry], redFlags: flags },
      `OPD Ward vital signs recorded${flags.length ? ` — red flags: ${flags.join(", ")}` : ""}`
    );
    if (ok) {
      setRecheck({});
      setError(null);
    }
  };

  const addCare = async (what: string) => {
    if (!current || !what.trim()) return;
    const ok = await saveCase({ ...current, care: [...current.care, { at: timestamp().slice(0, 16), by: signature, what: what.trim() }] }, `OPD Ward care: ${what.trim()}`);
    if (ok) setCareText("");
  };

  const applyOrders = async () => {
    if (!current || !isDoctor) return;
    const tpl = templateFor(current.caseType);
    const chosen = tpl.orders.filter((_, i) => selectedOrders.has(i));
    if (chosen.length === 0) return setError("Tick at least one order, or write your own in the plan.");
    const now = timestamp().slice(0, 16);
    for (const o of chosen) {
      if (o.kind === "medication") {
        const med: MedicationOrder = {
          id: `RX-${uid()}`,
          patientId: current.patientId,
          patientName: current.patientName,
          name: o.name!,
          dose: o.dose!,
          route: o.route!,
          freq: o.freq!,
          start: today,
          prescribedBy: user.name,
          prescribedByLicense: user.licenseNumber,
          status: "Active",
          refillable: false,
          notes: [o.notes, `OPD Ward — ${current.caseType}`].filter(Boolean).join(" "),
        };
        addMedication(med);
      } else if (o.kind === "lab") {
        const lab: DiagnosticResult = {
          id: `LAB-${uid()}`,
          patientId: current.patientId,
          patientName: current.patientName,
          test: o.test!,
          category: o.category!,
          date: today,
          orderedAt: now,
          status: "Pending Analysis",
          priority: current.redFlags.length ? "Urgent" : "Routine",
          indication: `${current.caseType}: ${current.complaint}`,
          specimenType: o.specimen,
          orderingPhysician: user.name,
          orderingPhysicianLicense: user.licenseNumber,
          releasedBy: "",
          summary: "",
          items: [],
        };
        addLabResult(lab);
      } else {
        const order: DoctorOrder = {
          id: `DO-${uid()}`,
          patientId: current.patientId,
          patientName: current.patientName,
          orderedAt: now,
          orderedBy: user.name,
          orderedByLicense: user.licenseNumber,
          category: o.orderCategory || "Nursing Care",
          order: o.order!,
          priority: current.redFlags.length ? "Urgent" : "Routine",
          status: "Pending",
        };
        await saveDoctorOrder(order);
      }
    }
    await saveCase(
      { ...current, ordersAppliedAt: now, ordersAppliedBy: signature, doctorPlan: plan.trim() || current.doctorPlan },
      `Signed ${chosen.length} OPD Ward order(s) for ${current.caseType}`
    );
    setError(null);
    flash(`${chosen.length} order(s) signed: medicines go to Pharmacy, tests to the Laboratory/Imaging list, nursing orders to the nurses.`);
  };

  const savePlan = () => current && saveCase({ ...current, doctorPlan: plan.trim() }, "Updated OPD Ward plan");

  const finish = async () => {
    if (!current || !isDoctor || !dispo) return;
    const p = patients.find(x => x.id === current.patientId);
    const unstable = p && p.triageTier !== "stable";
    if (dispo !== "admit" && unstable && !stableConfirmed) return setError(`${current.patientName} is marked ${p!.triageTier.toUpperCase()}. Confirm the patient is now stable first, or admit instead.`);
    if (dispo === "home" && !homeInstructions.trim()) return setError("Enter the home instructions.");
    if (dispo === "refer" && (!referTo.trim() || !referReason.trim())) return setError("Enter the receiving hospital and the reason.");
    const now = timestamp().slice(0, 16);
    dischargePatient({
      id: `DC-${uid()}`,
      patientId: current.patientId,
      patientName: current.patientName,
      dischargeDate: today,
      disposition: dispo === "home" ? "Treated & Sent Home" : dispo === "admit" ? "Admitted to Inpatient Ward" : "Referred to Tertiary Care",
      followUpDate: dispo === "home" ? followUp || undefined : undefined,
      instructions:
        dispo === "home"
          ? `${current.caseType}. ${homeInstructions.trim()}`
          : dispo === "refer"
          ? `Referred to ${referTo.trim()}: ${referReason.trim()}`
          : `Admit for inpatient care: ${plan.trim() || current.complaint}`,
      clearedByDoctor: signature,
      attendingDoctor: signature,
      dischargeSummary: `OPD Ward — ${current.caseType}. ${plan.trim() || current.doctorPlan || ""}`.trim(),
      conditionAtDischarge: dispo === "admit" ? undefined : dispo === "refer" ? "Stable for transfer" : "Stable — treated in OPD Ward",
      referredTo: dispo === "refer" ? referTo.trim() : undefined,
    });
    const status: OpdCase["status"] = dispo === "home" ? "Sent Home" : dispo === "admit" ? "Admitted" : "Referred / Transferred";
    const ok = await saveCase(
      {
        ...current,
        status,
        doctorPlan: plan.trim() || current.doctorPlan,
        disposition: {
          at: now,
          by: signature,
          type: status,
          instructions: dispo === "home" ? homeInstructions.trim() : dispo === "refer" ? `${referTo.trim()}: ${referReason.trim()}` : undefined,
          followUpDate: dispo === "home" ? followUp || undefined : undefined,
        },
      },
      `OPD Ward: ${status}`
    );
    if (ok) {
      setOpenId(null);
      flash(
        dispo === "admit"
          ? `${current.patientName} is for admission — assign a bed in Ward Bed Allocation.`
          : `${current.patientName}: ${status}. Saved in Transfer & Discharge History.`
      );
    }
  };

  const vitalInputs = (keys: VitalKey[], value: Partial<OpdCaseVitals>, onChange: (k: VitalKey, v: string) => void, sugarType?: { value?: "FBS" | "RBS"; onChange: (v: "FBS" | "RBS") => void }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {keys.map(k => (
        <div key={k}>
          <label className={ui.label}>{VITAL_LABELS[k].label}</label>
          <input value={(value[k] as string) || ""} onChange={e => onChange(k, e.target.value)} placeholder={VITAL_LABELS[k].placeholder} className={ui.input} />
        </div>
      ))}
      {sugarType && keys.includes("bloodSugar") && (
        <div>
          <label className={ui.label}>Sugar test</label>
          <select value={sugarType.value || "RBS"} onChange={e => sugarType.onChange(e.target.value as "FBS" | "RBS")} className={ui.input}>
            <option value="RBS">RBS (random)</option>
            <option value="FBS">FBS (fasting)</option>
          </select>
        </div>
      )}
    </div>
  );

  const vitalsSummary = (v?: OpdCaseVitals) =>
    v
      ? [
          v.bp && `BP ${v.bp}`,
          v.temp && `T ${v.temp}°C`,
          v.hr && `HR ${v.hr}`,
          v.rr && `RR ${v.rr}`,
          v.spo2 && `SpO2 ${v.spo2}%`,
          v.bloodSugar && `${v.bloodSugarType || "RBS"} ${v.bloodSugar}`,
          v.stools && `Stools: ${v.stools}`,
        ]
          .filter(Boolean)
          .join(" • ")
      : "—";

  const tpl = current ? templateFor(current.caseType) : null;
  const intakeTpl = intake ? templateFor(intake.caseType) : null;
  const intakeKeys = intakeTpl ? Array.from(new Set<VitalKey>(["bp", "temp", "hr", "rr", "spo2", ...intakeTpl.checks])) : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Stethoscope size={20} />}
        title="OPD Ward — Minor Cases"
        description="Common outpatient cases. Nurses add the patient, take vital signs and give care; the doctor signs the orders and sends home, admits, or refers."
        actions={
          <button onClick={() => startIntake()} className={ui.primaryBtn}>
            + Add Minor Case Patient
          </button>
        }
      />
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}
      {cases.error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{cases.error}</div>}

      {/* Common cases */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {CASE_TEMPLATES.filter(t => t.type !== "Other Minor Case").map(t => (
          <button
            key={t.type}
            onClick={() => startIntake(t.type)}
            className="text-left bg-white rounded-2xl border border-slate-200 p-3 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-900">{t.short}</div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{activeByType(t.type)}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-snug">{t.description}</div>
            <div className="text-[10px] text-emerald-700 font-bold mt-2">+ Add patient</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["active", "In OPD Ward"],
            ["released", "Sent Home / Admitted / Referred"],
            ["all", "All"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, case..." className={`${ui.input} pl-8`} />
          </div>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Time In</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Case</th>
                <th className={ui.th}>Latest Vital Signs</th>
                <th className={ui.th}>Condition</th>
                <th className={ui.th}>Orders</th>
                <th className={ui.th}>Status</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.loading && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>Loading…</td>
                </tr>
              )}
              {!cases.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>{tab === "active" ? "No patients in the OPD Ward." : "Nothing here."}</td>
                </tr>
              )}
              {rows.map(c => (
                <tr key={c.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(c.createdAt)}</td>
                  <td className={ui.td}>
                    <div className="font-bold text-slate-900 whitespace-nowrap">{c.patientName}</div>
                    <div className="text-[10px] text-slate-400">
                      <span className="font-mono">{c.patientId}</span> • {c.age} yrs • {c.gender}
                    </div>
                  </td>
                  <td className={ui.td}>
                    <div className="font-semibold text-slate-900">{templateFor(c.caseType).short}</div>
                    <div className="text-[10px] text-slate-500 max-w-[220px] truncate">{c.symptoms.join(", ") || c.complaint}</div>
                    {c.redFlags.length > 0 && (
                      <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle size={11} /> {c.redFlags.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className={`${ui.td} text-[11px]`}>{vitalsSummary(c.vitals[c.vitals.length - 1])}</td>
                  <td className={ui.td}>
                    <ConditionBadge patientId={c.patientId} />
                  </td>
                  <td className={ui.td}>
                    {c.ordersAppliedAt ? (
                      <span className={`${ui.badge} bg-emerald-50 text-emerald-700 border-emerald-200`}>Signed</span>
                    ) : (
                      <span className={`${ui.badge} bg-amber-50 text-amber-700 border-amber-200`}>Waiting for doctor</span>
                    )}
                  </td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${c.status === "In OPD Ward" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>{c.status}</span>
                  </td>
                  <td className={`${ui.td} text-right`}>
                    <button onClick={() => openCase(c)} className={c.status === "In OPD Ward" ? ui.primaryBtn : "text-emerald-700 font-bold hover:underline cursor-pointer"}>
                      {c.status === "In OPD Ward" ? "Open" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- Intake dialog ---------------- */}
      {intake && intakeTpl && (
        <Modal
          wide
          title="Add Minor Case Patient — OPD Ward"
          subtitle="The patient is placed in the OPD Ward and in the chosen doctor's queue."
          onClose={() => !busy && setIntake(null)}
          footer={
            <>
              <button type="button" onClick={() => setIntake(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="intake-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Add to OPD Ward"}
              </button>
            </>
          }
        >
          <form id="intake-form" onSubmit={submitIntake} className="space-y-4">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}

            <div className="flex gap-2">
              {(["existing", "new"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setIntakeField({ mode: m })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${intake.mode === m ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {m === "existing" ? "Registered patient" : "New patient"}
                </button>
              ))}
            </div>
            {intake.mode === "existing" ? (
              <div>
                <label className={ui.label}>Patient *</label>
                <select value={intake.patientId} onChange={e => setIntakeField({ patientId: e.target.value })} className={ui.input}>
                  <option value="">— Select patient —</option>
                  {patients
                    .filter(p => p.admissionStatus !== "Admitted")
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {p.age} yrs
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={ui.label}>Full name *</label>
                  <input value={intake.name} onChange={e => setIntakeField({ name: e.target.value })} className={ui.input} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={ui.label}>Date of birth *</label>
                    <input type="date" max={today} value={intake.dob} onChange={e => setIntakeField({ dob: e.target.value })} className={ui.input} />
                  </div>
                  <div>
                    <label className={ui.label}>Sex *</label>
                    <select value={intake.gender} onChange={e => setIntakeField({ gender: e.target.value as Patient["gender"] })} className={ui.input}>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={ui.label}>Contact number</label>
                  <input value={intake.contact} onChange={e => setIntakeField({ contact: e.target.value })} className={ui.input} />
                </div>
                <div>
                  <label className={ui.label}>Allergies (comma-separated)</label>
                  <input value={intake.allergies} onChange={e => setIntakeField({ allergies: e.target.value })} placeholder="e.g. Penicillin, Seafood — leave blank if none" className={ui.input} />
                </div>
              </div>
            )}

            <div>
              <label className={ui.label}>Case *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {CASE_TEMPLATES.map(t => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setIntakeField({ caseType: t.type, symptoms: [] })}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border text-left cursor-pointer ${intake.caseType === t.type ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {t.short}
                  </button>
                ))}
              </div>
            </div>

            {(intakeTpl.symptoms.length > 0 || intakeTpl.redFlagSymptoms.length > 0) && (
              <div>
                <label className={ui.label}>Symptoms (warning signs in red)</label>
                <div className="flex flex-wrap gap-1.5">
                  {[...intakeTpl.symptoms, ...intakeTpl.redFlagSymptoms].map(sym => {
                    const on = intake.symptoms.includes(sym);
                    const red = intakeTpl.redFlagSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setIntakeField({ symptoms: on ? intake.symptoms.filter(x => x !== sym) : [...intake.symptoms, sym] })}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer ${
                          on ? (red ? "bg-rose-600 text-white border-rose-600" : "bg-emerald-600 text-white border-emerald-600") : red ? "bg-white text-rose-700 border-rose-200" : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {on ? "✓ " : ""}
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className={ui.label}>Chief complaint (patient's own words)</label>
              <input value={intake.complaint} onChange={e => setIntakeField({ complaint: e.target.value })} placeholder="e.g. Ubo at sipon 3 days, may lagnat kagabi" className={ui.input} />
            </div>

            <div>
              <div className={ui.label}>Vital signs</div>
              {vitalInputs(
                intakeKeys,
                intake.vitals,
                (k, v) => setIntakeField({ vitals: { ...intake.vitals, [k]: v } }),
                { value: intake.vitals.bloodSugarType, onChange: v => setIntakeField({ vitals: { ...intake.vitals, bloodSugarType: v } }) }
              )}
            </div>

            {intakeFlags.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Warning signs — inform the doctor now
                </div>
                <ul className="list-disc ml-5 mt-1">
                  {intakeFlags.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Condition</label>
                {isDoctor ? (
                  <>
                    <select value={intake.triage} onChange={e => setIntakeField({ triage: e.target.value as TriageTier, triageTouched: true })} className={ui.input}>
                      <option value="stable">Stable</option>
                      <option value="observation">Observation</option>
                      <option value="critical">Critical</option>
                    </select>
                    {!intake.triageTouched && <p className="text-[10px] text-slate-500 mt-1">Suggested from the warning signs.</p>}
                  </>
                ) : (
                  <>
                    <div className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase ${intake.triage === "critical" ? "bg-rose-50 border-rose-200 text-rose-700" : intake.triage === "observation" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
                      {intake.triage}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Set automatically from the warning signs; the doctor confirms or changes it.</p>
                  </>
                )}
              </div>
              <div>
                <label className={ui.label}>Doctor *</label>
                <select value={intake.doctorName} onChange={e => setIntakeField({ doctorName: e.target.value })} className={ui.input}>
                  {doctors.length === 0 && <option value="">No active doctors</option>}
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------------- Case dialog ---------------- */}
      {current && tpl && (
        <Modal
          wide
          title={`${current.patientName} — ${tpl.short}`}
          subtitle={`${current.patientId} • ${current.age} yrs ${current.gender} • in OPD Ward since ${dt(current.createdAt)} • ${current.status}`}
          onClose={() => !busy && setOpenId(null)}
        >
          {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
          <div className="flex flex-wrap items-center gap-2">
            <ConditionBadge patientId={current.patientId} />
            {current.symptoms.map(s => (
              <span key={s} className={`${ui.badge} ${tpl.redFlagSymptoms.includes(s) ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-700 border-slate-200"}`}>
                {s}
              </span>
            ))}
          </div>
          <p className="text-slate-700">
            <b>Complaint:</b> {current.complaint}
          </p>
          {current.redFlags.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 font-semibold flex items-start gap-1.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Warning signs: {current.redFlags.join(", ")}
            </div>
          )}

          {/* Monitoring */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Monitoring</h4>
              {tpl.monitoring.length > 0 && <span className="text-[10px] text-slate-500">{tpl.monitoring.join(" • ")}</span>}
            </div>
            <div className="rounded-lg border border-slate-200 overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Time</th>
                    <th className="px-2 py-1.5 text-left">Vital signs</th>
                    <th className="px-2 py-1.5 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {current.vitals.map((v, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5 font-mono whitespace-nowrap">{dt(v.at)}</td>
                      <td className="px-2 py-1.5">
                        {vitalsSummary(v)}
                        {v.note ? ` — ${v.note}` : ""}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500">{v.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {current.status === "In OPD Ward" && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                {vitalInputs(Array.from(new Set<VitalKey>([...tpl.checks, "bp", "temp"])), recheck, (k, v) => setRecheck(r => ({ ...r, [k]: v })), {
                  value: recheck.bloodSugarType,
                  onChange: v => setRecheck(r => ({ ...r, bloodSugarType: v })),
                })}
                <div className="flex gap-2">
                  <input value={recheck.note || ""} onChange={e => setRecheck(r => ({ ...r, note: e.target.value }))} placeholder="Note (optional)" className={ui.input} />
                  <button type="button" onClick={addVitals} disabled={busy} className={`${ui.primaryBtn} shrink-0`}>
                    Record Vitals
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Care given */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Care Given</h4>
            {current.care.length === 0 ? (
              <p className="text-slate-400 italic">Nothing recorded yet.</p>
            ) : (
              <ul className="space-y-1">
                {current.care.map((c, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-slate-100 pb-1">
                    <span>{c.what}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {dt(c.at)} • {c.by}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {current.status === "In OPD Ward" && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.careActions.map(a => (
                    <button key={a} type="button" onClick={() => addCare(a)} disabled={busy} className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800 cursor-pointer hover:bg-emerald-100">
                      + {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={careText} onChange={e => setCareText(e.target.value)} placeholder="Other care given..." className={ui.input} />
                  <button type="button" onClick={() => addCare(careText)} disabled={busy || !careText.trim()} className={`${ui.secondaryBtn} shrink-0`}>
                    Add
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Doctor's orders */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Doctor's Orders</h4>
            {current.ordersAppliedAt ? (
              <p className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                Orders signed {dt(current.ordersAppliedAt)} by {current.ordersAppliedBy}. Medicines are in Pharmacy, tests in the Laboratory / Imaging list, nursing orders in Doctor's Orders.
              </p>
            ) : isDoctor && current.status === "In OPD Ward" ? (
              tpl.orders.length === 0 ? (
                <p className="text-slate-500">No standard orders for this case — use e-Prescriptions and Lab Requests, or write the plan below.</p>
              ) : (
                <>
                  <p className="text-[11px] text-slate-500">Standard orders for {tpl.short}. Tick what you want, check the patient's allergies, then sign. Usual adult doses — adjust as needed.</p>
                  <div className="space-y-1">
                    {tpl.orders.map((o, i) => (
                      <label key={i} className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(i)}
                          onChange={e =>
                            setSelectedOrders(s => {
                              const n = new Set(s);
                              if (e.target.checked) n.add(i);
                              else n.delete(i);
                              return n;
                            })
                          }
                          className="mt-0.5"
                        />
                        <span>
                          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">{o.kind === "medication" ? "Rx" : o.kind === "lab" ? "Test" : "Nursing"}</span>
                          {o.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={applyOrders} disabled={busy} className={ui.primaryBtn}>
                    Sign &amp; Send Orders
                  </button>
                </>
              )
            ) : (
              <p className="text-amber-700 font-semibold">Waiting for the doctor to sign orders.</p>
            )}
            <div>
              <label className={ui.label}>Doctor's assessment &amp; plan</label>
              <textarea value={plan} onChange={e => setPlan(e.target.value)} rows={2} disabled={!isDoctor || current.status !== "In OPD Ward"} className={ui.input} />
              {isDoctor && current.status === "In OPD Ward" && (
                <button type="button" onClick={savePlan} disabled={busy} className={`${ui.secondaryBtn} mt-1`}>
                  Save Plan
                </button>
              )}
            </div>
          </section>

          {/* Disposition */}
          {current.status !== "In OPD Ward" ? (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <b>{current.status}</b> {current.disposition && `— ${dt(current.disposition.at)} by ${current.disposition.by}`}
              {current.disposition?.instructions && <div className="mt-1 whitespace-pre-line">{current.disposition.instructions}</div>}
              {current.disposition?.followUpDate && <div className="mt-1">Follow-up: {current.disposition.followUpDate}</div>}
              <button type="button" onClick={() => navigate(`/history?patient=${encodeURIComponent(current.patientId)}`)} className="mt-2 text-emerald-700 font-bold hover:underline cursor-pointer">
                View patient history →
              </button>
            </div>
          ) : isDoctor ? (
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Disposition</h4>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["home", "Send Home"],
                    ["admit", "Admit to Ward"],
                    ["refer", "Refer / Transfer"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setDispo(id);
                      setError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${dispo === id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dispo === "home" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className={ui.label}>Home instructions *</label>
                    <textarea value={homeInstructions} onChange={e => setHomeInstructions(e.target.value)} rows={3} className={ui.input} />
                  </div>
                  <div>
                    <label className={ui.label}>Follow-up date</label>
                    <input type="date" min={today} value={followUp} onChange={e => setFollowUp(e.target.value)} className={ui.input} />
                  </div>
                </div>
              )}
              {dispo === "refer" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={ui.label}>Receiving hospital *</label>
                    <input value={referTo} onChange={e => setReferTo(e.target.value)} placeholder="e.g. Philippine General Hospital" className={ui.input} />
                  </div>
                  <div>
                    <label className={ui.label}>Reason *</label>
                    <input value={referReason} onChange={e => setReferReason(e.target.value)} placeholder="e.g. Needs specialist / higher level of care" className={ui.input} />
                  </div>
                </div>
              )}
              {dispo === "admit" && <p className="text-slate-600">The patient will be marked for admission. A nurse or the front desk then assigns the bed in Ward Bed Allocation.</p>}
              {dispo && dispo !== "admit" && patients.find(p => p.id === current.patientId)?.triageTier !== "stable" && (
                <label className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 font-semibold cursor-pointer">
                  <input type="checkbox" checked={stableConfirmed} onChange={e => setStableConfirmed(e.target.checked)} className="mt-0.5" />
                  The patient is marked {patients.find(p => p.id === current.patientId)?.triageTier?.toUpperCase()}. I re-assessed and confirm the patient is now stable. The status will change to STABLE.
                </label>
              )}
              {dispo && (
                <button type="button" onClick={finish} disabled={busy} className={ui.primaryBtn}>
                  {dispo === "home" ? "Confirm — Send Home" : dispo === "admit" ? "Confirm — For Admission" : "Confirm — Refer / Transfer"}
                </button>
              )}
            </section>
          ) : (
            <p className="text-slate-500">Only the doctor can send home, admit, or refer the patient.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
