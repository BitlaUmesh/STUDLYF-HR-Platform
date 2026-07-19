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

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Talent Search', icon: Search },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/documents', label: 'Letters', icon: FileText },
  { to: '/meetings', label: 'Meetings', icon: CalendarClock },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-[var(--color-ink)] text-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-vivid)] font-display text-lg font-bold">
          S
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none">StudLyf HR</p>
          <p className="mt-1 text-xs text-white/40">Talent workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary-vivid)] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-[var(--color-primary-vivid)] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>

        <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
            {user?.fullName?.slice(0, 2) || '..'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.fullName || 'Loading…'}</p>
            <p className="truncate text-xs text-white/40">{user?.companyName}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
