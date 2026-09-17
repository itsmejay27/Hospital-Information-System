import React, { useState } from "react";
import { User, Patient, VisitorLog } from "../types";
import { Users, Search, Plus, Check, Clock } from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  visitorLogs: VisitorLog[];
  onAddVisitorLog: (visitor: VisitorLog) => void;
  onCheckOutVisitor: (visitorId: string) => void;
  onSignOut?: () => void;
}

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function RegistrationVisitorsView({
  user,
  patients,
  visitorLogs,
  onAddVisitorLog,
  onCheckOutVisitor,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Form State
  const [visPatientId, setVisPatientId] = useState(patients[0]?.id || "");
  const [visName, setVisName] = useState("");
  const [visRel, setVisRel] = useState("Spouse");
  const [visPhone, setVisPhone] = useState("");
  const [visIdCard, setVisIdCard] = useState("Driver's License");
  const [visBadge, setVisBadge] = useState(`BADGE-MAIN-${Math.floor(100 + Math.random() * 900)}`);
  const [visTimeIn, setVisTimeIn] = useState(getCurrentDateTimeLocal());
  const [visExpectedTimeOut, setVisExpectedTimeOut] = useState("");

  const handleOpenCheckInModal = () => {
    setVisTimeIn(getCurrentDateTimeLocal());
    setVisExpectedTimeOut("");
    setShowCheckInModal(true);
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === visPatientId) || patients[0];
    if (!visName.trim()) return;

    const newVisitor: VisitorLog = {
      id: `VIS-${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      patientName: patient.name,
      wardBed: `${patient.ward || "Ward"}, ${patient.bed || "Bed"}`,
      visitorName: visName,
      relationship: visRel,
      contactNumber: visPhone || "09XX-XXX-XXXX",
      idPresented: visIdCard,
      badgeNumber: visBadge,
      timeIn: visTimeIn.replace("T", " "),
      timeOut: visExpectedTimeOut ? visExpectedTimeOut.replace("T", " ") : undefined,
      temperatureCelsius: "36.5°C",
      purpose: "Front desk visitor entry and bedside family visit",
      status: "Currently Visiting",
      loggedByStaff: `${user.name} (${user.id})`,
    };

    onAddVisitorLog(newVisitor);
    setShowCheckInModal(false);
    setVisName("");
    setVisPhone("");
    setVisExpectedTimeOut("");
    setVisBadge(`BADGE-MAIN-${Math.floor(100 + Math.random() * 900)}`);
    setNotification(`Visitor ${visName} checked in successfully! Assigned Badge: ${newVisitor.badgeNumber}`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCheckOut = (id: string) => {
    onCheckOutVisitor(id);
    setNotification("Visitor officially checked out and security badge returned.");
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredLogs = visitorLogs.filter(v => {
    const matches =
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.wardBed.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  const activeVisitors = visitorLogs.filter(v => v.status === "Currently Visiting").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Front Desk & Security • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/registration/visitors</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users size={24} className="text-emerald-600" />
            <span>Front Desk Visitor Log & Security Badging</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Currently In-Facility: <span className="font-bold text-emerald-700">{activeVisitors} Active Visitors</span>
          </p>
        </div>

        <button
          onClick={handleOpenCheckInModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Log New Visitor Entry</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search visitor, patient, badge, or ward..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-80 focus:outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No visitor log entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-3 px-3">Visitor Name & ID</th>
                  <th className="py-3 px-3">Badge Number</th>
                  <th className="py-3 px-3">Visiting Patient</th>
                  <th className="py-3 px-3">Ward / Bed</th>
                  <th className="py-3 px-3">Time In / Expected Out</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{v.visitorName}</div>
                      <div className="text-[10px] text-slate-400">{v.relationship} • {v.idPresented}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {v.badgeNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {v.patientName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {v.wardBed}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] font-semibold text-slate-700">{v.timeIn}</div>
                      {v.timeOut ? (
                        <div className="text-[10px] text-emerald-700 font-mono">Exp. Out: {v.timeOut}</div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">Open Visit</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === "Currently Visiting"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {v.status === "Currently Visiting" ? (
                        <button
                          onClick={() => handleCheckOut(v.id)}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Departed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCheckIn} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Front Desk Visitor Log Form
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-600 block mb-1">
                  Visiting Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={visPatientId}
                  onChange={e => setVisPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-hidden"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.ward || "OPD"}, {p.bed || "Desk"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-600 block mb-1">
                  Visitor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={visName}
                  onChange={e => setVisName(e.target.value)}
                  placeholder="e.g. Juan De La Cruz"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Relationship</label>
                  <select
                    value={visRel}
                    onChange={e => setVisRel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend / Colleague</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Government ID</label>
                  <select
                    value={visIdCard}
                    onChange={e => setVisIdCard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-hidden"
                  >
                    <option value="Driver's License">Driver's License</option>
                    <option value="National ID">National ID</option>
                    <option value="Passport">Passport</option>
                    <option value="SSS / UMID">SSS / UMID</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={visPhone}
                    onChange={e => setVisPhone(e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Badge Assigned</label>
                  <input
                    type="text"
                    value={visBadge}
                    onChange={e => setVisBadge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Time In and Expected Time Out DateTime Pickers */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1 text-[10px]">
                    Time In <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={visTimeIn}
                    onChange={e => setVisTimeIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1 text-[10px]">
                    Expected Time Out <span className="text-slate-400 font-normal text-[9px]">(Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={visExpectedTimeOut}
                    onChange={e => setVisExpectedTimeOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Confirm Visitor Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
