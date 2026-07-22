import { useEffect, useState, type FormEvent } from 'react';
import { Search, X, Sparkles, Filter } from 'lucide-react';
import { studentsApi, type StudentSearchResult } from '../api/students';
import { StudentCard } from '../components/students/StudentCard';
import { Button, PageHeader, EmptyState, Skeleton } from '../components/ui';
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
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader
        title="Talent Search"
        subtitle="Browse all available talent candidates or filter by skill, GitHub language, and hackathon project tag."
        action={
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <Sparkles size={14} className="text-indigo-600" />
            <span>AI Ranked Pool</span>
          </div>
        }
      />

      <form onSubmit={handleSearch} className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all">
          <Search size={18} className="ml-2 shrink-0 text-slate-400" />
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60 animate-fade-in"
            >
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-600 transition-colors ml-0.5">
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={keywords.length ? 'Filter by another keyword…' : 'Filter candidates (e.g. AIML, Frontend, React)'}
            className="min-w-[200px] flex-1 border-none bg-transparent px-2 py-1 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <Button type="submit" size="sm" loading={loading} className="rounded-xl font-bold px-4">
            {!loading && <><Filter size={13} /> Filter Candidates</>}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Skills:</span>
          {SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => addKeyword(kw)}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-2xs cursor-pointer"
            >
              + {kw}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-200">{error}</p>}

      {loading && results === null ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : results === null || results.length === 0 ? (
        <EmptyState title="No candidates found" description="Try broadening or clearing your keyword filters." />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
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
