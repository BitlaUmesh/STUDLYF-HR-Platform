import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Download } from 'lucide-react';
import { documentsApi, type DocumentType } from '../api/documents';
import { Card, Button, Input, PageHeader } from '../components/ui';
import { getErrorMessage } from '../api/client';

interface CandidateDetails {
  candidateName: string;
  candidateEmail: string;
  designation: string;
  startDate: string;
  salary: string;
}

const DEFAULT_DETAILS: CandidateDetails = {
  candidateName: '',
  candidateEmail: '',
  designation: '',
  startDate: '',
  salary: '',
};

function buildLetterBody(type: DocumentType, d: CandidateDetails) {
  if (type === 'OFFER_LETTER') {
    return `Dear ${d.candidateName || '[Candidate Name]'},

We are pleased to offer you the position of ${d.designation || '[Designation]'} with our organization. This letter confirms our offer of employment, subject to the terms outlined below.

Your annual compensation will be ${d.salary || '[Salary]'}, and your expected start date is ${d.startDate || '[Start Date]'}.

We are excited about the possibility of you joining our team and look forward to your positive response.

Warm regards,`;
  }
  return `Dear ${d.candidateName || '[Candidate Name]'},

Welcome aboard! This letter confirms your joining as ${d.designation || '[Designation]'}, effective ${d.startDate || '[Start Date]'}.

Please bring the required documents on your first day. We're looking forward to working with you.

Best,`;
}

export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [type, setType] = useState<DocumentType>('OFFER_LETTER');
  const [details, setDetails] = useState<CandidateDetails>(DEFAULT_DETAILS);
  const [body, setBody] = useState('');
  const [bodyEdited, setBodyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(isNew ? null : id || null);

  useEffect(() => {
    if (!isNew && id) {
      documentsApi.getById(id).then(({ data }) => {
        setType(data.type);
        setDetails({ ...DEFAULT_DETAILS, ...data.candidateDetails });
        setBody(data.contentJSON?.body || '');
        setBodyEdited(true);
      });
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!bodyEdited) setBody(buildLetterBody(type, details));
  }, [type, details, bodyEdited]);

  function updateDetail(field: keyof CandidateDetails, value: string) {
    setDetails((d) => ({ ...d, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        title: `${type === 'OFFER_LETTER' ? 'Offer' : 'Joining'} Letter — ${details.candidateName || 'Untitled'}`,
        candidateDetails: details,
        contentJSON: { body },
        status: 'completed',
      };

      if (docId) {
        await documentsApi.update(docId, payload);
      } else {
        const { data } = await documentsApi.create(payload);
        setDocId(data.id);
        navigate(`/documents/${data.id}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the letter'));
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <PageHeader
        title={isNew && !docId ? 'New Letter' : 'Edit Letter'}
        subtitle="Fill in candidate details — the letter body updates automatically."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Download size={14} /> Export / Print
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-[var(--color-signal-rejected)]">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Letter type</label>
            <div className="flex gap-2">
              {(['OFFER_LETTER', 'JOINING_LETTER'] as DocumentType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setBodyEdited(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? 'border-[var(--color-primary-vivid)] bg-[var(--color-primary-tint)] text-[var(--color-primary)]'
                      : 'border-[var(--color-line-strong)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {t === 'OFFER_LETTER' ? 'Offer Letter' : 'Joining Letter'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Candidate name</label>
            <Input value={details.candidateName} onChange={(e) => updateDetail('candidateName', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Candidate email</label>
            <Input value={details.candidateEmail} onChange={(e) => updateDetail('candidateEmail', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Designation</label>
            <Input value={details.designation} onChange={(e) => updateDetail('designation', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Start date</label>
              <Input type="date" value={details.startDate} onChange={(e) => updateDetail('startDate', e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Annual salary</label>
              <Input value={details.salary} onChange={(e) => updateDetail('salary', e.target.value)} placeholder="₹8,00,000" />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Letter body</label>
              {bodyEdited && (
                <button
                  onClick={() => setBodyEdited(false)}
                  className="text-xs text-[var(--color-primary-vivid)] hover:underline"
                >
                  Reset to template
                </button>
              )}
            </div>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setBodyEdited(true);
              }}
              rows={10}
              className="w-full rounded-lg border border-[var(--color-line-strong)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-vivid)] focus:ring-2 focus:ring-[var(--color-primary-tint)]"
            />
          </div>
        </Card>

        <Card className="p-8 print:border-none print:shadow-none">
          <div className="mx-auto max-w-md font-serif text-sm leading-relaxed text-[var(--color-ink)]">
            <p className="mb-6 whitespace-pre-line">{body}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
