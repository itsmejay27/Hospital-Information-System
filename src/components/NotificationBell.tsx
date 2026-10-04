import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import { hospitalDb } from "../services/db";
import { isToDispense, stockStatus } from "../services/pharmacy";
import { billBalance } from "../services/billing";
import { timestamp } from "../services/ids";
import { Appointment, Bill, IncidentReport, PrivacyRequest, StockItem } from "../types";
import { Bell } from "./Icons";

type Level = "critical" | "warning" | "info";
interface Notice {
  /** Stable id: the same event keeps the same id, so "read" survives refreshes. */
  id: string;
  level: Level;
  title: string;
  detail: string;
  time?: string;
  path: string;
}

const levelDot: Record<Level, string> = { critical: "bg-rose-500", warning: "bg-amber-500", info: "bg-sky-500" };
const levelOrder: Record<Level, number> = { critical: 0, warning: 1, info: 2 };
const MAX_SEEN = 500;

// Read state is a per-browser convenience, so it lives in localStorage (guarded: it may be unavailable)
const seenKey = (userId: string) => `carepoint_seen_notifications_${userId}`;
function loadSeen(userId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(userId)) || "[]"));
  } catch {
    return new Set();
  }
}
function storeSeen(userId: string, seen: Set<string>) {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify([...seen].slice(-MAX_SEEN)));
  } catch {
    /* ignore */
  }
}

/** Tables only some roles use; loaded when the bell mounts and each time it is opened. */
interface Extra {
  stock: StockItem[];
  appointments: Appointment[];
  incidents: IncidentReport[];
  privacy: PrivacyRequest[];
  bills: Bill[];
}
const EMPTY: Extra = { stock: [], appointments: [], incidents: [], privacy: [], bills: [] };

