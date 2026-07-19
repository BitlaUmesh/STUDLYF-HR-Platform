import { Link } from 'react-router-dom';
import { Code2, Star, FolderGit2 } from 'lucide-react';
import { Card } from '../ui';
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
    <Card className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {rank && (
            <span className="font-mono-data text-sm font-semibold text-[var(--color-text-muted)]">
              #{rank}
            </span>
          )}
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-tint)] text-sm font-semibold text-[var(--color-primary)]">
            {student.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              student.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <Link to={`/students/${student.id}`} className="font-display text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary-vivid)]">
              {student.name}
            </Link>
            {student.githubUsername && (
              <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Code2 size={12} /> @{student.githubUsername}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono-data text-lg font-semibold text-[var(--color-primary-vivid)]">
            {displayScore?.toFixed?.(0) ?? displayScore}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{scoreLabel}</p>
        </div>
      </div>

      {student.bio && <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{student.bio}</p>}

      <div className="flex flex-wrap gap-1.5">
        {student.skills?.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-[var(--color-primary-tint)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
          >
            {skill}
          </span>
        ))}
      </div>

      <LanguageFingerprint topLanguages={student.topLanguages} compact />

      <div className="flex items-center gap-4 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <FolderGit2 size={13} /> {student.projectCount} project{student.projectCount === 1 ? '' : 's'}
        </span>
        {'totalStars' in student && (
          <span className="flex items-center gap-1">
            <Star size={13} /> {student.totalStars} stars
          </span>
        )}
      </div>
    </Card>
  );
}
