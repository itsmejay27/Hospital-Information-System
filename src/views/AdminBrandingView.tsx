import React, { useState } from "react";
import { User, HospitalConfig } from "../types";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Siren,
  Check,
  ShieldCheck,
} from "../components/Icons";

interface Props {
  user: User;
  hospitalConfig: HospitalConfig;
  onUpdateHospitalConfig: (config: HospitalConfig) => void;
  onSignOut?: () => void;
}

export default function AdminBrandingView({
  user,
  hospitalConfig,
  onUpdateHospitalConfig,
}: Props) {
  const [notification, setNotification] = useState<string | null>(null);

  const [name, setName] = useState(hospitalConfig.name);
  const [tagline, setTagline] = useState(hospitalConfig.tagline);
  const [phone, setPhone] = useState(hospitalConfig.phone);
  const [hotline, setHotline] = useState(hospitalConfig.emergencyHotline);
  const [email, setEmail] = useState(hospitalConfig.email);
  const [dpoEmail, setDpoEmail] = useState(hospitalConfig.dpoEmail);
  const [address, setAddress] = useState(hospitalConfig.address);
  const [accreditation, setAccreditation] = useState(hospitalConfig.accreditation);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HospitalConfig = {
      name,
      tagline,
      logoText: name,
      phone,
      emergencyHotline: hotline,
      email,
      dpoEmail,
      address,
      accreditation,
    };
    onUpdateHospitalConfig(updated);
    setNotification("Hospital branding & institutional contacts updated across all views!");
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
              Institutional Settings • Isolated Route
            </span>
            <span className="text-xs text-slate-400 font-mono">/admin/branding</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 size={24} className="text-amber-600" />
            <span>Dynamic Hospital Branding & Institutional Contacts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin: <span className="font-semibold text-slate-800">{user.name}</span> • Changes propagate live to top nav, claims, and public portal
          </p>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-3">
          Live Branding Header Preview
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300 font-bold text-lg">
              CC
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{name}</h2>
              <p className="text-xs text-teal-300 font-medium">{tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <Siren size={18} className="text-rose-400 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-300 block">24/7 Trauma Hotline</span>
              <span className="font-mono font-bold text-white text-sm">{hotline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Official Hospital Facility Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Institutional Tagline / Motto *
            </label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Main Trunkline Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-rose-600 block mb-1">
              24/7 Emergency & Trauma Hotline *
            </label>
            <input
              type="text"
              value={hotline}
              onChange={e => setHotline(e.target.value)}
              className="w-full bg-rose-50/50 border border-rose-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              General Patient Inquiries Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Data Protection Officer (DPO) Email
            </label>
            <input
              type="email"
              value={dpoEmail}
              onChange={e => setDpoEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Registered Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
              Accreditation & Regulatory Statement
            </label>
            <input
              type="text"
              value={accreditation}
              onChange={e => setAccreditation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Authorized by: {user.name} ({user.role.toUpperCase()})
          </span>
          <button
            type="submit"
            className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={2.5} />
            <span>Save Institutional Branding</span>
          </button>
        </div>
      </form>
    </div>
  );
}
