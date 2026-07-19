import type { Application } from '../../api/applications';
import { Card } from '../ui';

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
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer p-3.5 hover:border-[var(--color-primary-vivid)] active:cursor-grabbing"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-tint)] text-xs font-semibold text-[var(--color-primary)]">
          {application.student.avatarUrl ? (
            <img src={application.student.avatarUrl} className="h-full w-full object-cover" />
          ) : (
            application.student.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-ink)]">{application.student.name}</p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">{application.student.email}</p>
        </div>
      </div>
      {application.student.skills?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {application.student.skills.slice(0, 3).map((s) => (
            <span key={s} className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
              {s}
            </span>
          ))}
        </div>
      )}
      {application.meeting && (
        <p className="mt-2.5 text-[11px] text-[var(--color-signal-questions)]">
          📅 Meeting {application.meeting.status}
        </p>
      )}
    </Card>
  );
}
