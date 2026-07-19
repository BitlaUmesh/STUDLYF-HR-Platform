import { useEffect, useState } from 'react';
import { studentsApi, type LeaderboardEntry } from '../api/students';
import { StudentCard } from '../components/students/StudentCard';
import { PageHeader, EmptyState } from '../components/ui';

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    studentsApi.leaderboard(50).then(({ data }) => setEntries(data.leaderboard));
  }, []);

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Ranked by hackathon jury ratings, GitHub activity, project count, and profile completeness."
      />

      {entries === null ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : entries.length === 0 ? (
        <EmptyState title="No students yet" description="Once students join StudLyf and sync GitHub, they'll rank here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <StudentCard key={entry.id} student={entry} rank={entry.rank} scoreLabel="Score" score={entry.score} />
          ))}
        </div>
      )}
    </div>
  );
}
