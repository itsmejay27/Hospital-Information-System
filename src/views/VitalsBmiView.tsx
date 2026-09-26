import React, { useState, useMemo } from "react";
import PatientInfoBar from "../components/PatientInfoBar";
import { User, Patient, TreatmentLog, BmiCategory } from "../types";
import {
  Activity,
  Droplets,
  User as UserIcon,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
} from "../components/Icons";

interface Props {
  user: User;
  patients: Patient[];
  treatments: TreatmentLog[];
  onAddTreatment: (treatment: TreatmentLog) => void;
  initialPatientId?: string;
  onSignOut?: () => void;
}

export default function VitalsBmiView({
  user,
  patients,
  treatments,
  onAddTreatment,
  initialPatientId,
}: Props) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patients[0]?.id || "P-2024-001"
  );
  const [notification, setNotification] = useState<string | null>(null);

  const selectedPatient =
    patients.find(p => p.id === selectedPatientId) || patients[0] || {
      id: "P-2024-001",
      name: "Patient",
      age: 35,
      gender: "Female",
      triageTier: "stable",
      bloodType: "O+",
      chiefComplaint: "Routine Checkup",
      admissionStatus: "Outpatient",
      registeredAt: "2026-03-01",
    };

  // Vitals State
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(76);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [spo2, setSpo2] = useState<number>(98);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [weightKg, setWeightKg] = useState<number>(68.5);
  const [heightCm, setHeightCm] = useState<number>(168);
  const [fluidIntake, setFluidIntake] = useState<number>(1500);
  const [urineOutput, setUrineOutput] = useState<number>(1200);
  const [clinicalNotes, setClinicalNotes] = useState(
    "Patient is alert, oriented, and in no acute respiratory or hemodynamic distress."
  );

  // Real-time BMI Calculation
  const bmiInfo = useMemo(() => {
    if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
      return { bmi: 0, category: "Normal" as BmiCategory, badgeColor: "bg-slate-100 text-slate-700" };
    }
    const heightM = heightCm / 100;
    const val = Number((weightKg / (heightM * heightM)).toFixed(1));
    let cat: BmiCategory = "Normal";
    let badge = "bg-emerald-100 text-emerald-800 border-emerald-300";

    if (val < 18.5) {
      cat = "Underweight";
      badge = "bg-amber-100 text-amber-800 border-amber-300";
    } else if (val < 25.0) {
      cat = "Normal";
      badge = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (val < 30.0) {
      cat = "Overweight";
      badge = "bg-amber-100 text-amber-800 border-amber-300";
    } else {
      cat = "Obese";
      badge = "bg-rose-100 text-rose-800 border-rose-300";
    }

    return { bmi: val, category: cat, badgeColor: badge };
  }, [weightKg, heightCm]);

  // Net Fluid Balance
  const netFluidBalance = fluidIntake - urineOutput;

  // Handle Submit Vitals & BMI
  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const exactTimestamp = new Date().toISOString().substring(0, 16);
    const vitalsFormatted = `BP ${systolicBp}/${diastolicBp} mmHg | HR ${heartRate} bpm | RR ${respiratoryRate} cpm | SpO2 ${spo2}% | Temp ${temperature}°C | BMI ${bmiInfo.bmi} (${bmiInfo.category})`;

    const newTrt: TreatmentLog = {
      id: `VIT-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      timestamp: exactTimestamp.replace("T", " "),
      treatmentName: "Bedside Vitals & Anthropometric Assessment",
      category: "Bedside Nursing",
      performedBy: user.name,
      performedByLicense: user.licenseNumber || "PRC-RN-LIC",
      role: user.title,
      vitalsAtTreatment: vitalsFormatted,
      structuredVitals: {
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        spo2,
        temperature,
        weightKg,
        heightCm,
        bmi: bmiInfo.bmi,
        bmiCategory: bmiInfo.category,
        fluidIntakeMl: fluidIntake,
        urineOutputMl: urineOutput,
        recordedAt: exactTimestamp,
        recordedBy: `${user.name} (${user.licenseNumber || "Clinician"})`,
      },
      fluidIntakeMl: fluidIntake,
      urineOutputMl: urineOutput,
      notes: clinicalNotes,
    };

    onAddTreatment(newTrt);
    setNotification(
      `Vitals & BMI assessment officially logged for ${selectedPatient.name} (BMI: ${bmiInfo.bmi} • ${bmiInfo.category}).`
    );
    setTimeout(() => setNotification(null), 5000);
  };

  // Treatment logs for selected patient
  const patientVitalsLogs = treatments.filter(t => t.patientId === selectedPatient.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-teal-900 text-teal-100 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.5} className="text-teal-300" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-300 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header & Clinician Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="patient-select-vitals" className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Patient
          </label>
          <select
            id="patient-select-vitals"
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-emerald-500 outline-hidden cursor-pointer"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.triageTier.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Recording as <span className="font-semibold text-slate-800">{user.name}</span>
          {user.licenseNumber && <span className="font-mono text-slate-500"> • {user.licenseNumber}</span>}
        </p>
      </div>

      {/* Patient Demographic Summary Strip */}
      <PatientInfoBar
        patient={selectedPatient}
        extra={[
          {
            label: "BMI",
            value: (
              <span className="flex items-center gap-1.5">
                {bmiInfo.bmi}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${bmiInfo.badgeColor}`}>{bmiInfo.category}</span>
              </span>
            ),
          },
          {
            label: "24h Fluid Balance",
            value: (
              <span className={netFluidBalance >= 0 ? "text-emerald-700" : "text-rose-700"}>
                {netFluidBalance > 0 ? `+${netFluidBalance}` : netFluidBalance} mL ({fluidIntake} in / {urineOutput} out)
              </span>
            ),
          },
        ]}
      />

      {/* Two Column Layout: Vitals Form (Left) & Historical Trend Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vitals Entry Form (full width) */}
        <div className="lg:col-span-12">
          <form onSubmit={handleSaveVitals} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Direct Bedside Vitals & Anthropometrics Entry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Timestamp: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Blood Pressure Systolic */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  min="50"
                  max="260"
                  value={systolicBp}
                  onChange={e => setSystolicBp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${systolicBp >= 140 ? "text-rose-600" : "text-slate-400"}`}>
                  {systolicBp >= 140 ? "Stage 2 Elevated" : systolicBp >= 130 ? "Stage 1 Elevated" : "Normal (<130)"}
                </span>
              </div>

              {/* Blood Pressure Diastolic */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="160"
                  value={diastolicBp}
                  onChange={e => setDiastolicBp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${diastolicBp >= 90 ? "text-rose-600" : "text-slate-400"}`}>
                  {diastolicBp >= 90 ? "High (>=90)" : "Optimal (<80)"}
                </span>
              </div>

              {/* Heart Rate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  value={heartRate}
                  onChange={e => setHeartRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${heartRate > 100 ? "text-rose-600" : heartRate < 60 ? "text-amber-600" : "text-slate-400"}`}>
                  {heartRate > 100 ? "Tachycardia" : heartRate < 60 ? "Bradycardia" : "Normal (60-100)"}
                </span>
              </div>

              {/* Respiratory Rate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Resp. Rate (cpm)
                </label>
                <input
                  type="number"
                  min="8"
                  max="60"
                  value={respiratoryRate}
                  onChange={e => setRespiratoryRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${respiratoryRate > 20 ? "text-amber-600" : "text-slate-400"}`}>
                  {respiratoryRate > 20 ? "Tachypnea (>20)" : "Normal (12-20)"}
                </span>
              </div>

              {/* SpO2 Oxygen Saturation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  SpO2 Saturation (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={spo2}
                  onChange={e => setSpo2(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${spo2 < 95 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                  {spo2 < 95 ? "Hypoxia Alert (<95%)" : "Adequate (95-100%)"}
                </span>
              </div>

              {/* Temperature */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="32.0"
                  max="43.0"
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className={`text-[9px] font-semibold mt-1 block ${temperature >= 37.8 ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                  {temperature >= 37.8 ? "Febrile (>=37.8°C)" : "Afebrile (Normal)"}
                </span>
              </div>

              {/* Height (cm) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-1 block">{(heightCm / 100).toFixed(2)} meters</span>
              </div>

              {/* Weight (kg) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="300"
                  value={weightKg}
                  onChange={e => setWeightKg(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                  required
                />
                <span className="text-[9px] text-slate-400 mt-1 block">{(weightKg * 2.20462).toFixed(1)} lbs</span>
              </div>
            </div>

            {/* Anthropometric BMI Card */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  BMI
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Automated Anthropometric Assessment</h4>
                  <p className="text-xs text-slate-500">WHO Adult Asian BMI Cutoff Standards</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Index Score:</div>
                  <div className="text-xl font-black text-slate-900">{bmiInfo.bmi} kg/m²</div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs ${bmiInfo.badgeColor}`}>
                  {bmiInfo.category}
                </div>
              </div>
            </div>

            {/* Fluid Intake & Output Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets size={16} className="text-blue-500" />
                  <label className="text-[11px] font-bold uppercase text-slate-700">
                    24-Hour Fluid Intake (mL)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={fluidIntake}
                  onChange={e => setFluidIntake(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  placeholder="Oral + IV Fluids..."
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Includes IV infusions, blood products & oral hydration</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 mb-2">
                  <Droplets size={16} className="text-amber-500" />
                  <label className="text-[11px] font-bold uppercase text-slate-700">
                    24-Hour Urine Output (mL)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={urineOutput}
                  onChange={e => setUrineOutput(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  placeholder="Catheter / voided output..."
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Adequate threshold: &gt;0.5 mL/kg/hr ({Math.round(weightKg * 0.5 * 24)} mL/24h)
                </span>
              </div>
            </div>

            {/* Bedside Clinical Notes */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                Bedside Nursing Observations & Patient Response
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                placeholder="Document patient orientation, comfort level, complaints..."
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Signature: {user.name} ({user.licenseNumber || "RN"})
              </span>
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Log Vitals & Anthropometrics</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Historical Vitals Table & Trends (5 Cols) */}
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Historical Vitals Log for {selectedPatient.name}
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {patientVitalsLogs.length} Records
              </span>
            </div>

            {patientVitalsLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                No previous vitals recordings registered for this encounter.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-y border-slate-200">
                    <tr>
                      {["Date / Time", "Assessment", "BP", "HR", "RR", "SpO2", "Temp", "BMI", "Intake", "Output", "Notes", "Logged By"].map(h => (
                        <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patientVitalsLogs.map(log => {
                      const v = log.structuredVitals;
                      return (
                        <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 align-top">
                          <td className="px-3 py-2 font-mono whitespace-nowrap text-slate-600">{log.timestamp}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900 min-w-[160px]">{log.treatmentName}</td>
                          {v ? (
                            <>
                              <td className="px-3 py-2 font-mono whitespace-nowrap">
                                {v.systolicBp}/{v.diastolicBp}
                              </td>
                              <td className="px-3 py-2 font-mono">{v.heartRate}</td>
                              <td className="px-3 py-2 font-mono">{v.respiratoryRate}</td>
                              <td className="px-3 py-2 font-mono">{v.spo2}%</td>
                              <td className="px-3 py-2 font-mono whitespace-nowrap">{v.temperature}°C</td>
                              <td className="px-3 py-2 font-mono">{v.bmi ?? "—"}</td>
                              <td className="px-3 py-2 font-mono whitespace-nowrap">{v.fluidIntakeMl ?? log.fluidIntakeMl ?? 0} mL</td>
                              <td className="px-3 py-2 font-mono whitespace-nowrap">{v.urineOutputMl ?? log.urineOutputMl ?? 0} mL</td>
                            </>
                          ) : (
                            <td colSpan={8} className="px-3 py-2 font-mono text-slate-700">
                              {log.vitalsAtTreatment || "Parameters recorded in bedside flow sheet"}
                            </td>
                          )}
                          <td className="px-3 py-2 text-slate-600 italic min-w-[200px]">{log.notes || "—"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{log.performedBy}</div>
                            <div className="text-[10px] font-mono text-slate-400">{log.performedByLicense}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
