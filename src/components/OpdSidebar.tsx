import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { OpdTab, User } from "../types";
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
} from "./Icons";

interface OpdSidebarProps {
  currentTab?: OpdTab;
  onSelectTab?: (tab: OpdTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: User | null;
  queueCount?: number;
}

interface NavItem {
  id: OpdTab;
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: number | string;
  roles?: string[];
  group: "clinical" | "billing" | "management";
}

export default function OpdSidebar({
  currentTab,
  onSelectTab,
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

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "OPD Dashboard",
      shortLabel: "Dashboard",
      icon: LayoutDashboard,
      group: "clinical",
    },
    {
      id: "queue",
      path: "/queue",
      label: "Patient Live Queue",
      shortLabel: "Queue",
      icon: Users,
      badge: liveWaiting > 0 ? liveWaiting : undefined,
      group: "clinical",
    },
    {
      id: "registration",
      path: "/registration",
      label: "Patient Registration",
      shortLabel: "Register",
      icon: UserPlus,
      group: "clinical",
    },
    {
      id: "workbench",
      path: "/workbench",
      label: "Doctor Workbench",
      shortLabel: "Workbench",
      icon: Stethoscope,
      group: "clinical",
    },
    {
      id: "vitals",
      path: "/vitals",
      label: "Vitals & BMI Assessment",
      shortLabel: "Vitals",
      icon: Activity,
      group: "clinical",
    },
    {
      id: "prescriptions",
      path: "/prescriptions",
      label: "e-Prescriptions & Rx",
      shortLabel: "Prescriptions",
      icon: Pill,
      group: "clinical",
    },
    {
      id: "diagnostics",
      path: "/diagnostics",
      label: "Labs & Diagnostic Results",
      shortLabel: "Diagnostics",
      icon: FlaskConical,
      group: "clinical",
    },
    {
      id: "philhealth",
      path: "/philhealth",
      label: "PhilHealth & eClaims",
      shortLabel: "PhilHealth",
      icon: CreditCard,
      badge: "eClaims",
      group: "billing",
    },
    {
      id: "referrals",
      path: "/referrals",
      label: "Referrals & Discharge",
      shortLabel: "Referrals",
      icon: Send,
      group: "billing",
    },
    {
      id: "reports",
      path: "/reports",
      label: "Census & OPD Reports",
      shortLabel: "Reports",
      icon: PieChart,
      group: "management",
    },
    {
      id: "admin",
      path: "/admin",
      label: "Admin & Security Audit",
      shortLabel: "Admin",
      icon: ShieldCheck,
      group: "management",
    },
  ];

  const isItemActive = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (location.pathname === "/" && item.path === "/dashboard") return true;
    if (currentTab && currentTab === item.id) return true;
    return false;
  };

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
    if (onSelectTab) {
      onSelectTab(item.id);
    }
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
          <div className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400 font-bold text-base shadow-inner group-hover:scale-105 transition-transform">
            CC
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight group-hover:text-teal-300 transition-colors">
                CityCare General
              </h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wide uppercase truncate">
                Outpatient Dept (OPD)
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {!collapsed && (
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Care
          </div>
        )}

        {navItems
          .filter(i => i.group === "clinical")
          .map(item => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal-600 text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={isActive ? "text-white shrink-0" : "text-slate-400 shrink-0"}
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
              </button>
            );
          })}

        <div className="pt-2">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Billing & Discharges
            </div>
          )}
          {navItems
            .filter(i => i.group === "billing")
            .map(item => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-600 text-white shadow-xs font-semibold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={isActive ? "text-white shrink-0" : "text-slate-400 shrink-0"}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        <div className="pt-2">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance & Admin
            </div>
          )}
          {navItems
            .filter(i => i.group === "management")
            .map(item => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-teal-600 text-white shadow-xs font-semibold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className={isActive ? "text-white shrink-0" : "text-slate-400 shrink-0"}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
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
