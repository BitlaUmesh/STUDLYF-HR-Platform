"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  HelpCircle,
  Calendar,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  CalendarClock,
  Loader2,
} from "lucide-react";
import {
  Application,
  ApplicationStatus,
  APPLICATION_STATUSES,
  ScreeningQuestion,
  ScreeningResponse,
  Message,
  updateApplicationStatus,
  listQuestions,
  createQuestion,
  assignQuestions,
  getResponses,
  createMeeting,
  cancelMeeting as cancelMeetingApi,
  sendMessage,
  getMessages,
} from "@/lib/pipelineApi";

type Tab = "overview" | "questions" | "meeting" | "messages";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  invited: "Invited",
  reviewing: "Reviewing",
  questions_sent: "Questions Sent",
  offered: "Offered",
  rejected: "Rejected",
};

interface ApplicationDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onUpdated: (application: Application) => void;
}

export default function ApplicationDetailModal({
  application,
  onClose,
  onUpdated,
}: ApplicationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [responses, setResponses] = useState<ScreeningResponse[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [sendingQuestions, setSendingQuestions] = useState(false);

  // Meeting
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingDescription, setMeetingDescription] = useState("");
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const resetLocalState = useCallback(() => {
    setActiveTab("overview");
    setQuestions([]);
    setSelectedQuestionIds([]);
    setNewQuestionText("");
    setResponses([]);
    setQuestionsError(null);
    setMeetingTitle("");
    setMeetingDate("");
    setMeetingDuration(30);
    setMeetingDescription("");
    setMeetingError(null);
    setMessages([]);
    setMessagesError(null);
    setMessageDraft("");
  }, []);

  useEffect(() => {
    resetLocalState();
  }, [application?.id, resetLocalState]);

  useEffect(() => {
    document.body.style.overflow = application ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [application]);

  const loadQuestionsTab = useCallback(async () => {
    if (!application) return;
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const [bank, existingResponses] = await Promise.all([
        listQuestions(),
        getResponses(application.id).catch(() => []),
      ]);
      setQuestions(bank);
      setResponses(existingResponses);
      setSelectedQuestionIds(existingResponses.map((r) => r.questionId));
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setQuestionsLoading(false);
    }
  }, [application]);

  const loadMessagesTab = useCallback(async () => {
    if (!application) return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await getMessages(application.studentId);
      setMessages(data);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, [application]);

  useEffect(() => {
    if (!application) return;
    if (activeTab === "questions" && questions.length === 0 && !questionsLoading) {
      loadQuestionsTab();
    }
    if (activeTab === "messages" && messages.length === 0 && !messagesLoading) {
      loadMessagesTab();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, application]);

  if (!application) return null;

  const handleStatusChange = async (status: ApplicationStatus) => {
    setStatusUpdating(true);
    try {
      const updated = await updateApplicationStatus(application.id, status);
      onUpdated({ ...application, ...updated });
    } catch {
      // status change failures are surfaced inline via the select reverting on next render
    } finally {
      setStatusUpdating(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const handleAddQuestion = async () => {
    const text = newQuestionText.trim();
    if (!text) return;
    try {
      const created = await createQuestion(text);
      setQuestions((prev) => [created, ...prev]);
      setSelectedQuestionIds((prev) => [...prev, created.id]);
      setNewQuestionText("");
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Failed to add question");
    }
  };

  const handleSendQuestions = async () => {
    if (!selectedQuestionIds.length) return;
    setSendingQuestions(true);
    setQuestionsError(null);
    try {
      await assignQuestions(application.id, selectedQuestionIds);
      onUpdated({ ...application, status: "questions_sent" });
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Failed to send questions");
    } finally {
      setSendingQuestions(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingTitle.trim()) {
      setMeetingError("Give the meeting a title first.");
      return;
    }
    setMeetingSubmitting(true);
    setMeetingError(null);
    try {
      const meeting = await createMeeting({
        applicationId: application.id,
        title: meetingTitle.trim(),
        duration: meetingDuration,
        startTime: meetingDate || undefined,
        description: meetingDescription.trim() || undefined,
      });
      onUpdated({
        ...application,
        meeting: {
          id: meeting.id,
          status: meeting.status,
          scheduledAt: meeting.scheduledAt,
          calendlyEventUrl: meeting.calendlyEventUrl,
        },
      });
    } catch (err) {
      setMeetingError(err instanceof Error ? err.message : "Failed to schedule meeting");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!application.meeting) return;
    setMeetingSubmitting(true);
    setMeetingError(null);
    try {
      await cancelMeetingApi(application.meeting.id);
      onUpdated({ ...application, meeting: { ...application.meeting, status: "cancelled" } });
    } catch (err) {
      setMeetingError(err instanceof Error ? err.message : "Failed to cancel meeting");
    } finally {
      setMeetingSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageDraft.trim();
    if (!text) return;
    setSendingMessage(true);
    setMessagesError(null);
    try {
      const msg = await sendMessage(application.studentId, text);
      setMessages((prev) => [...prev, msg]);
      setMessageDraft("");
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof HelpCircle }[] = [
    { id: "overview", label: "Overview", icon: HelpCircle },
    { id: "questions", label: "Questions", icon: HelpCircle },
    { id: "meeting", label: "Meeting", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[95%] max-w-2xl max-h-[90vh] bg-[#F9FAFB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{application.student.name}</h2>
              <p className="text-sm text-slate-500">{application.student.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={application.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className="text-sm font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none disabled:opacity-50"
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {application.student.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {application.student.githubUsername && (
                <a
                  href={`https://github.com/${application.student.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline w-fit"
                >
                  github.com/{application.student.githubUsername}
                </a>
              )}
              {application.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Notes
                  </h4>
                  <p className="text-sm text-slate-600">{application.notes}</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Invited {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="flex flex-col gap-4">
              {questionsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-2.5">
                  {questionsError}
                </div>
              )}

              {questionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
                      placeholder="Add a custom screening question…"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <button
                      onClick={handleAddQuestion}
                      disabled={!newQuestionText.trim()}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-primary disabled:opacity-40 text-white rounded-xl transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {questions.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">
                        No questions yet — add one above to build your question bank.
                      </p>
                    )}
                    {questions.map((q) => {
                      const response = responses.find((r) => r.questionId === q.id);
                      return (
                        <label
                          key={q.id}
                          className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3.5 cursor-pointer hover:border-primary/40"
                        >
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={() => toggleQuestion(q.id)}
                            className="mt-0.5 accent-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{q.question}</p>
                            {response?.answer && (
                              <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
                                <span className="font-semibold">Answer:</span> {response.answer}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSendQuestions}
                    disabled={sendingQuestions || !selectedQuestionIds.length}
                    className="mt-2 w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {sendingQuestions && <Loader2 size={14} className="animate-spin" />}
                    Send Selected Questions to Student
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "meeting" && (
            <div className="flex flex-col gap-4">
              {meetingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-2.5">
                  {meetingError}
                </div>
              )}

              {application.meeting && application.meeting.status !== "cancelled" ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                    <CalendarClock size={16} />
                    Meeting {application.meeting.status}
                  </div>
                  {application.meeting.scheduledAt && (
                    <p className="text-sm text-slate-600">
                      {new Date(application.meeting.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  {application.meeting.calendlyEventUrl && (
                    <a
                      href={application.meeting.calendlyEventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline mt-2 inline-block"
                    >
                      View scheduling link
                    </a>
                  )}
                  <button
                    onClick={handleCancelMeeting}
                    disabled={meetingSubmitting}
                    className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Cancel Meeting
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Meeting title, e.g. Technical Interview"
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <div className="flex gap-3">
                    <input
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <select
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(Number(e.target.value))}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                  <textarea
                    value={meetingDescription}
                    onChange={(e) => setMeetingDescription(e.target.value)}
                    placeholder="Optional description for the student…"
                    rows={3}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                  />
                  <button
                    onClick={handleScheduleMeeting}
                    disabled={meetingSubmitting}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {meetingSubmitting && <Loader2 size={14} className="animate-spin" />}
                    Schedule & Send Invite
                  </button>
                  <p className="text-xs text-slate-400">
                    A scheduling link is emailed to the student automatically once created.
                  </p>
                </>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="flex flex-col h-full">
              {messagesError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-2.5 mb-3">
                  {messagesError}
                </div>
              )}

              {messagesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mb-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No messages yet — say hello below.
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="self-end max-w-[80%] bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                    >
                      {msg.content}
                      <div className="text-[10px] text-white/70 mt-1">
                        {new Date(msg.sentAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Message this student…"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageDraft.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-primary disabled:opacity-40 text-white rounded-xl transition-colors"
                >
                  {sendingMessage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                The student is notified by email when you send a message.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
