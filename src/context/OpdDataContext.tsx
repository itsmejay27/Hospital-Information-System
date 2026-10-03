import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Patient,
  HealthRecord,
  DiagnosticResult,
  MedicationOrder,
  TreatmentLog,
  AdmissionEntry,
  AuditLog,
  VisitorLog,
  ShiftEndorsement,
  HospitalConfig,
  OpdQueueItem,
  PhilHealthClaim,
  OpdReferral,
  OpdDischarge,
  QueueStatus,
  User,
  ProfileChangeRequest,
  EditableProfileField,
  PublicDirectoryEntry,
  normalizeLicense,
  ROLE_LABELS,
} from "../types";
import {
  DEMO_USERS,
  INITIAL_PATIENTS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_LAB_RESULTS,
  INITIAL_MEDICATIONS,
  INITIAL_TREATMENTS,
  INITIAL_ADMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_VISITOR_LOGS,
  INITIAL_SHIFT_ENDORSEMENTS,
  INITIAL_HOSPITAL_CONFIG,
  INITIAL_OPD_QUEUE,
  INITIAL_PHILHEALTH_CLAIMS,
  INITIAL_OPD_REFERRALS,
  INITIAL_OPD_DISCHARGES,
} from "../mockData";
import { hospitalDb } from "../services/db";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { useAuth } from "./AuthContext";
import { uid, timestamp } from "../services/ids";

interface OpdDataContextType {
  // Queue & Patients
  queue: OpdQueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<OpdQueueItem[]>>;
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  selectPatientById: (patientId: string) => Patient | null;

  // Claims
  claims: PhilHealthClaim[];
  setClaims: React.Dispatch<React.SetStateAction<PhilHealthClaim[]>>;
  addClaim: (claim: PhilHealthClaim) => void;
  /** Saves a changed claims list (new claims and status changes) and logs the changes. */
  updateClaims: (claims: PhilHealthClaim[]) => void;

  // Clinical Records
  records: HealthRecord[];
  addRecord: (record: HealthRecord) => void;
  medications: MedicationOrder[];
  addMedication: (med: MedicationOrder) => void;
  administerMedication: (medId: string, nurseName: string, nurseLicense?: string) => void;
  labResults: DiagnosticResult[];
  addLabResult: (lab: DiagnosticResult) => void;
  treatments: TreatmentLog[];
  addTreatment: (treatment: TreatmentLog) => void;

  // Referrals & Discharges
  referrals: OpdReferral[];
  addReferral: (ref: OpdReferral) => void;
  discharges: OpdDischarge[];
  addDischarge: (dis: OpdDischarge) => void;

  // Administrative
  admissions: AdmissionEntry[];
  addAdmission: (adm: AdmissionEntry) => void;
  auditLogs: AuditLog[];
  addAuditLog: (log: AuditLog) => void;
  visitorLogs: VisitorLog[];
  addVisitorLog: (visitor: VisitorLog) => void;
  checkOutVisitor: (visitorId: string) => void;
  shiftEndorsements: ShiftEndorsement[];
  addShiftEndorsement: (endorsement: ShiftEndorsement) => void;
  hospitalConfig: HospitalConfig;
  updateHospitalConfig: (cfg: HospitalConfig) => void;
  usersList: User[];
  /** Creates the staff account; resolves to null on success, or an error message. */
  addUser: (newUser: User, password: string, email?: string) => Promise<string | null>;
  toggleUserStatus: (userId: string) => Promise<string | null>;

  // Global Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Dynamic Computed Numbers
  waitingCount: number;
  criticalCount: number;
  observationCount: number;
  stableCount: number;
  completedCount: number;
  inConsultCount: number;
  totalQueueCount: number;

  // Dynamic Queue Actions
  callNextPatient: () => OpdQueueItem | null;
  consultPatient: (patientId: string) => Patient | null;
  updateQueueStatus: (id: string, status: QueueStatus, room?: string) => void;
  addPatient: (patient: Patient) => void;
  updatePatientAdmissionStatus: (
    patientId: string,
    status: Patient["admissionStatus"],
    ward?: string,
    bed?: string
  ) => void;

  // Activity log (audit trail)
  logAction: (action: string, opts?: { patientId?: string; patientName?: string; status?: AuditLog["status"] }) => void;

