import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Calendar, ArrowRight, 
  Plus, Search, Clock, ChevronRight, UserCheck
} from 'lucide-react';
import { dashboardApi, type DashboardMetrics } from '../api/profile';
import { applicationsApi, APPLICATION_STATUSES, STATUS_LABELS, type Application } from '../api/applications';
import { meetingsApi, type Meeting } from '../api/meetings';
import { studentsApi } from '../api/students';
import { useAuthStore } from '../store/authStore';
import { StatusBadge } from '../components/ui';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [totalTalentCount, setTotalTalentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.metrics().then((m) => setMetrics(m.data)).catch(console.error);
    studentsApi.search('').then((res) => setTotalTalentCount(res.data.total)).catch(console.error);
    applicationsApi.list().then((apps) => {
      setApplications(apps.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
    meetingsApi.list().then((mtgs) => setMeetings(mtgs.data)).catch(console.error);
  }, []);

  const pipelineCandidates = applications.length;
  const activeInterviews = meetings.filter((m) => m.status === 'scheduled' || m.status === 'confirmed').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Clean B2B Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Welcome back, {user ? user.fullName : 'HR Administrator'}. Here is your recruitment pipeline overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            <Search size={14} className="text-slate-400" />
            <span>Search Talent</span>
          </button>
          <button
            onClick={() => navigate('/documents/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Letter</span>
          </button>
        </div>
      </div>

      {/* 4 Core B2B Metric Cards (Clickable Navigation Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Talent Pool -> Talent Search */}
        <button
          onClick={() => navigate('/students')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Total Talent Pool</p>
            <p className="text-2xl font-bold text-slate-900 font-mono-data">{totalTalentCount === null ? '—' : totalTalentCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Users size={18} />
          </div>
        </button>

        {/* Metric 2: Pipeline Candidates -> Pipeline Board */}
        <button
          onClick={() => navigate('/pipeline')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Pipeline Candidates</p>
            <p className="text-2xl font-bold text-slate-900 font-mono-data">{loading ? '—' : pipelineCandidates}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <UserCheck size={18} />
          </div>
        </button>

        {/* Metric 3: Meetings -> Meetings Schedule */}
        <button
          onClick={() => navigate('/meetings')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Scheduled Meetings</p>
            <p className="text-2xl font-bold text-slate-900 font-mono-data">{loading ? '—' : activeInterviews}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Calendar size={18} />
          </div>
        </button>

        {/* Metric 4: Documents Created -> Letters List */}
        <button
          onClick={() => navigate('/documents')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Documents Created</p>
            <p className="text-2xl font-bold text-slate-900 font-mono-data">{loading ? '—' : (metrics?.documentsCreated ?? 0)}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <FileText size={18} />
          </div>
        </button>
      </div>

      {/* Pipeline Funnel Breakdown Widget */}
      <div className="b2b-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pipeline Funnel Overview</h2>
            <p className="text-xs font-medium text-slate-500">Distribution of active candidates across recruitment stages.</p>
          </div>
          <Link to="/pipeline" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            <span>View Board</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {APPLICATION_STATUSES.map((status) => {
            const count = applications.filter((a) => a.status === status).length;
            return (
              <div key={status} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{STATUS_LABELS[status]}</p>
                <p className="text-xl font-bold text-slate-900 font-mono-data">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Section: Recent Candidates & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Candidates List (2 Columns) */}
        <div className="lg:col-span-2 b2b-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Candidates</h2>
            <Link to="/pipeline" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <p className="text-xs font-medium text-slate-400 py-4">Loading candidate pipeline...</p>
          ) : applications.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-lg">
              No candidates added yet. Search talent to invite candidates!
            </div>
          ) : (
            <div className="space-y-2.5">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate('/pipeline')}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
                      {app.student.avatarUrl ? (
                        <img src={app.student.avatarUrl} alt={app.student.name} className="h-full w-full object-cover" />
                      ) : (
                        app.student.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{app.student.name}</h3>
                      <p className="text-[11px] font-medium text-slate-500">{app.student.email}</p>
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings Widget (1 Column) */}
        <div className="b2b-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>Upcoming Meetings</span>
            </h2>
            <Link to="/meetings" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          {meetings.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-lg">
              No upcoming meetings.
            </div>
          ) : (
            <div className="space-y-2.5">
              {meetings.slice(0, 4).map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-slate-200/80 space-y-1 bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-900">{m.title}</p>
                  <p className="text-[11px] font-medium text-indigo-600">
                    Candidate: {m.application?.student.name || 'Candidate'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : 'Scheduled by HR'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
