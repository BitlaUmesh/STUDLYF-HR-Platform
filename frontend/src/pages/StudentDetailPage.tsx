import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Link2, Globe, Star, GitFork, Code2, RefreshCw, 
  UserPlus, ExternalLink, Mail, FileText, CheckCircle2, Award 
} from 'lucide-react';
import { studentsApi, type StudentDetail } from '../api/students';
import { applicationsApi } from '../api/applications';
import { LanguageFingerprint } from '../components/students/LanguageFingerprint';
import { Button } from '../components/ui';
import { getErrorMessage } from '../api/client';
import { useDocumentBuilderStore } from '../store/documentBuilderStore';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const { updateCandidateDetails, setDocumentType } = useDocumentBuilderStore();

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
      setMessage({ text: 'GitHub profile synced successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: getErrorMessage(err, 'Sync failed'), type: 'error' });
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
      setStudent((prev) => (prev ? { ...prev, isInvited: true } : prev));
      setMessage({ text: 'Candidate successfully invited! Check the Hiring Pipeline.', type: 'success' });
    } catch (err) {
      const errMsg = getErrorMessage(err, 'Could not invite candidate');
      if (errMsg.toLowerCase().includes('already applied')) {
        setStudent((prev) => (prev ? { ...prev, isInvited: true } : prev));
      } else {
        setMessage({ text: errMsg, type: 'error' });
      }
    } finally {
      setInviting(false);
    }
  }

  const handleCreateDocument = (type: 'offer' | 'joining') => {
    if (!student) return;
    setDocumentType(type);
    updateCandidateDetails({
      candidateName: student.name,
      candidateEmail: student.email,
      candidateAddress: 'Hyderabad, India',
    });
    navigate('/documents/new');
  };

  if (!student) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <RefreshCw size={24} className="animate-spin text-primary" />
        <p className="text-sm font-semibold text-slate-500">Loading candidate dossier...</p>
      </div>
    );
  }

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Talent List
      </button>

      {/* Toast Notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold animate-in fade-in duration-200 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : null}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 left-0 h-32 w-full bg-gradient-to-r from-primary via-indigo-600 to-secondary opacity-15" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between pt-6">
          {/* Left: Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 ring-4 ring-white shadow-md">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary/10 text-2xl font-black text-primary">
                  {initials}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Award size={12} /> Score: {student.score.toFixed(0)} / 100
                </span>
              </div>

              <p className="text-sm font-medium text-slate-500 max-w-xl">
                {student.bio || 'Passionate software developer and hackathon builder.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {student.email}
                </span>
                {student.githubUsername && (
                  <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                    <Code2 size={14} /> @{student.githubUsername}
                  </a>
                )}
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                    <Link2 size={14} /> LinkedIn
                  </a>
                )}
                {student.portfolioUrl && (
                  <a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                    <Globe size={14} /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing} className="rounded-xl">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sync GitHub
            </Button>
            
            {student.isInvited ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Candidate Invited
              </span>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleInvite} disabled={inviting} className="rounded-xl">
                <UserPlus size={14} />
                {inviting ? 'Inviting…' : 'Invite Candidate'}
              </Button>
            )}

            <button
              onClick={() => handleCreateDocument('offer')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
            >
              <FileText size={14} />
              Generate Offer Letter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Code Profile & Projects */}
        <div className="space-y-6 lg:col-span-2">
          {/* GitHub Stats Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Code2 size={18} className="text-primary" /> GitHub Code Profile
            </h3>

            <LanguageFingerprint topLanguages={student.githubStats?.topLanguages || {}} />

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-black text-slate-900">{student.githubStats?.totalRepos ?? 0}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Repositories</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-black text-amber-600 flex items-center justify-center gap-1">
                  <Star size={16} fill="currentColor" /> {student.githubStats?.totalStars ?? 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Stars</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xl font-black text-indigo-600 flex items-center justify-center gap-1">
                  <GitFork size={16} /> {student.githubStats?.totalForks ?? 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Forks</p>
              </div>
            </div>
          </div>

          {/* Hackathon Projects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Hackathon Projects ({student.projects.length})
              </h3>
            </div>

            {student.projects.length === 0 ? (
              <div className="p-6 text-center text-sm font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No projects recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {student.projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-200 p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{project.name}</h4>
                        {project.hackathonName && (
                          <p className="text-xs font-semibold text-primary mt-0.5">{project.hackathonName}</p>
                        )}
                      </div>
                      {project.juryRating != null && (
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                          ⭐ {project.juryRating.toFixed(1)} / 10
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">{project.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {project.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {tag}
                        </span>
                      ))}

                      <div className="ml-auto flex items-center gap-3">
                        {project.repoUrl && (
                          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                            Repo <ExternalLink size={12} />
                          </a>
                        )}
                        {project.demoUrl && (
                          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                            Demo <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Skills & Summary */}
        <div className="space-y-6">
          {/* Skills Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((s) => (
                <span key={s} className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Offer Generation Box */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white shadow-md space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Ready to Hire?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Create an official offer or joining letter for {student.name} with pre-filled candidate info in 1 click.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleCreateDocument('offer')}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Draft Offer Letter
              </button>
              <button
                onClick={() => handleCreateDocument('joining')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Draft Joining Letter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
