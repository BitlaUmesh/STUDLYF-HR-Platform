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
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../ui';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'TALENT',
    items: [
      { to: '/students', label: 'Talent Search', icon: Search },
      { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'WORKFLOW',
    items: [
      { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
      { to: '/documents', label: 'Letters & Offers', icon: FileText },
      { to: '/meetings', label: 'Meetings', icon: CalendarClock },
      { to: '/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const hasPhoto = Boolean(user?.profilePhoto);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[#0f172a] text-slate-300 border-r border-slate-800/80">
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white text-sm shadow-lg shrink-0">
          <Building2 size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white tracking-tight leading-none truncate">
            {user?.companyName || 'StudLyf HR'}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest truncate">
            Talent Management
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-600/90 text-white shadow-sm border-l-2 border-indigo-300/60'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border-l-2 border-transparent'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-slate-800/60 p-3 space-y-1.5">
        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-indigo-600/90 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
            }`
          }
        >
          <Settings size={16} className="shrink-0" />
          <span>Settings & Branding</span>
          {/* Profile incomplete indicator */}
          {!hasPhoto && (
            <span className="ml-auto">
              <span className="pulse-dot" />
            </span>
          )}
        </NavLink>

        {/* Profile incomplete banner */}
        {!hasPhoto && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2">
            <AlertCircle size={13} className="shrink-0 text-amber-400 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-300 leading-relaxed">
              Add a profile photo in{' '}
              <NavLink to="/settings" className="underline underline-offset-2 hover:text-amber-200">
                Settings
              </NavLink>
            </p>
          </div>
        )}

        {/* User card */}
        <div className="flex items-center gap-3 rounded-xl p-2.5 bg-slate-900/80 border border-slate-800/80 mt-2">
          <Avatar
            src={user?.profilePhoto}
            name={user?.fullName}
            size="sm"
            showIndicator
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-100">{user?.fullName || 'HR Administrator'}</p>
            <p className="truncate text-[10px] text-slate-500 font-medium">{user?.email || 'hr@company.com'}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
