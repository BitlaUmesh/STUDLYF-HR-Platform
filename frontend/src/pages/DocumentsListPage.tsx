import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, ExternalLink, Search, Calendar, Edit3, X } from 'lucide-react';
import { documentsApi, type DocumentRecord } from '../api/documents';
import { Card, Button, PageHeader, EmptyState, Input } from '../components/ui';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useDocumentBuilderStore } from '../store/documentBuilderStore';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  exported: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function DocumentsListPage() {
  const [docs, setDocs] = useState<DocumentRecord[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deletion modal state
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Renaming modal state
  const [renamingDoc, setRenamingDoc] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const resetState = useDocumentBuilderStore((s) => s.resetState);
  const currentDocId = useDocumentBuilderStore((s) => s.documentId);

  function load() {
    documentsApi.list().then(({ data }) => setDocs(data));
  }

  useEffect(load, []);

  async function handleConfirmDelete() {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await documentsApi.remove(deletingDoc.id);
      
      // Wipe session storage and reset store if deleted doc was active in store
      if (currentDocId === deletingDoc.id) {
        resetState();
      }
      sessionStorage.removeItem('draft_document_state');
      
      setDeletingDoc(null);
      load();
    } catch (err) {
      console.error('Failed to delete document', err);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleConfirmRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingDoc || !newTitle.trim()) return;
    setIsRenaming(true);
    try {
      await documentsApi.update(renamingDoc.id, { title: newTitle.trim() });
      setRenamingDoc(null);
      setNewTitle('');
      load();
    } catch (err) {
      console.error('Failed to rename document', err);
    } finally {
      setIsRenaming(false);
    }
  }

  function handleCreateNew() {
    resetState();
    sessionStorage.removeItem('draft_document_state');
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
          <Link to="/documents/new" onClick={handleCreateNew}>
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
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate" title={title}>{title}</h4>
                        <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLE[doc.status] || 'bg-slate-100 text-slate-700'}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setRenamingDoc({ id: doc.id, title });
                          setNewTitle(title);
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Rename letter"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingDoc({ id: doc.id, title })}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete letter"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      {/* Delete Confirmation Pop-up Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingDoc)}
        title="Delete Document"
        description={`Are you sure you want to delete "${deletingDoc?.title || 'this letter'}"? This action is permanent and cannot be undone.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingDoc(null)}
      />

      {/* Rename Document Pop-up Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit3 size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Rename Letter</h3>
              </div>
              <button
                onClick={() => setRenamingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmRename} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Letter Title
                </label>
                <Input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Offer Letter - John Doe"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setRenamingDoc(null)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="md"
                  loading={isRenaming}
                  disabled={!newTitle.trim()}
                  className="rounded-xl font-bold"
                >
                  Save Title
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
