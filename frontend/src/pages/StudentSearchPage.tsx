import { useEffect, useState, type FormEvent } from 'react';
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

  async function fetchCandidates(kwList: string[]) {
    setLoading(true);
    setError(null);
    try {
      const queryStr = kwList.join(',');
      const { data } = await studentsApi.search(queryStr);
      setResults(data.results);
    } catch (err) {
      setError(getErrorMessage(err, 'Search failed'));
    } finally {
      setLoading(false);
    }
  }

  // Load all candidates on initial mount
  useEffect(() => {
    fetchCandidates([]);
  }, []);

  function addKeyword(kw: string) {
    const clean = kw.trim();
    if (clean && !keywords.includes(clean)) {
      const nextKw = [...keywords, clean];
      setKeywords(nextKw);
      setInputValue('');
      fetchCandidates(nextKw);
    } else {
      setInputValue('');
    }
  }

  function removeKeyword(kw: string) {
    const nextKw = keywords.filter((x) => x !== kw);
    setKeywords(nextKw);
    fetchCandidates(nextKw);
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
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      setKeywords(finalKeywords);
    }
    setInputValue('');
    fetchCandidates(finalKeywords);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent Search"
        subtitle="Browse all available talent candidates or filter by skill, GitHub language, and hackathon project tag."
      />

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search size={18} className="ml-2 shrink-0 text-slate-400" />
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary border border-primary/20"
            >
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-rose-600 transition-colors">
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={keywords.length ? 'Filter by another keyword…' : 'Filter candidates (e.g. AIML, Frontend, React)'}
            className="min-w-[180px] flex-1 border-none bg-transparent px-2 py-1 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <Button type="submit" size="sm" disabled={loading} className="rounded-xl font-bold">
            {loading ? 'Searching…' : 'Filter Candidates'}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Popular Skills:</span>
          {SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => addKeyword(kw)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-2xs"
            >
              + {kw}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="mb-4 text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">{error}</p>}

      {loading && results === null ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm font-semibold text-slate-400">Loading talent pool...</p>
        </div>
      ) : results === null || results.length === 0 ? (
        <EmptyState title="No candidates found" description="Try broadening or clearing your keyword filters." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {keywords.length ? `Filtered Candidates (${results.length})` : `All Candidates in Talent Pool (${results.length})`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.map((student) => (
              <StudentCard key={student.id} student={student} scoreLabel="Leaderboard Rank" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
