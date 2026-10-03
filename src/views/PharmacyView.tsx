import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { MedicationOrder } from "../types";
import { timestamp } from "../services/ids";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import { Pill, Search } from "../components/Icons";

type Tab = "pending" | "dispensed" | "all";

/** Pharmacy Technician: dispense doctors' e-prescriptions and keep a dispensing record. */
export default function PharmacyView() {
  const { user } = useAuth();
  const { medications, updateMedication } = useOpdData();
  const canDispense = user?.role === "pharmacy";

  const [tab, setTab] = useState<Tab>(canDispense ? "pending" : "all");
  const [search, setSearch] = useState("");
  const [dispensing, setDispensing] = useState<MedicationOrder | null>(null);
  const [qty, setQty] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPending = (m: MedicationOrder) => m.status === "Active" && !m.dispensedAt;
  const counts = {
    pending: medications.filter(isPending).length,
    dispensed: medications.filter(m => !!m.dispensedAt).length,
    all: medications.length,
  };

  const rows = medications
    .filter(m => {
      if (tab === "pending" && !isPending(m)) return false;
      if (tab === "dispensed" && !m.dispensedAt) return false;
      const q = search.toLowerCase();
      return !q || [m.patientName, m.patientId, m.name, m.prescribedBy].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      tab === "dispensed" ? (b.dispensedAt || "").localeCompare(a.dispensedAt || "") : String(b.start).localeCompare(String(a.start))
    );

  if (!user) return null;
  const signature = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;

  const openDispense = (m: MedicationOrder) => {
    setError(null);
    setQty("");
    setRemarks("");
    setDispensing(m);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensing) return;
    if (!qty.trim()) return setError("Enter the quantity dispensed.");
    setBusy(true);
    try {
      await updateMedication(
        {
          ...dispensing,
          dispenseQuantity: qty.trim(),
          dispenseRemarks: remarks.trim() || undefined,
          dispensedBy: signature,
          dispensedAt: timestamp().slice(0, 16),
        },
        `Dispensed ${dispensing.name} ${dispensing.dose} × ${qty.trim()}`
      );
      setDispensing(null);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Pill size={20} />}
        title="Pharmacy Dispensing"
        description="Prescriptions written by doctors appear here. Check the order, dispense, and record the quantity given to the patient."
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["pending", "To Dispense"],
            ["dispensed", "Dispensed"],
            ["all", "All Prescriptions"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <div className={ui.toolbar}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, medicine, doctor..."
              className={`${ui.input} pl-8`}
            />
          </div>
        </div>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead className={ui.thead}>
              <tr>
                <th className={ui.th}>Prescribed</th>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Medicine</th>
                <th className={ui.th}>Route / Frequency</th>
                <th className={ui.th}>Prescriber</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Dispensed</th>
                <th className={`${ui.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className={ui.emptyCell}>
                    {tab === "pending" ? "No prescriptions waiting to be dispensed." : "Nothing here."}
                  </td>
                </tr>
              )}
              {rows.map(m => (
                <tr key={m.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{m.start}</td>
                  <td className={ui.td}>
                    <div className="font-bold text-slate-900 whitespace-nowrap">{m.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{m.patientId}</div>
                  </td>
                  <td className={ui.td}>
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-indigo-700 font-mono">{m.dose}</div>
                    {m.notes && <div className="text-[10px] text-slate-500 max-w-[220px]">{m.notes}</div>}
                  </td>
                  <td className={ui.td}>
                    {m.route}
                    <div className="text-[11px] text-slate-500">{m.freq}</div>
                  </td>
                  <td className={`${ui.td} whitespace-nowrap`}>{m.prescribedBy}</td>
                  <td className={ui.td}>
                    <span
                      className={`${ui.badge} ${
                        m.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : m.status === "Discontinued"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className={ui.td}>
                    {m.dispensedAt ? (
                      <>
                        <div className="font-semibold">× {m.dispenseQuantity}</div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap">
                          {m.dispensedAt} • {m.dispensedBy}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${ui.td} text-right`}>
                    {canDispense && isPending(m) && (
                      <button onClick={() => openDispense(m)} className={ui.primaryBtn}>
                        Dispense
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dispensing && (
        <Modal
          title={`Dispense ${dispensing.name}`}
          subtitle={`${dispensing.patientName} • ${dispensing.dose} • ${dispensing.route}, ${dispensing.freq} • prescribed by ${dispensing.prescribedBy}`}
          onClose={() => setDispensing(null)}
          footer={
            <>
              <button type="button" onClick={() => setDispensing(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="dispense-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Confirm Dispensed"}
              </button>
            </>
          }
        >
          <form id="dispense-form" onSubmit={submit} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            {dispensing.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold">Doctor's instructions:</span> {dispensing.notes}
              </div>
            )}
            <div>
              <label className={ui.label}>Quantity Dispensed *</label>
              <input value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 30 tablets" className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>Remarks</label>
              <input
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Generic substitute given, counselled patient"
                className={ui.input}
              />
            </div>
            <p className="text-slate-500">
              Recorded as <span className="font-bold text-slate-700">{signature}</span>
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}
