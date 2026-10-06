import React from "react";
import { DiagnosticResult, LabTestItem } from "../types";
import ImagingGallery from "./ImagingGallery";
import { printDiagnosticReport } from "../services/reports";
import { dt } from "../services/time";

/** Some stored values already include the unit ("13.8 g/dL"); avoid printing it twice. */
export function splitValue(item: LabTestItem): { value: string; unit: string } {
  const unit = item.unit?.trim() || "";
  let value = item.value.trim();
  if (unit && value.endsWith(unit)) value = value.slice(0, -unit.length).trim();
  return { value, unit };
}

const cell = "px-3 py-2 border-b border-slate-100";
const head = "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left";

/** Standard lab report layout: Parameter | Result | Unit | Reference Range | Flag. */
export default function LabResultsTable({ items }: { items: LabTestItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400 italic px-3 py-2">No result values yet.</p>;
  }
  return (
    <table className="w-full text-xs border-collapse bg-white">
      <thead className="bg-slate-50 border-y border-slate-200">
        <tr>
          <th className={head}>Parameter</th>
          <th className={head}>Result</th>
          <th className={head}>Unit</th>
          <th className={head}>Reference Range</th>
          <th className={head}>Flag</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const { value, unit } = splitValue(item);
          const flagged = !!item.flag;
          return (
            <tr key={item.name} className={flagged ? "bg-rose-50/60" : ""}>
              <td className={`${cell} font-semibold text-slate-800`}>{item.name}</td>
              <td className={`${cell} font-mono font-bold ${flagged ? "text-rose-700" : "text-slate-900"}`}>{value}</td>
              <td className={`${cell} text-slate-600`}>{unit || "—"}</td>
              <td className={`${cell} font-mono text-slate-600`}>{item.ref}</td>
              <td className={cell}>
                {item.flag === "HH" || item.flag === "LL" ? (
                  <span className="text-[10px] font-bold text-white bg-rose-600 border border-rose-700 px-1.5 py-0.5 rounded">
                    CRITICAL {item.flag === "HH" ? "HIGH" : "LOW"}
                  </span>
                ) : item.flag === "H" ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded">HIGH</span>
                ) : item.flag === "L" ? (
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100 border border-sky-200 px-1.5 py-0.5 rounded">LOW</span>
                ) : (
                  <span className="text-slate-400">Normal</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export const labStatusLabel = (status: DiagnosticResult["status"], lab?: DiagnosticResult) =>
  status === "Pending Analysis"
    ? "Ordered"
    : status === "In-Progress"
    ? lab?.acquiredAt
      ? "For Reading"
      : "In Progress"
    : "Released";

/** Full result body for one lab test or imaging study, as released by the MedTech / RadTech. */
export function DiagnosticReport({ lab }: { lab: DiagnosticResult }) {
  if (lab.status !== "Ready") {
    return (
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <span className="font-bold">{labStatusLabel(lab.status, lab)}:</span>{" "}
        {lab.acquiredAt ? "images taken; waiting for the radiologist's report." : "results are not released yet."}
        {lab.indication && <span> Indication: {lab.indication}</span>}
      </div>
    );
  }
  const imaging = !!lab.findings || lab.category === "Radiology";
  return (
    <div className="space-y-2 text-xs">
      {!!lab.images?.length && (
        <div className="p-3 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Images ({lab.images.length})</div>
          <ImagingGallery images={lab.images} />
        </div>
      )}
      {lab.findings && (
        <div className="p-3 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Findings</div>
          <p className="whitespace-pre-line text-slate-800">{lab.findings}</p>
        </div>
      )}
      {(!imaging || lab.items.length > 0) && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <LabResultsTable items={lab.items} />
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
        <span>
          <span className="font-semibold text-slate-700">{imaging ? "Impression" : "Interpretation"}:</span> {lab.summary || "—"}
        </span>
        <span className="flex items-center gap-3">
          <span>
            Released by: {lab.releasedBy || "—"}
            {lab.releasedAt ? ` • ${dt(lab.releasedAt)}` : ""}
          </span>
          <PrintReportButton lab={lab} />
        </span>
      </div>
    </div>
  );
}

export function PrintReportButton({ lab }: { lab: DiagnosticResult }) {
  const [state, setState] = React.useState<"idle" | "busy" | "blocked">("idle");
  return (
    <button
      type="button"
      onClick={async e => {
        e.stopPropagation();
        setState("busy");
        const ok = await printDiagnosticReport(lab);
        setState(ok ? "idle" : "blocked");
      }}
      className="font-bold text-emerald-700 hover:underline cursor-pointer whitespace-nowrap"
    >
      {state === "busy" ? "Preparing…" : state === "blocked" ? "Allow pop-ups to print" : "Print report"}
    </button>
  );
}
