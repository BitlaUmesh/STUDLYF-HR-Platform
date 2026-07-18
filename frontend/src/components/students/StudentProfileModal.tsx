"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Code2, Link as LinkIcon, Globe, Star, FolderGit2, ExternalLink, FileText, Loader2, UserPlus, Check } from "lucide-react";
import { getStudentProfile, StudentProfile } from "@/lib/studentsApi";
import { fetchAPI } from "@/lib/api";
import { inviteStudent } from "@/lib/pipelineApi";
import { getLanguageColor } from "@/lib/githubLanguageColors";

interface StudentProfileModalProps {
  studentId: string | null;
  onClose: () => void;
}

export default function StudentProfileModal({ studentId, onClose }: StudentProfileModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<"offer" | "joining" | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<"idle" | "inviting" | "invited" | "error">("idle");

  useEffect(() => {
    if (!studentId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setGenerateError(null);
    setGeneratingType(null);
    setInviteState("idle");

    getStudentProfile(studentId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    document.body.style.overflow = studentId ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [studentId]);

  const handleInvite = async () => {
    if (!studentId || inviteState === "inviting" || inviteState === "invited") return;
    setInviteState("inviting");
    try {
      await inviteStudent(studentId);
      setInviteState("invited");
    } catch {
      setInviteState("error");
    }
  };

  const handleGenerateDocument = async (type: "offer" | "joining") => {
    if (!profile || generatingType) return;
    setGeneratingType(type);
    setGenerateError(null);

    try {
      const doc = await fetchAPI("/api/documents/create", {
        method: "POST",
        body: JSON.stringify({
          title: `${type === "offer" ? "Offer" : "Joining"} Letter - ${profile.name}`,
          type,
          status: "draft",
          // Required by the backend schema even when empty — the builder fills this in.
          contentJSON: { html: "" },
          candidateDetails: {
            candidateName: profile.name,
            candidateEmail: profile.email,
            // Not collected on the student profile — left blank for HR to fill in,
            // rather than guessing at real personal/compensation details.
            candidatePhone: "",
            candidateAddress: "",
            jobTitle: "",
            companyName: "Studlyf Inc.",
            salary: "",
            joiningDate:
              type === "joining"
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : "",
          },
        }),
      });

      router.push(`/dashboard/builder/${doc.id}`);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to create document");
      setGeneratingType(null);
    }
  };

  if (!studentId) return null;

  const topLanguageEntries = Object.entries(profile?.githubStats?.topLanguages || {}).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[95%] max-w-3xl max-h-[90vh] bg-[#F9FAFB] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
          <div className="flex items-center gap-2">
            {profile && !isLoading && !error && (
              <>
                <button
                  onClick={handleInvite}
                  disabled={inviteState === "inviting" || inviteState === "invited"}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                    inviteState === "invited"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                  }`}
                >
                  {inviteState === "inviting" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : inviteState === "invited" ? (
                    <Check size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {inviteState === "invited" ? "Invited" : "Invite to Pipeline"}
                </button>
                <button
                  onClick={() => handleGenerateDocument("offer")}
                  disabled={generatingType !== null}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {generatingType === "offer" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  Offer Letter
                </button>
                <button
                  onClick={() => handleGenerateDocument("joining")}
                  disabled={generatingType !== null}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {generatingType === "joining" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  Joining Letter
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {generateError && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm font-medium px-6 py-2.5">
            {generateError}
          </div>
        )}

        {inviteState === "error" && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm font-medium px-6 py-2.5">
            Couldn&apos;t invite this student — they may already be in your pipeline.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-24 text-slate-500">
              <p className="font-semibold text-slate-900 mb-1">Couldn&apos;t load this profile</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {profile && !isLoading && !error && (
            <div className="flex flex-col gap-6">
              {/* Identity */}
              <div className="flex items-center gap-4">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center">
                    {profile.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                </div>
                <div className="ml-auto bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full text-sm">
                  Score {profile.score}
                </div>
              </div>

              {profile.bio && <p className="text-slate-600 leading-relaxed">{profile.bio}</p>}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {profile.githubUsername && (
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    <Code2 size={14} /> {profile.githubUsername}
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    <LinkIcon size={14} /> LinkedIn
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
                  >
                    <Globe size={14} /> Portfolio
                  </a>
                )}
              </div>

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests — renders once the backend adds this field to the student profile */}
              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Interests
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/5 text-primary"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* GitHub language breakdown */}
              {topLanguageEntries.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Most Used Languages
                  </h4>
                  <div className="flex flex-col gap-2">
                    {topLanguageEntries.map(([lang, pct]) => (
                      <div key={lang} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 w-28 shrink-0 truncate flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getLanguageColor(lang) }}
                          />
                          {lang}
                        </span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct as number, 100)}%`,
                              backgroundColor: getLanguageColor(lang),
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 w-10 text-right">
                          {Math.round(pct as number)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  {profile.githubStats && (
                    <div className="flex gap-4 mt-3 text-xs font-medium text-slate-500">
                      <span>{profile.githubStats.totalRepos} repos</span>
                      <span>{profile.githubStats.totalStars} stars</span>
                      <span>{profile.githubStats.totalCommits} commits</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hackathon projects */}
              {profile.projects?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Hackathon Projects
                  </h4>
                  <div className="flex flex-col gap-3">
                    {profile.projects.map((project) => (
                      <div
                        key={project.id}
                        className="bg-white border border-slate-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderGit2 size={16} className="text-slate-400 shrink-0" />
                            <h5 className="font-bold text-slate-900 truncate">{project.name}</h5>
                          </div>
                          {project.juryRating !== null && (
                            <div className="shrink-0 flex items-center gap-1 text-amber-600 font-bold text-sm">
                              <Star size={14} fill="currentColor" />
                              {project.juryRating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        {project.hackathonName && (
                          <p className="text-xs font-medium text-slate-400 mt-1">
                            {project.hackathonName}
                          </p>
                        )}
                        {project.description && (
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        {project.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {project.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3 mt-3">
                          {project.repoUrl && (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              Repo <ExternalLink size={11} />
                            </a>
                          )}
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              Demo <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
