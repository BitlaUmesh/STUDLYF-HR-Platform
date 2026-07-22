import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, Code2, Layers, Crown } from 'lucide-react';

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
  {
    medal: '🥇',
    rankBadge: '#1 Winner',
    bg: 'from-amber-100/90 via-yellow-50/70 to-amber-50/90',
    border: 'border-amber-400',
    ring: 'ring-4 ring-amber-400/80 shadow-lg',
    pillBg: 'bg-amber-500 text-white shadow-xs',
    text: 'text-amber-900',
    chipBorder: 'border-amber-300/80 bg-amber-50/80 text-amber-900',
    size: 'lg' as const,
    isPrimary: true,
  },
  {
    medal: '🥈',
    rankBadge: '2nd Place',
    bg: 'from-slate-100 via-slate-50 to-indigo-50/30',
    border: 'border-slate-300',
    ring: 'ring-4 ring-slate-300/80 shadow-xs',
    pillBg: 'bg-slate-700 text-white shadow-xs',
    text: 'text-slate-800',
    chipBorder: 'border-slate-200 bg-white text-slate-700',
    size: 'md' as const,
    isPrimary: false,
  },
  {
    medal: '🥉',
    rankBadge: '3rd Place',
    bg: 'from-rose-100/80 via-orange-50/40 to-rose-50/60',
    border: 'border-rose-300',
    ring: 'ring-4 ring-rose-300/80 shadow-xs',
    pillBg: 'bg-rose-600 text-white shadow-xs',
    text: 'text-rose-900',
    chipBorder: 'border-rose-200/80 bg-rose-50/80 text-rose-900',
    size: 'md' as const,
    isPrimary: false,
  },
];

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const cfg = RANK_CONFIG[rank - 1];

  return (
    <Link
      to={`/students/${entry.id}`}
      className={`group flex flex-col items-center rounded-2xl border-2 ${cfg.border} bg-gradient-to-b ${cfg.bg} p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden ${
        cfg.isPrimary ? 'lg:scale-105 shadow-xl ring-2 ring-amber-400/40' : 'shadow-md'
      }`}
    >
      {/* Winner Crown Banner for 1st Place */}
      {cfg.isPrimary && (
        <div className="absolute -top-1 font-bold text-[10px] uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-0.5 rounded-b-lg shadow-xs flex items-center gap-1">
          <Crown size={11} className="fill-white" /> Overall #1 Winner
        </div>
      )}

      <div className="mb-3 text-4xl pt-2 animate-fade-in">{cfg.medal}</div>
      
      <Avatar
        src={entry.avatarUrl}
        name={entry.name}
        size={cfg.size}
        className={cfg.ring}
      />

      <p className={`mt-3.5 font-display font-black text-slate-900 leading-tight ${cfg.isPrimary ? 'text-xl' : 'text-base'}`}>
        {entry.name}
      </p>

      {entry.githubUsername && (
        <a
          href={`https://github.com/${entry.githubUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <GithubIcon size={11} />
          @{entry.githubUsername}
        </a>
      )}

      {/* Score Pill */}
      <div className={`mt-3.5 flex items-center gap-1.5 rounded-full px-3.5 py-1 ${cfg.pillBg}`}>
        <Trophy size={13} />
        <span className="text-sm font-black">{entry.score.toFixed(1)}</span>
        <span className="text-[10px] font-bold opacity-80">pts</span>
      </div>

      {/* Stats chips */}
      <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
        {entry.totalStars > 0 && (
          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.chipBorder}`}>
            <Star size={11} className="fill-amber-400 text-amber-400" /> {entry.totalStars}
          </span>
        )}
        {entry.totalRepos > 0 && (
          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.chipBorder}`}>
            <Code2 size={11} /> {entry.totalRepos} repos
          </span>
        )}
        {entry.projectCount > 0 && (
          <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.chipBorder}`}>
            <Layers size={11} /> {entry.projectCount} projects
          </span>
        )}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap justify-center gap-1 mt-2.5">
        {entry.skills?.slice(0, 3).map((skill) => (
          <Badge key={skill} color="indigo" className="text-[10px] font-semibold">{skill}</Badge>
        ))}
      </div>
    </Link>
  );
}

function RankRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  return (
    <Link
      to={`/students/${entry.id}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-display text-xs font-black text-slate-500">
        #{rank}
      </div>
      <Avatar src={entry.avatarUrl} name={entry.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{entry.name}</p>
        {entry.githubUsername && (
          <p className="flex items-center gap-1 text-xs font-medium text-slate-400 mt-0.5">
            <GithubIcon size={10} /> @{entry.githubUsername}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200/70 px-3 py-1 rounded-full">
        <Trophy size={13} className="text-amber-500" />
        <span className="text-sm font-black text-slate-900">{entry.score.toFixed(1)}</span>
        <span className="text-[10px] font-bold text-slate-400">pts</span>
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
    <div className="space-y-8 pb-12 animate-fade-in">
      <PageHeader
        title="Leaderboard"
        subtitle="Top 5 talent ranked by jury ratings, GitHub activity, project count, and profile completeness."
        action={
          <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
            <Trophy size={16} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Top 5 Performers</span>
          </div>
        }
      />

      {entries === null ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6 space-y-3">
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
          <h3 className="font-display text-lg font-bold text-slate-900">No rankings yet</h3>
          <p className="mt-2 text-xs text-slate-500">Once students join StudLyf and sync GitHub, they'll rank here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Podium (top 3) ── */}
          {podium.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>🏆</span> Top 3 Performers
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3 items-end">
                {/* Desktop layout: 2nd place | 1st place | 3rd place */}
                {podium[1] && (
                  <div className="md:order-1 animate-fade-in-up delay-100">
                    <PodiumCard entry={podium[1]} rank={2} />
                  </div>
                )}
                {podium[0] && (
                  <div className="md:order-2 animate-fade-in-up">
                    <PodiumCard entry={podium[0]} rank={1} />
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
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>📋</span> Also in the Top 5
              </h2>
              <div className="space-y-2.5 animate-fade-in-up delay-300">
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
