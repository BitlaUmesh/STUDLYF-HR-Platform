import type { Application } from '../../api/applications';
import { Calendar, Mail, ChevronRight } from 'lucide-react';
import { Avatar, Badge } from '../ui';

export function ApplicationCard({
  application,
  onClick,
  onDragStart,
}: {
  application: Application;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group relative cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={application.student.avatarUrl} name={application.student.name} size="sm" />
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {application.student.name}
            </h4>
            <p className="truncate text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
              <Mail size={11} className="shrink-0 text-slate-400" />
              <span className="truncate">{application.student.email}</span>
            </p>
          </div>
        </div>
        <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {application.student.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-100">
          {application.student.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} color="indigo" className="text-[10px] font-medium">
              {skill}
            </Badge>
          ))}
          {application.student.skills.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center font-bold">
              +{application.student.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {application.meeting && (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
          <Calendar size={12} className="text-indigo-500 shrink-0" />
          <span className="truncate">Meeting: {application.meeting.status}</span>
        </div>
      )}
    </div>
  );
}
