import React, { useState } from "react";
import { DoctorOrder, DoctorOrderCategory, DoctorOrderStatus } from "../../types";
import { useWardData } from "../../context/WardDataContext";
import Modal from "../../components/Modal";
import { Plus, Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps, newId, nowStamp, staffLabel } from "./helpers";

const CATEGORIES: DoctorOrderCategory[] = [
  "Medication",
  "Laboratory",
  "Imaging / Diagnostics",
  "IV Fluids",
  "Diet",
  "Activity",
  "Monitoring",
  "Nursing Care",
  "Referral",
  "Other",
];

const priorityStyle: Record<DoctorOrder["priority"], string> = {
  Routine: "bg-slate-50 text-slate-600 border-slate-200",
  Urgent: "bg-amber-50 text-amber-700 border-amber-200",
  STAT: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusStyle: Record<DoctorOrderStatus, string> = {
  Pending: "bg-sky-50 text-sky-700 border-sky-200",
  "Carried Out": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Discontinued: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function DoctorOrdersTab({ user, patients, patientId }: NursingTabProps) {
  const { doctorOrders, saveDoctorOrder } = useWardData();
  const isDoctor = user.role === "doctor";
  const isNurse = user.role === "nurse";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DoctorOrderStatus>("All");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    patientId: "",
    category: "Medication" as DoctorOrderCategory,
    priority: "Routine" as DoctorOrder["priority"],
    order: "",
  });
  const [carryOut, setCarryOut] = useState<DoctorOrder | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = doctorOrders.filter(o => {
    if (patientId && o.patientId !== patientId) return false;
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q || [o.patientName, o.order, o.orderedBy, o.category].some(v => v.toLowerCase().includes(q));
  });
  const pendingCount = doctorOrders.filter(o => o.status === "Pending" && (!patientId || o.patientId === patientId)).length;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError("Could not save. Please try again.");
      throw new Error("save failed");
    } finally {
      setBusy(false);
    }
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === draft.patientId);
    if (!patient) return setError("Select a patient.");
    if (!draft.order.trim()) return setError("Write the order.");
    const order: DoctorOrder = {
      id: newId("ORD"),
      patientId: patient.id,
      patientName: patient.name,
      orderedAt: nowStamp(),
      orderedBy: user.name,
      orderedByLicense: user.licenseNumber,
      category: draft.category,
      priority: draft.priority,
      order: draft.order.trim(),
      status: "Pending",
    };
    await run(() => saveDoctorOrder(order)).then(() => setCreating(false), () => {});
  };

  const submitCarryOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carryOut) return;
    await run(() =>
      saveDoctorOrder({
        ...carryOut,
        status: "Carried Out",
        carriedOutBy: staffLabel(user),
        carriedOutAt: nowStamp(),
        remarks: remarks.trim() || undefined,
      })
    ).then(() => setCarryOut(null), () => {});
  };

  const discontinue = (o: DoctorOrder) => {
    if (!window.confirm(`Discontinue this order for ${o.patientName}?`)) return;
    run(() => saveDoctorOrder({ ...o, status: "Discontinued", remarks: `Discontinued by ${user.name} ${nowStamp()}` })).catch(() =>
      window.alert("Could not discontinue the order. Please try again.")
    );
  };

  return (
    <div className={ui.tableWrap}>
      <div className={ui.toolbar}>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, order, doctor..."
              className={`${ui.input} pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as "All" | DoctorOrderStatus)}
            className={ui.inlineInput}
          >
            <option value="All">All statuses</option>
            <option>Pending</option>
            <option>Carried Out</option>
            <option>Discontinued</option>
          </select>
          <span className={`${ui.badge} bg-sky-50 text-sky-700 border-sky-200`}>{pendingCount} pending</span>
        </div>
        {isDoctor && (
          <button
            onClick={() => {
              setError(null);
              setDraft({ patientId: patientId || patients[0]?.id || "", category: "Medication", priority: "Routine", order: "" });
              setCreating(true);
            }}
            className={ui.primaryBtn}
          >
            <Plus size={14} /> New Doctor's Order
          </button>
        )}
      </div>

      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Date / Time</th>
              <th className={ui.th}>Patient</th>
              <th className={ui.th}>Category</th>
              <th className={ui.th}>Order</th>
              <th className={ui.th}>Priority</th>
              <th className={ui.th}>Ordered By</th>
              <th className={ui.th}>Status</th>
              <th className={ui.th}>Carried Out By</th>
              <th className={ui.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className={ui.emptyCell}>
                  No doctor's orders{patientId ? " for this patient" : ""}.
                </td>
              </tr>
            )}
            {rows.map(o => (
              <tr key={o.id} className={ui.tr}>
                <td className={`${ui.td} font-mono whitespace-nowrap`}>{o.orderedAt}</td>
                <td className={ui.td}>
                  <div className="font-bold text-slate-900">{o.patientName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{o.patientId}</div>
                </td>
                <td className={`${ui.td} whitespace-nowrap`}>{o.category}</td>
                <td className={`${ui.td} max-w-[280px] whitespace-pre-line font-medium text-slate-900`}>{o.order}</td>
                <td className={ui.td}>
                  <span className={`${ui.badge} ${priorityStyle[o.priority]}`}>{o.priority}</span>
                </td>
                <td className={`${ui.td} whitespace-nowrap`}>
                  {o.orderedBy}
                  {o.orderedByLicense && <div className="text-[10px] text-slate-400">{o.orderedByLicense}</div>}
                </td>
                <td className={ui.td}>
                  <span className={`${ui.badge} ${statusStyle[o.status]}`}>{o.status}</span>
                </td>
                <td className={ui.td}>
                  {o.carriedOutBy ? (
                    <>
                      <div>{o.carriedOutBy}</div>
                      <div className="text-[10px] font-mono text-slate-400">{o.carriedOutAt}</div>
                    </>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                  {o.remarks && <div className="text-[11px] text-slate-500 italic mt-0.5">{o.remarks}</div>}
                </td>
                <td className={`${ui.td} whitespace-nowrap text-right`}>
                  {isNurse && o.status === "Pending" && (
                    <button
                      onClick={() => {
                        setError(null);
                        setRemarks("");
                        setCarryOut(o);
                      }}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Carry Out
                    </button>
                  )}
                  {isDoctor && o.status === "Pending" && (
                    <button onClick={() => discontinue(o)} className="text-rose-600 font-bold hover:underline cursor-pointer">
                      Discontinue
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal
          title="New Doctor's Order"
          subtitle={`Ordering physician: ${staffLabel(user)}`}
          onClose={() => setCreating(false)}
          footer={
            <>
              <button type="button" onClick={() => setCreating(false)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="order-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Sign & Submit Order"}
              </button>
            </>
          }
        >
          <form id="order-form" onSubmit={submitNew} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div>
              <label className={ui.label}>Patient *</label>
              <select
                value={draft.patientId}
                onChange={e => setDraft({ ...draft, patientId: e.target.value })}
                className={ui.input}
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={ui.label}>Category</label>
                <select
                  value={draft.category}
                  onChange={e => setDraft({ ...draft, category: e.target.value as DoctorOrderCategory })}
                  className={ui.input}
                >
                  {CATEGORIES.map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Priority</label>
                <select
                  value={draft.priority}
                  onChange={e => setDraft({ ...draft, priority: e.target.value as DoctorOrder["priority"] })}
                  className={ui.input}
                >
                  <option>Routine</option>
                  <option>Urgent</option>
                  <option>STAT</option>
                </select>
              </div>
            </div>
            <div>
              <label className={ui.label}>Order *</label>
              <textarea
                rows={4}
                value={draft.order}
                onChange={e => setDraft({ ...draft, order: e.target.value })}
                placeholder={"e.g. Paracetamol 500 mg 1 tab PO q4h PRN for fever ≥ 38.0°C\nCBC, urinalysis today"}
                className={ui.input}
              />
            </div>
          </form>
        </Modal>
      )}

      {carryOut && (
        <Modal
          title="Carry Out Doctor's Order"
          subtitle={`${carryOut.patientName} • ordered by ${carryOut.orderedBy} at ${carryOut.orderedAt}`}
          onClose={() => setCarryOut(null)}
          footer={
            <>
              <button type="button" onClick={() => setCarryOut(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="carry-out-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Mark as Carried Out"}
              </button>
            </>
          }
        >
          <form id="carry-out-form" onSubmit={submitCarryOut} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-line text-slate-900 font-medium">
              {carryOut.order}
            </div>
            <div>
              <label className={ui.label}>Remarks (optional)</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Given at 10:05, patient tolerated well"
                className={ui.input}
              />
            </div>
            <p className="text-slate-500">
              Signed as <span className="font-bold text-slate-700">{staffLabel(user)}</span> at the current time.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
