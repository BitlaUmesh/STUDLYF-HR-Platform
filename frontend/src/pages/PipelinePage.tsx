import { useEffect, useState } from 'react';
import { Search, Users, RefreshCw } from 'lucide-react';
import { applicationsApi, APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus } from '../api/applications';
import { ApplicationCard } from '../components/pipeline/ApplicationCard';
import { ApplicationDetailPanel } from '../components/pipeline/ApplicationDetailPanel';

const COLUMN_COLORS: Record<ApplicationStatus, { dot: string; bg: string; badge: string }> = {
  invited: { dot: 'bg-slate-400', bg: 'bg-slate-500/10', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  reviewing: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  questions_sent: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  offered: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { dot: 'bg-rose-500', bg: 'bg-rose-500/10', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    applicationsApi.list()
      .then(({ data }) => setApplications(data))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function moveApplication(id: string, status: ApplicationStatus) {
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await applicationsApi.updateStatus(id, status);
    } catch {
      load();
    }
  }

  function handleDrop(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    setDragOverStatus(null);
    const id = e.dataTransfer.getData('text/application-id');
    if (id) moveApplication(id, status);
  }

  const filteredApplications = applications.filter((app) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      app.student.name.toLowerCase().includes(q) ||
      app.student.email.toLowerCase().includes(q) ||
      app.student.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Hiring Pipeline</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Users size={12} /> {applications.length} Total Candidates
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Drag candidate cards across stages to update status, or click to open full details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or skill..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <button
            onClick={load}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh pipeline"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {APPLICATION_STATUSES.map((status) => {
          const columnApps = filteredApplications.filter((a) => a.status === status);
          const style = COLUMN_COLORS[status];
          const isDragOver = dragOverStatus === status;

          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, status)}
              className={`flex min-h-[70vh] flex-col rounded-2xl border p-3 transition-all duration-200 ${
                isDragOver
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-slate-200/80 bg-slate-50/50'
              }`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {STATUS_LABELS[status]}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${style.badge}`}>
                  {columnApps.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 space-y-3">
                {columnApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onClick={() => setSelectedId(app.id)}
                    onDragStart={(e) => e.dataTransfer.setData('text/application-id', app.id)}
                  />
                ))}

                {columnApps.length === 0 && (
                  <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200/80 p-4 text-center">
                    <p className="text-xs font-medium text-slate-400">
                      {isDragOver ? 'Release to Move' : 'No Candidates'}
                    </p>
                  </div>
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
