import React, { useState } from "react";
import { DiagnosticResult } from "../../types";
import { useOpdData } from "../../context/OpdDataContext";
import Modal from "../../components/Modal";
import LabResultsTable from "../../components/LabResultsTable";
import { Search } from "../../components/Icons";
import * as ui from "../../components/tableStyles";
import { NursingTabProps } from "./helpers";

const statusStyle: Record<DiagnosticResult["status"], string> = {
  Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "In-Progress": "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Analysis": "bg-sky-50 text-sky-700 border-sky-200",
};

/** Laboratory results as seen from the nursing station (read-only). */
export default function NurseLabsTab({ patientId }: NursingTabProps) {
  const { labResults } = useOpdData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | DiagnosticResult["status"]>("All");
  const [viewing, setViewing] = useState<DiagnosticResult | null>(null);

  const rows = labResults
    .filter(l => {
      if (patientId && l.patientId !== patientId) return false;
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      const q = search.toLowerCase();
      return !q || [l.patientName, l.test, l.category, l.orderingPhysician].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className={ui.tableWrap}>
      <div className={ui.toolbar}>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient, test, physician..."
              className={`${ui.input} pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as "All" | DiagnosticResult["status"])}
            className={ui.inlineInput}
          >
            <option value="All">All statuses</option>
            <option>Pending Analysis</option>
            <option>In-Progress</option>
            <option>Ready</option>
          </select>
        </div>
        <span className="text-[11px] text-slate-500">Lab requests are ordered by physicians under Doctor's Orders.</span>
      </div>

      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>Date</th>
              <th className={ui.th}>Patient</th>
              <th className={ui.th}>Test</th>
              <th className={ui.th}>Category</th>
              <th className={ui.th}>Specimen</th>
              <th className={ui.th}>Ordering Physician</th>
              <th className={ui.th}>Status</th>
              <th className={ui.th}>Abnormal</th>
              <th className={ui.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className={ui.emptyCell}>
                  No laboratory results{patientId ? " for this patient" : ""}.
                </td>
              </tr>
            )}
            {rows.map(l => {
              const abnormal = l.items.filter(i => i.flag).length;
              return (
                <tr key={l.id} className={ui.tr}>
                  <td className={`${ui.td} font-mono whitespace-nowrap`}>{l.date}</td>
                  <td className={ui.td}>
                    <div className="font-bold text-slate-900">{l.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{l.patientId}</div>
                  </td>
                  <td className={`${ui.td} font-semibold text-slate-900`}>{l.test}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{l.category}</td>
                  <td className={ui.td}>{l.specimenType || "—"}</td>
                  <td className={`${ui.td} whitespace-nowrap`}>{l.orderingPhysician}</td>
                  <td className={ui.td}>
                    <span className={`${ui.badge} ${statusStyle[l.status]}`}>{l.status}</span>
                  </td>
                  <td className={ui.td}>
                    {abnormal > 0 ? (
                      <span className={`${ui.badge} bg-rose-50 text-rose-700 border-rose-200`}>{abnormal} flagged</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className={`${ui.td} text-right`}>
                    <button onClick={() => setViewing(l)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
                      View Results
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal
          wide
          title={`${viewing.test} — ${viewing.patientName}`}
          subtitle={`${viewing.id} • ${viewing.date} • ordered by ${viewing.orderingPhysician} • released by ${viewing.releasedBy}`}
          onClose={() => setViewing(null)}
        >
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <LabResultsTable items={viewing.items} />
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700">Summary: </span>
            {viewing.summary}
          </div>
        </Modal>
      )}
    </div>
  );
}