/** Role-aware notification centre in the top bar. */
export default function NotificationBell() {
  const { user } = useAuth();
  const { labResults, medications, queue, profileRequests, auditLogs, claims } = useOpdData();
  const { doctorOrders } = useWardData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<Extra>(EMPTY);
  const ref = useRef<HTMLDivElement>(null);
  const role = user?.role;

  useEffect(() => {
    if (user) setSeen(loadSeen(user.id));
  }, [user]);

  const loadExtra = useCallback(async () => {
    if (!role) return;
    const get = async <T extends { id: string }>(store: string, roles: string[]) =>
      roles.includes(role) ? hospitalDb.getAll<T>(store).catch(() => [] as T[]) : ([] as T[]);
    const [stock, appointments, incidents, privacy, bills] = await Promise.all([
      get<StockItem>("pharmacy_stock", ["pharmacy"]),
      get<Appointment>("appointments", ["staff", "doctor"]),
      get<IncidentReport>("incident_reports", ["legal", "admin"]),
      get<PrivacyRequest>("privacy_requests", ["legal"]),
      get<Bill>("bills", ["finance"]),
    ]);
    setExtra({ stock, appointments, incidents, privacy, bills });
  }, [role]);

  useEffect(() => {
    loadExtra();
  }, [loadExtra]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const notices = useMemo<Notice[]>(() => {
    if (!user) return [];
    const list: Notice[] = [];
    const today = timestamp().slice(0, 10);
    const recent = (d?: string) => !!d && d.slice(0, 10) >= new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

    // Everyone: decisions on my own profile change requests
    profileRequests
      .filter(r => r.userId === user.id && r.status !== "Pending" && recent(r.reviewedAt))
      .forEach(r =>
        list.push({
          id: `profile-${r.id}-${r.status}`,
          level: r.status === "Approved" ? "info" : "warning",
          title: `Profile change ${r.status.toLowerCase()}`,
          detail: `${r.reviewedBy || "Administrator"}${r.reviewNote ? `: "${r.reviewNote}"` : ""}`,
          time: r.reviewedAt,
          path: "/settings",
        })
      );

    // Doctors & nurses: critical lab values not yet acknowledged
    if (role === "doctor" || role === "nurse") {
      labResults
        .filter(l => l.critical && l.status === "Ready" && !l.criticalAckAt)
        .forEach(l =>
          list.push({
            id: `critical-${l.id}`,
            level: "critical",
            title: `Critical result: ${l.patientName}`,
            detail: `${l.test} — ${l.items.filter(i => i.flag === "HH" || i.flag === "LL").map(i => `${i.name} ${i.value}`).join(", ")}`,
            time: l.releasedAt,
            path: "/clinical?tab=labs",
          })
        );
    }

    if (role === "doctor") {
      labResults
        .filter(l => l.status === "Ready" && l.orderingPhysician === user.name && recent(l.releasedAt))
        .forEach(l =>
          list.push({
            id: `result-${l.id}`,
            level: "info",
            title: `${l.category === "Radiology" ? "Imaging report" : "Lab result"} ready: ${l.patientName}`,
            detail: `${l.test} • released by ${l.releasedBy}`,
            time: l.releasedAt,
            path: "/clinical?tab=labs",
          })
        );
      const waiting = queue.filter(q => q.status === "Waiting");
      if (waiting.length)
        list.push({
          id: `queue-${today}-${waiting.length}`,
          level: waiting.some(q => q.triageTier === "critical") ? "warning" : "info",
          title: `${waiting.length} patient${waiting.length > 1 ? "s" : ""} waiting`,
          detail: waiting.some(q => q.triageTier === "critical") ? "Includes a critical triage patient" : `Next: ${waiting[0].patientName}`,
          path: "/queue",
        });
      const mine = extra.appointments.filter(a => a.doctorId === user.id && a.date === today && a.status === "Scheduled");
      if (mine.length)
        list.push({
          id: `appts-${today}-${mine.length}`,
          level: "info",
          title: `${mine.length} appointment${mine.length > 1 ? "s" : ""} today`,
          detail: mine.map(a => `${a.time} ${a.patientName}`).slice(0, 3).join(", "),
          path: "/appointments",
        });
    }

    if (role === "nurse") {
      doctorOrders
        .filter(o => o.status === "Pending")
        .forEach(o =>
          list.push({
            id: `order-${o.id}`,
            level: o.priority === "STAT" ? "critical" : o.priority === "Urgent" ? "warning" : "info",
            title: `${o.priority} order: ${o.patientName}`,
            detail: `${o.order} — ${o.orderedBy}`,
            time: o.orderedAt,
            path: "/nursing?tab=orders",
          })
        );
      labResults
        .filter(l => l.status === "Ready" && recent(l.releasedAt) && !l.critical)
        .slice(0, 10)
        .forEach(l =>
          list.push({
            id: `result-${l.id}`,
            level: "info",
            title: `Result released: ${l.patientName}`,
            detail: l.test,
            time: l.releasedAt,
            path: "/nursing?tab=labs",
          })
        );
    }

    if (role === "staff") {
      extra.appointments
        .filter(a => a.date === today && a.status === "Scheduled")
        .forEach(a =>
          list.push({
            id: `appt-${a.id}`,
            level: "info",
            title: `Appointment ${a.time}: ${a.patientName}`,
            detail: `with ${a.doctorName}${a.patientId ? "" : " • not registered yet"}`,
            path: "/appointments",
          })
        );
    }

    if (role === "medtech" || role === "radtech" || role === "radiologist") {
      labResults
        .filter(l => {
          const img = l.category === "Radiology";
          if (role === "medtech") return !img && l.status === "Pending Analysis";
          if (role === "radtech") return img && l.status === "Pending Analysis";
          return img && l.status === "In-Progress" && !!l.acquiredAt;
        })
        .forEach(l =>
          list.push({
            id: `${role}-${l.id}`,
            level: l.priority === "STAT" ? "critical" : l.priority === "Urgent" ? "warning" : "info",
            title: `${role === "radiologist" ? "Ready for reading" : "New request"}: ${l.test}`,
            detail: `${l.patientName} • ${l.priority || "Routine"} • ${l.orderingPhysician}`,
            time: role === "radiologist" ? l.acquiredAt : l.orderedAt || l.date,
            path: role === "medtech" ? "/lab" : "/imaging",
          })
        );
    }

    if (role === "pharmacy") {
      medications.filter(isToDispense).forEach(m =>
        list.push({
          id: `rx-${m.id}`,
          level: "info",
          title: `To dispense: ${m.name} ${m.dose}`,
          detail: `${m.patientName} • ${m.prescribedBy}`,
          time: m.start,
          path: "/pharmacy",
        })
      );
      extra.stock.forEach(s => {
        const st = stockStatus(s);
        if (st)
          list.push({
            id: `stock-${s.id}-${st.label}-${s.quantity}`,
            level: st.label === "Expired" || st.label === "Out of stock" ? "critical" : "warning",
            title: `${st.label}: ${s.name} ${s.strength}`,
            detail: `${s.quantity} ${s.unit} on hand${s.expiryDate ? ` • exp ${s.expiryDate}` : ""}`,
            path: "/pharmacy",
          });
      });
    }

    if (role === "finance") {
      const unpaid = extra.bills.filter(b => b.status === "Open" && billBalance(b) > 0);
      if (unpaid.length)
        list.push({
          id: `unpaid-${today}-${unpaid.length}`,
          level: "info",
          title: `${unpaid.length} unpaid bill${unpaid.length > 1 ? "s" : ""}`,
          detail: `Outstanding ₱${unpaid.reduce((s, b) => s + billBalance(b), 0).toLocaleString()}`,
          path: "/billing",
        });
      claims
        .filter(c => c.claimStatus === "Returned / Pending Docs")
        .forEach(c =>
          list.push({
            id: `claim-${c.id}-returned`,
            level: "warning",
            title: `Claim returned: ${c.memberName}`,
            detail: `${c.id} needs documents`,
            path: "/philhealth",
          })
        );
    }

    if (role === "admin") {
      profileRequests
        .filter(r => r.status === "Pending")
        .forEach(r =>
          list.push({
            id: `review-${r.id}`,
            level: "warning",
            title: `Approval needed: ${r.userName}`,
            detail: `Profile change: ${Object.keys(r.changes).join(", ")}`,
            time: r.requestedAt,
            path: "/admin/accounts",
          })
        );
    }

    if (role === "legal" || role === "admin") {
      extra.incidents
        .filter(i => i.status === "Open")
        .forEach(i =>
          list.push({
            id: `incident-${i.id}`,
            level: i.severity === "High" || i.severity === "Sentinel" ? "critical" : "warning",
            title: `Incident: ${i.category} (${i.severity})`,
            detail: `${i.location} • reported by ${i.reportedBy}`,
            time: i.reportedAt,
            path: "/legal",
          })
        );
    }

    if (role === "legal") {
      extra.privacy
        .filter(r => (r.status === "Received" || r.status === "In Review") && r.dueDate <= new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10))
        .forEach(r =>
          list.push({
            id: `dpr-${r.id}-${r.dueDate < today ? "overdue" : "due"}`,
            level: r.dueDate < today ? "critical" : "warning",
            title: `${r.dueDate < today ? "Overdue" : "Due soon"}: privacy request`,
            detail: `${r.type} — ${r.requesterName} • due ${r.dueDate}`,
            path: "/legal",
          })
        );
      auditLogs
        .filter(l => l.status === "Flagged" && recent(l.timestamp))
        .forEach(l =>
          list.push({
            id: `flag-${l.id}`,
            level: "warning",
            title: `Flagged activity: ${l.userName}`,
            detail: l.action,
            time: l.timestamp,
            path: "/admin/audit-ledger",
          })
        );
    }

    return list.sort((a, b) => levelOrder[a.level] - levelOrder[b.level] || (b.time || "").localeCompare(a.time || ""));
  }, [user, role, labResults, medications, queue, profileRequests, auditLogs, claims, doctorOrders, extra]);

  if (!user) return null;
  const unread = notices.filter(n => !seen.has(n.id));

  const markRead = (ids: string[]) => {
    const next = new Set(seen);
    ids.forEach(id => next.add(id));
    setSeen(next);
    storeSeen(user.id, next);
  };

  const openNotice = (n: Notice) => {
    markRead([n.id]);
    setOpen(false);
    navigate(n.path);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) loadExtra();
          setOpen(o => !o);
        }}
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Bell size={18} strokeWidth={2} />
        {unread.length > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white ${
              unread.some(n => n.level === "critical") ? "bg-rose-600" : "bg-amber-500"
            }`}
          >
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900">Notifications</div>
            {unread.length > 0 && (
              <button onClick={() => markRead(notices.map(n => n.id))} className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
            {notices.length === 0 && <div className="px-4 py-8 text-center text-xs text-slate-400">You're all caught up.</div>}
            {notices.map(n => {
              const isUnread = !seen.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => openNotice(n)}
                  className={`w-full text-left px-4 py-2.5 flex gap-3 hover:bg-slate-50 cursor-pointer ${isUnread ? "bg-emerald-50/40" : ""}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isUnread ? levelDot[n.level] : "bg-slate-200"}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-600"}`}>{n.title}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{n.detail}</span>
                    {n.time && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{n.time}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