  // Diagnostics & pharmacy updates
  updateLabResult: (lab: DiagnosticResult, action: string) => Promise<void>;
  updateMedication: (med: MedicationOrder, action: string) => Promise<void>;

  // Staff accounts (administrator)
  /** Returns the name of another active staff member already using this license number, if any. */
  findLicenseConflict: (license: string | undefined, excludeUserId?: string) => string | null;
  updateUser: (user: User, action: string) => Promise<string | null>;
  setDirectoryVisibility: (user: User, show: boolean, photo?: string) => Promise<string | null>;

  // Profile change requests (staff ask, administrator approves)
  profileRequests: ProfileChangeRequest[];
  submitProfileRequest: (changes: Partial<Record<EditableProfileField, string>>, reason: string) => Promise<string | null>;
  cancelProfileRequest: (id: string) => Promise<void>;
  reviewProfileRequest: (id: string, approve: boolean, note: string) => Promise<string | null>;

  // Database Management
  exportDatabase: () => Promise<string>;
  resetDatabase: () => Promise<void>;
  isDbReady: boolean;
}

const OpdDataContext = createContext<OpdDataContextType | undefined>(undefined);

export function OpdDataProvider({ children }: { children: React.ReactNode }) {
  // Database status
  const [isDbReady, setIsDbReady] = useState(false);

  // Queue & Patient state
  const [queue, setQueue] = useState<OpdQueueItem[]>(INITIAL_OPD_QUEUE);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(INITIAL_PATIENTS[0] || null);

  // Clinical states
  const [claims, setClaims] = useState<PhilHealthClaim[]>(INITIAL_PHILHEALTH_CLAIMS);
  const [records, setRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [medications, setMedications] = useState<MedicationOrder[]>(INITIAL_MEDICATIONS);
  const [treatments, setTreatments] = useState<TreatmentLog[]>(INITIAL_TREATMENTS);
  const [labResults, setLabResults] = useState<DiagnosticResult[]>(INITIAL_LAB_RESULTS);
  const [referrals, setReferrals] = useState<OpdReferral[]>(INITIAL_OPD_REFERRALS);
  const [discharges, setDischarges] = useState<OpdDischarge[]>(INITIAL_OPD_DISCHARGES);

  // Administrative states
  const [admissions, setAdmissions] = useState<AdmissionEntry[]>(INITIAL_ADMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>(INITIAL_VISITOR_LOGS);
  const [shiftEndorsements, setShiftEndorsements] = useState<ShiftEndorsement[]>(INITIAL_SHIFT_ENDORSEMENTS);
  const [hospitalConfig, setHospitalConfig] = useState<HospitalConfig>(INITIAL_HOSPITAL_CONFIG);
  const [usersList, setUsersList] = useState<User[]>(() =>
    isSupabaseConfigured ? [] : Object.values(DEMO_USERS).map(u => u.user)
  );

  // Global search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>([]);

  // Supabase data is only readable once a staff member has signed in, so
  // (re)load whenever the signed-in account changes.
  const { user: authUser, signInCount, registerBeforeLogout } = useAuth();
  const authUserId = authUser?.id ?? null;
  const actorRef = useRef<User | null>(authUser);
  actorRef.current = authUser;

  /** Records who did what, and when, in the append-only audit trail. */
  const logAction = useCallback(
    (action: string, opts: { patientId?: string; patientName?: string; status?: AuditLog["status"] } = {}) => {
      const actor = actorRef.current;
      if (!actor) return;
      const entry: AuditLog = {
        id: `AUD-${uid()}`,
        timestamp: timestamp(),
        userName: actor.name,
        userRole: actor.role,
        userLicense: actor.licenseNumber,
        action,
        targetPatient: opts.patientName || "—",
        patientId: opts.patientId || "—",
        department: actor.department || ROLE_LABELS[actor.role],
        ipAddress: "Web browser",
        status: opts.status || "Authorized",
      };
      setAuditLogs(prev => [entry, ...prev]);
      hospitalDb.append("audit_logs", entry).catch(console.error);
    },
    []
  );

  // Sign-in / sign-out events
  useEffect(() => {
    if (signInCount > 0) logAction("Signed in");
  }, [signInCount, logAction]);
  useEffect(
    () =>
      registerBeforeLogout(async () => {
        const actor = actorRef.current;
        if (!actor) return;
        const entry: AuditLog = {
          id: `AUD-${uid()}`,
          timestamp: timestamp(),
          userName: actor.name,
          userRole: actor.role,
          userLicense: actor.licenseNumber,
          action: "Signed out",
          targetPatient: "—",
          patientId: "—",
          department: actor.department || ROLE_LABELS[actor.role],
          ipAddress: "Web browser",
          status: "Authorized",
        };
        await hospitalDb.append("audit_logs", entry);
      }),
    [registerBeforeLogout]
  );

  // Initialize and Hydrate from Persistent Database
  useEffect(() => {
    if (isSupabaseConfigured && !authUserId) return;
    let mounted = true;
    hospitalDb
      .initializeDatabase()
      .then((state) => {
        if (!mounted) return;
        setPatients(state.patients);
        setQueue(state.queue);
        setRecords(state.records);
        setMedications(state.medications);
        setLabResults(state.labResults);
        setTreatments(state.treatments);
        setAdmissions(state.admissions);
        setReferrals(state.referrals);
        setDischarges(state.discharges);
        setClaims(state.claims);
        setVisitorLogs(state.visitorLogs);
        setAuditLogs(state.auditLogs);
        setHospitalConfig(state.hospitalConfig);
        setUsersList(state.users);
        hospitalDb
          .getAll<ShiftEndorsement>("shift_endorsements")
          .then(list => {
            if (mounted && list.length > 0) {
              setShiftEndorsements(list.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
            }
          })
          .catch(console.error);
        hospitalDb
          .getAll<ProfileChangeRequest>("profile_requests")
          .then(list => {
            if (mounted) setProfileRequests(list.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
          })
          .catch(console.error);
        if (state.patients.length > 0) {
          setSelectedPatient(state.patients[0]);
        }
        setIsDbReady(true);
      })
      .catch((err) => {
        console.warn("CarePoint IndexedDB initialization note:", err);
        setIsDbReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [authUserId]);

  // Dynamically computed metrics derived directly from queue array
  const waitingCount = useMemo(
    () => queue.filter(q => q.status === "Waiting").length,
    [queue]
  );
  const criticalCount = useMemo(
    () => queue.filter(q => q.triageTier === "critical").length,
    [queue]
  );
  const observationCount = useMemo(
    () => queue.filter(q => q.triageTier === "observation").length,
    [queue]
  );
  const stableCount = useMemo(
    () => queue.filter(q => q.triageTier === "stable").length,
    [queue]
  );
  const completedCount = useMemo(
    () => queue.filter(q => q.status === "Completed").length,
    [queue]
  );
  const inConsultCount = useMemo(
    () => queue.filter(q => q.status === "In-Consultation").length,
    [queue]
  );
  const totalQueueCount = queue.length;

  // Actions
  const selectPatientById = (patientId: string): Patient | null => {
    const found = patients.find(p => p.id === patientId) || null;
    if (found) {
      setSelectedPatient(found);
    }
    return found;
  };

  const updateQueueStatus = (id: string, status: QueueStatus, room?: string) => {
    const item = queue.find(q => q.id === id);
    if (item) logAction(`Queue status changed to ${status}`, { patientId: item.patientId, patientName: item.patientName });
    setQueue(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status,
            roomOrBooth: room || item.roomOrBooth,
          };
        }
        return item;
      });
      hospitalDb.saveQueue(updated).catch(console.error);
      return updated;
    });
  };

  const callNextPatient = (): OpdQueueItem | null => {
    const nextWaiting = queue.find(q => q.status === "Waiting");
    if (nextWaiting) {
      logAction("Called patient for consultation", { patientId: nextWaiting.patientId, patientName: nextWaiting.patientName });
      setQueue(prev => {
        const updated = prev.map(q =>
          q.id === nextWaiting.id
            ? { ...q, status: "In-Consultation" as QueueStatus, roomOrBooth: "Consultation Room 1" }
            : q
        );
        hospitalDb.saveQueue(updated).catch(console.error);
        return updated;
      });

      const targetPatient = patients.find(p => p.id === nextWaiting.patientId);
      if (targetPatient) {
        setSelectedPatient(targetPatient);
      }
      return nextWaiting;
    }
    return null;
  };

  const consultPatient = (patientId: string): Patient | null => {
    const p = patients.find(x => x.id === patientId);
    logAction("Started consultation", { patientId, patientName: p?.name });
    setQueue(prev => {
      const updated = prev.map(q =>
        q.patientId === patientId
          ? { ...q, status: "In-Consultation" as QueueStatus, roomOrBooth: "Consultation Room 1" }
          : q
      );
      hospitalDb.saveQueue(updated).catch(console.error);
      return updated;
    });

    const targetPatient = patients.find(p => p.id === patientId) || null;
    if (targetPatient) {
      setSelectedPatient(targetPatient);
    }
    return targetPatient;
  };

  const addPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
    hospitalDb.savePatient(newPatient).catch(console.error);
    logAction("Registered new patient", { patientId: newPatient.id, patientName: newPatient.name });

    // Also automatically add to OPD queue if outpatient
    const newQueueItem: OpdQueueItem = {
      id: `Q-${uid()}`,
      queueNumber: queue.reduce((max, q) => Math.max(max, q.queueNumber || 0), 0) + 1,
      patientId: newPatient.id,
      patientName: newPatient.name,
      age: newPatient.age,
      gender: newPatient.gender,
      triageTier: newPatient.triageTier,
      checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      chiefComplaint: newPatient.chiefComplaint,
      assignedDoctor: newPatient.attendingPhysician || "Attending Physician",
      status: "Waiting",
      roomOrBooth: "Waiting Lounge A",
    };

    setQueue(prev => {
      const updated = [...prev, newQueueItem];
      hospitalDb.saveQueue(updated).catch(console.error);
      return updated;
    });

    setSelectedPatient(newPatient);
  };

  const updatePatientAdmissionStatus = (
    patientId: string,
    status: Patient["admissionStatus"],
    ward?: string,
    bed?: string
  ) => {
    const p = patients.find(x => x.id === patientId);
    logAction(`Admission status set to ${status}${ward ? ` (${ward}${bed ? ` / ${bed}` : ""})` : ""}`, {
      patientId,
      patientName: p?.name,
    });
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated: Patient = {
            ...p,
            admissionStatus: status,
            ward: ward !== undefined ? ward : p.ward,
            bed: bed !== undefined ? bed : p.bed,
          };
          hospitalDb.savePatient(updated).catch(console.error);
          return updated;
        }
        return p;
      })
    );
  };

  const addClaim = (newClaim: PhilHealthClaim) => {
    setClaims(prev => [newClaim, ...prev]);
    hospitalDb.saveClaim(newClaim).catch(console.error);
    logAction(`Filed PhilHealth claim ${newClaim.id}`, { patientId: newClaim.patientId, patientName: newClaim.memberName });
  };

  const updateClaims = (next: PhilHealthClaim[]) => {
    const before = new Map(claims.map(c => [c.id, c]));
    next.forEach(c => {
      const old = before.get(c.id);
      if (!old) {
        hospitalDb.saveClaim(c).catch(console.error);
        logAction(`Filed PhilHealth claim ${c.id}`, { patientId: c.patientId, patientName: c.memberName });
      } else if (JSON.stringify(old) !== JSON.stringify(c)) {
        hospitalDb.saveClaim(c).catch(console.error);
        logAction(
          old.claimStatus !== c.claimStatus ? `Claim ${c.id} status: ${old.claimStatus} → ${c.claimStatus}` : `Updated claim ${c.id}`,
          { patientId: c.patientId, patientName: c.memberName }
        );
      }
    });
    setClaims(next);
  };

  const addRecord = (newRecord: HealthRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    hospitalDb.saveRecord(newRecord).catch(console.error);
    logAction(`Signed clinical note (${newRecord.type})`, { patientId: newRecord.patientId, patientName: newRecord.patientName });
  };

  const addMedication = (newMed: MedicationOrder) => {
    setMedications(prev => [newMed, ...prev]);
    hospitalDb.saveMedication(newMed).catch(console.error);
    logAction(`Prescribed ${newMed.name} ${newMed.dose}`, { patientId: newMed.patientId, patientName: newMed.patientName });
  };

  const administerMedication = (medId: string, nurseName: string, nurseLicense?: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const med = medications.find(m => m.id === medId);
    if (med) logAction(`Administered ${med.name} ${med.dose}`, { patientId: med.patientId, patientName: med.patientName });
    setMedications(prev =>
      prev.map(m => {
        if (m.id === medId) {
          const updated: MedicationOrder = {
            ...m,
            lastAdministered: `Today, ${timeNow}`,
            administeredBy: nurseName,
            administeredByLicense: nurseLicense || "PRC Lic. Registered Nurse",
          };
          hospitalDb.saveMedication(updated).catch(console.error);
          return updated;
        }
        return m;
      })
    );
  };

  const addLabResult = (newLab: DiagnosticResult) => {
    setLabResults(prev => [newLab, ...prev]);
    hospitalDb.saveLabResult(newLab).catch(console.error);
    logAction(`Ordered ${newLab.category} test: ${newLab.test}`, { patientId: newLab.patientId, patientName: newLab.patientName });
  };

  const updateLabResult = async (lab: DiagnosticResult, action: string) => {
    await hospitalDb.saveLabResult(lab);
    setLabResults(prev => prev.map(l => (l.id === lab.id ? lab : l)));
    logAction(action, { patientId: lab.patientId, patientName: lab.patientName });
  };

  const updateMedication = async (med: MedicationOrder, action: string) => {
    await hospitalDb.saveMedication(med);
    setMedications(prev => prev.map(m => (m.id === med.id ? med : m)));
    logAction(action, { patientId: med.patientId, patientName: med.patientName });
  };

  const addTreatment = (newTreatment: TreatmentLog) => {
    setTreatments(prev => [newTreatment, ...prev]);
    hospitalDb.saveTreatment(newTreatment).catch(console.error);
    logAction(`Recorded ${newTreatment.treatmentName}`, { patientId: newTreatment.patientId, patientName: newTreatment.patientName });
  };

  const addReferral = (newRef: OpdReferral) => {
    setReferrals(prev => [newRef, ...prev]);
    hospitalDb.saveReferral(newRef).catch(console.error);
    logAction(`Referred patient to ${newRef.referredTo}`, { patientId: newRef.patientId, patientName: newRef.patientName });
  };

  const addDischarge = (newDis: OpdDischarge) => {
    setDischarges(prev => [newDis, ...prev]);
    hospitalDb.saveDischarge(newDis).catch(console.error);
    logAction(`Discharged patient (${newDis.disposition})`, { patientId: newDis.patientId, patientName: newDis.patientName });
  };

  const addAdmission = (newAdm: AdmissionEntry) => {
    setAdmissions(prev => [newAdm, ...prev]);
    hospitalDb.saveAdmission(newAdm).catch(console.error);
    logAction(`Admitted to ${newAdm.ward} / ${newAdm.bed}`, { patientId: newAdm.patientId, patientName: newAdm.patientName });
  };

  const addAuditLog = (newLog: AuditLog) => {
    setAuditLogs(prev => [newLog, ...prev]);
    hospitalDb.append("audit_logs", newLog).catch(console.error);
  };

  const addVisitorLog = (newVisitor: VisitorLog) => {
    setVisitorLogs(prev => [newVisitor, ...prev]);
    hospitalDb.saveVisitorLog(newVisitor).catch(console.error);
    logAction(`Registered visitor ${newVisitor.visitorName}`, { patientId: newVisitor.patientId, patientName: newVisitor.patientName });
  };

  const checkOutVisitor = (visitorId: string) => {
    const timeNow = timestamp().substring(0, 16);
    const visitor = visitorLogs.find(v => v.id === visitorId);
    if (visitor) logAction(`Checked out visitor ${visitor.visitorName}`, { patientId: visitor.patientId, patientName: visitor.patientName });
    setVisitorLogs(prev =>
      prev.map(v => {
        if (v.id === visitorId) {
          const updated: VisitorLog = { ...v, timeOut: timeNow, status: "Departed" };
          hospitalDb.saveVisitorLog(updated).catch(console.error);
          return updated;
        }
        return v;
      })
    );
  };

  const addShiftEndorsement = (newEndorsement: ShiftEndorsement) => {
    setShiftEndorsements(prev => [newEndorsement, ...prev]);
    hospitalDb.save("shift_endorsements", newEndorsement).catch(console.error);
    logAction(`Shift endorsement to ${newEndorsement.incomingNurse} (${newEndorsement.ward})`);
  };

  const updateHospitalConfig = (cfg: HospitalConfig) => {
    setHospitalConfig(cfg);
    hospitalDb.saveHospitalConfig(cfg).catch(console.error);
    logAction("Updated hospital settings");
  };

  const findLicenseConflict = (license: string | undefined, excludeUserId?: string): string | null => {
    const digits = normalizeLicense(license);
    if (!digits) return null;
    const other = usersList.find(
      u => u.id !== excludeUserId && u.status !== "suspended" && normalizeLicense(u.licenseNumber) === digits
    );
    return other ? other.name : null;
  };

  /** Turns database errors into messages staff can act on. */
  const describeError = (error: unknown, fallback: string): string => {
    const msg = (error as { message?: string })?.message || "";
    if (msg.includes("users_unique_license")) return "Another active staff account already uses this license number.";
    return msg || fallback;
  };

  const addUser = async (newUser: User, password: string, email?: string): Promise<string | null> => {
    const conflict = findLicenseConflict(newUser.licenseNumber);
    if (conflict) return `License number is already used by ${conflict}.`;
    if (supabase) {
      // Logins can only be created server-side, and only by an administrator
      const { data, error } = await supabase.functions.invoke("create-staff-account", {
        body: { email, password, profile: newUser },
      });
      if (error) {
        const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
        return body?.error ?? "Could not create the account.";
      }
      newUser = data.profile as User;
      setUsersList(prev => [...prev, newUser]);
    } else {
      setUsersList(prev => [...prev, newUser]);
      hospitalDb.saveUser(newUser).catch(console.error);
    }
    logAction(`Created staff account: ${newUser.name} (${ROLE_LABELS[newUser.role]}${newUser.licenseNumber ? `, ${newUser.licenseNumber}` : ""})`);
    return null;
  };

  const updateUser = async (updated: User, action: string): Promise<string | null> => {
    const conflict = updated.status !== "suspended" ? findLicenseConflict(updated.licenseNumber, updated.id) : null;
    if (conflict) return `License number is already used by ${conflict}.`;
    try {
      await hospitalDb.saveUser(updated);
    } catch (err) {
      return describeError(err, "Could not save the account.");
    }
    setUsersList(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    logAction(action);
    // Keep the public website card in sync with the profile
    if (updated.showInDirectory) {
      const existing = await hospitalDb.getAll<PublicDirectoryEntry>("public_directory").catch(() => []);
      const card = existing.find(e => e.id === updated.id);
      if (updated.status === "suspended") {
        await hospitalDb.remove("public_directory", updated.id).catch(console.error);
      } else {
        await hospitalDb.save("public_directory", toDirectoryEntry(updated, card?.photo)).catch(console.error);
      }
    }
    return null;
  };

  const toggleUserStatus = async (userId: string): Promise<string | null> => {
    const u = usersList.find(x => x.id === userId);
    if (!u) return "Account not found.";
    const newStatus: "active" | "suspended" = u.status === "suspended" ? "active" : "suspended";
    return updateUser(
      { ...u, status: newStatus },
      `${newStatus === "suspended" ? "Suspended" : "Reactivated"} staff account: ${u.name} (${ROLE_LABELS[u.role]})`
    );
  };

  const toDirectoryEntry = (u: User, photo?: string): PublicDirectoryEntry => ({
    id: u.id,
    name: u.name,
    title: u.title,
    role: u.role,
    department: u.department,
    credentials: u.credentials,
    photo,
  });

  const setDirectoryVisibility = async (u: User, show: boolean, photo?: string): Promise<string | null> => {
    try {
      if (show) await hospitalDb.save("public_directory", toDirectoryEntry(u, photo));
      else await hospitalDb.remove("public_directory", u.id);
    } catch (err) {
      return describeError(err, "Could not update the public directory.");
    }
    return updateUser(
      { ...u, showInDirectory: show },
      `${show ? "Published" : "Removed"} ${u.name} ${show ? "on" : "from"} the public staff directory`
    );
  };

  // — Profile change requests —
  const submitProfileRequest = async (
    changes: Partial<Record<EditableProfileField, string>>,
    reason: string
  ): Promise<string | null> => {
    const me = actorRef.current;
    if (!me) return "Please sign in again.";
    if (Object.keys(changes).length === 0) return "No changes to submit.";
    if (changes.licenseNumber !== undefined) {
      const conflict = findLicenseConflict(changes.licenseNumber, me.id);
      if (conflict) return `License number is already used by ${conflict}.`;
    }
    const previous: Partial<Record<EditableProfileField, string>> = {};
    (Object.keys(changes) as EditableProfileField[]).forEach(k => (previous[k] = (me[k] as string | undefined) || ""));
    const request: ProfileChangeRequest = {
      id: `PRQ-${uid()}`,
      userId: me.id,
      userName: me.name,
      role: me.role,
      requestedAt: timestamp(),
      changes,
      previous,
      reason: reason.trim() || undefined,
      status: "Pending",
    };
    try {
      await hospitalDb.append("profile_requests", request);
    } catch (err) {
      return describeError(err, "Could not submit the request.");
    }
    setProfileRequests(prev => [request, ...prev]);
    logAction(`Requested profile change: ${Object.keys(changes).join(", ")}`);
    return null;
  };

  const cancelProfileRequest = async (id: string) => {
    await hospitalDb.remove("profile_requests", id);
    setProfileRequests(prev => prev.filter(r => r.id !== id));
    logAction("Cancelled profile change request");
  };

  const reviewProfileRequest = async (id: string, approve: boolean, note: string): Promise<string | null> => {
    const me = actorRef.current;
    const req = profileRequests.find(r => r.id === id);
    if (!me || !req) return "Request not found.";
    if (approve) {
      const target = usersList.find(u => u.id === req.userId);
      if (!target) return "The staff account no longer exists.";
      const err = await updateUser(
        { ...target, ...req.changes },
        `Approved profile change for ${target.name}: ${Object.keys(req.changes).join(", ")}`
      );
      if (err) return err;
    }
    const reviewed: ProfileChangeRequest = {
      ...req,
      status: approve ? "Approved" : "Rejected",
      reviewedBy: me.name,
      reviewedAt: timestamp(),
      reviewNote: note.trim() || undefined,
    };
    try {
      await hospitalDb.save("profile_requests", reviewed);
    } catch (err) {
      return describeError(err, "Could not save the review.");
    }
    setProfileRequests(prev => prev.map(r => (r.id === id ? reviewed : r)));
    if (!approve) logAction(`Rejected profile change for ${req.userName}`);
    return null;
  };

  const exportDatabase = async () => {
    return hospitalDb.exportDatabaseToJson();
  };

  const resetDatabase = async () => {
    await hospitalDb.resetDatabaseToDefaults();
    const state = await hospitalDb.loadFullState();
    setPatients(state.patients);
    setQueue(state.queue);
    setRecords(state.records);
    setMedications(state.medications);
    setLabResults(state.labResults);
    setTreatments(state.treatments);
    setAdmissions(state.admissions);
    setReferrals(state.referrals);
    setDischarges(state.discharges);
    setClaims(state.claims);
    setVisitorLogs(state.visitorLogs);
    setAuditLogs(state.auditLogs);
    setHospitalConfig(state.hospitalConfig);
    setUsersList(state.users);
  };

  return (
    <OpdDataContext.Provider
      value={{
        queue,
        setQueue,
        patients,
        setPatients,
        selectedPatient,
        setSelectedPatient,
        selectPatientById,
        claims,
        setClaims,
        addClaim,
        updateClaims,
        records,
        addRecord,
        medications,
        addMedication,
        administerMedication,
        labResults,
        addLabResult,
        treatments,
        addTreatment,
        referrals,
        addReferral,
        discharges,
        addDischarge,
        admissions,
        addAdmission,
        auditLogs,
        addAuditLog,
        visitorLogs,
        addVisitorLog,
        checkOutVisitor,
        shiftEndorsements,
        addShiftEndorsement,
        hospitalConfig,
        updateHospitalConfig,
        usersList,
        addUser,
        toggleUserStatus,
        globalSearchQuery,
        setGlobalSearchQuery,
        waitingCount,
        criticalCount,
        observationCount,
        stableCount,
        completedCount,
        inConsultCount,
        totalQueueCount,
        callNextPatient,
        consultPatient,
        updateQueueStatus,
        addPatient,
        updatePatientAdmissionStatus,
        exportDatabase,
        resetDatabase,
        isDbReady,
        logAction,
        updateLabResult,
        updateMedication,
        findLicenseConflict,
        updateUser,
        setDirectoryVisibility,
        profileRequests,
        submitProfileRequest,
        cancelProfileRequest,
        reviewProfileRequest,
      }}
    >
      {children}
    </OpdDataContext.Provider>
  );
}

export function useOpdData(): OpdDataContextType {
  const context = useContext(OpdDataContext);
  if (!context) {
    throw new Error("useOpdData must be used within an OpdDataProvider");
  }
  return context;
}
