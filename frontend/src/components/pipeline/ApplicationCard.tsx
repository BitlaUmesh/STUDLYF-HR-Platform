"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { Application } from "@/lib/pipelineApi";

interface ApplicationCardProps {
  application: Application;
  onOpen: (application: Application) => void;
}

export default function ApplicationCard({ application, onOpen }: ApplicationCardProps) {
  const { student, meeting } = application;
  const initials = student.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={() => onOpen(application)}
      className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center gap-3">
        {student.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{student.name}</p>
          <p className="text-xs text-slate-500 truncate">{student.email}</p>
        </div>
      </div>

      {student.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {student.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {meeting && (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-primary">
          <Calendar size={12} />
          Meeting {meeting.status}
        </div>
      )}
    </button>
  );
}
