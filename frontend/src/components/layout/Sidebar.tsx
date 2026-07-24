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
    <aside className="flex h-full w-64 shrink-0 flex-col bg-white text-slate-800 border-r border-slate-200/90 shadow-2xs">
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200/90 p-1.5 shadow-md shrink-0 hover:scale-105 transition-transform">
          <img src="/logo-s.png" alt="StudLyf Logo" className="h-full w-full object-contain filter drop-shadow-sm" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <img src="/studlyf-logo.png" alt="STUDLYF" className="h-7 w-auto object-contain object-left" />
          <p className="mt-0.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
            {user?.companyName ? `${user.companyName}` : 'HR Platform'}
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ff2a5f] to-[#c026d3] text-white shadow-md shadow-pink-500/20 scale-[1.01]'
                        : 'text-slate-600 hover:bg-pink-50/60 hover:text-[#d946ef]'
                    }`
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/40">
        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 ${
              isActive
                ? 'bg-gradient-to-r from-[#ff2a5f] to-[#c026d3] text-white shadow-md shadow-pink-500/20'
                : 'text-slate-600 hover:bg-pink-50/60 hover:text-[#d946ef]'
            }`
          }
        >
          <Settings size={17} className="shrink-0" />
          <span>Settings & Branding</span>
          {!hasPhoto && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-500">
              <span className="pulse-dot" />
            </span>
          )}
        </NavLink>

        {/* User card */}
        <div className="flex items-center gap-3 rounded-xl p-2.5 bg-white border border-slate-200/90 shadow-2xs mt-1">
          <Avatar
            src={user?.profilePhoto}
            name={user?.fullName}
            size="sm"
            showIndicator
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{user?.fullName || 'HR Administrator'}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium">{user?.email || 'hr@company.com'}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
