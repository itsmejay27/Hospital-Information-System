import React, { createContext, useContext, useState, useMemo } from "react";
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
  addUser: (newUser: User, password?: string) => void;
  toggleUserStatus: (userId: string) => void;

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
}

const OpdDataContext = createContext<OpdDataContextType | undefined>(undefined);

export function OpdDataProvider({ children }: { children: React.ReactNode }) {
  // Queue state
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
    Object.values(DEMO_USERS).map(u => u.user)
  );

  // Global search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

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
    setQueue(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status,
            roomOrBooth: room || item.roomOrBooth,
          };
        }
        return item;
      })
    );
  };

  const callNextPatient = (): OpdQueueItem | null => {
    const nextWaiting = queue.find(q => q.status === "Waiting");
    if (nextWaiting) {
      setQueue(prev =>
        prev.map(q =>
          q.id === nextWaiting.id
            ? { ...q, status: "In-Consultation", roomOrBooth: "Consultation Room 1" }
            : q
        )
      );

      const targetPatient = patients.find(p => p.id === nextWaiting.patientId);
      if (targetPatient) {
        setSelectedPatient(targetPatient);
      }
      return nextWaiting;
    }
    return null;
  };

  const consultPatient = (patientId: string): Patient | null => {
    setQueue(prev =>
      prev.map(q =>
        q.patientId === patientId
          ? { ...q, status: "In-Consultation", roomOrBooth: "Consultation Room 1" }
          : q
      )
    );

    const targetPatient = patients.find(p => p.id === patientId) || null;
    if (targetPatient) {
      setSelectedPatient(targetPatient);
    }
    return targetPatient;
  };

  const addPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);

    // Also automatically add to OPD queue if outpatient
    const newQueueItem: OpdQueueItem = {
      id: `Q-${Date.now().toString().slice(-3)}`,
      queueNumber: queue.length + 1,
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
    setQueue(prev => [...prev, newQueueItem]);
    setSelectedPatient(newPatient);
  };

  const updatePatientAdmissionStatus = (
    patientId: string,
    status: Patient["admissionStatus"],
    ward?: string,
    bed?: string
  ) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === patientId
          ? {
              ...p,
              admissionStatus: status,
              ward: ward !== undefined ? ward : p.ward,
              bed: bed !== undefined ? bed : p.bed,
            }
          : p
      )
    );
  };

  const addClaim = (newClaim: PhilHealthClaim) => {
    setClaims(prev => [newClaim, ...prev]);
  };

  const addRecord = (newRecord: HealthRecord) => {
    setRecords(prev => [newRecord, ...prev]);
  };

  const addMedication = (newMed: MedicationOrder) => {
    setMedications(prev => [newMed, ...prev]);
  };

  const administerMedication = (medId: string, nurseName: string, nurseLicense?: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMedications(prev =>
      prev.map(m =>
        m.id === medId
          ? {
              ...m,
              lastAdministered: `Today, ${timeNow}`,
              administeredBy: nurseName,
              administeredByLicense: nurseLicense || "PRC Lic. Registered Nurse",
            }
          : m
      )
    );
  };

  const addLabResult = (newLab: DiagnosticResult) => {
    setLabResults(prev => [newLab, ...prev]);
  };

  const addTreatment = (newTreatment: TreatmentLog) => {
    setTreatments(prev => [newTreatment, ...prev]);
  };

  const addReferral = (newRef: OpdReferral) => {
    setReferrals(prev => [newRef, ...prev]);
  };

  const addDischarge = (newDis: OpdDischarge) => {
    setDischarges(prev => [newDis, ...prev]);
  };

  const addAdmission = (newAdm: AdmissionEntry) => {
    setAdmissions(prev => [newAdm, ...prev]);
  };

  const addAuditLog = (newLog: AuditLog) => {
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addVisitorLog = (newVisitor: VisitorLog) => {
    setVisitorLogs(prev => [newVisitor, ...prev]);
  };

  const checkOutVisitor = (visitorId: string) => {
    const timeNow = new Date().toISOString().replace("T", " ").substring(0, 16);
    setVisitorLogs(prev =>
      prev.map(v =>
        v.id === visitorId ? { ...v, timeOut: timeNow, status: "Departed" } : v
      )
    );
  };

  const addShiftEndorsement = (newEndorsement: ShiftEndorsement) => {
    setShiftEndorsements(prev => [newEndorsement, ...prev]);
  };

  const updateHospitalConfig = (cfg: HospitalConfig) => {
    setHospitalConfig(cfg);
  };

  const addUser = (newUser: User, _password = "pass") => {
    setUsersList(prev => [...prev, newUser]);
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: "Admin System",
      userRole: "admin",
      action: `Admin Provisioned Staff Account: ${newUser.name} (${newUser.role.toUpperCase()} - ${newUser.licenseNumber || "N/A"})`,
      targetPatient: "Hospital System Users",
      patientId: newUser.id,
      department: "Administration",
      ipAddress: "192.168.10.5",
      status: "Authorized",
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const toggleUserStatus = (userId: string) => {
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newStatus = u.status === "suspended" ? "active" : "suspended";
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
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
