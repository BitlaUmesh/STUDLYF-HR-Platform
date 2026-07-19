import { useEffect, useState } from 'react';
import { X, Send, CalendarPlus, ListChecks } from 'lucide-react';
import { applicationsApi, type ApplicationDetail, type ApplicationStatus, APPLICATION_STATUSES, STATUS_LABELS } from '../../api/applications';
import { questionsApi, type ScreeningQuestion } from '../../api/questions';
import { meetingsApi } from '../../api/meetings';
import { messagesApi } from '../../api/messages';
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
    if (!meetingTitle.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      await meetingsApi.create({
        applicationId,
        title: meetingTitle,
        startTime: meetingTime || undefined,
      });
      setFeedback('Meeting invite sent.');
      load();
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="font-display text-base font-semibold text-[var(--color-ink)]">
            {application?.student.name || 'Loading…'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-canvas)]">
            <X size={18} />
          </button>
        </div>

        {application && (
          <>
            <div className="flex gap-2 border-b border-[var(--color-line)] px-5 py-3">
              {APPLICATION_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    application.status === s
                      ? 'bg-[var(--color-primary-vivid)] text-white'
                      : 'bg-[var(--color-canvas)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary-tint)]'
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">{application.student.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {application.student.skills.map((s) => (
                      <span key={s} className="rounded-md bg-[var(--color-primary-tint)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                        {s}
                      </span>
                    ))}
                  </div>
                  {application.responses.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Screening responses</p>
                      <div className="space-y-3">
                        {application.responses.map((r) => (
                          <div key={r.id} className="rounded-lg border border-[var(--color-line)] p-3">
                            <p className="text-xs font-medium text-[var(--color-text-muted)]">{r.question.question}</p>
                            <p className="mt-1 text-sm text-[var(--color-ink)]">{r.answer || <em className="text-[var(--color-text-muted)]">No answer yet</em>}</p>
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
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Meeting title</label>
                    <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">Preferred time (optional)</label>
                    <Input type="datetime-local" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
                  </div>
                  <Button onClick={handleScheduleMeeting} disabled={busy} className="w-full">
                    <CalendarPlus size={15} /> Send scheduling invite
                  </Button>
                  {application.meeting && (
                    <div className="rounded-lg bg-[var(--color-canvas)] p-3 text-sm">
                      <p className="font-medium text-[var(--color-ink)]">Current meeting: {application.meeting.status}</p>
                      {application.meeting.calendlyEventUrl && (
                        <a href={application.meeting.calendlyEventUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary-vivid)] hover:underline">
                          View booking link
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tab === 'message' && (
                <div className="space-y-3">
                  <Textarea
                    rows={5}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${application.student.name}…`}
                  />
                  <Button onClick={handleSendMessage} disabled={busy || !messageText.trim()} className="w-full">
                    <Send size={15} /> Send message
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
