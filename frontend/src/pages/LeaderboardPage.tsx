import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, Code2, Layers } from 'lucide-react';

/** Inline GitHub mark — lucide-react v1+ removed the Github icon */
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { studentsApi, type LeaderboardEntry } from '../api/students';
import { PageHeader, Avatar, Badge, Skeleton } from '../components/ui';

const RANK_CONFIG = [
  { medal: '🥇', label: '1st', ring: 'rank-gold',   bg: 'from-amber-50 to-orange-50',   border: 'border-amber-300',  text: 'text-amber-700', size: 'lg' as const },
  { medal: '🥈', label: '2nd', ring: 'rank-silver',  bg: 'from-slate-50 to-gray-50',     border: 'border-slate-300',  text: 'text-slate-600', size: 'md' as const },
  { medal: '🥉', label: '3rd', ring: 'rank-bronze',  bg: 'from-orange-50 to-amber-50',   border: 'border-orange-300', text: 'text-orange-700', size: 'md' as const },
];

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const cfg = RANK_CONFIG[rank - 1];
  const isPrimary = rank === 1;

  return (
    <Link
      to={`/students/${entry.id}`}
      className={`group flex flex-col items-center rounded-2xl border-2 ${cfg.border} bg-gradient-to-b ${cfg.bg} p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        isPrimary ? 'lg:scale-105 shadow-lg' : ''
      }`}
    >
      <div className="mb-3 text-4xl animate-fade-in">{cfg.medal}</div>
      <Avatar
        src={entry.avatarUrl}
        name={entry.name}
        size={cfg.size}
        className={isPrimary ? '' : ''}
      />
      <p className={`mt-3 font-display text-base font-bold text-[var(--color-ink)] ${isPrimary ? 'text-lg' : ''}`}>
        {entry.name}
      </p>
      {entry.githubUsername && (
        <a
          href={`https://github.com/${entry.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        >
          <GithubIcon size={11} />
          {entry.githubUsername}
        </a>
      )}

      {/* Score */}
      <div className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 ${isPrimary ? 'bg-amber-100' : 'bg-white/80'}`}>
        <Trophy size={13} className={cfg.text} />
        <span className={`text-sm font-bold ${cfg.text}`}>{entry.score.toFixed(1)}</span>
        <span className="text-xs text-[var(--color-text-muted)]">pts</span>
      </div>

      {/* Stats chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {entry.totalStars > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/80 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <Star size={10} /> {entry.totalStars}
          </span>
        )}
        {entry.totalRepos > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
            <Code2 size={10} /> {entry.totalRepos} repos
          </span>
        )}
        {entry.projectCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/80 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            <Layers size={10} /> {entry.projectCount} projects
          </span>
        )}
      </div>

      {entry.skills?.slice(0, 3).map((skill) => (
        <Badge key={skill} color="indigo" className="mt-1.5 text-[10px]">{skill}</Badge>
      ))}
    </Link>
  );
}

function RankRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  return (
    <Link
      to={`/students/${entry.id}`}
      className="group flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-white p-4 transition-all hover:border-[var(--color-primary)] hover:shadow-sm hover:-translate-y-0.5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-canvas-dark)] font-display text-sm font-bold text-[var(--color-text-muted)]">
        {rank}
      </div>
      <Avatar src={entry.avatarUrl} name={entry.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">{entry.name}</p>
        {entry.githubUsername && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <GithubIcon size={10} /> {entry.githubUsername}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Trophy size={14} className="text-amber-500" />
        <span className="text-sm font-bold text-[var(--color-ink)]">{entry.score.toFixed(1)}</span>
        <span className="text-xs text-[var(--color-text-muted)]">pts</span>
      </div>
    </Link>
  );
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    studentsApi.leaderboard(5).then(({ data }) => setEntries(data.leaderboard));
  }, []);

  const podium = entries?.slice(0, 3) ?? [];
  const rest   = entries?.slice(3) ?? [];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Leaderboard"
        subtitle="Top 5 talent ranked by jury ratings, GitHub activity, project count, and profile completeness."
        action={
          <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
            <Trophy size={16} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">Top 5</span>
          </div>
        }
      />

      {entries === null ? (
        /* ── Loading skeleton ── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-line)] p-6 space-y-3">
                <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">No rankings yet</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Once students join StudLyf and sync GitHub, they'll rank here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Podium (top 3) ── */}
          {podium.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>🏆</span> Top Performers
              </h2>
              {/* Arrange: 2nd | 1st | 3rd on desktop */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Mobile: 1, 2, 3 order. Desktop: reorder via CSS order */}
                {podium[0] && (
                  <div className="md:order-2 animate-fade-in-up">
                    <PodiumCard entry={podium[0]} rank={1} />
                  </div>
                )}
                {podium[1] && (
                  <div className="md:order-1 animate-fade-in-up delay-100">
                    <PodiumCard entry={podium[1]} rank={2} />
                  </div>
                )}
                {podium[2] && (
                  <div className="md:order-3 animate-fade-in-up delay-200">
                    <PodiumCard entry={podium[2]} rank={3} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Ranks 4–5 ── */}
          {rest.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span>📋</span> Also in the Top 5
              </h2>
              <div className="space-y-2 animate-fade-in-up delay-300">
                {rest.map((entry) => (
                  <RankRow key={entry.id} entry={entry} rank={entry.rank} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
