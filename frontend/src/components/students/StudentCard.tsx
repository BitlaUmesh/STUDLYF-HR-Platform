"use client";

import React, { useState } from "react";
import { Code2, FolderGit2, Star, UserPlus, Check, Loader2 } from "lucide-react";
import { StudentSearchResult } from "@/lib/studentsApi";
import { getLanguageColor } from "@/lib/githubLanguageColors";
import { inviteStudent } from "@/lib/pipelineApi";

interface StudentCardProps {
  student: StudentSearchResult;
  onViewProfile: (studentId: string) => void;
}

export default function StudentCard({ student, onViewProfile }: StudentCardProps) {
  const [inviteState, setInviteState] = useState<"idle" | "inviting" | "invited" | "error">(
    "idle"
  );

  const handleInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inviteState === "inviting" || inviteState === "invited") return;
    setInviteState("inviting");
    try {
      await inviteStudent(student.id);
      setInviteState("invited");
    } catch {
      setInviteState("error");
    }
  };
  const topLanguageEntries = Object.entries(student.topLanguages || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  const initials = student.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200 p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {student.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{student.name}</h3>
            {student.githubUsername && (
              <a
                href={`https://github.com/${student.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-500 hover:text-primary flex items-center gap-1 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                <Code2 size={12} />
                {student.githubUsername}
              </a>
            )}
          </div>
        </div>

        <div
          className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full"
          title="Keyword match score"
        >
          {student.matchScore} match
        </div>
      </div>

      {/* Bio */}
      {student.bio && (
        <p className="text-sm text-slate-500 mt-3 line-clamp-2">{student.bio}</p>
      )}

      {/* Skills */}
      {student.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {student.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Top languages */}
      {topLanguageEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {topLanguageEntries.map(([lang, pct]) => (
            <span
              key={lang}
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-50 text-slate-600"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(lang) }}
              />
              {lang} {Math.round(pct as number)}%
            </span>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <FolderGit2 size={14} className="text-slate-400" />
          {student.projectCount} project{student.projectCount === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-slate-400" />
          Score {student.leaderboardScore.toFixed(1)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onViewProfile(student.id)}
          className="flex-1 py-2.5 bg-slate-900 hover:bg-primary text-white rounded-xl text-sm font-semibold transition-colors"
        >
          View Full Profile
        </button>
        <button
          onClick={handleInvite}
          disabled={inviteState === "inviting" || inviteState === "invited"}
          title={inviteState === "invited" ? "Invited" : "Invite to Pipeline"}
          className={`shrink-0 w-11 flex items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed ${
            inviteState === "invited"
              ? "bg-emerald-50 text-emerald-600"
              : inviteState === "error"
              ? "bg-red-50 text-red-500"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
        >
          {inviteState === "inviting" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : inviteState === "invited" ? (
            <Check size={16} />
          ) : (
            <UserPlus size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
