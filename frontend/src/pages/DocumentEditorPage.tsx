import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DocumentWizard from "../components/builder/DocumentWizard";
import LivePreview from "../components/builder/LivePreview";
import BuilderHeader from "../components/builder/BuilderHeader";
import { useDocumentBuilderStore } from "../store/documentBuilderStore";
import { documentsApi } from "../api/documents";

export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentId = id === "new" ? "" : id;
  
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

  const [isLoading, setIsLoading] = useState(!!documentId);
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

  // Initial Fetch or Auto-create new draft
  useEffect(() => {
    if (!documentId) {
      const createInitialDraft = async () => {
        try {
          const { data: doc } = await documentsApi.create({
            title: `${documentType === 'offer' ? 'Offer' : 'Joining'} Letter - ${candidateDetails?.candidateName || 'Draft'}`,
            type: documentType === 'offer' ? 'OFFER_LETTER' : 'JOINING_LETTER',
            status: 'draft',
            candidateDetails,
            contentJSON: { html: typeof content === 'string' ? content : '' },
          });
          setDocumentId(doc.id);
          setSaveStatus('Saved');
        } catch (e) {
          console.error("Failed auto-creating initial draft", e);
        }
      };
      createInitialDraft();
      return;
    }

    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const { data: doc } = await documentsApi.getById(documentId);
        
        setDocumentId(doc.id);
        setDocumentType(doc.type === 'JOINING_LETTER' ? 'joining' : 'offer');
        updateCandidateDetails(doc.candidateDetails);
        setContent(doc.contentJSON?.html || doc.contentJSON?.body || "");
        
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
    if (isLoading || error || !documentId) return;

    const interval = setInterval(async () => {
      const currentState = stateRef.current;
      if (currentState.saveStatus === 'Unsaved Changes') {
        setSaveStatus('Saving...');
        try {
          await documentsApi.update(documentId, {
            title: currentState.candidateDetails.candidateName 
                   ? `${currentState.documentType === 'offer' ? 'Offer' : 'Joining'} Letter - ${currentState.candidateDetails.candidateName}` 
                   : 'Untitled Document',
            type: currentState.documentType === 'offer' ? 'OFFER_LETTER' : 'JOINING_LETTER',
            status: "draft",
            candidateDetails: currentState.candidateDetails,
            contentJSON: { html: currentState.content },
            template_id: currentState.templateConfig?.id || undefined
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
        <button onClick={() => navigate('/documents')} className="px-4 py-2 bg-slate-900 text-white rounded-lg">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-88px)] bg-[#F9FAFB]">
      <BuilderHeader />
      
      <div className="flex w-full flex-1 overflow-hidden pt-2">
        {/* Left Side: Wizard (40%) */}
        <div className="w-[40%] min-w-[380px] max-w-[600px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0 flex flex-col">
          <DocumentWizard />
        </div>

        {/* Right Side: Live Preview (60%) */}
        <div className="w-[60%] flex-1 overflow-y-auto bg-slate-900 relative custom-scrollbar flex justify-center py-10 px-8 lg:px-12 pb-10 gap-8">
          <LivePreview />
        </div>
      </div>
    </div>
  );
}
