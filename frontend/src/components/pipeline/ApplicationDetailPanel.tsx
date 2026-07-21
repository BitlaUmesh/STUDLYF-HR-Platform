import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, CalendarPlus, ListChecks, Code2, Star, GitFork, ExternalLink, Mail } from 'lucide-react';
import { applicationsApi, type ApplicationDetail, type ApplicationStatus, APPLICATION_STATUSES, STATUS_LABELS } from '../../api/applications';
import { questionsApi, type ScreeningQuestion } from '../../api/questions';
import { meetingsApi } from '../../api/meetings';
import { messagesApi } from '../../api/messages';
import { LanguageFingerprint } from '../students/LanguageFingerprint';
import { Button, Textarea, Input, StatusBadge } from '../ui';
import { getErrorMessage } from '../../api/client';

type Tab = 'overview' | 'questions' | 'meeting' | 'message';

export function ApplicationDetailPanel({
  applicationId,
  onClose,
  onStatusChanged,
}: {
  applicationId: string;
  onClose: () => void;
  onStatusChanged: () => void;
}) {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('Interview');
  const [meetingTime, setMeetingTime] = useState('');
  const [messageText, setMessageText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    applicationsApi.getById(applicationId).then(({ data }) => setApplication(data));
  }

  useEffect(load, [applicationId]);
  useEffect(() => {
    questionsApi.list().then(({ data }) => setQuestions(data));
  }, []);

  async function handleStatusChange(status: ApplicationStatus) {
    setBusy(true);
    try {
      await applicationsApi.updateStatus(applicationId, status);
      load();
      onStatusChanged();
    } catch (err) {
      setFeedback(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateQuestion() {
    if (!newQuestion.trim()) return;
    const { data } = await questionsApi.create(newQuestion.trim());
    setQuestions((qs) => [data, ...qs]);
    setNewQuestion('');
  }

  async function handleAssignQuestions() {
    if (!selectedQuestionIds.length) return;
    setBusy(true);
    try {
      await questionsApi.assign(applicationId, selectedQuestionIds);
      setFeedback('Questions sent to candidate.');
      setSelectedQuestionIds([]);
      load();
      onStatusChanged();
    } catch (err) {
      setFeedback(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleScheduleMeeting() {
    if (!meetingTitle.trim()) {
      setFeedback('Please enter an interview title (e.g. Technical Round).');
      return;
    }
    if (!meetingTime) {
      setFeedback('Please select an interview Date & Time.');
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      await meetingsApi.create({
        applicationId,
        title: meetingTitle.trim(),
        startTime: meetingTime,
      });
      setFeedback('Interview scheduled & email invite sent to candidate!');
      load();
      onStatusChanged();
    } catch (err) {
      setFeedback(getErrorMessage(err, 'Could not schedule the meeting'));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !application) return;
    setBusy(true);
    try {
      await messagesApi.send(application.studentId, messageText.trim());
      setFeedback('Message sent.');
      setMessageText('');
    } catch (err) {
      setFeedback(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {application?.student.name || 'Loading…'}
            </h2>
            <p className="text-xs font-medium text-slate-500">{application?.student.email}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {application && (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-6 py-3 bg-slate-50/30">
              {APPLICATION_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    application.status === s
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex border-b border-[var(--color-line)] px-5">
              {(['overview', 'questions', 'meeting', 'message'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'border-[var(--color-primary-vivid)] text-[var(--color-primary-vivid)]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {feedback && <p className="mb-4 text-sm text-[var(--color-primary-vivid)]">{feedback}</p>}

              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* Candidate Bio Card */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={application.status} />
                      <Link
                        to={`/students/${application.student.id}`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        View Full Dossier <ExternalLink size={12} />
                      </Link>
                    </div>

                    {application.student.bio && (
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        {application.student.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" /> {application.student.email}
                      </span>
                      {application.student.githubUsername && (
                        <a
                          href={`https://github.com/${application.student.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary font-bold hover:underline"
                        >
                          <Code2 size={12} /> @{application.student.githubUsername}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Skills & Tech Stack</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {application.student.skills.map((s) => (
                        <span key={s} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* GitHub Profile Breakdown */}
                  {application.student.githubStats && (
                    <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                      <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                        <Code2 size={14} className="text-primary" /> GitHub Code Breakdown
                      </h4>
                      <LanguageFingerprint topLanguages={application.student.githubStats.topLanguages || {}} />
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-black text-slate-900">{application.student.githubStats.totalRepos ?? 0}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Repos</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-black text-amber-600 flex items-center justify-center gap-0.5">
                            <Star size={12} fill="currentColor" /> {application.student.githubStats.totalStars ?? 0}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500">Stars</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-black text-indigo-600 flex items-center justify-center gap-0.5">
                            <GitFork size={12} /> {application.student.githubStats.totalForks ?? 0}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500">Forks</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hackathon Projects */}
                  {application.student.projects && application.student.projects.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Projects ({application.student.projects.length})
                      </h4>
                      <div className="space-y-3">
                        {application.student.projects.map((project) => (
                          <div key={project.id} className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white hover:border-primary/40 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{project.name}</h5>
                                {project.hackathonName && (
                                  <p className="text-[11px] font-semibold text-primary">{project.hackathonName}</p>
                                )}
                              </div>
                              {project.juryRating != null && (
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700 border border-emerald-200">
                                  ⭐ {project.juryRating.toFixed(1)} / 10
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{project.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {project.tags.map((tag) => (
                                <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                  {tag}
                                </span>
                              ))}
                              <div className="ml-auto flex items-center gap-2">
                                {project.repoUrl && (
                                  <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline">
                                    Repo <ExternalLink size={10} />
                                  </a>
                                )}
                                {project.demoUrl && (
                                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[11px] font-bold text-primary hover:underline">
                                    Demo <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screening Responses */}
                  {application.responses.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Screening Responses</h4>
                      <div className="space-y-2.5">
                        {application.responses.map((r) => (
                          <div key={r.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/30 space-y-1">
                            <p className="text-xs font-bold text-slate-700">{r.question.question}</p>
                            <p className="text-xs text-slate-900 font-medium">
                              {r.answer || <em className="text-slate-400 font-normal">No answer submitted yet</em>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Write a screening question…"
                    />
                    <Button size="sm" onClick={handleCreateQuestion}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {questions.map((q) => (
                      <label key={q.id} className="flex items-start gap-2 rounded-lg border border-[var(--color-line)] p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={(e) =>
                            setSelectedQuestionIds((ids) =>
                              e.target.checked ? [...ids, q.id] : ids.filter((id) => id !== q.id)
                            )
                          }
                        />
                        {q.question}
                      </label>
                    ))}
                    {questions.length === 0 && (
                      <p className="text-sm text-[var(--color-text-muted)]">No saved questions yet — add one above.</p>
                    )}
                  </div>
                  <Button onClick={handleAssignQuestions} disabled={busy || !selectedQuestionIds.length} className="w-full">
                    <ListChecks size={15} /> Send {selectedQuestionIds.length || ''} question{selectedQuestionIds.length === 1 ? '' : 's'}
                  </Button>
                </div>
              )}

              {tab === 'meeting' && (
                <div className="space-y-4">
                  {/* Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Technical Interview', 'System Design Round', 'Culture Fit', 'Executive Final'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMeetingTitle(preset)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                            meetingTitle === preset
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Meeting Title <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="e.g. Technical Interview"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Interview Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      required
                    />
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      The candidate will receive an official invite for this exact scheduled time.
                    </p>
                  </div>

                  <Button onClick={handleScheduleMeeting} disabled={busy} className="w-full py-2.5 rounded-xl font-bold">
                    <CalendarPlus size={15} /> Schedule & Notify Candidate
                  </Button>

                  {application.meeting && (
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Interview Status</span>
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 uppercase">
                          {application.meeting.status}
                        </span>
                      </div>
                      {application.meeting.scheduledAt && (
                        <p className="text-xs font-semibold text-slate-800">
                          📅 Scheduled: {new Date(application.meeting.scheduledAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'message' && (
                <div className="space-y-4">
                  {/* Canned Response Templates */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Message Templates</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '👋 Initial Intro', text: `Hi ${application.student.name}, we reviewed your hackathon projects and would love to schedule a quick 15-min chat!` },
                        { label: '🚀 Next Round', text: `Hi ${application.student.name}, congratulations on passing the initial review! We'd like to schedule your technical interview.` },
                        { label: '🎉 Offer Notice', text: `Hi ${application.student.name}, we are thrilled to extend an official offer to join our team! Please check your email for the offer document.` },
                      ].map((tmpl) => (
                        <button
                          key={tmpl.label}
                          type="button"
                          onClick={() => setMessageText(tmpl.text)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Write a direct message to ${application.student.name}…`}
                    className="w-full text-xs font-medium"
                  />
                  
                  <Button onClick={handleSendMessage} disabled={busy || !messageText.trim()} className="w-full py-2.5 rounded-xl font-bold">
                    <Send size={15} /> Send Message
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
