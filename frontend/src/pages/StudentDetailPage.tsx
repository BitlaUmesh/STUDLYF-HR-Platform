import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link2, Globe, Star, GitFork, Code2, RefreshCw, UserPlus, ExternalLink } from 'lucide-react';
import { studentsApi, type StudentDetail } from '../api/students';
import { applicationsApi } from '../api/applications';
import { LanguageFingerprint } from '../components/students/LanguageFingerprint';
import { Card, Button, PageHeader } from '../components/ui';
import { getErrorMessage } from '../api/client';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    if (!id) return;
    studentsApi.getById(id).then(({ data }) => setStudent(data));
  }

  useEffect(load, [id]);

  async function handleSync() {
    if (!id) return;
    setSyncing(true);
    try {
      await studentsApi.syncGithub(id);
      load();
    } catch (err) {
      setMessage(getErrorMessage(err, 'Sync failed'));
    } finally {
      setSyncing(false);
    }
  }

  async function handleInvite() {
    if (!id) return;
    setInviting(true);
    setMessage(null);
    try {
      await applicationsApi.invite(id);
      setMessage('Invited — see them in the Pipeline.');
    } catch (err) {
      setMessage(getErrorMessage(err, 'Could not invite this student'));
    } finally {
      setInviting(false);
    }
  }

  if (!student) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary-vivid)]">
        ← Back
      </button>

      <PageHeader
        title={student.name}
        subtitle={student.bio || undefined}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sync GitHub
            </Button>
            <Button size="sm" onClick={handleInvite} disabled={inviting}>
              <UserPlus size={14} />
              {inviting ? 'Inviting…' : 'Invite to pipeline'}
            </Button>
          </div>
        }
      />

      {message && <p className="mb-4 text-sm text-[var(--color-primary-vivid)]">{message}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-[var(--color-ink)]">
              <Code2 size={16} /> GitHub language profile
            </h3>
            <LanguageFingerprint topLanguages={student.githubStats?.topLanguages || {}} />
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--color-line)] pt-4 text-center">
              <div>
                <p className="font-mono-data text-lg font-semibold">{student.githubStats?.totalRepos ?? 0}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Repos</p>
              </div>
              <div>
                <p className="font-mono-data text-lg font-semibold flex items-center justify-center gap-1">
                  <Star size={14} /> {student.githubStats?.totalStars ?? 0}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Stars</p>
              </div>
              <div>
                <p className="font-mono-data text-lg font-semibold flex items-center justify-center gap-1">
                  <GitFork size={14} /> {student.githubStats?.totalForks ?? 0}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Forks</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-[var(--color-ink)]">
              Hackathon projects ({student.projects.length})
            </h3>
            {student.projects.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No projects recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {student.projects.map((project) => (
                  <div key={project.id} className="rounded-lg border border-[var(--color-line)] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-ink)]">{project.name}</p>
                        {project.hackathonName && (
                          <p className="text-xs text-[var(--color-text-muted)]">{project.hackathonName}</p>
                        )}
                      </div>
                      {project.juryRating != null && (
                        <span className="rounded-md bg-[var(--color-primary-tint)] px-2 py-1 font-mono-data text-xs font-semibold text-[var(--color-primary)]">
                          {project.juryRating.toFixed(1)} / 10
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{project.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                          {tag}
                        </span>
                      ))}
                      {project.repoUrl && (
                        <a href={project.repoUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs text-[var(--color-primary-vivid)] hover:underline">
                          Repo <ExternalLink size={11} />
                        </a>
                      )}
                      {project.demoUrl && (
                        <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-[var(--color-primary-vivid)] hover:underline">
                          Demo <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-display text-sm font-semibold text-[var(--color-ink)]">Profile</h3>
            <div className="mb-4 text-center">
              <p className="font-mono-data text-3xl font-semibold text-[var(--color-primary-vivid)]">
                {student.score.toFixed(0)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Composite score</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Code2 size={14} /> {student.githubUsername ? `@${student.githubUsername}` : 'Not connected'}
              </p>
              {student.linkedinUrl && (
                <a href={student.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[var(--color-primary-vivid)] hover:underline">
                  <Link2 size={14} /> LinkedIn
                </a>
              )}
              {student.portfolioUrl && (
                <a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[var(--color-primary-vivid)] hover:underline">
                  <Globe size={14} /> Portfolio
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--color-line)] pt-4">
              {student.skills.map((s) => (
                <span key={s} className="rounded-md bg-[var(--color-primary-tint)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                  {s}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
