import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { DiagnosticResult } from "../types";
import { timestamp } from "../services/ids";
import { AlertTriangle } from "./Icons";
import { dt } from "../services/time";

/**
 * Banner shown to doctors and nurses on every page while a released lab result has a
 * critical (HH/LL) value that no doctor has acknowledged yet.
 */
export default function CriticalResultsAlert() {
  const { user } = useAuth();
  const { labResults, updateLabResult } = useOpdData();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!user || (user.role !== "doctor" && user.role !== "nurse")) return null;

  const pending = labResults
    .filter(l => l.critical && l.status === "Ready" && !l.criticalAckAt)
    .sort((a, b) => (b.releasedAt || "").localeCompare(a.releasedAt || ""));
  if (pending.length === 0) return null;

  const acknowledge = async (l: DiagnosticResult) => {
    setBusy(l.id);
    setError(null);
    try {
      const by = user.licenseNumber ? `${user.name} (${user.licenseNumber})` : user.name;
      await updateLabResult({ ...l, criticalAckBy: by, criticalAckAt: timestamp().slice(0, 16) }, `Acknowledged critical result: ${l.test}`);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div role="alert" className="mb-4 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 sm:p-4 text-xs text-rose-900">
      <div className="flex items-center gap-2 font-extrabold text-sm">
        <AlertTriangle size={18} className="text-rose-600" />
        Critical lab result{pending.length > 1 ? `s (${pending.length})` : ""} — act now
      </div>
      {error && <div className="mt-1 font-semibold">{error}</div>}
      <div className="mt-2 space-y-2">
        {pending.map(l => {
          const crit = l.items.filter(i => i.flag === "HH" || i.flag === "LL");
          const mine = l.orderingPhysician === user.name;
          return (
            <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-white border border-rose-200 px-3 py-2">
              <div className="flex-1 min-w-0">
                <span className="font-bold">{l.patientName}</span> ({l.patientId}) • {l.test} •{" "}
                {crit.map(i => `${i.name} ${i.value}${i.unit ? " " + i.unit : ""} (${i.flag === "HH" ? "critical high" : "critical low"})`).join(", ")}
                <div className="text-[10px] text-rose-700">
                  Released {dt(l.releasedAt)} by {l.releasedBy} • ordered by {l.orderingPhysician}
                  {mine ? " (you)" : ""}
                </div>
              </div>
              {user.role === "doctor" ? (
                <button
                  onClick={() => acknowledge(l)}
                  disabled={busy === l.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shrink-0"
                >
                  {busy === l.id ? "Saving..." : "Acknowledge"}
                </button>
              ) : (
                <span className="text-[10px] font-bold shrink-0">Inform the doctor immediately</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
