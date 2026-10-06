import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { Bill, BillItem, Payment, StockItem } from "../types";
import { timestamp, uid } from "../services/ids";
import { billBalance, billGross, billNet, billPaid, statutoryDiscount } from "../services/billing";
import { downloadCsv, esc, peso, printDocument } from "../services/print";
import { useCollection } from "../hooks/useCollection";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import * as ui from "../components/tableStyles";
import { CreditCard, Search, X } from "../components/Icons";
import { dt } from "../services/time";

type Tab = "open" | "paid" | "all" | "revenue";
const CATEGORIES: BillItem["category"][] = ["Consultation", "Laboratory", "Imaging", "Medicines", "Room", "Procedure", "Other"];
const METHODS: Payment["method"][] = ["Cash", "Card", "GCash / E-wallet", "Bank Transfer", "HMO"];
const blankItem = (): BillItem => ({ description: "", category: "Other", quantity: 1, unitPrice: 0 });
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
const todayStr = () => timestamp().slice(0, 10);

/** Billing & cashiering: patient bills, payments with OR numbers, statements and revenue reports. */
export default function BillingView() {
  const { user } = useAuth();
  const { patients, labResults, medications, claims, hospitalConfig } = useOpdData();
  const bills = useCollection<Bill>("bills");
  const stock = useCollection<StockItem>("pharmacy_stock");
  const canEdit = user?.role === "finance" || user?.role === "staff";

  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState<Bill | null>(null); // create / edit
  const [openBill, setOpenBill] = useState<Bill | null>(null); // detail + payments
  const [pay, setPay] = useState({ amount: "", method: "Cash" as Payment["method"], orNumber: "" });

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayStr());

  const allPayments = useMemo(() => bills.items.flatMap(b => b.payments.map(p => ({ ...p, bill: b }))), [bills.items]);

  if (!user) return null;
  const signature = user.name;
  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000);
  };

  const q = search.toLowerCase();
  const rows = bills.items
    .filter(b => (tab === "open" ? b.status === "Open" : tab === "paid" ? b.status === "Paid" : true))
    .filter(b => !q || [b.id, b.patientName, b.patientId].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    open: bills.items.filter(b => b.status === "Open").length,
    paid: bills.items.filter(b => b.status === "Paid").length,
    all: bills.items.length,
  };

  // ---------- Create / edit ----------
  const newBill = () => {
    setError(null);
    setDraft({
      id: "",
      patientId: "",
      patientName: "",
      createdAt: "",
      createdBy: signature,
      items: [{ ...blankItem(), description: "Professional fee — consultation", category: "Consultation" }],
      philhealthDeduction: 0,
      discountType: "None",
      discountAmount: 0,
      payments: [],
      status: "Open",
    });
  };

  const setItem = (i: number, patch: Partial<BillItem>) =>
    setDraft(d => (d ? { ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) } : d));

  const choosePatient = (id: string) => {
    if (!draft) return;
    const p = patients.find(x => x.id === id);
    const claim = claims.find(c => c.patientId === id && c.claimStatus !== "Returned / Pending Docs");
    const senior = (p?.age ?? 0) >= 60;
    setDraft({
      ...draft,
      patientId: id,
      patientName: p?.name || "",
      philhealthDeduction: claim?.philhealthBenefit || 0,
      discountType: senior ? "Senior Citizen (20%)" : draft.discountType,
    });
  };

  /** Adds the patient's released lab/imaging tests and dispensed medicines as bill lines (prices editable). */
  const importOrders = () => {
    if (!draft?.patientId) return setError("Choose the patient first.");
    const already = new Set(draft.items.map(i => i.description));
    const lines: BillItem[] = [];
    labResults
      .filter(l => l.patientId === draft.patientId && l.status === "Ready")
      .forEach(l => {
        const description = `${l.test} (${l.date})`;
        if (!already.has(description)) lines.push({ description, category: l.category === "Radiology" ? "Imaging" : "Laboratory", quantity: 1, unitPrice: 0 });
      });
    medications
      .filter(m => m.patientId === draft.patientId && (m.dispenses?.length || m.dispensedAt))
      .forEach(m => {
        const qty = m.dispenses?.reduce((s, d) => s + d.quantity, 0) || Number.parseInt(m.dispenseQuantity || "1") || 1;
        const first = m.name.toLowerCase().split(/\s+/)[0];
        const price = stock.items.find(s => s.name.toLowerCase().includes(first))?.unitPrice || 0;
        const description = `${m.name} ${m.dose}`;
        if (!already.has(description)) lines.push({ description, category: "Medicines", quantity: qty, unitPrice: price });
      });
    if (lines.length === 0) return setError("No released tests or dispensed medicines found for this patient.");
    setError(null);
    setDraft({ ...draft, items: [...draft.items.filter(i => i.description.trim()), ...lines] });
  };

  const draftGross = draft ? billGross(draft) : 0;
  const draftDiscount = draft
    ? draft.discountType === "None"
      ? 0
      : draft.discountType === "Other"
      ? draft.discountAmount
      : statutoryDiscount(draftGross, draft.philhealthDeduction)
    : 0;

  const saveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.patientId) return setError("Choose the patient.");
    const items = draft.items.filter(i => i.description.trim());
    if (items.length === 0) return setError("Add at least one charge.");
    if (items.some(i => i.quantity <= 0 || i.unitPrice < 0)) return setError("Quantities must be above 0 and prices cannot be negative.");
    if (draft.philhealthDeduction < 0 || draftDiscount < 0) return setError("Deductions cannot be negative.");
    const bill: Bill = {
      ...draft,
      items,
      discountAmount: draftDiscount,
      id: draft.id || `BILL-${uid()}`,
      createdAt: draft.createdAt || timestamp().slice(0, 16),
    };
    if (billNet(bill) < billPaid(bill)) return setError("The new total is lower than what was already paid.");
    if (billBalance(bill) === 0 && bill.payments.length > 0) bill.status = "Paid";
    setBusy(true);
    const err = await bills.save(bill, `${draft.id ? "Updated" : "Created"} bill ${bill.id}: ${peso(billNet(bill))} net`, {
      patientId: bill.patientId,
      patientName: bill.patientName,
    });
    setBusy(false);
    if (err) return setError(err);
    setDraft(null);
    setOpenBill(bill);
    flash(`Bill ${bill.id} saved.`);
  };

  // ---------- Payments ----------
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openBill) return;
    const amount = Math.round(Number(pay.amount) * 100) / 100;
    const balance = billBalance(openBill);
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter the amount paid.");
    if (amount > balance) return setError(`Amount is more than the balance (${peso(balance)}).`);
    const or = pay.orNumber.trim();
    if (!or) return setError("Enter the official receipt (OR) number.");
    if (allPayments.some(p => p.orNumber.toLowerCase() === or.toLowerCase())) return setError(`OR number ${or} was already used.`);
    const payment: Payment = { id: `PAY-${uid()}`, amount, method: pay.method, orNumber: or, at: timestamp().slice(0, 16), by: signature };
    const updated: Bill = { ...openBill, payments: [...openBill.payments, payment] };
    updated.status = billBalance(updated) === 0 ? "Paid" : "Open";
    setBusy(true);
    const err = await bills.save(updated, `Payment ${peso(amount)} (${pay.method}, OR ${or}) on bill ${openBill.id}`, {
      patientId: openBill.patientId,
      patientName: openBill.patientName,
    });
    setBusy(false);
    if (err) return setError(err);
    setOpenBill(updated);
    setPay({ amount: "", method: pay.method, orNumber: "" });
    setError(null);
    flash(updated.status === "Paid" ? `Bill ${updated.id} is fully paid.` : `Payment recorded. Balance ${peso(billBalance(updated))}.`);
  };

  const cancelBill = async (b: Bill) => {
    if (b.payments.length > 0) return setError("A bill with payments cannot be cancelled.");
    if (!window.confirm(`Cancel bill ${b.id} for ${b.patientName}?`)) return;
    const updated: Bill = { ...b, status: "Cancelled" };
    const err = await bills.save(updated, `Cancelled bill ${b.id}`, { patientId: b.patientId, patientName: b.patientName });
    if (err) return setError(err);
    setOpenBill(updated);
  };

  const printStatement = (b: Bill) => {
    const rowsHtml = b.items
      .map(i => `<tr><td>${esc(i.description)}</td><td>${esc(i.category)}</td><td class="right">${i.quantity}</td><td class="right">${esc(peso(i.unitPrice))}</td><td class="right">${esc(peso(i.quantity * i.unitPrice))}</td></tr>`)
      .join("");
    const payHtml = b.payments.length
      ? `<h2>Payments</h2><table><tr><th>Date</th><th>OR No.</th><th>Method</th><th class="right">Amount</th></tr>${b.payments
          .map(p => `<tr><td>${esc(dt(p.at))}</td><td>${esc(p.orNumber)}</td><td>${esc(p.method)}</td><td class="right">${esc(peso(p.amount))}</td></tr>`)
          .join("")}</table>`
      : "";
    const ok = printDocument(
      "Statement of Account",
      `<p><b>Patient:</b> ${esc(b.patientName)} (${esc(b.patientId)})<br><b>Bill No.:</b> ${esc(b.id)} &nbsp; <b>Date:</b> ${esc(dt(b.createdAt))}</p>
<h2>Charges</h2><table><tr><th>Description</th><th>Category</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Amount</th></tr>${rowsHtml}</table>
<table style="width:320px;margin-left:auto;margin-top:12px">
<tr><td>Gross charges</td><td class="right">${esc(peso(billGross(b)))}</td></tr>
<tr><td>Less PhilHealth</td><td class="right">− ${esc(peso(b.philhealthDeduction))}</td></tr>
<tr><td>Less ${esc(b.discountType === "None" ? "discount" : b.discountType)}</td><td class="right">− ${esc(peso(b.discountAmount))}</td></tr>
<tr><td><b>Amount due</b></td><td class="right"><b>${esc(peso(billNet(b)))}</b></td></tr>
<tr><td>Paid</td><td class="right">${esc(peso(billPaid(b)))}</td></tr>
<tr><td><b>Balance</b></td><td class="right"><b>${esc(peso(billBalance(b)))}</b></td></tr></table>
${payHtml}
<div class="sign"><div>Billing / Cashier</div></div>`,
      hospitalConfig.name
    );
    if (!ok) setError("Allow pop-ups for this site to print.");
  };

  // ---------- Revenue ----------
  const inRange = (d: string) => d.slice(0, 10) >= from && d.slice(0, 10) <= to;
  const paymentsInRange = allPayments.filter(p => inRange(p.at)).sort((a, b) => b.at.localeCompare(a.at));
  const billsInRange = bills.items.filter(b => b.status !== "Cancelled" && inRange(b.createdAt));
  const collected = paymentsInRange.reduce((s, p) => s + p.amount, 0);
  const byMethod = METHODS.map(m => [m, paymentsInRange.filter(p => p.method === m).reduce((s, p) => s + p.amount, 0)] as const).filter(([, v]) => v > 0);
  const byCategory = CATEGORIES.map(c => [c, billsInRange.reduce((s, b) => s + b.items.filter(i => i.category === c).reduce((x, i) => x + i.quantity * i.unitPrice, 0), 0)] as const).filter(([, v]) => v > 0);
  const outstanding = bills.items.filter(b => b.status === "Open").reduce((s, b) => s + billBalance(b), 0);

  const kpi = (label: string, value: string, tone = "text-slate-900") => (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-xl font-extrabold mt-1 ${tone}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<CreditCard size={20} />}
        title="Billing & Payments"
        description="Create patient bills, apply PhilHealth and Senior/PWD discounts, record payments with OR numbers, print statements and review revenue."
        actions={
          canEdit ? (
            <button onClick={newBill} className={ui.primaryBtn}>
              + New Bill
            </button>
          ) : undefined
        }
      />
      {notice && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">{notice}</div>}
      {(bills.error || (error && !draft && !openBill)) && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{bills.error || error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {(
          [
            ["open", "Unpaid"],
            ["paid", "Paid"],
            ["all", "All Bills"],
            ["revenue", "Revenue Report"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {label}
            {id !== "revenue" && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? "bg-white/25" : "bg-slate-100 text-slate-600"}`}>{counts[id]}</span>}
          </button>
        ))}
      </div>

      {tab === "revenue" ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className={ui.label}>From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={ui.input} />
            </div>
            <div>
              <label className={ui.label}>To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={ui.input} />
            </div>
            <button
              onClick={() =>
                downloadCsv(`payments_${from}_to_${to}.csv`, [
                  ["Date", "OR Number", "Bill", "Patient ID", "Patient", "Method", "Amount", "Received By"],
                  ...paymentsInRange.map(p => [dt(p.at), p.orNumber, p.bill.id, p.bill.patientId, p.bill.patientName, p.method, p.amount.toFixed(2), p.by]),
                ])
              }
              className={ui.secondaryBtn}
            >
              Export Payments (CSV)
            </button>
            <button
              onClick={() =>
                downloadCsv(`bills_${from}_to_${to}.csv`, [
                  ["Bill", "Date", "Patient ID", "Patient", "Gross", "PhilHealth", "Discount", "Net", "Paid", "Balance", "Status"],
                  ...billsInRange.map(b => [b.id, dt(b.createdAt), b.patientId, b.patientName, billGross(b).toFixed(2), b.philhealthDeduction.toFixed(2), b.discountAmount.toFixed(2), billNet(b).toFixed(2), billPaid(b).toFixed(2), billBalance(b).toFixed(2), b.status]),
                ])
              }
              className={ui.secondaryBtn}
            >
              Export Bills (CSV)
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpi("Collected", peso(collected), "text-emerald-700")}
            {kpi("Billed (net)", peso(billsInRange.reduce((s, b) => s + billNet(b), 0)))}
            {kpi("PhilHealth deductions", peso(billsInRange.reduce((s, b) => s + b.philhealthDeduction, 0)), "text-sky-700")}
            {kpi("Outstanding (all unpaid)", peso(outstanding), "text-amber-700")}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={ui.tableWrap}>
              <div className={ui.toolbar}>
                <h2 className="text-sm font-bold text-slate-900">Collections by payment method</h2>
              </div>
              <table className={ui.table}>
                <tbody>
                  {byMethod.length === 0 && (
                    <tr>
                      <td className={ui.emptyCell}>No payments in this period.</td>
                    </tr>
                  )}
                  {byMethod.map(([m, v]) => (
                    <tr key={m} className={ui.tr}>
                      <td className={ui.td}>{m}</td>
                      <td className={`${ui.td} text-right font-mono font-bold`}>{peso(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={ui.tableWrap}>
              <div className={ui.toolbar}>
                <h2 className="text-sm font-bold text-slate-900">Charges by service</h2>
              </div>
              <table className={ui.table}>
                <tbody>
                  {byCategory.length === 0 && (
                    <tr>
                      <td className={ui.emptyCell}>No bills in this period.</td>
                    </tr>
                  )}
                  {byCategory.map(([c, v]) => (
                    <tr key={c} className={ui.tr}>
                      <td className={ui.td}>{c}</td>
                      <td className={`${ui.td} text-right font-mono font-bold`}>{peso(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={ui.tableWrap}>
            <div className={ui.toolbar}>
              <h2 className="text-sm font-bold text-slate-900">Payments ({paymentsInRange.length})</h2>
            </div>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead className={ui.thead}>
                  <tr>
                    <th className={ui.th}>Date</th>
                    <th className={ui.th}>OR No.</th>
                    <th className={ui.th}>Patient</th>
                    <th className={ui.th}>Method</th>
                    <th className={`${ui.th} text-right`}>Amount</th>
                    <th className={ui.th}>Received By</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsInRange.length === 0 && (
                    <tr>
                      <td colSpan={6} className={ui.emptyCell}>No payments in this period.</td>
                    </tr>
                  )}
                  {paymentsInRange.map(p => (
                    <tr key={p.id} className={ui.tr}>
                      <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(p.at)}</td>
                      <td className={`${ui.td} font-mono`}>{p.orNumber}</td>
                      <td className={ui.td}>{p.bill.patientName}</td>
                      <td className={ui.td}>{p.method}</td>
                      <td className={`${ui.td} text-right font-mono font-bold`}>{peso(p.amount)}</td>
                      <td className={ui.td}>{p.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className={ui.tableWrap}>
          <div className={ui.toolbar}>
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bill no., patient..." className={`${ui.input} pl-8`} />
            </div>
          </div>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Date</th>
                  <th className={ui.th}>Bill No.</th>
                  <th className={ui.th}>Patient</th>
                  <th className={`${ui.th} text-right`}>Gross</th>
                  <th className={`${ui.th} text-right`}>Deductions</th>
                  <th className={`${ui.th} text-right`}>Amount Due</th>
                  <th className={`${ui.th} text-right`}>Balance</th>
                  <th className={ui.th}>Status</th>
                  <th className={`${ui.th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.loading && (
                  <tr>
                    <td colSpan={9} className={ui.emptyCell}>Loading bills…</td>
                  </tr>
                )}
                {!bills.loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className={ui.emptyCell}>{tab === "open" ? "No unpaid bills." : "Nothing here."}</td>
                  </tr>
                )}
                {rows.map(b => (
                  <tr key={b.id} className={ui.tr}>
                    <td className={`${ui.td} font-mono whitespace-nowrap`}>{dt(b.createdAt)}</td>
                    <td className={`${ui.td} font-mono`}>{b.id}</td>
                    <td className={ui.td}>
                      <div className="font-bold text-slate-900">{b.patientName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{b.patientId}</div>
                    </td>
                    <td className={`${ui.td} text-right font-mono`}>{peso(billGross(b))}</td>
                    <td className={`${ui.td} text-right font-mono text-sky-700`}>{peso(b.philhealthDeduction + b.discountAmount)}</td>
                    <td className={`${ui.td} text-right font-mono font-bold`}>{peso(billNet(b))}</td>
                    <td className={`${ui.td} text-right font-mono font-bold ${billBalance(b) > 0 ? "text-amber-700" : "text-emerald-700"}`}>{peso(billBalance(b))}</td>
                    <td className={ui.td}>
                      <span
                        className={`${ui.badge} ${
                          b.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : b.status === "Cancelled" ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {b.status === "Open" ? "Unpaid" : b.status}
                      </span>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <button
                        onClick={() => {
                          setError(null);
                          setPay({ amount: String(billBalance(b) || ""), method: "Cash", orNumber: "" });
                          setOpenBill(b);
                        }}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {draft && (
        <Modal
          wide
          title={draft.id ? `Edit Bill ${draft.id}` : "New Bill"}
          onClose={() => !busy && setDraft(null)}
          footer={
            <>
              <button type="button" onClick={() => setDraft(null)} className={ui.secondaryBtn}>
                Cancel
              </button>
              <button type="submit" form="bill-form" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Save Bill"}
              </button>
            </>
          }
        >
          <form id="bill-form" onSubmit={saveDraft} className="space-y-3">
            {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <label className={ui.label}>Patient *</label>
                <select value={draft.patientId} onChange={e => choosePatient(e.target.value)} disabled={!!draft.id} className={ui.input}>
                  <option value="">— Select patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={importOrders} className={ui.secondaryBtn}>
                Add tests &amp; medicines from records
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-slate-500">
                    <th className="p-1.5">Description</th>
                    <th className="p-1.5">Category</th>
                    <th className="p-1.5 w-20">Qty</th>
                    <th className="p-1.5 w-28">Unit Price</th>
                    <th className="p-1.5 w-28 text-right">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-1.5 min-w-[200px]">
                        <input value={it.description} onChange={e => setItem(i, { description: e.target.value })} className={ui.input} />
                      </td>
                      <td className="p-1.5">
                        <select value={it.category} onChange={e => setItem(i, { category: e.target.value as BillItem["category"] })} className={ui.input}>
                          {CATEGORIES.map(c => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input type="number" min={1} value={it.quantity} onChange={e => setItem(i, { quantity: Number(e.target.value) })} className={ui.input} />
                      </td>
                      <td className="p-1.5">
                        <input type="number" min={0} step="0.01" value={it.unitPrice} onChange={e => setItem(i, { unitPrice: Number(e.target.value) })} className={ui.input} />
                      </td>
                      <td className="p-1.5 text-right font-mono">{peso(it.quantity * it.unitPrice)}</td>
                      <td className="p-1.5">
                        <button
                          type="button"
                          aria-label="Remove line"
                          onClick={() => setDraft({ ...draft, items: draft.items.filter((_, idx) => idx !== i) })}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setDraft({ ...draft, items: [...draft.items, blankItem()] })} className={ui.secondaryBtn}>
              + Add Charge
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={ui.label}>PhilHealth deduction (₱)</label>
                <input type="number" min={0} step="0.01" value={draft.philhealthDeduction} onChange={e => setDraft({ ...draft, philhealthDeduction: Number(e.target.value) })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Discount</label>
                <select value={draft.discountType} onChange={e => setDraft({ ...draft, discountType: e.target.value as Bill["discountType"] })} className={ui.input}>
                  {(["None", "Senior Citizen (20%)", "PWD (20%)", "Other"] as Bill["discountType"][]).map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>Discount amount (₱)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.discountType === "Other" ? draft.discountAmount : draftDiscount}
                  disabled={draft.discountType !== "Other"}
                  onChange={e => setDraft({ ...draft, discountAmount: Number(e.target.value) })}
                  className={ui.input}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 font-semibold">
              <div>Gross: {peso(draftGross)}</div>
              <div>PhilHealth: −{peso(draft.philhealthDeduction)}</div>
              <div>Discount: −{peso(draftDiscount)}</div>
              <div className="text-emerald-800">Amount due: {peso(Math.max(0, draftGross - draft.philhealthDeduction - draftDiscount))}</div>
            </div>
          </form>
        </Modal>
      )}

      {openBill && !draft && (
        <Modal
          wide
          title={`Bill ${openBill.id}`}
          subtitle={`${openBill.patientName} (${openBill.patientId}) • ${dt(openBill.createdAt)} • by ${openBill.createdBy}`}
          onClose={() => !busy && setOpenBill(null)}
          footer={
            <>
              {canEdit && openBill.status === "Open" && openBill.payments.length === 0 && (
                <>
                  <button type="button" onClick={() => cancelBill(openBill)} className={`${ui.secondaryBtn} text-rose-700`}>
                    Cancel Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDraft({ ...openBill });
                    }}
                    className={ui.secondaryBtn}
                  >
                    Edit Charges
                  </button>
                </>
              )}
              <button type="button" onClick={() => printStatement(openBill)} className={ui.primaryBtn}>
                Print Statement
              </button>
            </>
          }
        >
          {error && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">{error}</div>}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase text-slate-500 border-b border-slate-200">
                <th className="p-1.5">Description</th>
                <th className="p-1.5">Category</th>
                <th className="p-1.5 text-right">Qty</th>
                <th className="p-1.5 text-right">Price</th>
                <th className="p-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {openBill.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-1.5">{it.description}</td>
                  <td className="p-1.5">{it.category}</td>
                  <td className="p-1.5 text-right">{it.quantity}</td>
                  <td className="p-1.5 text-right font-mono">{peso(it.unitPrice)}</td>
                  <td className="p-1.5 text-right font-mono">{peso(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 font-semibold">
            <div>Gross: {peso(billGross(openBill))}</div>
            <div>PhilHealth: −{peso(openBill.philhealthDeduction)}</div>
            <div>
              {openBill.discountType === "None" ? "Discount" : openBill.discountType}: −{peso(openBill.discountAmount)}
            </div>
            <div>Amount due: {peso(billNet(openBill))}</div>
            <div>Paid: {peso(billPaid(openBill))}</div>
            <div className={billBalance(openBill) > 0 ? "text-amber-700" : "text-emerald-700"}>Balance: {peso(billBalance(openBill))}</div>
          </div>
          {openBill.payments.length > 0 && (
            <div>
              <div className={ui.label}>Payments</div>
              {openBill.payments.map(p => (
                <div key={p.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>
                    {dt(p.at)} • OR <span className="font-mono">{p.orNumber}</span> • {p.method} • {p.by}
                  </span>
                  <span className="font-mono font-bold">{peso(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {canEdit && openBill.status === "Open" && billBalance(openBill) > 0 && (
            <form onSubmit={recordPayment} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div>
                <label className={ui.label}>Amount (₱)</label>
                <input type="number" min={0} step="0.01" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} className={ui.input} />
              </div>
              <div>
                <label className={ui.label}>Method</label>
                <select value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value as Payment["method"] })} className={ui.input}>
                  {METHODS.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ui.label}>OR Number *</label>
                <input value={pay.orNumber} onChange={e => setPay({ ...pay, orNumber: e.target.value })} className={ui.input} />
              </div>
              <button type="submit" disabled={busy} className={ui.primaryBtn}>
                {busy ? "Saving..." : "Record Payment"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
