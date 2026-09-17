import React, { useState } from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OpdDataProvider, useOpdData } from "./context/OpdDataContext";
import OpdSidebar from "./components/OpdSidebar";
import OpdTopNav from "./components/OpdTopNav";
import PublicLayout, {
  PublicHomePage,
  PublicAboutPage,
  PublicDepartmentsPage,
  PublicAnnouncementsPage,
  PublicStaffPage,
  PublicContactPage,
} from "./views/PublicLayout";
import OpdDashboardView from "./views/OpdDashboardView";
import OpdQueueView from "./views/OpdQueueView";
import PhilHealthClaimsView from "./views/PhilHealthClaimsView";
import OpdReportsView from "./views/OpdReportsView";

// Dedicated Isolated Route Components
import DoctorWorkbenchView from "./views/DoctorWorkbenchView";
import VitalsBmiView from "./views/VitalsBmiView";
import PatientBedAllocationView from "./views/PatientBedAllocationView";
import RegistrationNewPatientView from "./views/RegistrationNewPatientView";
import RegistrationDirectoryView from "./views/RegistrationDirectoryView";
import RegistrationVisitorsView from "./views/RegistrationVisitorsView";
import AdminAccountsView from "./views/AdminAccountsView";
import AdminBrandingView from "./views/AdminBrandingView";
import AdminAuditLedgerView from "./views/AdminAuditLedgerView";
import AdminRbacView from "./views/AdminRbacView";
import AdminComplianceView from "./views/AdminComplianceView";

import { User, Role } from "./types";

// — Protected Route with Role-Based Access Control Guard —
interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectTarget = user.role === "admin" ? "/admin/accounts" : "/dashboard";
    return <Navigate to={redirectTarget} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

// — Connected Dedicated Route Wrapper Functions —

function DoctorWorkbenchRoute() {
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
  } = useOpdData();

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
    <DoctorWorkbenchView
      user={doctorUser}
      patients={patients}
      records={records}
      onAddRecord={addRecord}
      labResults={labResults}
      onAddLabResult={addLabResult}
      medications={medications}
      onAddMedication={addMedication}
      initialPatientId={selectedPatient?.id}
      onSignOut={logout}
    />
  );
}

function VitalsBmiRoute() {
  const { user, logout } = useAuth();
  const { patients, treatments, addTreatment, selectedPatient } = useOpdData();

  const clinicianUser: User =
    user || {
      id: "NURSE-001",
      name: "Triage & Ward Nurse",
      role: "nurse",
      title: "Staff Nurse, RN",
      avatarInitials: "RN",
      department: "Nursing Station",
      licenseNumber: "PRC Lic. Registered Nurse",
      status: "active",
    };

  return (
    <VitalsBmiView
      user={clinicianUser}
      patients={patients}
      treatments={treatments}
      onAddTreatment={addTreatment}
      initialPatientId={selectedPatient?.id}
      onSignOut={logout}
    />
  );
}

function RegistrationNewPatientRoute() {
  const { user, logout } = useAuth();
  const { patients, addPatient } = useOpdData();

  const staffUser: User =
    user || {
      id: "USR-STAFF",
      name: "Admissions Staff",
      role: "staff",
      title: "Admissions Officer",
      avatarInitials: "AS",
      department: "Admissions Desk",
      status: "active",
    };

  return (
    <RegistrationNewPatientView
      user={staffUser}
      patients={patients}
      onAddPatient={addPatient}
      onSignOut={logout}
    />
  );
}

function PatientBedAllocationRoute() {
  const { user, logout } = useAuth();
  const { patients, admissions, addAdmission, updatePatientAdmissionStatus } = useOpdData();

  const staffUser: User =
    user || {
      id: "USR-STAFF",
      name: "Admissions Desk",
      role: "staff",
      title: "Bed Management Officer",
      avatarInitials: "AS",
      department: "Admissions & Ward Logistics",
      status: "active",
    };

  return (
    <PatientBedAllocationView
      user={staffUser}
      patients={patients}
      admissions={admissions}
      onAddAdmission={addAdmission}
      onUpdatePatientStatus={updatePatientAdmissionStatus}
      onSignOut={logout}
    />
  );
}

