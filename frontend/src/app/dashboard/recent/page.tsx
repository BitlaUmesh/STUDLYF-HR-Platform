"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileText, ArrowRight, Edit3, Trash2, Loader2, Calendar } from "lucide-react";
import { fetchAPI } from "@/lib/api";

export default function RecentEditsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      // Fetch all documents - they are sorted by updatedAt DESC in the backend
      const data = await fetchAPI("/api/documents/");
      setDocuments(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load documents for recent edits", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        setDeletingId(docId);
        await fetchAPI(`/api/documents/delete/${docId}`, {
          method: "DELETE",
        });
        setDocuments(documents.filter((doc) => doc.id !== docId));
      } catch (err) {
        console.error("Failed to delete document", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Clock size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recent Edits</h1>
            <p className="text-slate-500 mt-1">Quick access to the letters you have worked on most recently.</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-20 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading recently edited documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 mb-5 text-slate-400">
            <Clock size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">No edit history found</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm mt-2 mb-6 leading-relaxed">
            You haven't edited any documents yet. Create one or select a template to get started.
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.slice(0, 10).map((doc) => (
            <div
              key={doc.id}
              onClick={() => window.location.href = `/dashboard/builder/${doc.id}`}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-350 shadow-sm hover:shadow-md transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-950 text-base group-hover:text-primary transition-colors">
                      {doc.title || "Untitled Document"}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-650 rounded">
                      {doc.type === "offer" ? "Offer Letter" : "Joining Letter"}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${doc.status === "completed" ? "bg-emerald-100 text-emerald-700" : ""}
                      ${doc.status === "draft" ? "bg-amber-100 text-amber-700" : ""}
                      ${doc.status === "exported" ? "bg-blue-100 text-blue-700" : ""}
                    `}>
                      {doc.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {doc.candidateDetails?.candidateName ? (
                      <span>Candidate: <span className="text-slate-700 font-semibold">{doc.candidateDetails.candidateName}</span> ({doc.candidateDetails.candidateEmail || "No Email"})</span>
                    ) : (
                      "No Candidate Details Provided"
                    )}
                  </p>
                </div>
              </div>

              {/* Timing & Action Section */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-50 sm:border-t-0 pt-3 sm:pt-0">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold">{getRelativeTime(doc.updatedAt)}</span>
                </div>
                
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/builder/${doc.id}`}
                    className="p-2.5 text-slate-500 hover:text-primary hover:bg-slate-150 rounded-xl transition-all"
                    title="Edit Document"
                  >
                    <Edit3 size={16} />
                  </Link>
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Document"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 size={16} className="animate-spin text-red-500" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
