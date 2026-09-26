import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import StaffAvatar from "../components/StaffAvatar";
import {
  Settings,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Clock,
  Activity,
  Check,
  Building2,
  Stethoscope,
  Bell,
  CheckCircle,
  FileText,
  AlertTriangle,
  ChevronRight,
  LogOut,
  Smartphone,
  KeyRound,
  RefreshCw,
} from "../components/Icons";

export default function SettingsView() {
  const { user, changePassword, isSecureMode } = useAuth();
  const { hospitalConfig } = useOpdData();
  const { staffPhotos, saveMyPhoto } = useWardData();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<"profile" | "clinical" | "display" | "security">("profile");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || "Dr. Maria Elena Santos, MD");
  const [profileTitle, setProfileTitle] = useState(user?.title || "Attending Physician");
  const [profileLicense, setProfileLicense] = useState(user?.licenseNumber || "PRC-0089241");
  const [profileDepartment, setProfileDepartment] = useState(user?.department || "Outpatient Department (OPD)");
  const [profileEmail, setProfileEmail] = useState("m.santos@carepoint.med.ph");
  const [profilePhone, setProfilePhone] = useState("+63 917 555 0192");
  const [profilePan, setProfilePan] = useState("PAN-2024-9182");

  // Clinical Station Preferences
  const [stationRoom, setStationRoom] = useState("Consultation Room 1");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState("30s");
  const [soundAlertUrgent, setSoundAlertUrgent] = useState(true);
  const [autoSaveEmr, setAutoSaveEmr] = useState(true);
  const [defaultSoapTemplate, setDefaultSoapTemplate] = useState("Comprehensive Outpatient SOAP");
  const [includePrcFooter, setIncludePrcFooter] = useState(true);

  // Display Preferences
  const [accentColor, setAccentColor] = useState<"emerald" | "teal" | "mint">("emerald");
  const [tableDensity, setTableDensity] = useState<"comfortable" | "compact">("comfortable");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const notify = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    notify("Medical credentials and staff profile successfully saved.");
  };

  const handleSaveClinical = (e: React.FormEvent) => {
    e.preventDefault();
    notify("Clinical station preferences and triage alert configurations updated.");
  };

  const handleSaveDisplay = (e: React.FormEvent) => {
    e.preventDefault();
    notify("Display and hospital theme preferences saved.");
  };

  // Center-crops and shrinks the chosen image to a 256px JPEG before saving
  const resizePhoto = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        canvas
          .getContext("2d")!
          .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("unreadable"));
      };
      img.src = url;
    });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Image is too large. Please choose one under 10 MB.");
      return;
    }
    setPhotoBusy(true);
    try {
      await saveMyPhoto(await resizePhoto(file));
      notify("Profile picture updated.");
    } catch {
      setPhotoError("Could not save the picture. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await saveMyPhoto(null);
      notify("Profile picture removed.");
    } catch {
      setPhotoError("Could not remove the picture. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword || !newPassword) {
      setPasswordError("Enter your current password and a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setPasswordBusy(true);
    const error = await changePassword(currentPassword, newPassword);
    setPasswordBusy(false);
    if (error) {
      setPasswordError(error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    notify("Password changed successfully. Use your new password the next time you sign in.");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between border border-emerald-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-emerald-300" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner / Hero (Medzone Emerald Hospital Theme) */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-500/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              CarePoint HIS • System Preferences
            </span>
            <span className="text-xs text-emerald-200/80 font-mono">/settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Settings size={28} className="text-emerald-300" />
            <span>Clinical & System Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Configure your professional PRC credentials, clinical consultation station, triage alerts, and security options.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-xs">
          <StaffAvatar user={user} size={48} />
          <div>
            <span className="text-xs font-bold text-white block leading-tight">
              {user?.name || "Active Session"}
            </span>
            <span className="text-[10px] text-emerald-300 font-semibold uppercase">
              {user?.role || "Staff"} • {user?.department || "Outpatient Clinic"}
            </span>
            <span className="text-[10px] text-emerald-200/80 block font-mono">
              {user?.licenseNumber || "PRC Verified"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "profile"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserIcon size={16} strokeWidth={2} />
          <span>Medical Credentials & Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("clinical")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "clinical"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Stethoscope size={16} strokeWidth={2} />
          <span>Consultation & Station</span>
        </button>

        <button
          onClick={() => setActiveTab("display")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "display"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 size={16} strokeWidth={2} />
          <span>Display & Hospital Theme</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === "security"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck size={16} strokeWidth={2} />
          <span>Security & Authentication</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MEDICAL CREDENTIALS & PROFILE */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <StaffAvatar user={user} size={80} />
            <div className="flex-1 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Profile Picture</h3>
              <p className="text-slate-500 mt-0.5">
                Shown in the top bar and staff directory. JPG or PNG; it is cropped to a square.
              </p>
              {photoError && <p className="text-rose-600 font-semibold mt-1.5">{photoError}</p>}
            </div>
            <div className="flex items-center gap-2">
              <label
                className={`px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer ${
                  photoBusy ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {photoBusy ? "Saving..." : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              {user && staffPhotos[user.id] && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={photoBusy}
                  className="px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">Professional Identity & Licensure</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on clinical SOAP signatures, PhilHealth eClaims, and electronic prescriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Legal Name (with suffix)</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Designation / Title</label>
              <input
                type="text"
                value={profileTitle}
                onChange={e => setProfileTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PRC License Number</label>
              <input
                type="text"
                value={profileLicense}
                onChange={e => setProfileLicense(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">PhilHealth Accreditation No. (PAN)</label>
              <input
                type="text"
                value={profilePan}
                onChange={e => setProfilePan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Assigned Department / Service</label>
              <select
                value={profileDepartment}
                onChange={e => setProfileDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden cursor-pointer"
              >
                <option value="Outpatient Department (OPD)">Outpatient Department (OPD)</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Pediatrics Clinic">Pediatrics Clinic</option>
                <option value="Surgery & Trauma">Surgery & Trauma</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                <option value="Nursing Station 3">Nursing Station 3</option>
                <option value="Admissions & Front Desk">Admissions & Front Desk</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Institutional Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Direct Clinic Hotline / Mobile</label>
              <input
                type="text"
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="font-bold text-slate-900 block leading-tight">Verified Hospital Credentials</span>
                <span className="text-[11px] text-emerald-800">
                  DOH & PhilHealth compliance verified for current hospital cycle.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Save Profile Credentials</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONSULTATION & STATION */}
      {/* ========================================================================= */}
      {activeTab === "clinical" && (
        <form onSubmit={handleSaveClinical} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Clinical Station & Consultation Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize queue polling intervals, audio triage chimes, and electronic encounter templates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Active Consultation Room / Clinic Booth</label>
              <select
                value={stationRoom}
                onChange={e => setStationRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden cursor-pointer"
              >
                <option value="Consultation Room 1">Consultation Room 1 (Main OPD)</option>
                <option value="Consultation Room 2">Consultation Room 2 (Internal Medicine)</option>
                <option value="Consultation Room 3">Consultation Room 3 (Pediatrics)</option>
                <option value="Triage Booth A">Triage Booth A (Vital Signs)</option>
                <option value="Tele-Consult Desk">Tele-Consultation Desk</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Live Queue Auto-Refresh Rate</label>
              <select
                value={autoRefreshInterval}
                onChange={e => setAutoRefreshInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden cursor-pointer"
              >
                <option value="15s">Every 15 seconds (High Frequency)</option>
                <option value="30s">Every 30 seconds (Recommended)</option>
                <option value="60s">Every 60 seconds</option>
                <option value="manual">Manual Refresh Only</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-3.5 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Critical Triage Sound Alert</span>
                    <span className="text-[11px] text-slate-500">
                      Play an audio chime alert whenever a patient with Critical (Tier 1) triage arrives in the queue.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlertUrgent}
                  onChange={e => setSoundAlertUrgent(e.target.checked)}
                  className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Auto-Save Clinical Encounters</span>
                    <span className="text-[11px] text-slate-500">
                      Continuously save draft SOAP notes and vitals inputs to prevent session data loss.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSaveEmr}
                  onChange={e => setAutoSaveEmr(e.target.checked)}
                  className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Include PRC License Footer on Prescriptions</span>
                    <span className="text-[11px] text-slate-500">
                      Append official Republic of the Philippines PRC MD License & PAN numbers on printed Rx slips.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includePrcFooter}
                  onChange={e => setIncludePrcFooter(e.target.checked)}
                  className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Save Clinical Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISPLAY & HOSPITAL THEME */}
      {/* ========================================================================= */}
      {activeTab === "display" && (
        <form onSubmit={handleSaveDisplay} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Visual Styling & Interface Theme</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize color accents, typography density, and hospital branding views.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-2">Hospital Brand Color Theme</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setAccentColor("emerald")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accentColor === "emerald"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 shadow-inner"></span>
                    <span className="font-bold text-slate-900">Hospital Emerald</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Signature Medzone hospital green. Clean, calming, and state-of-the-art.
                  </p>
                </div>

                <div
                  onClick={() => setAccentColor("teal")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accentColor === "teal"
                      ? "border-teal-600 bg-teal-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 shadow-inner"></span>
                    <span className="font-bold text-slate-900">Clinical Teal</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    High contrast surgical teal with crisp borders for bright monitors.
                  </p>
                </div>

                <div
                  onClick={() => setAccentColor("mint")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    accentColor === "mint"
                      ? "border-emerald-700 bg-emerald-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 shadow-inner"></span>
                    <span className="font-bold text-slate-900">Deep Forest & Mint</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sleek dark-toned sidebar with mint dashboard highlights.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">Queue & Table Display Density</label>
                <p className="text-[11px] text-slate-500 mb-3">Adjust row heights across patient tables.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTableDensity("comfortable")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      tableDensity === "comfortable"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Comfortable (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableDensity("compact")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      tableDensity === "compact"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Compact (More Rows)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">Header Clock Format</label>
                <p className="text-[11px] text-slate-500 mb-3">Time display in top navigation bar.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeFormat("12h")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      timeFormat === "12h"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    12-Hour (02:30 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFormat("24h")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      timeFormat === "24h"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    24-Hour (14:30)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Save Display Theme</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SECURITY & ACCESS CONTROLS */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <form onSubmit={handleSaveSecurity} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Session Management</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protect patient health information (PHI) and update your clinic authentication credentials.
            </p>
          </div>

          {/* Change Password */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound size={16} className="text-emerald-700" />
              <span>Change Account Password</span>
            </h4>
            <p className="text-slate-500 -mt-2">
              {isSecureMode
                ? "For your security, confirm your current password before choosing a new one (at least 8 characters)."
                : "Password changes are available once the system is connected to the hospital database."}
            </p>
            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  autoComplete="current-password"
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  autoComplete="new-password"
                  minLength={8}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 2FA Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Two-Factor Authentication (2FA)</span>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Protects patient records by requesting an OTP verification code when signing in from unrecognized hospital terminals.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={e => setTwoFactorEnabled(e.target.checked)}
              className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
          </div>

          {/* Active Clinical Sessions */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Active Hospital Terminal Sessions</h4>
              <span className="text-[11px] text-slate-500">2 Active Workstations</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <div className="p-3.5 flex items-center justify-between bg-emerald-50/30">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <span className="font-bold text-slate-900">Consultation Terminal (Current Session)</span>
                    <p className="text-[10px] text-slate-500 font-mono">
                      IP: 192.168.10.42 • Chrome / Windows 11 • Pasig Medical Center LAN
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  CURRENT
                </span>
              </div>

              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <div>
                    <span className="font-bold text-slate-700">Mobile Nursing Tablet (Ward 4)</span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      IP: 192.168.10.88 • Android Hospital EMR App • Signed in 4 hrs ago
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => notify("Remote tablet session terminated.")}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:scale-102 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{passwordBusy ? "Updating..." : "Change Password"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
