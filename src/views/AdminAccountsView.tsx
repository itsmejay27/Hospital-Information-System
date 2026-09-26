import React, { useState } from "react";
import { User, Role } from "../types";
import { isSupabaseConfigured } from "../services/supabase";
import {
  Users,
  Plus,
  Search,
  Check,
  UserCheck,
  UserX,
  ShieldCheck,
} from "../components/Icons";

interface Props {
  user: User;
  usersList: User[];
  onAddUser: (newUser: User, password: string, email?: string) => Promise<string | null>;
  onToggleUserStatus: (userId: string) => void;
  onSignOut?: () => void;
}

export default function AdminAccountsView({
  user,
  usersList,
  onAddUser,
  onToggleUserStatus,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [notification, setNotification] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for new user
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("nurse");
  const [title, setTitle] = useState("Staff Registered Nurse");
  const [department, setDepartment] = useState("Medical Surgical Ward");
  const [license, setLicense] = useState("PRC Lic. #00");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(isSupabaseConfigured ? "" : "pass");
  const [email, setEmail] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;
    setCreateError(null);

    const initials = fullName
      .split(" ")
      .filter(w => w.length > 0)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join("");

    const newUserObj: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      name: fullName,
      role: role,
      title: title,
      department: department,
      avatarInitials: initials || "ST",
      licenseNumber: license,
      status: "active",
      username: username,
    };

    setIsCreating(true);
    const error = await onAddUser(newUserObj, password, email.trim() || undefined);
    setIsCreating(false);
    if (error) {
      setCreateError(error);
      return;
    }
    setShowCreateModal(false);
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword(isSupabaseConfigured ? "" : "pass");
    setNotification(`Account for ${fullName} (${role.toUpperCase()}) created successfully!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (roleFilter === "all") return true;
    return u.role === roleFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-amber-950 text-amber-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-amber-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-amber-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-amber-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Identity Governance • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/admin/accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users size={24} className="text-amber-600" />
            <span>Account Directory & Role Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Authority: <span className="font-semibold text-slate-800">{user.name}</span> • Total Registered Accounts:{" "}
            <span className="font-bold text-slate-800">{usersList.length}</span>
          </p>
        </div>

        <button
          onClick={() => { setCreateError(null); setShowCreateModal(true); }}
          className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search user name, username, license, or department..."
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-full sm:w-80 focus:outline-hidden focus:bg-white focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Filter Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="nurse">Nurses</option>
              <option value="staff">Staff</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-3 px-3">Clinician / User</th>
                <th className="py-3 px-3">Role & Title</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">License Credential</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const isActive = u.status !== "suspended" && u.status !== "inactive";
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {u.avatarInitials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username || u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block mb-0.5 ${
                          u.role === "doctor"
                            ? "bg-teal-100 text-teal-800"
                            : u.role === "nurse"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "admin"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {u.role}
                      </span>
                      <div className="text-[11px] text-slate-600 font-medium">{u.title}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {u.department}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {u.licenseNumber || "N/A"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.id !== user.id ? (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            isActive
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                          <span>{isActive ? "Suspend" : "Reactivate"}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Current Session</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Provision New Healthcare Worker Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {createError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold">
                  {createError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Roberto Mendoza"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-900 focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={e => {
                      const r = e.target.value as Role;
                      setRole(r);
                      if (r === "doctor") setTitle("Attending Physician, MD");
                      else if (r === "nurse") setTitle("Staff Registered Nurse");
                      else if (r === "admin") setTitle("System Administrator");
                      else setTitle("Admissions Officer");
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900 focus:outline-hidden"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Assigned Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-600 block mb-1">PRC License Number</label>
                <input
                  type="text"
                  value={license}
                  onChange={e => setLicense(e.target.value)}
                  placeholder="PRC Lic. #0093821"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:bg-white focus:outline-hidden"
                />
              </div>

              {isSupabaseConfigured && (
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Login Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. rmendoza@carepointmedical.ph"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. rmendoza"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-slate-600 block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    value={password}
                    minLength={isSupabaseConfigured ? 8 : undefined}
                    placeholder={isSupabaseConfigured ? "At least 8 characters" : undefined}
                    autoComplete="new-password"
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Provision Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
