import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Calendar, ArrowRight, 
  Plus, Search, Clock, ChevronRight, UserCheck, Sparkles, TrendingUp
} from 'lucide-react';
import { dashboardApi, type DashboardMetrics } from '../api/profile';
import { applicationsApi, APPLICATION_STATUSES, STATUS_LABELS, type Application } from '../api/applications';
import { meetingsApi, type Meeting } from '../api/meetings';
import { studentsApi } from '../api/students';
import { useAuthStore } from '../store/authStore';
import { StatusBadge, Avatar, Skeleton, Card } from '../components/ui';

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
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Clean B2B Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Dashboard Overview</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              <Sparkles size={12} /> Live Sync
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user ? user.fullName : 'HR Administrator'}</span>. Here is your talent pipeline overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
          >
            <Search size={14} className="text-slate-400" />
            <span>Search Talent</span>
          </button>
          <button
            onClick={() => navigate('/documents/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* 4 Core B2B Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Talent Pool */}
        <div
          onClick={() => navigate('/students')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group rounded-xl border border-slate-200/80 bg-white"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Total Talent Pool</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">
              {totalTalentCount === null ? <Skeleton className="h-8 w-16" /> : totalTalentCount}
            </p>
            <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <TrendingUp size={11} /> 25 Verified Candidates
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Metric 2: Pipeline Candidates */}
        <div
          onClick={() => navigate('/pipeline')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group rounded-xl border border-slate-200/80 bg-white"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Pipeline Candidates</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">
              {loading ? <Skeleton className="h-8 w-16" /> : pipelineCandidates}
            </p>
            <p className="text-[11px] font-medium text-purple-600">Active Applications</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 shrink-0">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Metric 3: Scheduled Meetings */}
        <div
          onClick={() => navigate('/meetings')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group rounded-xl border border-slate-200/80 bg-white"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Scheduled Meetings</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">
              {loading ? <Skeleton className="h-8 w-16" /> : activeInterviews}
            </p>
            <p className="text-[11px] font-medium text-emerald-600">Upcoming Interviews</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shrink-0">
            <Calendar size={20} />
          </div>
        </div>

        {/* Metric 4: Documents Created */}
        <div
          onClick={() => navigate('/documents')}
          className="b2b-card b2b-card-hover p-5 flex items-center justify-between text-left cursor-pointer group rounded-xl border border-slate-200/80 bg-white"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Documents Created</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">
              {loading ? <Skeleton className="h-8 w-16" /> : (metrics?.documentsCreated ?? 0)}
            </p>
            <p className="text-[11px] font-medium text-amber-600">Letters & Offers</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200 shrink-0">
            <FileText size={20} />
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Breakdown Widget */}
      <div className="b2b-card p-6 space-y-4 rounded-xl border border-slate-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">Pipeline Funnel Overview</h2>
            <p className="text-xs font-medium text-slate-500">Distribution of candidates across active recruitment stages.</p>
          </div>
          <Link to="/pipeline" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
            <span>View Board</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {APPLICATION_STATUSES.map((status) => {
            const count = applications.filter((a) => a.status === status).length;
            const percentage = pipelineCandidates > 0 ? Math.round((count / pipelineCandidates) * 100) : 0;
            return (
              <div key={status} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/60 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{STATUS_LABELS[status]}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-slate-900 font-display">{count}</p>
                  <span className="text-[10px] font-semibold text-slate-400">{percentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Section: Recent Candidates & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Candidates List (2 Columns) */}
        <div className="lg:col-span-2 b2b-card p-6 space-y-4 rounded-xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 font-display">Recent Candidates</h2>
            <Link to="/pipeline" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              No candidates in pipeline yet. Search talent to invite candidates!
            </div>
          ) : (
            <div className="space-y-2.5">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate('/pipeline')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={app.student.avatarUrl} name={app.student.name} size="sm" />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{app.student.name}</h3>
                      <p className="text-[11px] font-medium text-slate-500 truncate">{app.student.email}</p>
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings Widget (1 Column) */}
        <div className="b2b-card p-6 space-y-4 rounded-xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>Upcoming Meetings</span>
            </h2>
            <Link to="/meetings" className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          {meetings.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              No upcoming meetings scheduled.
            </div>
          ) : (
            <div className="space-y-2.5">
              {meetings.slice(0, 4).map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-slate-200/70 space-y-1 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                  <p className="text-xs font-bold text-slate-900">{m.title}</p>
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
