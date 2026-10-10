import { useMemo } from "react";
import { useOpdData } from "../context/OpdDataContext";
import { PatientMovement } from "../types";
import { useCollection } from "./useCollection";

/**
 * Every admission, ward / bed transfer, referral, discharge and condition change, newest first.
 * Older records (made before the movement history existed) are rebuilt from the discharge,
 * referral and admission records.
 */
export function useMovementHistory() {
  const { discharges, referrals, admissions } = useOpdData();
  const movements = useCollection<PatientMovement>("patient_movements");

  const rows = useMemo(() => {
    const logged = new Set(movements.items.map(m => `${m.sourceId}|${m.type}`));
    const legacy: PatientMovement[] = [];
    const add = (m: PatientMovement) => {
      if (!logged.has(`${m.sourceId}|${m.type}`)) legacy.push(m);
    };
    discharges.forEach(d => {
      const outside = /Tertiary|Referred/i.test(d.disposition);
      const admitted = /Inpatient Ward/i.test(d.disposition);
      add({
        id: `legacy-${d.id}`,
        patientId: d.patientId,
        patientName: d.patientName,
        type: admitted ? "Admitted" : outside ? "Referred / Transferred Out" : "Discharged",
        to: admitted ? "Inpatient ward" : outside ? d.disposition : "Home",
        conditionBefore: d.triageBeforeDischarge,
        conditionAfter: admitted ? undefined : "stable",
        details: `${d.disposition}${d.conditionAtDischarge ? ` • Condition: ${d.conditionAtDischarge}` : ""}${d.followUpDate ? ` • Follow-up ${d.followUpDate}` : ""}`,
        at: d.dischargeDate,
        by: d.clearedByDoctor,
        byRole: "doctor",
        sourceId: d.id,
      });
    });
    referrals.forEach(r =>
      add({
        id: `legacy-${r.id}`,
        patientId: r.patientId,
        patientName: r.patientName,
        type: "Referred / Transferred Out",
        from: r.referredFrom,
        to: r.referredTo,
        details: `${r.priority}: ${r.reason} (${r.status})`,
        at: r.timestamp,
        by: r.referringDoctor,
        byRole: "doctor",
        sourceId: r.id,
      })
    );
    admissions.forEach(a => {
      // If the patient was transferred since, the first transfer's "from" is the original bed
      const firstTransfer = movements.items
        .filter(m => m.sourceId === a.id && m.type === "Ward / Bed Transfer")
        .sort((x, y) => x.at.localeCompare(y.at))[0];
      add({
        id: `legacy-adm-${a.id}`,
        patientId: a.patientId,
        patientName: a.patientName,
        type: "Admitted",
        from: "OPD",
        to: firstTransfer?.from || `${a.ward} / ${a.bed}`,
        details: a.reason,
        at: a.admissionDate,
        by: a.admittingStaff,
        byRole: "staff",
        sourceId: a.id,
      });
      if (a.status === "Discharged")
        add({
          id: `legacy-dis-${a.id}`,
          patientId: a.patientId,
          patientName: a.patientName,
          type: "Discharged",
          from: `${a.ward} / ${a.bed}`,
          to: "Home",
          details: "Bed vacated",
          at: a.dischargeDate || a.admissionDate,
          by: a.attendingPhysician,
          byRole: "doctor",
          sourceId: a.id,
        });
    });
    return [...movements.items, ...legacy].sort((x, y) => y.at.localeCompare(x.at));
  }, [movements.items, discharges, referrals, admissions]);

  return { rows, loading: movements.loading, error: movements.error };
}
