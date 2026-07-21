import { Link } from 'react-router-dom';
import { Code2, Star, FolderGit2, ArrowUpRight } from 'lucide-react';
import { LanguageFingerprint } from './LanguageFingerprint';
import type { StudentSearchResult, LeaderboardEntry } from '../../api/students';

type Props = {
  student: StudentSearchResult | LeaderboardEntry;
  rank?: number;
  scoreLabel?: string;
  score?: number;
};

export function StudentCard({ student, rank, scoreLabel = 'Match', score }: Props) {
  const displayScore = score ?? ('matchScore' in student ? student.matchScore : student.score);

  return (
    <div className="b2b-card b2b-card-hover p-5 flex flex-col justify-between gap-4 group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {rank && (
              <span className="font-mono-data text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                #{rank}
              </span>
            )}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 shrink-0">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                student.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <Link to={`/students/${student.id}`} className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                <span>{student.name}</span>
                <ArrowUpRight size={13} className="text-slate-400 group-hover:text-indigo-600 transition-all" />
              </Link>
              {student.githubUsername && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <Code2 size={12} className="text-slate-400" /> @{student.githubUsername}
                </p>
              )}
            </div>
          </div>

          <div className="text-right bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <p className="font-mono-data text-sm font-bold text-indigo-600">
              {displayScore?.toFixed?.(0) ?? displayScore}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{scoreLabel}</p>
          </div>
        </div>

        {student.bio && <p className="line-clamp-2 text-xs text-slate-600 font-normal mt-3">{student.bio}</p>}

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {student.skills?.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <LanguageFingerprint topLanguages={student.topLanguages} compact />

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <FolderGit2 size={13} className="text-slate-400" /> {student.projectCount} project{student.projectCount === 1 ? '' : 's'}
          </span>
          {'totalStars' in student && (
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <Star size={13} className="fill-amber-400 text-amber-400" /> {student.totalStars} stars
            </span>
          )}
          <Link
            to={`/students/${student.id}`}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View Candidate
          </Link>
        </div>
      </div>
    </div>
  );
}
