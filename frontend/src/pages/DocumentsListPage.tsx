import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, ExternalLink, Search, Calendar } from 'lucide-react';
import { documentsApi, type DocumentRecord } from '../api/documents';
import { Card, Button, PageHeader, EmptyState } from '../components/ui';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  exported: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function DocumentsListPage() {
  const [docs, setDocs] = useState<DocumentRecord[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  function load() {
    documentsApi.list().then(({ data }) => setDocs(data));
  }

  useEffect(load, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    await documentsApi.remove(id);
    load();
  }

  const filteredDocs = (docs || []).filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const title = (doc.title || '').toLowerCase();
    const candidate = (doc.candidateDetails?.candidateName || '').toLowerCase();
    return title.includes(q) || candidate.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer & Joining Letters"
        subtitle="Generate, save, export, and email official candidate documents."
        action={
          <Link to="/documents/new">
            <Button size="sm" className="rounded-xl font-bold">
              <Plus size={15} /> Create New Letter
            </Button>
          </Link>
        }
      />

      {/* Control Bar: Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search letter title or candidate..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {docs === null ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No letters found"
          description={searchQuery ? 'No documents match your search.' : 'Create an offer or joining letter to get started.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const title = doc.title || (doc.type === 'OFFER_LETTER' ? 'Offer Letter' : 'Joining Letter');
            return (
              <Card key={doc.id} className="flex flex-col justify-between p-5 border border-slate-200 hover:border-primary/40 transition-colors space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{title}</h4>
                        <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLE[doc.status] || 'bg-slate-100 text-slate-700'}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.id, title)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <p className="font-bold text-slate-800">
                      Candidate: <span className="font-medium text-slate-600">{doc.candidateDetails?.candidateName || 'Not specified'}</span>
                    </p>
                    {doc.candidateDetails?.designation && (
                      <p className="text-slate-500 font-medium">Role: {doc.candidateDetails.designation}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={12} /> {new Date(doc.createdAt).toLocaleDateString()}
                  </span>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    Open & Edit <ExternalLink size={13} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
