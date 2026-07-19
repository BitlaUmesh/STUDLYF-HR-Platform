import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, LayoutTemplate, Clock, ArrowRight } from 'lucide-react';
import { dashboardApi, type DashboardMetrics } from '../api/profile';
import { applicationsApi, type Application } from '../api/applications';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, StatusBadge } from '../components/ui';

const METRIC_CARDS = [
  { key: 'documentsCreated', label: 'Documents Created', icon: FileText },
  { key: 'recentExports', label: 'Exports', icon: Download },
  { key: 'activeTemplates', label: 'Active Templates', icon: LayoutTemplate },
  { key: 'timeSaved', label: 'Time Saved', icon: Clock },
] as const;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.metrics(), applicationsApi.list()])
      .then(([m, apps]) => {
        setMetrics(m.data);
        setApplications(apps.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome back${user ? `, ${user.fullName.split(' ')[0]}` : ''}`}
        subtitle="Here's what's happening across your hiring pipeline."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {METRIC_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="p-5">
            <Icon size={18} className="text-[var(--color-primary-vivid)]" />
            <p className="mt-3 font-mono-data text-2xl font-semibold text-[var(--color-ink)]">
              {loading ? '—' : (metrics?.[key] ?? 0)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">Recent candidates</h2>
        <Link to="/pipeline" className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary-vivid)] hover:underline">
          View pipeline <ArrowRight size={14} />
        </Link>
      </div>

      <Card className="mt-4 divide-y divide-[var(--color-line)]">
        {loading ? (
          <p className="p-6 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-text-muted)]">
            No candidates yet. Head to Talent Search to invite your first one.
          </p>
        ) : (
          applications.map((app) => (
            <Link
              key={app.id}
              to="/pipeline"
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--color-primary-tint)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-tint)] text-xs font-semibold text-[var(--color-primary)]">
                  {app.student.avatarUrl ? (
                    <img src={app.student.avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    app.student.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{app.student.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{app.student.email}</p>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
