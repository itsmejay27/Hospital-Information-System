import { useState } from "react";
import { User, AuditLog, HospitalConfig, Role } from "../types";
import {
  FileText,
  KeyRound,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Plus,
  Settings,
  UserCheck,
  UserX,
  Building2,
  Phone,
  Mail,
  MapPin,
  Siren,
  X,
  Check,
} from "../components/Icons";

interface Props {
  user: User;
  auditLogs: AuditLog[];
  hospitalConfig: HospitalConfig;
  onUpdateHospitalConfig: (config: HospitalConfig) => void;
  usersList: User[];
  onAddUser: (newUser: User, password: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onSignOut: () => void;
}

type AdminTab = "audit" | "rbac" | "users" | "branding" | "security";

interface RbacRow {
  feature: string;
  doctor: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  nurse: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  staff: { status: "denied" | "allowed" | "read" | "audit"; text: string };
  admin: { status: "denied" | "allowed" | "read" | "audit"; text: string };
}

function RbacBadge({ entry }: { entry: { status: "denied" | "allowed" | "read" | "audit"; text: string } }) {
  if (entry.status === "denied") {
    return (
      <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
        <XCircle size={14} className="text-rose-600 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "allowed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  if (entry.status === "read") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
        <Eye size={14} className="text-slate-500 flex-shrink-0" strokeWidth={2} />
        <span>{entry.text}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
      <ShieldCheck size={14} className="text-amber-600 flex-shrink-0" strokeWidth={2} />
      <span>{entry.text}</span>
    </span>
  );
}

export default function AdminCompliance({
  user,
  auditLogs,
  hospitalConfig,
  onUpdateHospitalConfig,
  usersList,
  onAddUser,
  onToggleUserStatus,
}: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [logFilter, setLogFilter] = useState("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Hospital Branding Form State
  const [brandingName, setBrandingName] = useState(hospitalConfig.name);
  const [brandingTagline, setBrandingTagline] = useState(hospitalConfig.tagline);
  const [brandingPhone, setBrandingPhone] = useState(hospitalConfig.phone);
  const [brandingHotline, setBrandingHotline] = useState(hospitalConfig.emergencyHotline);
  const [brandingEmail, setBrandingEmail] = useState(hospitalConfig.email);
  const [brandingDpoEmail, setBrandingDpoEmail] = useState(hospitalConfig.dpoEmail);
  const [brandingAddress, setBrandingAddress] = useState(hospitalConfig.address);
  const [brandingAccreditation, setBrandingAccreditation] = useState(hospitalConfig.accreditation);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<Role>("nurse");
  const [newTitle, setNewTitle] = useState("Staff Registered Nurse");
  const [newDepartment, setNewDepartment] = useState("Medical Surgical Ward");
  const [newLicense, setNewLicense] = useState("PRC Lic. #00");
  const [newCredentials, setNewCredentials] = useState("RN, BSN");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("pass");

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HospitalConfig = {
      name: brandingName,
      tagline: brandingTagline,
      logoText: brandingName,
      phone: brandingPhone,
      emergencyHotline: brandingHotline,
      email: brandingEmail,
      dpoEmail: brandingDpoEmail,
      address: brandingAddress,
      accreditation: brandingAccreditation,
    };
    onUpdateHospitalConfig(updated);
    setNotification("Hospital branding & contact configuration updated successfully across all system views!");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim()) return;

    const initials = newFullName
      .split(" ")
      .filter(w => w.length > 0)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join("");

    const prefix = newRole === "doctor" ? "D" : newRole === "nurse" ? "N" : newRole === "staff" ? "S" : "A";
    const id = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newUser: User = {
      id,
      name: newFullName,
      role: newRole,
      title: newTitle,
      department: newDepartment,
      avatarInitials: initials || "ST",
      licenseNumber: newLicense,
      credentials: newCredentials,
      status: "active",
      username: newUsername,
      contactEmail: `${newUsername.toLowerCase()}@citycarehospital.ph`,
    };

    onAddUser(newUser, newPassword);
    setShowCreateUserModal(false);
    setNewFullName("");
    setNewUsername("");
    setNotification(`New clinical staff account '${newUser.name}' created under role ${newRole.toUpperCase()}!`);
    setTimeout(() => setNotification(null), 5000);
  };

  const rbacMatrix: RbacRow[] = [
    {
      feature: "1. Patient Registration & Intake",
      doctor: { status: "allowed", text: "Full Access" },
      nurse: { status: "allowed", text: "Full Access" },
      staff: { status: "allowed", text: "Primary Allocator" },
      admin: { status: "allowed", text: "Full Control" },
    },
    {
      feature: "1. Inpatient Bed Allocation",
      doctor: { status: "allowed", text: "Order Admission" },
      nurse: { status: "allowed", text: "Bedside Intake" },
      staff: { status: "allowed", text: "Primary Allocator" },
      admin: { status: "allowed", text: "Full Control" },
    },
    {
      feature: "2. Creation & Updating of EHR",
      doctor: { status: "allowed", text: "Primary Author / Sign" },
      nurse: { status: "allowed", text: "Nursing Notes / Vitals" },
      staff: { status: "read", text: "Demographics Only" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "3. Prescribe Medications",
      doctor: { status: "allowed", text: "Primary Prescriber" },
      nurse: { status: "denied", text: "Denied (Read-only)" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "3. Medication Administration Record (MAR)",
      doctor: { status: "read", text: "Review Execution" },
      nurse: { status: "allowed", text: "Record Administration" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "4. Staff Account Management (Admin Exclusive)",
      doctor: { status: "denied", text: "Denied" },
      nurse: { status: "denied", text: "Denied" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "allowed", text: "Exclusive Authority" },
    },
    {
      feature: "5. Lab Diagnostic Result Retrieval",
      doctor: { status: "allowed", text: "Review & Order" },
      nurse: { status: "allowed", text: "View for Ward Care" },
      staff: { status: "read", text: "Status Only" },
      admin: { status: "audit", text: "Audit Trail Access" },
    },
    {
      feature: "6. Hospital Branding & System Configuration",
      doctor: { status: "denied", text: "Denied" },
      nurse: { status: "denied", text: "Denied" },
      staff: { status: "denied", text: "Denied" },
      admin: { status: "allowed", text: "Master Config Control" },
    },
  ];

  const filteredLogs = auditLogs.filter(l => {
    if (logFilter === "all") return true;
    return l.userRole === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Hospital Administration & DPA Compliance Console
                </span>
                <span className="text-xs text-slate-300">
                  Admin ID: <strong className="text-white">{user.id}</strong>
                </span>
                {user.licenseNumber && (
                  <span className="text-xs bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded font-mono font-semibold">
                    {user.licenseNumber}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>{user.title}</span>
                <span>•</span>
                <span>{user.department}</span>
                {user.credentials && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">{user.credentials}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={16} strokeWidth={2} />
              <span>Create Staff Account</span>
            </button>
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-2 text-xs text-emerald-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RA 10173 DPA Compliant</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Users size={16} className="flex-shrink-0" />
            <span>Admin-Only Account Management ({usersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "branding"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Settings size={16} className="flex-shrink-0" />
            <span>Dynamic Hospital Branding & Contacts</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FileText size={16} className="flex-shrink-0" />
            <span>Cryptographic Audit Ledger ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "rbac"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <KeyRound size={16} className="flex-shrink-0" />
            <span>RBAC Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "security"
                ? "bg-amber-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ShieldCheck size={16} className="flex-shrink-0" />
            <span>Security Status & NPC Guidelines</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2} className="text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: RESTRICTED ACCOUNT MANAGEMENT (ADMIN EXCLUSIVE)               */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                  <Users size={20} strokeWidth={2} className="text-amber-600" />
                  <span>Authorized Hospital Staff Account Directory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Strict Access Control: Only Administrators possess authority to create, update, or deactivate accounts for Doctors, Nurses, and Staff. Patient accounts are strictly prohibited.
                </p>
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs flex-shrink-0"
              >
                <Plus size={16} strokeWidth={2} />
                <span>Create Staff User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Worker Full Name & ID</th>
                    <th className="px-4 py-3">Role & Title</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">PRC License / Credentials</th>
                    <th className="px-4 py-3">Username & Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{u.id}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === "doctor"
                            ? "bg-blue-100 text-blue-800"
                            : u.role === "nurse"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "staff"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {u.role}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium">{u.title}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                        {u.department}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono text-slate-900 font-semibold">{u.licenseNumber || "N/A"}</div>
                        <div className="text-[10px] text-slate-500">{u.credentials}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                        <div>User: <strong>{u.username || u.id.toLowerCase()}</strong></div>
                        <div className="text-[10px] text-slate-500">{u.contactEmail}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded ${
                          u.status === "suspended"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {u.status === "suspended" ? (
                            <>
                              <UserX size={12} strokeWidth={2} />
                              <span>Suspended</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} strokeWidth={2} />
                              <span>Active</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                            u.status === "suspended"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {u.status === "suspended" ? "Re-activate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: DYNAMIC HOSPITAL BRANDING & CONTACT CONFIGURATION            */}
      {/* ========================================================================= */}
      {activeTab === "branding" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="font-serif text-2xl text-slate-900 flex items-center gap-2">
                <Settings size={22} strokeWidth={2} className="text-amber-600" />
                <span>Customizable Hospital Branding & Contact Configurator</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure Hospital Name, Logo Text, Emergency Hotline, Telephones, Emails, and Physical Address across all headers, footers, and reports.
              </p>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 size={14} strokeWidth={2} className="text-slate-500" />
                    <span>Hospital Official Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingName}
                    onChange={e => setBrandingName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-medium text-sm"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">Appears on navigation header, browser tab, and reports.</div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Hospital Tagline / Motto
                  </label>
                  <input
                    type="text"
                    value={brandingTagline}
                    onChange={e => setBrandingTagline(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block font-semibold uppercase text-rose-700 mb-1 flex items-center gap-1.5">
                    <Siren size={14} strokeWidth={2} className="text-rose-600" />
                    <span>Emergency Hotline Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingHotline}
                    onChange={e => setBrandingHotline(e.target.value)}
                    className="w-full border border-rose-300 bg-rose-50/50 rounded-lg p-2.5 font-bold font-mono text-rose-800"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">Displayed in top red emergency banner (e.g. 911).</div>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone size={14} strokeWidth={2} className="text-slate-500" />
                    <span>Hospital Trunkline / General Phone</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandingPhone}
                    onChange={e => setBrandingPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail size={14} strokeWidth={2} className="text-slate-500" />
                    <span>General Contact Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={brandingEmail}
                    onChange={e => setBrandingEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} strokeWidth={2} className="text-slate-500" />
                    <span>Data Protection Officer (DPO) Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={brandingDpoEmail}
                    onChange={e => setBrandingDpoEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">
                    Accreditation & Quality Status
                  </label>
                  <input
                    type="text"
                    value={brandingAccreditation}
                    onChange={e => setBrandingAccreditation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={2} className="text-slate-500" />
                  <span>Hospital Physical Address</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={brandingAddress}
                  onChange={e => setBrandingAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={16} strokeWidth={2} />
                  <span>Save & Apply Dynamic Branding</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: CRYPTOGRAPHIC ACCESS AUDIT LEDGER                            */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
              <div>
                <h2 className="font-semibold text-lg text-slate-900">
                  Cryptographic Access & Transaction Audit Trail
                </h2>
                <p className="text-xs text-slate-500">
                  Permanent immutable ledger of all hospital worker clinical interactions with worker credentials transparency per Section 20 of RA 10173.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filter Role:</span>
                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-xs bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Account & License</th>
                    <th className="px-4 py-3">Action Executed</th>
                    <th className="px-4 py-3">Target Patient / Unit</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">IP / Device</th>
                    <th className="px-4 py-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.userLicense || log.userRole.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{log.action}</td>
                      <td className="px-4 py-3 text-slate-700">{log.targetPatient}</td>
                      <td className="px-4 py-3 text-slate-600">{log.department}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: RBAC PERMISSIONS MATRIX                                      */}
      {/* ========================================================================= */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg text-slate-900 mb-1">
              Strict Role-Based Access Control (RBAC) System Matrix
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Complete specification of permission segregation across all hospital modules. Patients have zero system accounts or access.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Clinical / Administrative Module</th>
                    <th className="px-3 py-3">Doctor</th>
                    <th className="px-3 py-3">Nurse</th>
                    <th className="px-3 py-3">Admissions Staff</th>
                    <th className="px-3 py-3 bg-amber-50 text-amber-900">Hospital Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rbacMatrix.map(row => (
                    <tr key={row.feature} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.feature}</td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.doctor} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.nurse} />
                      </td>
                      <td className="px-3 py-3">
                        <RbacBadge entry={row.staff} />
                      </td>
                      <td className="px-3 py-3 bg-amber-50/50">
                        <RbacBadge entry={row.admin} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: SECURITY STATUS                                              */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-lg text-slate-900">DPA 2012 & NPC Circular Compliance Status</h2>
            <p className="text-xs text-slate-500">
              Evaluation of technical and organizational healthcare security measures per RA 10173.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <Lock size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-slate-900">Patient Access Elimination</div>
                <div className="text-xs text-slate-600 mt-1">
                  Zero public patient accounts; hospital records are managed solely by verified healthcare personnel.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <ShieldCheck size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-slate-900">Admin Account Authority</div>
                <div className="text-xs text-slate-600 mt-1">
                  Account provisioning is strictly restricted to system administrators with mandatory license tracking.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 mb-3 shadow-2xs">
                  <FileText size={18} strokeWidth={2} />
                </div>
                <div className="font-bold text-sm text-slate-900">Immutable Audit Ledger</div>
                <div className="text-xs text-slate-600 mt-1">
                  All clinical encounters, medication entries, and visitor check-ins are stamped with provider license numbers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CREATE STAFF USER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-serif text-lg text-slate-900">Provision Hospital Staff Account</h3>
                <p className="text-xs text-slate-500">Restricted Admin-Only Authority</p>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="e.g. Dr. Christine Tan, MD or Kevin Santos, RN"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Hospital Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as Role)}
                    className="w-full border rounded-lg p-2.5 bg-white"
                  >
                    <option value="doctor">Doctor / Physician</option>
                    <option value="nurse">Nurse / Charge Nurse</option>
                    <option value="staff">Admissions / Staff</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Official Position Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">PRC License / Staff ID</label>
                  <input
                    type="text"
                    required
                    value={newLicense}
                    onChange={e => setNewLicense(e.target.value)}
                    placeholder="PRC Lic. #00XXXXX"
                    className="w-full border rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1">Professional Credentials</label>
                <input
                  type="text"
                  value={newCredentials}
                  onChange={e => setNewCredentials(e.target.value)}
                  placeholder="e.g. MD, FPCP, FPCC or RN, MAN, CCRN"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. dr.tan, nurse.kevin"
                    className="w-full border rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
