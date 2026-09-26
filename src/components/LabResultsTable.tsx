import React from "react";
import { LabTestItem } from "../types";

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
                {item.flag === "H" ? (
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
