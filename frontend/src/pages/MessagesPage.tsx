import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { messagesApi, type Conversation, type Message } from '../api/messages';
import { PageHeader, EmptyState, Button, Textarea } from '../components/ui';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    messagesApi.conversations().then(({ data }) => {
      setConversations(data);
      if (data.length && !activeStudentId) setActiveStudentId(data[0].student.id);
    });
  }, []);

  useEffect(() => {
    if (activeStudentId) {
      messagesApi.thread(activeStudentId).then(({ data }) => setThread(data));
    }
  }, [activeStudentId]);

  async function handleSend() {
    if (!draft.trim() || !activeStudentId) return;
    setSending(true);
    try {
      await messagesApi.send(activeStudentId, draft.trim());
      setDraft('');
      const { data } = await messagesApi.thread(activeStudentId);
      setThread(data);
    } finally {
      setSending(false);
    }
  }

  const activeConversation = conversations?.find((c) => c.student.id === activeStudentId);

  const filteredConversations = (conversations || []).filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.student.name.toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Direct Messages" subtitle="Communicate directly with candidates in your hiring pipeline." />

      {conversations === null ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState title="No conversations yet" description="Message a candidate from their pipeline card to start a conversation." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: '75vh' }}>
          {/* Left Panel: Conversation List */}
          <div className="col-span-1 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {filteredConversations.map((c) => {
                const isActive = activeStudentId === c.student.id;
                const initials = c.student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <button
                    key={c.student.id}
                    onClick={() => setActiveStudentId(c.student.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all ${
                      isActive ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-white">
                      {c.student.avatarUrl ? (
                        <img src={c.student.avatarUrl} alt={c.student.name} className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`truncate text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-900'}`}>
                          {c.student.name}
                        </p>
                      </div>
                      <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{c.lastMessage.content}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Chat Thread */}
          <div className="col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* Header */}
            {activeConversation && (
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {activeConversation.student.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{activeConversation.student.name}</h3>
                    <p className="text-xs font-medium text-slate-500">Candidate</p>
                  </div>
                </div>

                <Link
                  to={`/students/${activeConversation.student.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  View Dossier <ExternalLink size={13} />
                </Link>
              </div>
            )}

            {/* Thread Message Body */}
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 bg-slate-50/20">
              {thread.map((m) => (
                <div key={m.id} className="flex flex-col items-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-white shadow-xs">
                    <p className="text-xs font-medium leading-relaxed">{m.content}</p>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    {format(new Date(m.sentAt), 'PPp')}
                  </p>
                </div>
              ))}
              {thread.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs font-semibold text-slate-400">No messages yet. Send a message to start conversation.</p>
                </div>
              )}
            </div>

            {/* Quick Templates & Message Input */}
            <div className="border-t border-slate-100 p-4 bg-white space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Templates:</span>
                {[
                  { label: '👋 Intro', text: `Hi ${activeConversation?.student.name || ''}, we reviewed your hackathon projects and would love to connect for a quick 15-min chat!` },
                  { label: '🚀 Next Round', text: `Hi ${activeConversation?.student.name || ''}, congratulations on passing the initial review! We'd like to schedule your technical interview.` },
                  { label: '📄 Offer Letter', text: `Hi ${activeConversation?.student.name || ''}, we are thrilled to extend an official offer to join our team!` },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setDraft(t.text)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3">
                <Textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message... (Ctrl + Enter to send)"
                  className="flex-1 text-xs font-medium rounded-xl border-slate-200"
                />
                <Button onClick={handleSend} disabled={sending || !draft.trim()} className="rounded-xl py-3 px-4 font-bold">
                  <Send size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
