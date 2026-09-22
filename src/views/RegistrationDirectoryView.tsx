import React, { useState } from "react";
import { User, Patient, TriageTier } from "../types";
import { Users, Search, Filter, Phone, MapPin, Check } from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  onSignOut?: () => void;
}

export default function RegistrationDirectoryView({ user, patients }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [triageFilter, setTriageFilter] = useState<TriageTier | "all">("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.ward && p.ward.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.philhealth?.pin && p.philhealth.pin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.contact.includes(searchTerm);
    if (!matchesSearch) return false;

    if (triageFilter === "all") return true;
    return p.triageTier === triageFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner (Medzone Hospital Emerald Theme) */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-500/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              Registration Records • Master Index
            </span>
            <span className="text-xs text-emerald-200/80 font-mono">/registration/directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users size={28} className="text-emerald-300" />
            <span>Master Patient Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Total Registered Patients: <span className="font-bold text-white">{patients.length}</span> records in hospital master database.
          </p>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, MRN, phone, ward, or PhilHealth..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-80 focus:outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={14} />
            <span>Acuity Filter:</span>
            <select
              value={triageFilter}
              onChange={e => setTriageFilter(e.target.value as TriageTier | "all")}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="all">All Tiers ({patients.length})</option>
              <option value="critical">Critical (Red)</option>
              <option value="observation">Observation (Yellow)</option>
              <option value="stable">Stable (Green)</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        {filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No registered patients match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-3 px-3">Patient & MRN</th>
                  <th className="py-3 px-3">Age / Gender</th>
                  <th className="py-3 px-3">Blood Type</th>
                  <th className="py-3 px-3">Status & Ward</th>
                  <th className="py-3 px-3">PhilHealth Status</th>
                  <th className="py-3 px-3">Acuity</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.id}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200">
                        {p.bloodType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{p.admissionStatus}</div>
                      {p.ward && <div className="text-[10px] text-slate-500">{p.ward} ({p.bed})</div>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] text-slate-700">{p.philhealth?.pin || "N/A"}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{p.philhealth?.eligibilityStatus || "Verified"}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          p.triageTier === "critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : p.triageTier === "observation"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {p.triageTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPatient.name}</h3>
                <span className="font-mono text-xs text-slate-400">MRN: {selectedPatient.id}</span>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age & Gender</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.age} yrs • {selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Civil Status</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.civilStatus || "Single"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.contact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Type</span>
                  <span className="font-bold text-teal-700">{selectedPatient.bloodType}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Address</span>
                <p className="font-medium text-slate-700 mt-0.5">{selectedPatient.address || "Metro Manila, Philippines"}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Chief Complaint</span>
                <p className="font-medium text-slate-700 mt-0.5">{selectedPatient.chiefComplaint}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">PhilHealth Details</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  PIN: {selectedPatient.philhealth?.pin || "N/A"} • {selectedPatient.philhealth?.category}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
