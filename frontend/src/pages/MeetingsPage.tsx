import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, X, ExternalLink, Search, User, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { meetingsApi, type Meeting } from '../api/meetings';
import { Card, PageHeader, EmptyState, Button, Input } from '../components/ui';

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-amber-700 bg-amber-50 border-amber-200',
  rescheduled: 'text-purple-700 bg-purple-50 border-purple-200 font-bold',
  confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-200',
};

type FilterTab = 'all' | 'scheduled' | 'rescheduled' | 'cancelled';

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reschedule Modal state
  const [reschedulingMeeting, setReschedulingMeeting] = useState<Meeting | null>(null);
  const [newTime, setNewTime] = useState('');
  const [reschedulingBusy, setReschedulingBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  function load() {
    meetingsApi.list().then(({ data }) => setMeetings(data));
  }

  useEffect(load, []);

  async function handleCancel(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to cancel the meeting "${title}"?`)) return;
    await meetingsApi.cancel(id);
    load();
  }

  async function handleConfirmReschedule() {
    if (!reschedulingMeeting || !newTime) {
      setModalError('Please select a new Date & Time.');
      return;
    }
    setReschedulingBusy(true);
    setModalError(null);
    try {
      await meetingsApi.reschedule(reschedulingMeeting.id, newTime);
      setReschedulingMeeting(null);
      setNewTime('');
      load();
    } catch (err: any) {
      setModalError(err?.response?.data?.error || 'Failed to reschedule meeting');
    } finally {
      setReschedulingBusy(false);
    }
  }

  const filteredMeetings = (meetings || []).filter((m) => {
    if (activeTab !== 'all' && m.status !== activeTab) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const candidateName = m.application?.student.name?.toLowerCase() || '';
    const title = m.title.toLowerCase();
    return candidateName.includes(q) || title.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings & Interviews"
        subtitle="Manage upcoming interview sessions, schedule times, and candidate invitations."
      />

      {/* Control Bar: Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(['all', 'scheduled', 'rescheduled', 'cancelled'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate or title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {meetings === null ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">Loading meetings...</p>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <EmptyState
          title="No meetings found"
          description={searchQuery ? 'No meetings match your search query.' : 'Schedule an interview from a candidate\'s pipeline card.'}
        />
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((m) => (
            <Card key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 hover:border-primary/40 transition-colors gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                  <CalendarClock size={22} />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                    <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold border uppercase tracking-wider ${STATUS_STYLE[m.status] || 'bg-slate-100 text-slate-700'}`}>
                      {m.status === 'rescheduled' ? '🔄 Rescheduled' : m.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    {m.application?.student && (
                      <Link
                        to={`/students/${m.application.student.id}`}
                        className="flex items-center gap-1 font-bold text-slate-800 hover:text-primary transition-colors"
                      >
                        <User size={13} className="text-slate-400" />
                        {m.application.student.name}
                      </Link>
                    )}

                    <span className={`flex items-center gap-1 font-bold ${m.status === 'rescheduled' ? 'text-purple-700' : 'text-primary'}`}>
                      <Clock size={13} />
                      {m.scheduledAt ? format(new Date(m.scheduledAt), 'PPp') : 'Scheduled by HR'}
                      {m.status === 'rescheduled' && <span className="ml-1 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-black">NEW TIME</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                {m.calendlyEventUrl && (
                  <a
                    href={m.calendlyEventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Event Details <ExternalLink size={13} />
                  </a>
                )}

                {m.status !== 'cancelled' && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setReschedulingMeeting(m);
                        setModalError(null);
                      }}
                      className="rounded-xl text-xs font-bold"
                    >
                      <RefreshCw size={13} /> Reschedule
                    </Button>

                    <button
                      onClick={() => handleCancel(m.id, m.title)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <X size={13} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Reschedule Interview</h3>
              <button onClick={() => setReschedulingMeeting(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {modalError}
              </p>
            )}

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">{reschedulingMeeting.title}</p>
              <p className="text-xs text-slate-500 font-medium">Candidate: {reschedulingMeeting.application?.student.name}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-800 uppercase tracking-wider">
                New Interview Date & Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                An updated invitation email will be sent to the candidate immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setReschedulingMeeting(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmReschedule} disabled={reschedulingBusy || !newTime} className="rounded-xl font-bold">
                {reschedulingBusy ? 'Rescheduling...' : 'Confirm Reschedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
