import { useEffect, useState } from 'react';
import { CalendarClock, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { meetingsApi, type Meeting } from '../api/meetings';
import { Card, PageHeader, EmptyState, Button } from '../components/ui';

const STATUS_STYLE: Record<Meeting['status'], string> = {
  scheduled: 'text-[var(--color-signal-invited)] bg-[var(--color-canvas)]',
  confirmed: 'text-[var(--color-signal-questions)] bg-blue-50',
  completed: 'text-[var(--color-signal-offered)] bg-green-50',
  cancelled: 'text-[var(--color-signal-rejected)] bg-red-50',
};

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);

  function load() {
    meetingsApi.list().then(({ data }) => setMeetings(data));
  }

  useEffect(load, []);

  async function handleCancel(id: string) {
    await meetingsApi.cancel(id);
    load();
  }

  return (
    <div>
      <PageHeader title="Meetings" subtitle="Interviews scheduled through Calendly." />

      {meetings === null ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : meetings.length === 0 ? (
        <EmptyState title="No meetings scheduled" description="Schedule an interview from a candidate's pipeline card." />
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{m.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {m.application?.student.name || 'Candidate'} · {m.scheduledAt ? format(new Date(m.scheduledAt), 'PPp') : 'Awaiting booking'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                {m.calendlyEventUrl && (
                  <a href={m.calendlyEventUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary-vivid)] hover:underline">
                    <ExternalLink size={15} />
                  </a>
                )}
                {m.status !== 'cancelled' && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(m.id)}>
                    <X size={14} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
