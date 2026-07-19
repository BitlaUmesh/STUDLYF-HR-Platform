import { useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { studentsApi, type StudentSearchResult } from '../api/students';
import { StudentCard } from '../components/students/StudentCard';
import { Button, PageHeader, EmptyState } from '../components/ui';
import { getErrorMessage } from '../api/client';

const SUGGESTED_KEYWORDS = ['AIML', 'Frontend', 'Backend', 'React', 'Python', 'Web3', 'DevOps'];

export function StudentSearchPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<StudentSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addKeyword(kw: string) {
    const clean = kw.trim();
    if (clean && !keywords.includes(clean)) {
      setKeywords((k) => [...k, clean]);
    }
    setInputValue('');
  }

  function removeKeyword(kw: string) {
    setKeywords((k) => k.filter((x) => x !== kw));
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const finalKeywords = inputValue.trim() ? [...keywords, inputValue.trim()] : keywords;
    if (!finalKeywords.length) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await studentsApi.search(finalKeywords.join(','));
      setResults(data.results);
      setKeywords(finalKeywords);
      setInputValue('');
    } catch (err) {
      setError(getErrorMessage(err, 'Search failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Talent Search"
        subtitle="Search students by skill, GitHub language, or hackathon project tag."
      />

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-line-strong)] bg-white p-2 focus-within:ring-2 focus-within:ring-[var(--color-primary-tint)]">
          <Search size={16} className="ml-2 shrink-0 text-[var(--color-text-muted)]" />
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 rounded-md bg-[var(--color-primary-tint)] px-2 py-1 text-sm font-medium text-[var(--color-primary)]"
            >
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-[var(--color-signal-rejected)]">
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={keywords.length ? 'Add another keyword…' : 'e.g. AIML, Frontend, React'}
            className="min-w-[160px] flex-1 border-none bg-transparent px-1 py-1 text-sm outline-none"
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Try:</span>
          {SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => addKeyword(kw)}
              className="rounded-md border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary-vivid)] hover:text-[var(--color-primary-vivid)]"
            >
              {kw}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="mb-4 text-sm text-[var(--color-signal-rejected)]">{error}</p>}

      {results === null ? (
        <EmptyState
          title="Search for your next hire"
          description="Add one or more keywords above — matching students are ranked by skill overlap, GitHub language match, and hackathon project tags."
        />
      ) : results.length === 0 ? (
        <EmptyState title="No matches" description="Try broader or different keywords." />
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            {results.length} student{results.length === 1 ? '' : 's'} matched
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((student) => (
              <StudentCard key={student.id} student={student} scoreLabel="Match" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
