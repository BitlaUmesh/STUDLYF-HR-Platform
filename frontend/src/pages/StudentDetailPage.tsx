import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Link2, Globe, Star, GitFork, Code2, RefreshCw, 
  UserPlus, FileText, CheckCircle2, Award, Mail
} from 'lucide-react';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

import { studentsApi, type StudentDetail } from '../api/students';
import { applicationsApi } from '../api/applications';
import { LanguageFingerprint } from '../components/students/LanguageFingerprint';
import { Button, Avatar, Badge } from '../components/ui';
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
        <RefreshCw size={24} className="animate-spin text-indigo-600" />
        <p className="text-sm font-bold text-slate-500">Loading candidate dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Talent List
      </button>

      {/* Toast Notification */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : null}
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 left-0 h-32 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 opacity-15" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between pt-4">
          {/* Left: Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <Avatar src={student.avatarUrl} name={student.name} size="xl" className="ring-4 ring-white shadow-md" />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-display">{student.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Award size={13} /> Score: {student.score.toFixed(0)} / 100
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 max-w-xl leading-relaxed">
                {student.bio || 'Passionate software developer and hackathon builder.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" /> {student.email}
                </span>
                {student.githubUsername && (
                  <a href={`https://github.com/${student.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                    <GithubIcon size={14} /> @{student.githubUsername}
                  </a>
                )}
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                    <Link2 size={14} /> LinkedIn
                  </a>
                )}
                {student.portfolioUrl && (
                  <a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                    <Globe size={14} /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing} className="rounded-xl">
              {!syncing && <RefreshCw size={14} />}
              Sync GitHub
            </Button>
            
            {student.isInvited ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Candidate Invited
              </span>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleInvite} loading={inviting} className="rounded-xl">
                {!inviting && <UserPlus size={14} />}
                {inviting ? 'Inviting…' : 'Invite Candidate'}
              </Button>
            )}

            <button
              onClick={() => handleCreateDocument('offer')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer"
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
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 font-display">
              <Code2 size={18} className="text-indigo-600" /> GitHub Code Profile
            </h3>

            <LanguageFingerprint topLanguages={student.githubStats?.topLanguages || {}} />

            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <p className="text-2xl font-black text-slate-900 font-display">{student.githubStats?.totalRepos ?? 0}</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Repositories</p>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
                <p className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1 font-display">
                  <Star size={18} fill="currentColor" /> {student.githubStats?.totalStars ?? 0}
                </p>
                <p className="text-xs font-bold text-amber-700 mt-0.5">Stars</p>
              </div>
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/60">
                <p className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1 font-display">
                  <GitFork size={18} /> {student.githubStats?.totalForks ?? 0}
                </p>
                <p className="text-xs font-bold text-indigo-700 mt-0.5">Forks</p>
              </div>
            </div>
          </div>

          {/* Hackathon Projects */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Hackathon Projects ({student.projects.length})
              </h3>
            </div>

            {student.projects.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No hackathon projects recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {student.projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-slate-200/80 p-4.5 hover:border-indigo-300 transition-colors bg-slate-50/40 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{project.name}</h4>
                        {project.hackathonName && (
                          <p className="text-xs font-semibold text-indigo-600 mt-0.5">{project.hackathonName}</p>
                        )}
                      </div>
                      {project.juryRating && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 shrink-0">
                          <Star size={11} className="fill-amber-400 text-amber-400" /> {project.juryRating} / 10
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.tags.map((tag) => (
                          <Badge key={tag} color="indigo" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Skills & Application Status */}
        <div className="space-y-6">
          {/* Skill Set */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Technical Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {student.skills.map((skill) => (
                <Badge key={skill} color="indigo" className="text-xs py-1 px-3">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-display">Candidate Dossier Actions</h3>
            <button
              onClick={() => handleCreateDocument('offer')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <FileText size={14} /> Generate Offer Letter
            </button>
            <button
              onClick={() => handleCreateDocument('joining')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText size={14} /> Generate Joining Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
