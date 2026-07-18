"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Trash2, Edit3, Search, Plus, Loader2, Sparkles, Filter, FileSignature, Briefcase } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { useDocumentCreation } from "@/hooks/useDocumentCreation";
import EmptyState from "@/components/dashboard/EmptyState";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { createDocument, isCreating } = useDocumentCreation();

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAPI("/api/documents/");
      setDocuments(data || []);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load documents", err);
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

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const titleMatch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const candidateName = doc.candidateDetails?.candidateName || "";
    const candidateMatch = candidateName.toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = titleMatch || candidateMatch;

    if (statusFilter === "all") return searchMatch;
    return searchMatch && doc.status === statusFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Documents</h1>
            <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {documents.length} Total
            </div>
          </div>
          <p className="text-slate-500 mt-1">Manage, edit, and organize all generated offer and joining letters.</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => createDocument("offer")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Briefcase size={16} className="text-blue-500" />
            New Offer
          </button>
          <button
            onClick={() => createDocument("joining")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSignature size={16} className="text-emerald-400" />
            )}
            New Joining
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[480px]">
        
        {/* Search and Filters Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 md:border-b-0 space-x-2">
            {[
              { id: "all", label: "All Documents" },
              { id: "draft", label: "Drafts" },
              { id: "completed", label: "Completed" },
              { id: "exported", label: "Exported" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`pb-2 md:pb-0 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? "bg-white border border-slate-200 shadow-sm text-slate-950 font-bold"
                    : "text-slate-500 hover:text-slate-850 hover:bg-white/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents or candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
            />
          </div>
        </div>

        {/* List Section */}
        <div className="p-6 flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <EmptyState />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <Search className="text-slate-400 w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No matching documents</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs">
                We couldn't find any documents matching &quot;{searchQuery}&quot;. Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Details</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Edited</th>
                    <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="group hover:bg-slate-50/70 transition-all cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/builder/${doc.id}`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
                              {doc.title || "Untitled Document"}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {doc.candidateDetails?.candidateName ? (
                                <span>For: <span className="text-slate-700 font-semibold">{doc.candidateDetails.candidateName}</span> ({doc.candidateDetails.candidateEmail || "No Email"})</span>
                              ) : (
                                "No Candidate Specified"
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {doc.type === "offer" ? "Offer Letter" : "Joining Letter"}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${doc.status === "completed" ? "bg-emerald-100 text-emerald-700" : ""}
                          ${doc.status === "draft" ? "bg-amber-100 text-amber-700" : ""}
                          ${doc.status === "exported" ? "bg-blue-100 text-blue-700" : ""}
                        `}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-500">
                        {new Date(doc.updatedAt).toLocaleDateString()} at {new Date(doc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/builder/${doc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Document"
                          >
                            <Edit3 size={16} />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(e, doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Document"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 size={16} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
