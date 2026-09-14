import React, { useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OpdDataProvider, useOpdData } from "./context/OpdDataContext";
import OpdSidebar from "./components/OpdSidebar";
import OpdTopNav from "./components/OpdTopNav";
import LoginPage from "./views/LoginPage";
import OpdDashboardView from "./views/OpdDashboardView";
import OpdQueueView from "./views/OpdQueueView";
import DoctorWorkbench, { WorkbenchTab } from "./views/DoctorWorkbench";
import NurseStation from "./views/NurseStation";
import StaffAdmissions from "./views/StaffAdmissions";
import PhilHealthClaimsView from "./views/PhilHealthClaimsView";
import OpdReportsView from "./views/OpdReportsView";
import AdminCompliance from "./views/AdminCompliance";
import { User } from "./types";

// — Connected Route Wrapper Components —

function RegistrationRoute() {
  const { user, logout } = useAuth();
  const {
    patients,
    addPatient,
    admissions,
    addAdmission,
    updatePatientAdmissionStatus,
    visitorLogs,
    addVisitorLog,
    checkOutVisitor,
  } = useOpdData();

  const staffUser: User =
    user?.role === "staff"
      ? user
      : {
          id: user?.id || "USR-STAFF",
          name: user?.name || "Admissions Staff",
          role: "staff",
          title: "Admissions Officer",
          avatarInitials: "AS",
          status: "active",
          department: user?.department || "Outpatient Admissions Desk",
          licenseNumber: user?.licenseNumber || "EMP-REG-101",
        };

  return (
    <StaffAdmissions
      user={staffUser}
      patients={patients}
      onAddPatient={addPatient}
      admissions={admissions}
      onAddAdmission={addAdmission}
      onUpdatePatientStatus={updatePatientAdmissionStatus}
      visitorLogs={visitorLogs}
      onAddVisitorLog={addVisitorLog}
      onCheckOutVisitor={checkOutVisitor}
      onSignOut={logout}
    />
  );
}

function WorkbenchRoute({ initialTab = "profile" }: { initialTab?: WorkbenchTab }) {
  const { user, logout } = useAuth();
  const {
    patients,
    records,
    addRecord,
    labResults,
    addLabResult,
    medications,
    addMedication,
    selectedPatient,
    referrals,
    addReferral,
    discharges,
    addDischarge,
  } = useOpdData();

  // Active doctor derived from current authenticated session
  const doctorUser: User =
    user?.role === "doctor"
      ? user
      : {
          id: user?.id || "DOC-001",
          name: user?.name || "Attending Physician, MD",
          role: "doctor",
          title: "Attending Physician",
          avatarInitials: "AP",
          department: user?.department || "Outpatient Department",
          licenseNumber: user?.licenseNumber || "PRC Lic. Verified",
          status: "active",
        };

  return (
    <DoctorWorkbench
      key={initialTab}
      user={doctorUser}
      patients={patients}
      records={records}
      onAddRecord={addRecord}
      labResults={labResults}
      onAddLabResult={addLabResult}
      medications={medications}
      onAddMedication={addMedication}
      initialPatientId={selectedPatient?.id}
      initialTab={initialTab}
      referrals={referrals}
      onAddReferral={addReferral}
      discharges={discharges}
      onAddDischarge={addDischarge}
      onSignOut={logout}
    />
  );
}

function VitalsRoute() {
  const { user, logout } = useAuth();
  const {
    patients,
    medications,
    administerMedication,
    treatments,
    addTreatment,
    admissions,
    shiftEndorsements,
    addShiftEndorsement,
    visitorLogs,
    addVisitorLog,
    checkOutVisitor,
  } = useOpdData();

  const nurseUser: User =
    user?.role === "nurse"
      ? user
      : {
          id: user?.id || "NURSE-001",
          name: user?.name || "Triage & OPD Nurse",
          role: "nurse",
          title: "Staff Nurse, RN",
          avatarInitials: "RN",
          department: user?.department || "Outpatient Nursing Station",
          licenseNumber: user?.licenseNumber || "PRC Lic. Registered Nurse",
          status: "active",
        };

  return (
    <NurseStation
      user={nurseUser}
      patients={patients}
      medications={medications}
      onAdministerMedication={(medId, nurseName) =>
        administerMedication(medId, nurseName, user?.licenseNumber)
      }
      treatments={treatments}
      onAddTreatment={addTreatment}
      admissions={admissions}
      shiftEndorsements={shiftEndorsements}
      onAddShiftEndorsement={addShiftEndorsement}
      visitorLogs={visitorLogs}
      onAddVisitorLog={addVisitorLog}
      onCheckOutVisitor={checkOutVisitor}
      onSignOut={logout}
    />
  );
}

function PhilHealthRoute() {
  const { claims, setClaims, hospitalConfig } = useOpdData();
  return (
    <PhilHealthClaimsView
      claims={claims}
      onUpdateClaims={setClaims}
      hospitalConfig={hospitalConfig}
    />
  );
}

function ReportsRoute() {
  const { patients, claims, hospitalConfig } = useOpdData();
  return (
    <OpdReportsView
      patients={patients}
      claims={claims}
      hospitalConfig={hospitalConfig}
    />
  );
}

function AdminRoute() {
  const { user, logout } = useAuth();
  const {
    auditLogs,
    hospitalConfig,
    updateHospitalConfig,
    usersList,
    addUser,
    toggleUserStatus,
  } = useOpdData();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: user?.id || "ADM-001",
          name: user?.name || "System Administrator",
          role: "admin",
          title: "Hospital Administrator",
          avatarInitials: "SA",
          department: "Hospital Administration & Security",
          status: "active",
          licenseNumber: user?.licenseNumber || "SYS-ADMIN-AUTH",
        };

  return (
    <AdminCompliance
      user={adminUser}
      auditLogs={auditLogs}
      hospitalConfig={hospitalConfig}
      onUpdateHospitalConfig={updateHospitalConfig}
      usersList={usersList}
      onAddUser={addUser}
      onToggleUserStatus={toggleUserStatus}
      onSignOut={logout}
    />
  );
}

// — Professional Full-Width OPD Layout —
function OpdAppLayout() {
  const { user, isAuthenticated } = useAuth();
  const { hospitalConfig } = useOpdData();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If user is not authenticated or session was cleared on logout, reset completely to Login
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/70 font-sans text-slate-800 antialiased">
      {/* Persistent Collapsible Sidebar with Dynamic Routing */}
      <OpdSidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Dynamic Top Navigation Bar */}
        <OpdTopNav emergencyHotline={hospitalConfig.emergencyHotline} />

        {/* Dynamic Routed Outpatient Department Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<OpdDashboardView />} />
            <Route path="/queue" element={<OpdQueueView />} />
            <Route path="/registration" element={<RegistrationRoute />} />
            <Route path="/workbench" element={<WorkbenchRoute initialTab="profile" />} />
            <Route path="/vitals" element={<VitalsRoute />} />
            <Route path="/prescriptions" element={<WorkbenchRoute initialTab="prescriptions" />} />
            <Route path="/diagnostics" element={<WorkbenchRoute initialTab="diagnostics" />} />
            <Route path="/philhealth" element={<PhilHealthRoute />} />
            <Route path="/referrals" element={<WorkbenchRoute initialTab="referral" />} />
            <Route path="/reports" element={<ReportsRoute />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// — Main Application Root with Global Providers —
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <OpdDataProvider>
          <OpdAppLayout />
        </OpdDataProvider>
      </AuthProvider>
    </HashRouter>
  );
}
