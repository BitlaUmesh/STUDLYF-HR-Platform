import type { Application } from '../../api/applications';
import { Calendar, Mail, ChevronRight } from 'lucide-react';

export function ApplicationCard({
  application,
  onClick,
  onDragStart,
}: {
  application: Application;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const initials = application.student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group relative cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-xs font-bold text-primary ring-2 ring-white shadow-xs">
            {application.student.avatarUrl ? (
              <img src={application.student.avatarUrl} alt={application.student.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
              {application.student.name}
            </h4>
            <p className="truncate text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
              <Mail size={12} className="shrink-0 text-slate-400" />
              <span className="truncate">{application.student.email}</span>
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>

      {application.student.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
          {application.student.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
            >
              {skill}
            </span>
          ))}
          {application.student.skills.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center font-medium">
              +{application.student.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {application.meeting && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700">
          <Calendar size={12} className="text-indigo-500 shrink-0" />
          <span className="truncate">Meeting: {application.meeting.status}</span>
        </div>
      )}
    </div>
  );
}
