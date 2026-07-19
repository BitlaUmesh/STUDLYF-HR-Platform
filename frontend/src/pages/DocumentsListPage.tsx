import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { documentsApi, type DocumentRecord } from '../api/documents';
import { Card, Button, PageHeader, EmptyState } from '../components/ui';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-[var(--color-canvas)] text-[var(--color-text-muted)]',
  completed: 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]',
  exported: 'bg-green-50 text-[var(--color-signal-offered)]',
  archived: 'bg-gray-100 text-gray-500',
};

export function DocumentsListPage() {
  const [docs, setDocs] = useState<DocumentRecord[] | null>(null);

  function load() {
    documentsApi.list().then(({ data }) => setDocs(data));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    await documentsApi.remove(id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Offer & Joining Letters"
        subtitle="Generate and manage candidate documents."
        action={
          <Link to="/documents/new">
            <Button size="sm">
              <Plus size={15} /> New letter
            </Button>
          </Link>
        }
      />

      {docs === null ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : docs.length === 0 ? (
        <EmptyState title="No letters yet" description="Create an offer or joining letter from the pipeline once you make a hire." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[var(--color-primary-vivid)]" />
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {doc.title || (doc.type === 'OFFER_LETTER' ? 'Offer Letter' : 'Joining Letter')}
                  </p>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-signal-rejected)]">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {doc.candidateDetails?.candidateName || 'No candidate set'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[doc.status]}`}>
                  {doc.status}
                </span>
                <Link to={`/documents/${doc.id}`} className="text-xs font-medium text-[var(--color-primary-vivid)] hover:underline">
                  Open →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
