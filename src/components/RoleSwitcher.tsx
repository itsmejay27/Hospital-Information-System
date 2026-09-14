import { User, Role } from "../types";
import { DEMO_USERS } from "../mockData";
import { Stethoscope, Syringe, ClipboardList, ShieldCheck, LogOut, User as UserIcon } from "./Icons";

interface RoleSwitcherProps {
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
  onSignOut: () => void;
}

export default function RoleSwitcher({ currentUser, onSwitchUser, onSignOut }: RoleSwitcherProps) {
  const accounts = Object.values(DEMO_USERS).map(u => u.user);

  const renderRoleIcon = (role: Role, size = 16) => {
    switch (role) {
      case "doctor":
        return <Stethoscope size={size} strokeWidth={2} className="text-slate-400" />;
      case "nurse":
        return <Syringe size={size} strokeWidth={2} className="text-slate-400" />;
      case "staff":
        return <ClipboardList size={size} strokeWidth={2} className="text-slate-400" />;
      case "admin":
        return <ShieldCheck size={size} strokeWidth={2} className="text-slate-400" />;
      default:
        return <UserIcon size={size} strokeWidth={2} className="text-slate-400" />;
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "doctor":
        return "bg-blue-950 text-blue-300 border-blue-800";
      case "nurse":
        return "bg-purple-950 text-purple-300 border-purple-800";
      case "staff":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      case "admin":
        return "bg-amber-950 text-amber-300 border-amber-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 tracking-wider">
            STAFF SESSIONS
          </span>
          <span className="text-slate-400 hidden sm:inline">Active Staff:</span>
          {currentUser ? (
            <span className="font-medium text-white flex items-center gap-1.5 flex-wrap">
              <span>{currentUser.name}</span>
              {currentUser.licenseNumber && (
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {currentUser.licenseNumber}
                </span>
              )}
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border inline-flex items-center gap-1 ${getRoleBadgeStyle(currentUser.role)}`}>
                {renderRoleIcon(currentUser.role, 12)}
                <span>{currentUser.role.toUpperCase()}</span>
              </span>
            </span>
          ) : (
            <span className="text-slate-400 italic">Not logged in</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] hidden md:inline mr-1">Switch Role:</span>
          {accounts.map(acc => {
            const isCurrent = currentUser?.id === acc.id;

            return (
              <button
                key={acc.id}
                onClick={() => onSwitchUser(acc)}
                type="button"
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-cyan-600 text-white font-bold ring-1 ring-cyan-400 shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
                title={`Switch session to ${acc.name} (${acc.role}) - ${acc.licenseNumber || ""}`}
              >
                {renderRoleIcon(acc.role, 13)}
                <span className="truncate max-w-[120px]">{acc.name.split(" ")[0]} ({acc.role})</span>
              </button>
            );
          })}
          {currentUser && (
            <button
              onClick={onSignOut}
              type="button"
              className="ml-1 text-slate-400 hover:text-rose-400 px-2 py-1 rounded text-[11px] hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut size={14} strokeWidth={2} className="text-slate-400 hover:text-rose-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
