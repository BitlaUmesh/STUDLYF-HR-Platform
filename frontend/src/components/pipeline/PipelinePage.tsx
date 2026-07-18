"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Users2 } from "lucide-react";
import { Application, ApplicationStatus, APPLICATION_STATUSES, listApplications } from "@/lib/pipelineApi";
import ApplicationCard from "./ApplicationCard";
import ApplicationDetailModal from "./ApplicationDetailModal";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  invited: "Invited",
  reviewing: "Reviewing",
  questions_sent: "Questions Sent",
  offered: "Offered",
  rejected: "Rejected",
};

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApplicationUpdated = (updated: Application) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setSelected((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] p-8 lg:p-12 pb-24">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hiring Pipeline</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Track invited students through screening, meetings, and offers.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users2 className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No candidates yet</h3>
          <p className="text-slate-500 max-w-sm">
            Invite students from Find Students to start tracking them here.
          </p>
        </div>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {APPLICATION_STATUSES.map((status) => {
            const columnApps = applications.filter((a) => a.status === status);
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    {columnApps.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3 min-h-[80px]">
                  {columnApps.map((app) => (
                    <ApplicationCard key={app.id} application={app} onOpen={setSelected} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApplicationDetailModal
        application={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleApplicationUpdated}
      />
    </div>
  );
}