function RegistrationDirectoryRoute() {
  const { user, logout } = useAuth();
  const { patients } = useOpdData();

  const currentUser: User =
    user || {
      id: "USR-STAFF",
      name: "Staff",
      role: "staff",
      title: "Records Officer",
      avatarInitials: "RO",
      department: "Medical Records",
      status: "active",
    };

  return <RegistrationDirectoryView user={currentUser} patients={patients} onSignOut={logout} />;
}

function RegistrationVisitorsRoute() {
  const { user, logout } = useAuth();
  const { patients, visitorLogs, addVisitorLog, checkOutVisitor } = useOpdData();

  const staffUser: User =
    user || {
      id: "USR-STAFF",
      name: "Front Desk Officer",
      role: "staff",
      title: "Front Desk Officer",
      avatarInitials: "FD",
      department: "Admissions & Security",
      status: "active",
    };

  return (
    <RegistrationVisitorsView
      user={staffUser}
      patients={patients}
      visitorLogs={visitorLogs}
      onAddVisitorLog={addVisitorLog}
      onCheckOutVisitor={checkOutVisitor}
      onSignOut={logout}
    />
  );
}

function AdminAccountsRoute() {
  const { user, logout } = useAuth();
  const { usersList, addUser, toggleUserStatus } = useOpdData();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: "ADM-001",
          name: "System Administrator",
          role: "admin",
          title: "Hospital Administrator",
          avatarInitials: "SA",
          department: "Administration",
          status: "active",
        };

  return (
    <AdminAccountsView
      user={adminUser}
      usersList={usersList}
      onAddUser={addUser}
      onToggleUserStatus={toggleUserStatus}
      onSignOut={logout}
    />
  );
}

function AdminBrandingRoute() {
  const { user, logout } = useAuth();
  const { hospitalConfig, updateHospitalConfig } = useOpdData();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: "ADM-001",
          name: "System Administrator",
          role: "admin",
          title: "Hospital Administrator",
          avatarInitials: "SA",
          department: "Administration",
          status: "active",
        };

  return (
    <AdminBrandingView
      user={adminUser}
      hospitalConfig={hospitalConfig}
      onUpdateHospitalConfig={updateHospitalConfig}
      onSignOut={logout}
    />
  );
}

function AdminAuditLedgerRoute() {
  const { user, logout } = useAuth();
  const { auditLogs } = useOpdData();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: "ADM-001",
          name: "Security Officer",
          role: "admin",
          title: "DPA Compliance Auditor",
          avatarInitials: "SO",
          department: "Information Security",
          status: "active",
        };

  return <AdminAuditLedgerView user={adminUser} auditLogs={auditLogs} onSignOut={logout} />;
}

function AdminRbacRoute() {
  const { user, logout } = useAuth();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: "ADM-001",
          name: "System Administrator",
          role: "admin",
          title: "Hospital Administrator",
          avatarInitials: "SA",
          department: "Administration",
          status: "active",
        };

  return <AdminRbacView user={adminUser} onSignOut={logout} />;
}

