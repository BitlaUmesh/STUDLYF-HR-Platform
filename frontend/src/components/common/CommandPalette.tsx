import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, FileText, CalendarClock, KanbanSquare, 
  Settings, Trophy, Plus, X, ArrowRight, Command
} from 'lucide-react';
import { studentsApi, type StudentSearchResult } from '../../api/students';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const navigate = useNavigate();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search candidates on query change
  useEffect(() => {
    if (!isOpen) return;
    studentsApi.search(query)
      .then((res) => setStudents(res.data.results.slice(0, 5)))
      .catch(console.error);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const navActions = [
    { label: 'Create New Offer Letter', path: '/documents/new', icon: Plus, badge: 'Letter Builder' },
    { label: 'Candidate Pipeline Board', path: '/pipeline', icon: KanbanSquare, badge: 'Pipeline' },
    { label: 'Talent Search Directory', path: '/students', icon: Users, badge: 'Talent' },
    { label: 'Leaderboard Rankings', path: '/leaderboard', icon: Trophy, badge: 'Leaderboard' },
    { label: 'Meetings & Interviews', path: '/meetings', icon: CalendarClock, badge: 'Meetings' },
    { label: 'Letters & Offer History', path: '/documents', icon: FileText, badge: 'Documents' },
    { label: 'Settings & Branding', path: '/settings', icon: Settings, badge: 'Settings' },
  ];

  const filteredNav = navActions.filter((a) => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.badge.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 backdrop-blur-xs p-4">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or candidate name..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            ESC
          </kbd>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 sm:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {/* Candidates Match Section */}
          {students.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidates</p>
              <div className="space-y-1">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleSelect(`/students/${student.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 hover:text-indigo-900 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          student.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">{student.name}</p>
                        <p className="text-[11px] font-medium text-slate-500">{student.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile <ArrowRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Navigation Section */}
          <div>
            <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
            <div className="space-y-1">
              {filteredNav.map(({ label, path, icon: Icon, badge }) => (
                <button
                  key={path}
                  onClick={() => handleSelect(path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                    {badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Command size={12} /> Press <kbd className="font-semibold text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-200">⌘K</kbd> anywhere to open
          </span>
          <span>STUDLYF HR Platform</span>
        </div>
      </div>
    </div>
  );
}
