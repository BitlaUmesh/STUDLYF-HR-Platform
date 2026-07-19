import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { messagesApi, type Conversation, type Message } from '../api/messages';
import { Card, PageHeader, EmptyState, Button, Textarea } from '../components/ui';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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

  return (
    <div>
      <PageHeader title="Messages" subtitle="Direct conversations with candidates." />

      {conversations === null ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : conversations.length === 0 ? (
        <EmptyState title="No conversations yet" description="Message a candidate from their pipeline card to start a conversation." />
      ) : (
        <div className="grid grid-cols-3 gap-4" style={{ height: '70vh' }}>
          <Card className="col-span-1 divide-y divide-[var(--color-line)] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.student.id}
                onClick={() => setActiveStudentId(c.student.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeStudentId === c.student.id ? 'bg-[var(--color-primary-tint)]' : 'hover:bg-[var(--color-canvas)]'
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-tint)] text-xs font-semibold text-[var(--color-primary)]">
                  {c.student.avatarUrl ? (
                    <img src={c.student.avatarUrl} className="h-full w-full object-cover" />
                  ) : (
                    c.student.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">{c.student.name}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{c.lastMessage.content}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-vivid)] text-[10px] font-semibold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </Card>

          <Card className="col-span-2 flex flex-col">
            <div className="border-b border-[var(--color-line)] px-5 py-3.5">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{activeConversation?.student.name}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {thread.map((m) => (
                <div key={m.id} className="max-w-[75%] rounded-xl bg-[var(--color-primary-tint)] px-4 py-2.5">
                  <p className="text-sm text-[var(--color-ink)]">{m.content}</p>
                  <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{format(new Date(m.sentAt), 'PPp')}</p>
                </div>
              ))}
              {thread.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No messages yet.</p>}
            </div>
            <div className="flex items-end gap-2 border-t border-[var(--color-line)] p-4">
              <Textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={sending || !draft.trim()}>
                <Send size={15} />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
