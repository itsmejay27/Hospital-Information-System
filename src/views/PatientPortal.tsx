import { useState } from "react";
import { User, HealthRecord, DiagnosticResult, MedicationOrder, PrivacyConsentSettings } from "../types";
import BackButton from "../components/BackButton";
import {
  AlertTriangle,
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Pill,
  ShieldCheck,
  Siren,
  FileDown,
  Lock,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  X,
} from "../components/Icons";

interface Props {
  user: User;
  records: HealthRecord[];
  labResults: DiagnosticResult[];
  medications: MedicationOrder[];
  onRequestRefill: (medId: string) => void;
  onSignOut: () => void;
}

type PatientTab = "overview" | "records" | "lab" | "medications" | "privacy";

export default function PatientPortal({
  user,
  records,
  labResults,
  medications,
  onRequestRefill,
}: Props) {
  const [activeTab, setActiveTab] = useState<PatientTab>("overview");
  const [notification, setNotification] = useState<string | null>(null);

  // Filter strictly to current patient only
  const patientId = user.patientId || "P-2024-001";
  const myRecords = records.filter(r => r.patientId === patientId);
  const myLabs = labResults.filter(l => l.patientId === patientId);
  const myMeds = medications.filter(m => m.patientId === patientId);

  // Consent settings
  const [consentSettings, setConsentSettings] = useState<PrivacyConsentSettings>({
    allowSpecialistSharing: true,
    allowResearchAnonymized: false,
    allowSmsNotifications: true,
    emergencyOverrideConsent: true,
    twoFactorAuth: true,
    lastUpdated: "Sep 12, 2026, 09:30 AM",
  });

  const handleToggleConsent = (key: keyof PrivacyConsentSettings) => {
    setConsentSettings(prev => ({
      ...prev,
      [key]: !prev[key],
      lastUpdated: new Date().toLocaleString(),
    }));
    setNotification("Your privacy consent preferences have been updated and saved.");
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Patient Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2744] to-[#1e3a5f] text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Patient Self-Service Portal
                </span>
                <span className="text-xs text-slate-300">Hospital ID: <strong>{user.id}</strong></span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white">{user.name}</h1>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>DOB: Apr 14, 1992 (34 y/o)</span>
                <span>Sex: Female</span>
                <span>Blood: <strong>O+ Rh Positive</strong></span>
              </div>
            </div>
          </div>

          {/* Patient Quick Info */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/15 border border-amber-400/40 rounded-xl px-4 py-2.5 text-xs text-amber-200 flex items-center gap-2.5">
              <AlertTriangle size={20} strokeWidth={2} className="text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-amber-300">Known Allergies</div>
                <div className="font-bold text-white mt-0.5">Penicillin, NSAIDs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Navigation Bar */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/15">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-teal-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <LayoutDashboard size={16} strokeWidth={2} className="text-slate-300" />
            <span>My Health Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "records"
                ? "bg-teal-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ClipboardList size={16} strokeWidth={2} className="text-slate-300" />
            <span>Health Records ({myRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("lab")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "lab"
                ? "bg-teal-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FlaskConical size={16} strokeWidth={2} className="text-slate-300" />
            <span>Lab Results ({myLabs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "medications"
                ? "bg-teal-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Pill size={16} strokeWidth={2} className="text-slate-300" />
            <span>Active Medications ({myMeds.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-2 ${
              activeTab === "privacy"
                ? "bg-teal-600 text-white shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <ShieldCheck size={16} strokeWidth={2} className="text-slate-300" />
            <span>Privacy & Consents</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2} className="text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* SUB-VIEW 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab("records")}
              className="bg-white border border-[var(--border)] rounded-xl p-5 text-left hover:border-teal-500 transition-all shadow-xs group"
            >
              <div className="mb-2">
                <ClipboardList size={20} strokeWidth={2} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="font-bold text-xl text-[var(--foreground)]">{myRecords.length} Visits</div>
              <div className="text-xs text-[var(--muted-foreground)]">Electronic Health Records</div>
            </button>

            <button
              onClick={() => setActiveTab("lab")}
              className="bg-white border border-[var(--border)] rounded-xl p-5 text-left hover:border-teal-500 transition-all shadow-xs group"
            >
              <div className="mb-2">
                <FlaskConical size={20} strokeWidth={2} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="font-bold text-xl text-emerald-700">{myLabs.length} Ready</div>
              <div className="text-xs text-[var(--muted-foreground)]">Diagnostic Reports Available</div>
            </button>

            <button
              onClick={() => setActiveTab("medications")}
              className="bg-white border border-[var(--border)] rounded-xl p-5 text-left hover:border-teal-500 transition-all shadow-xs group"
            >
              <div className="mb-2">
                <Pill size={20} strokeWidth={2} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="font-bold text-xl text-slate-800">{myMeds.length} Active</div>
              <div className="text-xs text-[var(--muted-foreground)]">Prescribed Medications</div>
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className="bg-white border border-[var(--border)] rounded-xl p-5 text-left hover:border-teal-500 transition-all shadow-xs group"
            >
              <div className="mb-2">
                <ShieldCheck size={20} strokeWidth={2} className="text-slate-500 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="font-bold text-xl text-teal-700">DPA Protected</div>
              <div className="text-xs text-[var(--muted-foreground)]">Consents & Security Controls</div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Recent Consultations & Labs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Consultation Snippet */}
              <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-base text-[var(--foreground)]">
                    Most Recent Clinical Consultation
                  </h2>
                  <button onClick={() => setActiveTab("records")} className="text-xs text-teal-700 font-semibold hover:underline">
                    View full history →
                  </button>
                </div>

                {myRecords.length > 0 ? (
                  <div className="border border-[var(--border)] rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-teal-50 text-teal-800 font-semibold px-2.5 py-0.5 rounded border border-teal-200">
                          {myRecords[0].type}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">{myRecords[0].date}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">Attending: {myRecords[0].doctor}</span>
                    </div>
                    <h3 className="font-semibold text-lg text-[var(--foreground)] mb-1">
                      {myRecords[0].diagnosis}
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-3">
                      {myRecords[0].notes}
                    </p>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[var(--border)] text-center text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">BP</div>
                        <div className="font-bold text-slate-800">{myRecords[0].vitals.bp}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Heart Rate</div>
                        <div className="font-bold text-slate-800">{myRecords[0].vitals.hr}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Temp</div>
                        <div className="font-bold text-slate-800">{myRecords[0].vitals.temp}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Weight</div>
                        <div className="font-bold text-slate-800">{myRecords[0].vitals.wt}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No consultation records available.</p>
                )}
              </div>

              {/* Ready Lab Results Snippet */}
              <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-base text-[var(--foreground)]">
                    Diagnostic Lab Reports Ready
                  </h2>
                  <button onClick={() => setActiveTab("lab")} className="text-xs text-teal-700 font-semibold hover:underline">
                    View all reports →
                  </button>
                </div>

                <div className="space-y-3">
                  {myLabs.slice(0, 2).map(l => (
                    <div key={l.id} className="p-3.5 border border-[var(--border)] rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-sm text-[var(--foreground)]">{l.test}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          {l.date} · {l.category} · Released by {l.releasedBy}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("lab")}
                        className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 font-medium inline-flex items-center gap-1.5"
                      >
                        <FileText size={16} strokeWidth={2} className="text-slate-500" />
                        <span>Open Results</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Appointments & Emergency */}
            <div className="space-y-6">
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3">
                  Next Scheduled Visit
                </h3>
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                  <div className="text-xs text-cyan-800 font-semibold uppercase tracking-wider mb-1">
                    Confirmed Appointment
                  </div>
                  <div className="font-serif text-xl text-[var(--primary)] font-semibold">
                    September 24, 2026
                  </div>
                  <div className="text-xs text-slate-700 mt-1">10:00 AM · OPD Consultation Clinic 3</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">With Dr. Jose Reyes, MD</div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Siren size={20} strokeWidth={2} className="text-rose-600" />
                  <span className="font-semibold text-sm text-red-900">Emergency Care</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  For life-threatening symptoms, chest discomfort, or severe shortness of breath, call <strong>911</strong> immediately or visit our 24/7 Emergency Room.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ELECTRONIC HEALTH RECORDS (EHR) WITH DPA 2012 PRIVACY MASKING */}
      {activeTab === "records" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("overview")} label="Back to Health Overview" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-6">
              <div>
                <h2 className="font-serif text-2xl text-[var(--foreground)]">
                  My Electronic Health Records
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Chronological consultation encounters and medical evaluations.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading certified EHR consultation record (PDF)...")}
                className="text-xs font-semibold text-teal-800 border border-teal-300 hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <FileDown size={16} strokeWidth={2} className="text-slate-500" />
                <span>Download Summary PDF</span>
              </button>
            </div>

            <div className="space-y-6">
              {myRecords.map(r => (
                <div key={r.id} className="border border-[var(--border)] rounded-xl p-5 hover:border-teal-500/40 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <span className="text-xs bg-teal-50 text-teal-800 font-semibold px-2.5 py-0.5 rounded border border-teal-200">
                        {r.type}
                      </span>
                      <h3 className="font-semibold text-lg text-[var(--foreground)] mt-1.5">{r.diagnosis}</h3>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {r.date} · Attending Physician: <strong>{r.doctor}</strong>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      ICD-10: {r.icd10Code || "I10"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <div className="font-semibold text-slate-800 uppercase tracking-wide mb-1">Chief Complaint & Symptoms</div>
                      <p className="text-slate-600 leading-relaxed">{r.subjective}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <div className="font-semibold text-slate-800 uppercase tracking-wide mb-1">Clinical Findings & Assessment</div>
                      <p className="text-slate-600 leading-relaxed">{r.assessment}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs mb-4">
                    <div className="font-semibold text-slate-800 uppercase tracking-wide mb-1">Physician Plan & Recommendations</div>
                    <p className="text-slate-600 leading-relaxed">{r.plan}</p>
                  </div>

                  {/* DPA PRIVACY COMPLIANCE LOGIC: MASK PRIVATE INTERNAL CLINICIAN NOTES */}
                  {r.internalClinicianNotes && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5 mb-4">
                      <Lock size={16} strokeWidth={2} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-950">
                          Internal Clinician Deliberation Note (Protected under DPA 2012 / RA 10173, Sec. 12)
                        </div>
                        <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                          This confidential physician deliberation note is masked in patient portal view to protect clinical peer consultation integrity. Full notes are accessible to authorized attending doctors on the Clinical Workbench.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vitals */}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase mb-2">Recorded Vitals</div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">BP</div>
                        <div className="font-bold text-slate-800">{r.vitals.bp}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Heart Rate</div>
                        <div className="font-bold text-slate-800">{r.vitals.hr}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Temp</div>
                        <div className="font-bold text-slate-800">{r.vitals.temp}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Weight</div>
                        <div className="font-bold text-slate-800">{r.vitals.wt}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">SpO2</div>
                        <div className="font-bold text-slate-800">{r.vitals.spo2 || "99%"}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Resp Rate</div>
                        <div className="font-bold text-slate-800">{r.vitals.rr || "16 cpm"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: LAB RESULTS */}
      {activeTab === "lab" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("overview")} label="Back to Health Overview" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-serif text-2xl text-[var(--foreground)] mb-1">
              My Laboratory & Diagnostic Reports
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Certified examination results released by CityCare Diagnostic Laboratories.
            </p>

            <div className="space-y-6">
              {myLabs.map(l => (
                <div key={l.id} className="border border-[var(--border)] rounded-xl overflow-hidden shadow-2xs">
                  <div className="p-5 bg-slate-50 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={14} strokeWidth={2} className="text-emerald-600" />
                          <span>{l.status}</span>
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Ref: {l.id}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-[var(--foreground)]">{l.test}</h3>
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {l.date} · {l.category} · Specimen: {l.specimenType || "Blood"}
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading official PDF for ${l.test}...`)}
                      className="text-xs text-teal-800 font-semibold border border-teal-300 hover:bg-teal-50 px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <Download size={16} strokeWidth={2} className="text-slate-500" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white text-[var(--muted-foreground)] uppercase font-semibold border-b border-[var(--border)]">
                        <tr>
                          <th className="px-5 py-3">Parameter</th>
                          <th className="px-5 py-3">Result</th>
                          <th className="px-5 py-3">Reference Range</th>
                          <th className="px-5 py-3 text-right">Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {l.items.map(item => (
                          <tr key={item.name} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                            <td className={`px-5 py-3 font-bold ${item.flag ? "text-red-600" : "text-slate-800"}`}>
                              {item.value}
                            </td>
                            <td className="px-5 py-3 text-slate-500">{item.ref}</td>
                            <td className="px-5 py-3 text-right">
                              {item.flag ? (
                                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                                  HIGH
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-semibold">NORMAL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50/70 border-t border-[var(--border)] text-xs flex items-start gap-2">
                    <FileText size={16} strokeWidth={2} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Diagnostic Summary: </span>
                      <span className="text-slate-600">{l.summary}</span>
                      <div className="text-[11px] text-slate-400 mt-1">Verified & signed by: {l.releasedBy}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: MEDICATIONS */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("overview")} label="Back to Health Overview" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-serif text-2xl text-[var(--foreground)] mb-1">
              My Active Medications & Refill Requests
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Review current medications, dosage directions, and submit refill requests directly to the pharmacy.
            </p>

            <div className="space-y-4">
              {myMeds.map(m => (
                <div key={m.id} className="border border-[var(--border)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-base flex items-center justify-center flex-shrink-0">
                      <Pill size={20} strokeWidth={2} className="text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base text-[var(--foreground)]">{m.name}</h3>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                          {m.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium mt-1">
                        Dosage: <strong>{m.dose}</strong> · Route: {m.route} · Frequency: <strong>{m.freq}</strong>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Prescribed by {m.prescribedBy} on {m.start} {m.notes ? `— "${m.notes}"` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {m.refillable && (
                      <button
                        onClick={() => {
                          onRequestRefill(m.id);
                          setNotification(`Refill request for ${m.name} submitted to hospital pharmacy!`);
                          setTimeout(() => setNotification(null), 5000);
                        }}
                        disabled={m.refillStatus === "Pending Approval"}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                          m.refillStatus === "Pending Approval"
                            ? "bg-amber-50 text-amber-800 border-amber-300 cursor-not-allowed"
                            : "bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100"
                        }`}
                      >
                        {m.refillStatus === "Pending Approval" ? (
                          <>
                            <Clock size={14} strokeWidth={2} className="text-amber-600" />
                            <span>Refill Pending</span>
                          </>
                        ) : (
                          <span>Request Refill</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: DATA PRIVACY & CONSENT SETTINGS */}
      {activeTab === "privacy" && (
        <div className="space-y-6">
          <BackButton onBack={() => setActiveTab("overview")} label="Back to Health Overview" />

          <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[var(--border)] pb-4">
              <h2 className="font-serif text-2xl text-[var(--foreground)]">
                My Data Privacy & Consent Preferences
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Protected under Republic Act No. 10173 (Data Privacy Act of 2012)
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: "allowSpecialistSharing" as const,
                  title: "Consent to Inter-Departmental Specialist Consultation Sharing",
                  desc: "Permits consulting cardiologists and radiologists within CityCare Hospital to review your health history.",
                  active: consentSettings.allowSpecialistSharing,
                },
                {
                  key: "allowResearchAnonymized" as const,
                  title: "Anonymized Public Health Statistical Research",
                  desc: "Permits de-identified, non-traceable clinical statistics to be used for epidemiological study.",
                  active: consentSettings.allowResearchAnonymized,
                },
                {
                  key: "allowSmsNotifications" as const,
                  title: "Automated SMS & Email Health Notifications",
                  desc: "Receive encrypted notifications when laboratory findings or doctor notes are available.",
                  active: consentSettings.allowSmsNotifications,
                },
                {
                  key: "emergencyOverrideConsent" as const,
                  title: "Emergency Care Immediate Access Override",
                  desc: "Authorizes emergency trauma physicians to access allergy and medication profiles during acute emergencies.",
                  active: consentSettings.emergencyOverrideConsent,
                },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between p-4 rounded-xl border border-[var(--border)] hover:bg-slate-50 transition-colors gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] mb-1">{item.title}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleConsent(item.key)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                      item.active ? "bg-teal-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => alert("Certified copy of all personal health records dispatched to your email address.")}
                className="text-xs font-semibold text-teal-800 border border-teal-300 hover:bg-teal-50 px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Download size={16} strokeWidth={2} className="text-slate-500" />
                <span>Download Full Personal Data Archive (Right to Portability)</span>
              </button>
              <div className="text-xs text-[var(--muted-foreground)]">
                NPC Registration: CityCare HIS / RA 10173 Compliant
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
