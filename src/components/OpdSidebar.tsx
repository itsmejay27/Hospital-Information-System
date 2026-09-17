import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Role } from "../types";
import { useAuth } from "../context/AuthContext";
import { useOpdData } from "../context/OpdDataContext";
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
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: number | string;
  roles?: Role[];
  group: "clinical" | "registration" | "billing" | "management";
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
  const { user: authUser } = useAuth();
  const { waitingCount } = useOpdData();

  const user = propsUser || authUser;
  const liveWaiting = propsQueueCount !== undefined ? propsQueueCount : waitingCount;

  // Track expanded parent sections
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    clinical: true,
    registration: true,
    admin: true,
  });

  const navItems: NavItem[] = [
    // --- Clinical Care ---
    {
      id: "dashboard",
      path: "/dashboard",
      label: "OPD Dashboard",
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
      path: "/clinical/doctor-workbench",
      label: "Clinical Care",
      icon: Stethoscope,
      roles: ["doctor", "nurse"],
      group: "clinical",
      subItems: [
        { id: "doctor-workbench", label: "Doctor Workbench", path: "/clinical/doctor-workbench" },
        { id: "vitals-bmi", label: "Vitals & BMI Assessment", path: "/clinical/vitals-bmi" },
        { id: "prescriptions", label: "e-Prescriptions & Rx", path: "/prescriptions" },
        { id: "diagnostics", label: "Labs & Diagnostics", path: "/diagnostics" },
      ],
    },

    // --- Patient Registration ---
    {
      id: "registration-group",
      path: "/registration/new-patient",
      label: "Patient Registration",
      icon: UserPlus,
      roles: ["staff", "nurse"],
      group: "registration",
      subItems: [
        { id: "new-patient", label: "Patient Registration & Intake", path: "/registration/new-patient" },
        { id: "beds", label: "Inpatient Bed Allocation", path: "/registration/beds" },
        { id: "directory", label: "Master Patient Directory", path: "/registration/directory" },
        { id: "visitors", label: "Front Desk Visitor Log", path: "/registration/visitors" },
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

    // --- Governance & Admin ---
    {
      id: "admin-group",
      path: "/admin/accounts",
      label: "Governance & Admin",
      icon: ShieldCheck,
      roles: ["admin"],
      group: "management",
      subItems: [
        { id: "accounts", label: "Account Directory & Roles", path: "/admin/accounts" },
        { id: "audit-ledger", label: "Cryptographic Audit Ledger", path: "/admin/audit-ledger" },
        { id: "rbac", label: "RBAC Permissions Matrix", path: "/admin/rbac" },
        { id: "compliance", label: "Security & NPC Guidelines", path: "/admin/compliance" },
      ],
    },
  ];

  const currentRole = user?.role;
  const isItemVisible = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return currentRole ? item.roles.includes(currentRole) : false;
  };

  const clinicalItems = navItems.filter(i => i.group === "clinical" && isItemVisible(i));
  const registrationItems = navItems.filter(i => i.group === "registration" && isItemVisible(i));
  const billingItems = navItems.filter(i => i.group === "billing" && isItemVisible(i));
  const managementItems = navItems.filter(i => i.group === "management" && isItemVisible(i));

  // Auto-expand group if current route is inside it
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems) {
        const matches = item.subItems.some(sub => location.pathname === sub.path);
        if (matches) {
          setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const isItemActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (location.pathname === "/" && item.path === "/dashboard") return true;
    if (item.subItems?.some(s => location.pathname === s.path)) return true;
    return false;
  };

  const isSubItemActive = (sub: SubNavItem) => {
    return location.pathname === sub.path;
  };

  const toggleExpand = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
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
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.id} className="space-y-1">
        <div
          onClick={() => handleNavClick(item)}
          title={collapsed ? item.label : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer select-none ${
            isActive && !hasSubItems
              ? "bg-teal-600 text-white shadow-xs font-semibold"
              : isActive && hasSubItems
              ? "bg-slate-800 text-teal-300 font-semibold"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
          } ${collapsed ? "justify-center px-0" : ""}`}
        >
          <Icon
            size={18}
            strokeWidth={2}
            className={isActive ? (hasSubItems ? "text-teal-400 shrink-0" : "text-white shrink-0") : "text-slate-400 shrink-0"}
          />
          {!collapsed && (
            <span className="truncate flex-1 text-left">{item.label}</span>
          )}
          {!collapsed && item.badge && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              }`}
            >
              {item.badge}
            </span>
          )}
          {!collapsed && hasSubItems && (
            <button
              onClick={(e) => toggleExpand(item.id, e)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>

        {/* Embedded Sub-menu Dedicated Direct Links */}
        {!collapsed && hasSubItems && isExpanded && (
          <div className="ml-3 pl-3 border-l border-slate-800 space-y-1 py-1">
            {item.subItems!.map(sub => {
              const subActive = isSubItemActive(sub);
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubItemClick(sub)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    subActive
                      ? "bg-teal-500/20 text-teal-300 font-bold border-l-2 border-teal-400 pl-2 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${subActive ? "bg-teal-400" : "bg-slate-600"}`} />
                  <span className="truncate text-left">{sub.label}</span>
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
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-200 z-30 select-none ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-950/40">
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 overflow-hidden cursor-pointer group"
        >
          <img
            src="/carepoint-logo.png"
            alt="CarePoint Medical Center"
            className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight group-hover:text-teal-300 transition-colors">
                CarePoint Medical
              </h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wide uppercase truncate">
                Hospital System (HIS)
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-3 scrollbar-thin">
        {/* Clinical Care Section */}
        {clinicalItems.length > 0 && (
          <div>
            {!collapsed && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Clinical Care
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
            {!collapsed && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
            {!collapsed && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
            {!collapsed && (
              <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Governance & Admin
              </div>
            )}
            <div className="space-y-1">
              {managementItems.map(item => renderNavItem(item))}
            </div>
          </div>
        )}

        {/* Public Website Shortcut */}
        <div className="pt-3 border-t border-slate-800/80 mt-3">
          <button
            onClick={() => navigate("/")}
            title={collapsed ? "Public Hospital Site" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-teal-300 hover:bg-slate-800/60 transition-colors cursor-pointer ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <Building2 size={18} strokeWidth={1.75} className="shrink-0 text-slate-400" />
            {!collapsed && <span className="truncate flex-1 text-left">Public Hospital Site</span>}
          </button>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.avatarInitials || "ST"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {user?.name || "Clinician Session"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-teal-400 uppercase font-medium">
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
          <div
            className="w-8 h-8 mx-auto rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center cursor-default"
            title={`${user?.name || "Clinician"} (${user?.role || "Staff"})`}
          >
            {user?.avatarInitials || "ST"}
          </div>
        )}
      </div>
    </aside>
  );
}
