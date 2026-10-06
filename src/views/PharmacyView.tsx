import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { MedicationOrder, StockItem } from "../types";
import { timestamp, uid } from "../services/ids";
import { useCollection } from "../hooks/useCollection";
import { isFullyDispensed, isToDispense, stockStatus, daysUntil, dispensedTotal, allergyMatch } from "../services/pharmacy";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import { Pill, Search } from "../components/Icons";
import { dt } from "../services/time";

type Tab = "pending" | "dispensed" | "all" | "stock";

const stockLabel = (s: StockItem) => `${s.name} ${s.strength} ${s.form}`.trim();
const realAllergies = (list?: string[]) => (list || []).filter(a => a && !/^(none|nka|nkda|no known)/i.test(a.trim()));

const blankStock = (): StockItem => ({
  id: "",
  name: "",
  strength: "",
  form: "Tablet",
  unit: "tablets",
  quantity: 0,
  reorderLevel: 20,
  lotNumber: "",
  expiryDate: "",
  unitPrice: 0,
  updatedAt: "",
  updatedBy: "",
});

/** Pharmacy Technician: dispense e-prescriptions (with allergy checks) and keep medicine stock. */
export default function PharmacyView() {
  const { user } = useAuth();
  const { medications, updateMedication, patients, logAction } = useOpdData();
  const stock = useCollection<StockItem>("pharmacy_stock");
  const canDispense = user?.role === "pharmacy";

  const [tab, setTab] = useState<Tab>(canDispense ? "pending" : "all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Dispense dialog
  const [dispensing, setDispensing] = useState<MedicationOrder | null>(null);
  const [qty, setQty] = useState("");
  const [stockId, setStockId] = useState("");
  const [complete, setComplete] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [allergyConfirmed, setAllergyConfirmed] = useState(false);

  // Stock dialogs
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [receiving, setReceiving] = useState<StockItem | null>(null);
  const [receiveQty, setReceiveQty] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = {
    pending: medications.filter(isToDispense).length,
    dispensed: medications.filter(m => (m.dispenses?.length ?? 0) > 0 || !!m.dispensedAt).length,
    all: medications.length,
    stock: stock.items.length,
  };
  const stockAlerts = stock.items.filter(s => stockStatus(s)).length;

  const q = search.toLowerCase();
  const rows = medications
    .filter(m => {
      if (tab === "pending" && !isToDispense(m)) return false;
      if (tab === "dispensed" && !((m.dispenses?.length ?? 0) > 0 || m.dispensedAt)) return false;
      return !q || [m.patientName, m.patientId, m.name, m.prescribedBy].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      tab === "dispensed" ? (b.dispensedAt || "").localeCompare(a.dispensedAt || "") : String(b.start).localeCompare(String(a.start))
    );
  const stockRows = stock.items
    .filter(s => !q || [s.name, s.strength, s.form, s.lotNumber || ""].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const patientOf = (m: MedicationOrder) => patients.find(p => p.id === m.patientId);
  const matchingStock = useMemo(() => {
    if (!dispensing) return [];
    const first = dispensing.name.toLowerCase().split(/\s+/)[0];
    return stock.items
      .filter(s => s.name.toLowerCase().includes(first) || first.includes(s.name.toLowerCase().split(/\s+/)[0]))
      .filter(s => daysUntil(s.expiryDate) >= 0 && s.quantity > 0)
      .sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999")); // first to expire, first out
  }, [dispensing, stock.items]);

  if (!user) return null;
  const signature = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000);
  };

  const openDispense = (m: MedicationOrder) => {
    setError(null);
    setQty("");
    setRemarks("");
    setComplete(true);
    setAllergyConfirmed(false);
    setDispensing(m);
    const first = m.name.toLowerCase().split(/\s+/)[0];
    const best = stock.items
      .filter(s => s.name.toLowerCase().includes(first) && s.quantity > 0 && daysUntil(s.expiryDate) >= 0)
      .sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999"))[0];
    setStockId(best?.id || "");
  };

  const allergies = dispensing ? realAllergies(patientOf(dispensing)?.allergies) : [];
  const allergyHit = dispensing ? allergyMatch(dispensing.name, allergies) : undefined;

  const submitDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensing) return;
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return setError("Enter the quantity dispensed (a number).");
    if (allergyHit && !allergyConfirmed) return setError("This medicine may match a recorded allergy. Confirm with the prescriber first.");
    const item = stock.items.find(s => s.id === stockId);
    if (item && n > item.quantity) return setError(`Only ${item.quantity} ${item.unit} left in this stock lot.`);
    setBusy(true);
    setError(null);
    try {
      const at = timestamp().slice(0, 16);
      const events = [
        ...(dispensing.dispenses || []),
        { quantity: n, stockId: item?.id, stockLabel: item ? `${stockLabel(item)}${item.lotNumber ? ` lot ${item.lotNumber}` : ""}` : undefined, remarks: remarks.trim() || undefined, by: signature, at },
      ];
      const total = events.reduce((s, d) => s + d.quantity, 0);
      await updateMedication(
        {
          ...dispensing,
          dispenses: events,
          fullyDispensed: complete,
          dispenseQuantity: `${total}${item ? ` ${item.unit}` : ""}`,
          dispenseRemarks: remarks.trim() || dispensing.dispenseRemarks,
          dispensedBy: signature,
          dispensedAt: at,
        },
        `${complete ? "Dispensed" : "Partially dispensed"} ${dispensing.name} ${dispensing.dose} × ${n}${item ? ` (${item.unit})` : ""}`
      );
      if (item) {
        const err = await stock.save(
          { ...item, quantity: item.quantity - n, updatedAt: at, updatedBy: signature },
          `Stock out: ${stockLabel(item)} −${n} (for ${dispensing.patientName}); ${item.quantity - n} left`,
          { patientId: dispensing.patientId, patientName: dispensing.patientName }
        );
        if (err) throw new Error(err);
      }
      setDispensing(null);
      flash(complete ? `${dispensing.name} dispensed to ${dispensing.patientName}.` : `Partial dispense recorded; the rest stays in "To Dispense".`);
    } catch (err) {
      setError((err as Error).message || "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;
    const s = editingStock;
    if (!s.name.trim() || !s.strength.trim()) return setError("Enter the medicine name and strength.");
    if (s.quantity < 0 || s.reorderLevel < 0) return setError("Quantities cannot be negative.");
    setBusy(true);
    const isNew = !s.id;
    const item: StockItem = { ...s, id: s.id || `STK-${uid()}`, name: s.name.trim(), strength: s.strength.trim(), updatedAt: timestamp().slice(0, 16), updatedBy: signature };
    const err = await stock.save(item, `${isNew ? "Added stock item" : "Updated stock item"}: ${stockLabel(item)} (qty ${item.quantity})`);
    setBusy(false);
    if (err) return setError(err);
    setEditingStock(null);
    flash(`${stockLabel(item)} saved.`);
  };

  const saveReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiving) return;
    const n = Number(receiveQty);
    if (!Number.isFinite(n) || n <= 0) return setError("Enter the quantity received.");
    setBusy(true);
    const err = await stock.save(
      { ...receiving, quantity: receiving.quantity + n, updatedAt: timestamp().slice(0, 16), updatedBy: signature },
      `Stock in: ${stockLabel(receiving)} +${n}; ${receiving.quantity + n} on hand`
    );
    setBusy(false);
    if (err) return setError(err);
    setReceiving(null);
    flash(`Received ${n} ${receiving.unit} of ${stockLabel(receiving)}.`);
  };

  const field = (label: string, input: React.ReactNode, wide = false) => (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className={ui.label}>{label}</label>
      {input}
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<Pill size={20} />}
        title="Pharmacy Dispensing"
        description="Doctors' prescriptions appear here. Check allergies, dispense from stock (first to expire, first out), and keep the medicine inventory up to date."
      />
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}
      {stock.error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{stock.error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["pending", "To Dispense"],
            ["dispensed", "Dispensed"],
            ["all", "All Prescriptions"],
            ["stock", "Medicine Stock"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{counts[id]}</span>
            {id === "stock" && stockAlerts > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950">{stockAlerts} alert{stockAlerts > 1 ? "s" : ""}</span>}
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
              placeholder={tab === "stock" ? "Search medicine, lot..." : "Search patient, medicine, doctor..."}
              className={`${ui.input} pl-8`}
            />
          </div>
          {tab === "stock" && canDispense && (
            <button
              onClick={() => {
                setError(null);
                setEditingStock(blankStock());
              }}
              className={ui.primaryBtn}
            >
              + Add Medicine
            </button>
          )}
        </div>
        <div className={ui.tableScroll}>
          {tab === "stock" ? (
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Medicine</th>
                  <th className={ui.th}>Form</th>
                  <th className={`${ui.th} text-right`}>On Hand</th>
                  <th className={`${ui.th} text-right`}>Reorder At</th>
                  <th className={ui.th}>Lot / Expiry</th>
                  <th className={ui.th}>Status</th>
                  <th className={ui.th}>Last Update</th>
                  <th className={`${ui.th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stock.loading && (
                  <tr>
                    <td colSpan={8} className={ui.emptyCell}>Loading stock…</td>
                  </tr>
                )}
                {!stock.loading && stockRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className={ui.emptyCell}>No medicines in stock yet. Click "+ Add Medicine".</td>
                  </tr>
                )}
                {stockRows.map(s => {
                  const st = stockStatus(s);
                  return (
                    <tr key={s.id} className={ui.tr}>
                      <td className={ui.td}>
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-indigo-700 font-mono">{s.strength}</div>
                      </td>
                      <td className={ui.td}>{s.form}</td>
                      <td className={`${ui.td} text-right font-mono font-bold`}>
                        {s.quantity} <span className="font-sans font-normal text-slate-500">{s.unit}</span>
                      </td>
                      <td className={`${ui.td} text-right font-mono`}>{s.reorderLevel}</td>
                      <td className={ui.td}>
                        <div className="font-mono">{s.lotNumber || "—"}</div>
                        <div className="text-[10px] text-slate-500">{s.expiryDate ? `Exp ${s.expiryDate}` : "No expiry set"}</div>
                      </td>
                      <td className={ui.td}>{st ? <span className={`${ui.badge} ${st.style}`}>{st.label}</span> : <span className="text-emerald-700 font-semibold">OK</span>}</td>
                      <td className={`${ui.td} text-[10px] text-slate-500`}>
                        {dt(s.updatedAt)}
                        <div>{s.updatedBy}</div>
                      </td>
                      <td className={`${ui.td} text-right whitespace-nowrap`}>
                        {canDispense && (
                          <>
                            <button
                              onClick={() => {
                                setError(null);
                                setReceiveQty("");
                                setReceiving(s);
                              }}
                              className="text-emerald-700 font-bold hover:underline cursor-pointer mr-3"
                            >
                              Receive
                            </button>
                            <button
                              onClick={() => {
                                setError(null);
                                setEditingStock({ ...s });
                              }}
                              className="text-slate-600 font-bold hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
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
                    <td colSpan={8} className={ui.emptyCell}>{tab === "pending" ? "No prescriptions waiting to be dispensed." : "Nothing here."}</td>
                  </tr>
                )}
                {rows.map(m => {
                  const al = realAllergies(patientOf(m)?.allergies);
                  const partial = (m.dispenses?.length ?? 0) > 0 && !isFullyDispensed(m);
                  return (
                    <tr key={m.id} className={ui.tr}>
                      <td className={`${ui.td} font-mono whitespace-nowrap`}>{m.start}</td>
                      <td className={ui.td}>
                        <div className="font-bold text-slate-900 whitespace-nowrap">{m.patientName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{m.patientId}</div>
                        {al.length > 0 && <div className="text-[10px] font-bold text-rose-700">⚠ Allergies: {al.join(", ")}</div>}
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
                            m.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : m.status === "Discontinued" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {m.status}
                        </span>
                        {partial && <div className="mt-1"><span className={`${ui.badge} bg-amber-50 text-amber-700 border-amber-200`}>Partial</span></div>}
                      </td>
                      <td className={ui.td}>
                        {m.dispensedAt ? (
                          <>
                            <div className="font-semibold">× {m.dispenses?.length ? dispensedTotal(m) : m.dispenseQuantity}</div>
                            <div className="text-[10px] text-slate-400 whitespace-nowrap">
                              {dt(m.dispensedAt)} • {m.dispensedBy}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className={`${ui.td} text-right`}>
                        {canDispense && isToDispense(m) && (
                          <button onClick={() => openDispense(m)} className={ui.primaryBtn}>
                            {partial ? "Dispense Rest" : "Dispense"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {dispensing && (
        <Modal
          title={`Dispense ${dispensing.name}`}
          subtitle={`${dispensing.patientName} • ${dispensing.dose} • ${dispensing.route}, ${dispensing.freq} • prescribed by ${dispensing.prescribedBy}`}
          onClose={() => !busy && setDispensing(null)}
          footer={
            <>
              <button type="button" onClick={() => setDispensing(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="dispense-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : complete ? "Confirm Dispensed" : "Record Partial Dispense"}
              </button>
            </>
          }
        >
          <form id="dispense-form" onSubmit={submitDispense} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            {allergies.length > 0 ? (
              <div className={`p-3 rounded-lg border ${allergyHit ? "bg-rose-100 border-rose-300 text-rose-900" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
                <div className="font-bold">⚠ Patient allergies: {allergies.join(", ")}</div>
                {allergyHit && (
                  <label className="flex items-start gap-2 mt-2 font-semibold cursor-pointer">
                    <input type="checkbox" checked={allergyConfirmed} onChange={e => setAllergyConfirmed(e.target.checked)} className="mt-0.5" />
                    "{dispensing.name}" may match the allergy "{allergyHit}". I confirmed with the prescriber that it is safe to dispense.
                  </label>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">No known allergies recorded for this patient.</div>
            )}
            {dispensing.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold">Doctor's instructions:</span> {dispensing.notes}
              </div>
            )}
            {(dispensing.dispenses?.length ?? 0) > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                Already dispensed: {dispensing.dispenses!.map(d => `${d.quantity} on ${dt(d.at)}`).join("; ")}
              </div>
            )}
            <div>
              <label className={ui.label}>Take from stock</label>
              <select value={stockId} onChange={e => setStockId(e.target.value)} className={ui.input}>
                <option value="">— Not from inventory (no stock deduction) —</option>
                {matchingStock.map(s => (
                  <option key={s.id} value={s.id}>
                    {stockLabel(s)} • {s.quantity} {s.unit} left{s.lotNumber ? ` • lot ${s.lotNumber}` : ""}{s.expiryDate ? ` • exp ${s.expiryDate}` : ""}
                  </option>
                ))}
              </select>
              {matchingStock.length === 0 && <p className="text-[11px] text-amber-700 mt-1">No usable stock matches this medicine (none on hand, or all expired).</p>}
            </div>
            <div>
              <label className={ui.label}>Quantity dispensed now *</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 21" className={ui.input} />
            </div>
            <label className="flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={complete} onChange={e => setComplete(e.target.checked)} />
              This completes the prescription (untick if the patient will come back for the rest)
            </label>
            <div>
              <label className={ui.label}>Remarks</label>
              <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Generic substitute given, counselled patient" className={ui.input} />
            </div>
            <p className="text-slate-500">
              Recorded as <span className="font-bold text-slate-700">{signature}</span>
            </p>
          </form>
        </Modal>
      )}

      {editingStock && (
        <Modal
          title={editingStock.id ? `Edit ${stockLabel(editingStock)}` : "Add Medicine to Stock"}
          onClose={() => !busy && setEditingStock(null)}
          footer={
            <>
              <button type="button" onClick={() => setEditingStock(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="stock-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <form id="stock-form" onSubmit={saveStock} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {error && <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            {field("Generic name *", <input value={editingStock.name} onChange={e => setEditingStock({ ...editingStock, name: e.target.value })} placeholder="e.g. Amoxicillin" className={ui.input} />)}
            {field("Strength *", <input value={editingStock.strength} onChange={e => setEditingStock({ ...editingStock, strength: e.target.value })} placeholder="e.g. 500 mg" className={ui.input} />)}
            {field(
              "Form",
              <select value={editingStock.form} onChange={e => setEditingStock({ ...editingStock, form: e.target.value })} className={ui.input}>
                {["Tablet", "Capsule", "Syrup", "Suspension", "Injection", "Vial", "Ampule", "Cream / Ointment", "Drops", "Inhaler", "Sachet", "Other"].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            )}
            {field("Unit", <input value={editingStock.unit} onChange={e => setEditingStock({ ...editingStock, unit: e.target.value })} placeholder="tablets, bottles, vials" className={ui.input} />)}
            {field("Quantity on hand", <input type="number" min={0} value={editingStock.quantity} onChange={e => setEditingStock({ ...editingStock, quantity: Number(e.target.value) })} className={ui.input} />)}
            {field("Reorder when at or below", <input type="number" min={0} value={editingStock.reorderLevel} onChange={e => setEditingStock({ ...editingStock, reorderLevel: Number(e.target.value) })} className={ui.input} />)}
            {field("Lot number", <input value={editingStock.lotNumber || ""} onChange={e => setEditingStock({ ...editingStock, lotNumber: e.target.value })} className={ui.input} />)}
            {field("Expiry date", <input type="date" value={editingStock.expiryDate || ""} onChange={e => setEditingStock({ ...editingStock, expiryDate: e.target.value })} className={ui.input} />)}
            {field("Unit price (₱)", <input type="number" min={0} step="0.01" value={editingStock.unitPrice ?? 0} onChange={e => setEditingStock({ ...editingStock, unitPrice: Number(e.target.value) })} className={ui.input} />)}
          </form>
        </Modal>
      )}

      {receiving && (
        <Modal
          title={`Receive ${stockLabel(receiving)}`}
          subtitle={`${receiving.quantity} ${receiving.unit} on hand`}
          onClose={() => !busy && setReceiving(null)}
          footer={
            <>
              <button type="button" onClick={() => setReceiving(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="receive-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Add to Stock"}
              </button>
            </>
          }
        >
          <form id="receive-form" onSubmit={saveReceive} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div>
              <label className={ui.label}>Quantity received *</label>
              <input type="number" min={1} value={receiveQty} onChange={e => setReceiveQty(e.target.value)} className={ui.input} />
            </div>
            <p className="text-slate-500">A delivery with a different lot or expiry date should be added as its own stock item.</p>
          </form>
        </Modal>
      )}
    </div>
  );
}
