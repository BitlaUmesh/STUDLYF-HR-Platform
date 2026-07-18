"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DocumentWizard from "@/components/builder/DocumentWizard";
import LivePreview from "@/components/builder/LivePreview";
import { useDocumentBuilderStore } from "@/store/documentBuilderStore";
import { fetchAPI } from "@/lib/api";

export default function DocumentBuilderPage() {
  const params = useParams();
  const documentId = params?.id as string;
  const router = useRouter();
  
  const { 
    setDocumentId, 
    setDocumentType, 
    updateCandidateDetails, 
    setContent, 
    setSaveStatus,
    documentType,
    candidateDetails,
    content,
    branding,
    templateConfig,
    saveStatus
  } = useDocumentBuilderStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs for autosave to access latest state without dependency loops
  const stateRef = useRef({
    documentType,
    candidateDetails,
    content,
    branding,
    templateConfig,
    saveStatus
  });

  useEffect(() => {
    stateRef.current = {
      documentType,
      candidateDetails,
      content,
      branding,
      templateConfig,
      saveStatus
    };
  }, [documentType, candidateDetails, content, branding, templateConfig, saveStatus]);

  // Initial Fetch
  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const doc = await fetchAPI(`/api/documents/${documentId}`);
        
        setDocumentId(doc.id);
        setDocumentType(doc.type === 'JOINING_LETTER' ? 'joining' : 'offer');
        updateCandidateDetails(doc.candidateDetails);
        setContent(doc.contentJSON?.html || doc.contentJSON || "");
        // Optional: restore branding and templateConfig if they exist in DB later
        
        setSaveStatus('Saved');
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load document", err);
        setError("Failed to load document. It may have been deleted.");
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, setDocumentId, setDocumentType, updateCandidateDetails, setContent, setSaveStatus]);

  // Autosave
  useEffect(() => {
    if (isLoading || error) return;

    const interval = setInterval(async () => {
      const currentState = stateRef.current;
      if (currentState.saveStatus === 'Unsaved Changes') {
        setSaveStatus('Saving...');
        try {
          await fetchAPI(`/api/documents/update/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: currentState.candidateDetails.candidateName 
                     ? `${currentState.documentType === 'offer' ? 'Offer' : 'Joining'} Letter - ${currentState.candidateDetails.candidateName}` 
                     : 'Untitled Document',
              type: currentState.documentType === 'offer' ? 'OFFER_LETTER' : 'JOINING_LETTER',
              status: "draft",
              candidateDetails: currentState.candidateDetails,
              contentJSON: { html: currentState.content },
              template_id: currentState.templateConfig?.id || null
            })
          });
          setSaveStatus('Saved');
        } catch (err) {
          console.error("Autosave failed", err);
          setSaveStatus('Unsaved Changes');
        }
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [documentId, isLoading, error, setSaveStatus]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50">Loading Document...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-88px)] bg-[#F9FAFB]">
      
      {/* Left Side: Wizard (40%) */}
      <div className="w-[40%] min-w-[380px] max-w-[600px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0 flex flex-col">
        <DocumentWizard />
      </div>

      {/* Right Side: Live Preview (60%) */}
      <div className="w-[60%] flex-1 overflow-y-auto bg-slate-900 relative custom-scrollbar flex justify-center py-10 px-8 lg:px-12 pb-10 gap-8">
        <LivePreview />
      </div>

    </div>
  );
}