function AdminComplianceRoute() {
  const { user, logout } = useAuth();
  const { hospitalConfig } = useOpdData();

  const adminUser: User =
    user?.role === "admin"
      ? user
      : {
          id: "ADM-001",
          name: "System Administrator",
          role: "admin",
          title: "Hospital Administrator",
          avatarInitials: "SA",
          department: "Administration",
          status: "active",
        };

  return <AdminComplianceView user={adminUser} hospitalConfig={hospitalConfig} onSignOut={logout} />;
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

// — Professional Full-Width OPD Layout —
function OpdAppLayout() {
  const { hospitalConfig } = useOpdData();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// — Main Application Root with Global Providers & Public/Private Routing —
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <OpdDataProvider>
          <Routes>
            {/* Public Layout and Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicHomePage />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<PublicAboutPage />} />
              <Route path="/departments" element={<PublicDepartmentsPage />} />
              <Route path="/announcements" element={<PublicAnnouncementsPage />} />
              <Route path="/staff" element={<PublicStaffPage />} />
              <Route path="/contact" element={<PublicContactPage />} />
            </Route>

            {/* Standalone Authentication Route Redirects (Auth is handled via Modal) */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />

            {/* Protected OPD Layout and Clinical Workbenches */}
            <Route
              element={
                <ProtectedRoute>
                  <OpdAppLayout />
                </ProtectedRoute>
              }
            >
              {/* OPD Dashboard */}
              <Route path="/dashboard" element={<OpdDashboardView />} />

              {/* Patient Live Queue */}
              <Route
                path="/queue"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "nurse", "staff"]}>
                    <OpdQueueView />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================ */}
              {/* CLINICAL CARE & DOCTOR WORKBENCH (/clinical/*) */}
              {/* ============================================================ */}
              <Route
                path="/clinical/doctor-workbench"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorWorkbenchRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clinical/vitals-bmi"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "nurse"]}>
                    <VitalsBmiRoute />
                  </ProtectedRoute>
                }
              />

              {/* Connected Clinical Actions */}
              <Route
                path="/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorWorkbenchRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diagnostics"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "nurse"]}>
                    <DoctorWorkbenchRoute />
                  </ProtectedRoute>
                }
              />
              {/* Referrals & Discharge Workflow (Now Modal-based, redirect to Workbench) */}
              <Route path="/referrals" element={<Navigate to="/clinical/doctor-workbench" replace />} />

              {/* Legacy Clinical Route Redirects */}
              <Route path="/workbench" element={<Navigate to="/clinical/doctor-workbench" replace />} />
              <Route path="/vitals" element={<Navigate to="/clinical/vitals-bmi" replace />} />

              {/* ============================================================ */}
              {/* PATIENT REGISTRATION (/registration/*) */}
              {/* ============================================================ */}
              <Route
                path="/registration/new-patient"
                element={
                  <ProtectedRoute allowedRoles={["staff"]}>
                    <RegistrationNewPatientRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registration/beds"
                element={
                  <ProtectedRoute allowedRoles={["staff", "nurse"]}>
                    <PatientBedAllocationRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registration/directory"
                element={
                  <ProtectedRoute allowedRoles={["staff", "doctor", "nurse"]}>
                    <RegistrationDirectoryRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registration/visitors"
                element={
                  <ProtectedRoute allowedRoles={["staff", "nurse"]}>
                    <RegistrationVisitorsRoute />
                  </ProtectedRoute>
                }
              />

              {/* Legacy Registration Route Redirect */}
              <Route path="/registration" element={<Navigate to="/registration/new-patient" replace />} />

              {/* ============================================================ */}
              {/* GOVERNANCE & ADMIN (/admin/*) */}
              {/* ============================================================ */}
              <Route
                path="/admin/accounts"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminAccountsRoute />
                  </ProtectedRoute>
                }
              />
              {/* Decommissioned Dynamic Branding Route Redirect */}
              <Route path="/admin/branding" element={<Navigate to="/admin/accounts" replace />} />
              <Route
                path="/admin/audit-ledger"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminAuditLedgerRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rbac"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminRbacRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminComplianceRoute />
                  </ProtectedRoute>
                }
              />

              {/* Legacy Admin Route Redirect */}
              <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />

              {/* ============================================================ */}
              {/* BILLING & REPORTS */}
              {/* ============================================================ */}
              <Route
                path="/philhealth"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "staff"]}>
                    <PhilHealthRoute />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["doctor", "nurse", "staff"]}>
                    <ReportsRoute />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </OpdDataProvider>
      </AuthProvider>
    </HashRouter>
  );
}
