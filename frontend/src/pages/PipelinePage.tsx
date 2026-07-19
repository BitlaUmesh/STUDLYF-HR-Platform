import { useEffect, useState } from 'react';
import { applicationsApi, APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus } from '../api/applications';
import { ApplicationCard } from '../components/pipeline/ApplicationCard';
import { ApplicationDetailPanel } from '../components/pipeline/ApplicationDetailPanel';
import { PageHeader } from '../components/ui';

const COLUMN_ACCENT: Record<ApplicationStatus, string> = {
  invited: 'var(--color-signal-invited)',
  reviewing: 'var(--color-signal-reviewing)',
  questions_sent: 'var(--color-signal-questions)',
  offered: 'var(--color-signal-offered)',
  rejected: 'var(--color-signal-rejected)',
};

export function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);

  function load() {
    applicationsApi.list().then(({ data }) => setApplications(data));
  }

  useEffect(load, []);

  async function moveApplication(id: string, status: ApplicationStatus) {
    // optimistic update
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await applicationsApi.updateStatus(id, status);
    } catch {
      load(); // revert on failure
    }
  }

  function handleDrop(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/application-id');
    if (id) moveApplication(id, status);
  }

  return (
    <div>
      <PageHeader
        title="Hiring Pipeline"
        subtitle="Drag candidates across stages, or click a card for full detail."
      />

      <div className="grid grid-cols-5 gap-4">
        {APPLICATION_STATUSES.map((status) => {
          const columnApps = applications.filter((a) => a.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex min-h-[60vh] flex-col rounded-xl border p-2.5 transition-colors ${
                dragOverStatus === status
                  ? 'border-[var(--color-primary-vivid)] bg-[var(--color-primary-tint)]'
                  : 'border-[var(--color-line)] bg-[var(--color-canvas)]'
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLUMN_ACCENT[status] }} />
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{STATUS_LABELS[status]}</p>
                </div>
                <span className="font-mono-data text-xs text-[var(--color-text-muted)]">{columnApps.length}</span>
              </div>

              <div className="flex-1 space-y-2.5">
                {columnApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onClick={() => setSelectedId(app.id)}
                    onDragStart={(e) => e.dataTransfer.setData('text/application-id', app.id)}
                  />
                ))}
                {columnApps.length === 0 && (
                  <p className="px-1 py-3 text-center text-xs text-[var(--color-text-muted)]">Drop here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedId && (
        <ApplicationDetailPanel
          applicationId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChanged={load}
        />
      )}
    </div>
  );
}
