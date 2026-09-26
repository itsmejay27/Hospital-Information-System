import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import PageHeader from "../components/PageHeader";
import { ClipboardList } from "../components/Icons";
import * as ui from "../components/tableStyles";
import CarePlanTab from "./nursing/CarePlanTab";
import DoctorOrdersTab from "./nursing/DoctorOrdersTab";
import NurseNotesTab from "./nursing/NurseNotesTab";
import NurseLabsTab from "./nursing/NurseLabsTab";
import EndorsementTab from "./nursing/EndorsementTab";
import ChiefComplaintTab from "./nursing/ChiefComplaintTab";

export type NursingTab = "careplan" | "orders" | "notes" | "labs" | "endorsement" | "complaint";

export const NURSING_TABS: { id: NursingTab; label: string }[] = [
  { id: "careplan", label: "Care Plan (ADPIE)" },
  { id: "orders", label: "Doctor's Orders" },
  { id: "notes", label: "Nurses' Notes" },
  { id: "labs", label: "Laboratory" },
  { id: "endorsement", label: "Endorsement" },
  { id: "complaint", label: "Chief Complaint" },
];

export default function NursingStationView() {
  const { user } = useAuth();
  const { patients } = useOpdData();
  const { doctorOrders, carePlans } = useWardData();
  const [params, setParams] = useSearchParams();

  const defaultTab: NursingTab = user?.role === "doctor" ? "orders" : "careplan";
  const requested = params.get("tab") as NursingTab | null;
  const tab: NursingTab = NURSING_TABS.some(t => t.id === requested) ? (requested as NursingTab) : defaultTab;
  const patientId = params.get("patient") || "";

  const update = (next: { tab?: NursingTab; patient?: string }) => {
    const p = new URLSearchParams(params);
    if (next.tab) p.set("tab", next.tab);
    if (next.patient !== undefined) {
      if (next.patient) p.set("patient", next.patient);
      else p.delete("patient");
    }
    setParams(p, { replace: true });
  };

  if (!user) return null;

  const pendingOrders = doctorOrders.filter(o => o.status === "Pending").length;
  const activePlans = carePlans.filter(p => p.status === "Active").length;
  const tabProps = { user, patients, patientId };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      <PageHeader
        icon={<ClipboardList size={20} />}
        title="Nursing Station"
        description="Nursing care plans, doctor's orders, nurses' notes, laboratory results, shift endorsements and chief complaints."
        actions={
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold uppercase text-slate-500">Patient</label>
            <select value={patientId} onChange={e => update({ patient: e.target.value })} className={`${ui.inlineInput} w-64`}>
              <option value="">All patients</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        {NURSING_TABS.map(t => {
          const count = t.id === "orders" ? pendingOrders : t.id === "careplan" ? activePlans : 0;
          return (
            <button
              key={t.id}
              onClick={() => update({ tab: t.id })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                tab === t.id ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === t.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "careplan" && <CarePlanTab {...tabProps} />}
      {tab === "orders" && <DoctorOrdersTab {...tabProps} />}
      {tab === "notes" && <NurseNotesTab {...tabProps} />}
      {tab === "labs" && <NurseLabsTab {...tabProps} />}
      {tab === "endorsement" && <EndorsementTab {...tabProps} />}
      {tab === "complaint" && <ChiefComplaintTab {...tabProps} />}
    </div>
  );
}
