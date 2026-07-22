import { Link } from 'react-router-dom';
import { Star, FolderGit2, ArrowUpRight, Github } from 'lucide-react';
import { LanguageFingerprint } from './LanguageFingerprint';
import type { StudentSearchResult, LeaderboardEntry } from '../../api/students';
import { Avatar, Badge } from '../ui';

type Props = {
  student: StudentSearchResult | LeaderboardEntry;
  rank?: number;
  scoreLabel?: string;
  score?: number;
};

export function StudentCard({ student, rank, scoreLabel = 'Match', score }: Props) {
  const displayScore = score ?? ('matchScore' in student ? student.matchScore : student.score);

  return (
    <div className="b2b-card b2b-card-hover p-5 flex flex-col justify-between gap-4 group rounded-xl border border-slate-200/80 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {rank && (
              <span className="font-mono-data text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                #{rank}
              </span>
            )}
            <Avatar src={student.avatarUrl} name={student.name} size="md" />
            <div className="min-w-0">
              <Link
                to={`/students/${student.id}`}
                className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1 truncate"
              >
                <span className="truncate">{student.name}</span>
                <ArrowUpRight size={14} className="text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              {student.githubUsername && (
                <a
                  href={`https://github.com/${student.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors mt-0.5 truncate"
                >
                  <Github size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">@{student.githubUsername}</span>
                </a>
              )}
            </div>
          </div>

          <div className="text-right bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg shrink-0">
            <p className="font-mono-data text-sm font-bold text-indigo-600">
              {displayScore?.toFixed?.(0) ?? displayScore}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{scoreLabel}</p>
          </div>
        </div>

        {student.bio && <p className="line-clamp-2 text-xs text-slate-600 mt-3 font-normal leading-relaxed">{student.bio}</p>}

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {student.skills?.slice(0, 4).map((skill) => (
            <Badge key={skill} color="indigo" className="text-[11px] font-medium">
              {skill}
            </Badge>
          ))}
          {(student.skills?.length ?? 0) > 4 && (
            <span className="text-[10px] font-semibold text-slate-400 self-center">
              +{(student.skills?.length ?? 0) - 4} more
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <LanguageFingerprint topLanguages={student.topLanguages} compact />

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-slate-600">
            <FolderGit2 size={13} className="text-slate-400" /> {student.projectCount} project{student.projectCount === 1 ? '' : 's'}
          </span>
          {'totalStars' in student && student.totalStars > 0 && (
            <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 text-[11px]">
              <Star size={11} className="fill-amber-400 text-amber-400" /> {student.totalStars} stars
            </span>
          )}
          <Link
            to={`/students/${student.id}`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-auto"
          >
            View Candidate →
          </Link>
        </div>
      </div>
    </div>
  );
}
