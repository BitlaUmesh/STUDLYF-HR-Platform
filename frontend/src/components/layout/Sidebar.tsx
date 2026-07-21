import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  KanbanSquare,
  FileText,
  CalendarClock,
  MessageSquare,
  Trophy,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Talent Search', icon: Search },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/documents', label: 'Letters & Offers', icon: FileText },
  { to: '/meetings', label: 'Meetings', icon: CalendarClock },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0f172a] text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-semibold text-white text-sm shadow-xs shrink-0">
          <Building2 size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white tracking-tight leading-none truncate">
            {user?.companyName || 'StudLyf HR'}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-400 truncate">Talent Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer & User Profile */}
      <div className="border-t border-slate-800/80 p-3 space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
            }`
          }
        >
          <Settings size={17} className="shrink-0" />
          <span>Settings & Branding</span>
        </NavLink>

        <div className="flex items-center gap-3 rounded-lg p-2 bg-slate-900 border border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-200 uppercase shrink-0">
            {user?.fullName?.slice(0, 2) || 'HR'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-100">{user?.fullName || 'HR Administrator'}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium">{user?.email || 'hr@company.com'}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
