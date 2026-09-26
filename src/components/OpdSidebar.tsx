import React, { useState, useEffect } from "react";
import StaffAvatar from "./StaffAvatar";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Role } from "../types";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
import { useWardData } from "../context/WardDataContext";
import { DUTY_SHIFT_HOURS } from "../types";
import { todayIso } from "../views/nursing/helpers";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  Activity,
  Pill,
  FlaskConical,
  CreditCard,
  Send,
  PieChart,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Bed,
  Lock,
  KeyRound,
  FileText,
  Settings,
  Rocket,
  LogOut,
  ClipboardList,
  Clock,
} from "./Icons";

interface OpdSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: User | null;
  queueCount?: number;
}

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  roles?: Role[];
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: number | string;
  roles?: Role[];
  group: "clinical" | "registration" | "billing" | "management" | "general";
  subItems?: SubNavItem[];
}

export default function OpdSidebar({
  collapsed,
  onToggleCollapse,
  currentUser: propsUser,
  queueCount: propsQueueCount,
}: OpdSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, logout } = useAuth();
  const { waitingCount } = useOpdData();
  const { shiftSchedules } = useWardData();

  const user = propsUser || authUser;
  const liveWaiting = propsQueueCount !== undefined ? propsQueueCount : waitingCount;

  // Auto-collapsible hover expansion state
  const [isHovered, setIsHovered] = useState(false);
  const showFullSidebar = isHovered || !collapsed;

  // Track expanded parent sections
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    clinical: true,
    registration: true,
    admin: true,
  });

  const currentRole = user?.role;
  const today = todayIso();
  const myShiftsToday = shiftSchedules.filter(s => s.userId === user?.id && s.date === today);

  const navItems: NavItem[] = [
    // --- Core Workstation ---
    {
      id: "dashboard",
      path: "/dashboard",
      label: currentRole === "admin" ? "System Console" : "OPD Dashboard",
      icon: LayoutDashboard,
      roles: ["doctor", "nurse", "staff", "admin"],
      group: "clinical",
    },
    {
      id: "queue",
      path: "/queue",
      label: "Patient Live Queue",
      icon: Users,
      badge: liveWaiting > 0 ? liveWaiting : undefined,
      roles: ["doctor", "nurse", "staff"],
      group: "clinical",
    },
    {
      id: "clinical-group",
      path: "/clinical",
      label: "Clinical Care",
      icon: Stethoscope,
      roles: ["doctor"],
      group: "clinical",
      subItems: [
        { id: "doctor-workbench", label: "Doctor Workbench", path: "/clinical?tab=workbench", roles: ["doctor"] },
        { id: "prescriptions", label: "e-Prescriptions & Rx", path: "/clinical?tab=prescriptions", roles: ["doctor"] },
        { id: "diagnostics", label: "Labs & Diagnostics", path: "/clinical?tab=labs", roles: ["doctor"] },
        { id: "vitals-bmi", label: "Vitals & BMI Assessment", path: "/clinical?tab=vitals", roles: ["doctor", "nurse"] },
      ],
    },
    {
      id: "nursing-station",
      path: "/nursing",
      label: "Nursing Station",
      icon: ClipboardList,
      roles: ["doctor", "nurse"],
      group: "clinical",
      subItems: [
        { id: "ns-vitals", label: "Vitals & BMI", path: "/clinical?tab=vitals", roles: ["nurse"] },
        { id: "ns-complaint-top", label: "Chief Complaint", path: "/nursing?tab=complaint", roles: ["nurse"] },
        { id: "ns-careplan", label: "Care Plan (ADPIE)", path: "/nursing?tab=careplan", roles: ["doctor", "nurse"] },
        { id: "ns-orders", label: "Doctor's Orders", path: "/nursing?tab=orders", roles: ["doctor", "nurse"] },
        { id: "ns-notes", label: "Nurses' Notes", path: "/nursing?tab=notes", roles: ["doctor", "nurse"] },
        { id: "ns-labs", label: "Laboratory", path: "/nursing?tab=labs", roles: ["doctor", "nurse"] },
        { id: "ns-endorsement", label: "Shift Endorsement", path: "/nursing?tab=endorsement", roles: ["doctor", "nurse"] },
        { id: "ns-complaint", label: "Chief Complaint", path: "/nursing?tab=complaint", roles: ["doctor"] },
      ],
    },
    {
      id: "nurse-beds",
      path: "/registration/beds",
      label: "Ward Bed Allocation",
      icon: Bed,
      roles: ["nurse"],
      group: "clinical",
    },

    // --- Patient Registration (Staff Only) ---
    {
      id: "registration-group",
      path: "/registration/new-patient",
      label: "Patient Registration",
      icon: UserPlus,
      roles: ["staff"],
      group: "registration",
      subItems: [
        { id: "new-patient", label: "Patient Registration & Intake", path: "/registration/new-patient", roles: ["staff"] },
        { id: "beds", label: "Inpatient Bed Allocation", path: "/registration/beds", roles: ["staff"] },
        { id: "directory", label: "Master Patient Directory", path: "/registration/directory", roles: ["staff"] },
        { id: "visitors", label: "Front Desk Visitor Log", path: "/registration/visitors", roles: ["staff"] },
      ],
    },

    // --- Billing & Discharges ---
    {
      id: "philhealth",
      path: "/philhealth",
      label: "PhilHealth & eClaims",
      icon: CreditCard,
      badge: "eClaims",
      roles: ["doctor", "staff"],
      group: "billing",
    },
    {
      id: "reports",
      path: "/reports",
      label: "Census & OPD Reports",
      icon: PieChart,
      roles: ["doctor", "nurse", "staff"],
      group: "billing",
    },

    // --- Workforce & Help (Everyone) ---
    {
      id: "shifts",
      path: "/shifts",
      label: "Duty Shifts",
      icon: Clock,
      roles: ["doctor", "nurse", "staff", "admin"],
      group: "general",
    },
    {
      id: "flowchart",
      path: "/flowchart",
      label: "System Flowchart",
      icon: Activity,
      roles: ["doctor", "nurse", "staff", "admin"],
      group: "general",
    },

    // --- Governance & Admin (Admin Only) ---
    {
      id: "admin-group",
      path: "/admin/accounts",
      label: "Governance & Admin",
      icon: ShieldCheck,
      roles: ["admin"],
      group: "management",
      subItems: [
        { id: "accounts", label: "Account Directory & Roles", path: "/admin/accounts", roles: ["admin"] },
        { id: "audit-ledger", label: "Cryptographic Audit Ledger", path: "/admin/audit-ledger", roles: ["admin"] },
        { id: "rbac", label: "RBAC Permissions Matrix", path: "/admin/rbac", roles: ["admin"] },
        { id: "compliance", label: "Security & NPC Guidelines", path: "/admin/compliance", roles: ["admin"] },
      ],
    },
  ];

  const isItemVisible = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return currentRole ? item.roles.includes(currentRole) : false;
  };

  const clinicalItems = navItems.filter(i => i.group === "clinical" && isItemVisible(i));
  const registrationItems = navItems.filter(i => i.group === "registration" && isItemVisible(i));
  const billingItems = navItems.filter(i => i.group === "billing" && isItemVisible(i));
  const managementItems = navItems.filter(i => i.group === "management" && isItemVisible(i));
  const generalItems = navItems.filter(i => i.group === "general" && isItemVisible(i));

  // Auto-expand group if current route is inside it
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems) {
        const matches = item.subItems.some(sub => {
          const basePath = sub.path.split("?")[0];
          return location.pathname === basePath;
        });
        if (matches) {
          setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const isItemActive = (item: NavItem) => {
    const currentBase = location.pathname;
    if (currentBase === item.path) return true;
    if (currentBase === "/" && item.path === "/dashboard") return true;
    if (
      item.subItems?.some(
        s => currentBase === s.path.split("?")[0] && (!s.roles || (currentRole && s.roles.includes(currentRole)))
      )
    )
      return true;
    return false;
  };

  const isSubItemActive = (sub: SubNavItem) => {
    const currentFull = location.pathname + location.search;
    if (sub.path.includes("?")) {
      if (currentFull === sub.path) return true;
      if (location.pathname === "/clinical" && !location.search) {
        if (currentRole === "nurse" && sub.id === "vitals-bmi") return true;
        if (currentRole === "doctor" && sub.id === "doctor-workbench") return true;
      }
      return false;
    }
    return location.pathname === sub.path;
  };

  const toggleExpand = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === "clinical-group") {
      const defaultTab = currentRole === "nurse" ? "/clinical?tab=vitals" : "/clinical?tab=workbench";
      navigate(defaultTab);
    } else {
      navigate(item.path);
    }
    if (item.subItems) {
      setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
    }
  };

  const handleSubItemClick = (sub: SubNavItem) => {
    navigate(sub.path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = expandedMenus[item.id];
    const visibleSubItems =
      item.subItems?.filter(s => !s.roles || (currentRole && s.roles.includes(currentRole))) || [];
    const hasSubItems = visibleSubItems.length > 0;

    return (
      <div key={item.id} className="space-y-1">
        <div
          onClick={() => handleNavClick(item)}
          title={!showFullSidebar ? item.label : undefined}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
            isActive && !hasSubItems
              ? "bg-white text-emerald-950 shadow-md shadow-black/20"
              : isActive && hasSubItems
              ? "bg-slate-800 text-emerald-300 font-bold"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
          } ${!showFullSidebar ? "justify-center px-0" : ""}`}
        >
          <Icon
            size={18}
            strokeWidth={2.2}
            className={
              isActive
                ? hasSubItems
                  ? "text-emerald-400 shrink-0"
                  : "text-emerald-600 shrink-0"
                : "text-slate-400 shrink-0 group-hover:text-white"
            }
          />
          {showFullSidebar && (
            <span className="truncate flex-1 text-left whitespace-nowrap">{item.label}</span>
          )}
          {showFullSidebar && item.badge && (
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-xs ${
                typeof item.badge === "number" || item.badge === "10"
                  ? "bg-amber-500 text-slate-950"
                  : isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {item.badge}
            </span>
          )}
          {showFullSidebar && hasSubItems && (
            <button
              onClick={(e) => toggleExpand(item.id, e)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>

        {/* Embedded Sub-menu Dedicated Direct Links */}
        {showFullSidebar && hasSubItems && isExpanded && (
          <div className="ml-4 pl-3 border-l border-slate-800/80 space-y-1 py-1">
            {visibleSubItems.map(sub => {
              const subActive = isSubItemActive(sub);
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubItemClick(sub)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                    subActive
                      ? "bg-white text-emerald-950 font-bold shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subActive ? "bg-emerald-600" : "bg-slate-600"}`} />
                  <span className="truncate text-left whitespace-nowrap">{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex flex-col bg-[#0B0F17] border-r border-slate-800/80 text-slate-300 transition-all duration-300 ease-in-out z-30 select-none overflow-hidden ${
        !showFullSidebar ? "w-[68px]" : "w-64 shadow-2xl"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-[#070A0F] shrink-0">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 overflow-hidden cursor-pointer group"
        >
          <img
            src="/carepoint-logo.png"
            alt="CarePoint Medical Center"
            className="w-9 h-9 rounded-xl bg-white p-0.5 object-contain shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          />
          {showFullSidebar && (
            <div className="min-w-0 flex-1 whitespace-nowrap">
              <h1 className="text-base font-bold text-white tracking-tight truncate leading-tight group-hover:text-emerald-400 transition-colors">
                CarePoint
              </h1>
              <p className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase truncate">
                Medical Center
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title={!showFullSidebar ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!showFullSidebar ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronLeft size={15} strokeWidth={2} />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-3 scrollbar-thin">
        {/* Clinical Care Section */}
        {clinicalItems.length > 0 && (
          <div>
            {showFullSidebar && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                {currentRole === "admin" ? "System Console" : currentRole === "nurse" ? "Nursing Care" : currentRole === "staff" ? "Outpatient Frontline" : "Clinical Care"}
              </div>
            )}
            <div className="space-y-1">
              {clinicalItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Patient Registration Section */}
        {registrationItems.length > 0 && (
          <div className="pt-2">
            {showFullSidebar && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Patient Registration
              </div>
            )}
            <div className="space-y-1">
              {registrationItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Billing & Census Section */}
        {billingItems.length > 0 && (
          <div className="pt-2">
            {showFullSidebar && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Billing & Discharges
              </div>
            )}
            <div className="space-y-1">
              {billingItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Governance & Admin Section */}
        {managementItems.length > 0 && (
          <div className="pt-2">
            {showFullSidebar && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Governance & Admin
              </div>
            )}
            <div className="space-y-1">
              {managementItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Workforce & Help Section */}
        {generalItems.length > 0 && (
          <div className="pt-2">
            {showFullSidebar && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Workforce & Help
              </div>
            )}
            <div className="space-y-1">
              {generalItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Bottom Shift Status Card (Medzone Inspired) */}
        {showFullSidebar ? (
          <div className="mt-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-teal-900/90 via-emerald-950 to-[#02211B] border border-emerald-700/40 text-center shadow-lg relative overflow-hidden group">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform">
                <Clock size={20} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                {myShiftsToday.length > 0 ? `My Shift Today: ${myShiftsToday.map(s => s.shift).join(", ")}` : "No Shift Today"}
              </p>
              <p className="text-[10px] text-emerald-300/80 mt-0.5 mb-2.5">
                {myShiftsToday.length > 0
                  ? myShiftsToday.map(s => `${DUTY_SHIFT_HOURS[s.shift]} • ${s.area}`).join(" / ")
                  : "You are off duty today"}
              </p>
              <button
                onClick={() => navigate("/shifts")}
                className="w-full py-1.5 px-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] shadow-sm transition-all cursor-pointer hover:shadow-md"
              >
                View Duty Shifts
              </button>
            </div>
          </div>
        ) : (
          <div className="my-2 flex justify-center">
            <button
              onClick={() => navigate("/shifts")}
              title="Duty Shifts"
              className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center cursor-pointer transition-all"
            >
              <Clock size={17} />
            </button>
          </div>
        )}

        {/* Settings & Sign Out Actions */}
        <div className="pt-2 border-t border-slate-800/80 mt-2 space-y-0.5">
          <button
            onClick={() => navigate("/settings")}
            title={!showFullSidebar ? "Settings" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              location.pathname === "/settings"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            } ${!showFullSidebar ? "justify-center px-0" : ""}`}
          >
            <Settings size={18} strokeWidth={1.8} className={`shrink-0 ${location.pathname === "/settings" ? "text-white" : "text-slate-400"}`} />
            {showFullSidebar && <span className="truncate flex-1 text-left whitespace-nowrap">Settings</span>}
          </button>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            title={!showFullSidebar ? "Log Out" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer ${
              !showFullSidebar ? "justify-center px-0" : ""
            }`}
          >
            <LogOut size={18} strokeWidth={1.8} className="shrink-0 text-slate-400 hover:text-rose-400" />
            {showFullSidebar && <span className="truncate flex-1 text-left whitespace-nowrap">Log Out</span>}
          </button>

          <button
            onClick={() => navigate("/")}
            title={!showFullSidebar ? "Public Hospital Site" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-teal-300 hover:bg-slate-800/60 transition-colors cursor-pointer ${
              !showFullSidebar ? "justify-center px-0" : ""
            }`}
          >
            <Building2 size={18} strokeWidth={1.75} className="shrink-0 text-slate-400" />
            {showFullSidebar && <span className="truncate flex-1 text-left whitespace-nowrap">Public Hospital Site</span>}
          </button>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070A0F] shrink-0">
        {showFullSidebar ? (
          <div className="flex items-center gap-2.5">
            <StaffAvatar user={user} size={32} />
            <div className="min-w-0 flex-1 whitespace-nowrap">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || "Clinician Session"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">
                  {user?.role || "Staff"}
                </span>
                {user?.licenseNumber && (
                  <span className="text-[9px] text-slate-400 font-mono truncate">
                    • {user.licenseNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${user?.name || "Clinician"} (${user?.role || "Staff"})`}>
            <StaffAvatar user={user} size={32} />
          </div>
        )}
      </div>
    </aside>
  );
}
