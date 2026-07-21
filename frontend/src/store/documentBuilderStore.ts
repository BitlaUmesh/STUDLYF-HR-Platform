import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TemplateConfig {
  id: string;
  templateName: string;
  layoutType: 'classic' | 'modern' | 'minimal' | 'think-unlimited' | 'minimal-corporate' | string;
  borders: {
    show: boolean;
    type: 'solid' | 'dashed' | 'geometric';
  };
  footerDesign: 'geometric_strip' | 'none' | 'simple';
  typography: {
    headingFont: string;
    bodyFont: string;
    lineSpacing: string;
  };
  spacing: 'compact' | 'comfortable' | 'spacious';
  headerStyle: 'split' | 'centered' | 'left' | 'right';
  titleStyle: 'centered' | 'left' | 'strong-centered';
  signaturePlacement: 'bottom-right' | 'centered' | 'bottom-left';
  dividerType: 'thin' | 'horizontal' | 'none';
  cornerAccents?: boolean;
}

interface CandidateDetails {
  // Candidate Information
  candidateName: string;
  candidateEmail: string;
  candidateAddress: string;
  candidatePhone: string;
  
  // Job Information
  jobTitle: string;
  department: string;
  employmentType: string;
  workMode: string;
  reportingManager: string;
  reportingManagerDesignation: string;

  // Compensation
  salary: string;
  bonus: string;
  benefits: string;

  // Joining Details
  joiningDate: string;
  internshipDuration: string;
  probationPeriod: string;
  officeLocation: string;

  // Company Information
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companyPhone: string;
  companyEmail: string;
  hrRepresentative: string;
  hrDesignation: string;
  hrContactEmail: string;

  // Additional Information
  offerValidUntil: string;
  documentReferenceId: string;
  customNotes: string;
}

interface BrandingDetails {
  brandColor: string;
  fontFamily: string;
  fontSize?: string;
  borderColors: { top: string; bottom: string; divider: string };
  logoUrl: string | null;
  signatureUrl: string | null;
  letterheadUrl: string | null;
  sealUrl: string | null;
}

interface DocumentBuilderState {
  documentType: 'offer' | 'joining';
  branding: BrandingDetails;
  candidateDetails: CandidateDetails;
  content: string;
  templateConfig: TemplateConfig | null;
  saveStatus: 'Saved' | 'Saving...' | 'Unsaved Changes';
  documentId: string | null;
  
  setDocumentType: (type: 'offer' | 'joining') => void;
  updateBranding: (branding: Partial<BrandingDetails>) => void;
  updateCandidateDetails: (details: Partial<CandidateDetails>) => void;
  setContent: (content: string) => void;
  setTemplateConfig: (config: TemplateConfig) => void;
  setSaveStatus: (status: 'Saved' | 'Saving...' | 'Unsaved Changes') => void;
  setDocumentId: (id: string | null) => void;
  resetState: () => void;
}

export const DEFAULT_DOCUMENT_CONTENT = "<p>Dear {{candidate_name}},</p><p>We are thrilled to offer you the position of <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>. Your reporting manager will be <strong>{{reporting_manager}}</strong>, <strong>{{reporting_manager_designation}}</strong>.</p><p>Your annual compensation (CTC) will be <strong>{{salary}}</strong>. Please review the attached terms.</p>";

export const useDocumentBuilderStore = create<DocumentBuilderState>()(
  persist(
    (set) => ({
      documentType: 'offer',
      branding: {
        brandColor: '#2D136F',
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '11pt',
        borderColors: { top: '#2D136F', bottom: '#2D136F', divider: '#2D136F' },
        logoUrl: null,
        signatureUrl: null,
        letterheadUrl: null,
        sealUrl: null,
      },
      candidateDetails: {
        candidateName: '',
        candidateEmail: '',
        candidateAddress: '',
        candidatePhone: '',
        jobTitle: '',
        department: '',
        employmentType: 'Full-time',
        workMode: 'On-site',
        reportingManager: '',
        reportingManagerDesignation: '',
        salary: '',
        bonus: '',
        benefits: '',
        joiningDate: '',
        internshipDuration: '',
        probationPeriod: '',
        officeLocation: '',
        companyName: 'Studlyf Inc.',
        companyAddress: 'Hyderabad, Telangana, India',
        companyWebsite: 'www.studlyf.com',
        companyPhone: '+91 9876543210',
        companyEmail: 'hr@studlyf.com',
        hrRepresentative: '',
        hrDesignation: '',
        hrContactEmail: '',
        offerValidUntil: '',
        documentReferenceId: '',
        customNotes: '',
      },
      content: DEFAULT_DOCUMENT_CONTENT,
      templateConfig: null,
      saveStatus: 'Saved',
      documentId: null,
      
      setDocumentType: (type) => set({ documentType: type }),
      updateBranding: (branding) => set((state) => ({ branding: { ...state.branding, ...branding } })),
      updateCandidateDetails: (details) => set((state) => ({ candidateDetails: { ...state.candidateDetails, ...details } })),
      setContent: (content) => set({ content, saveStatus: 'Unsaved Changes' }),
      setTemplateConfig: (config) => set({ templateConfig: config }),
      setSaveStatus: (status) => set({ saveStatus: status }),
      setDocumentId: (id) => set({ documentId: id }),
      resetState: () => set({
        documentId: null,
        documentType: 'offer',
        content: DEFAULT_DOCUMENT_CONTENT,
        templateConfig: null,
        saveStatus: 'Saved',
        candidateDetails: {
          candidateName: '', candidateEmail: '', candidateAddress: '', candidatePhone: '',
          jobTitle: '', department: '', employmentType: 'Full-time', workMode: 'On-site',
          reportingManager: '', reportingManagerDesignation: '', salary: '', bonus: '', benefits: '',
          joiningDate: '', internshipDuration: '', probationPeriod: '', officeLocation: '',
          companyName: 'Studlyf Inc.', companyAddress: 'Hyderabad, Telangana, India',
          companyWebsite: 'www.studlyf.com', companyPhone: '+91 9876543210', companyEmail: 'hr@studlyf.com',
          hrRepresentative: '', hrDesignation: '', hrContactEmail: '', offerValidUntil: '', documentReferenceId: '', customNotes: '',
        }
      })
    }),
    {
      name: 'draft_document_state',
      storage: createJSONStorage(() => sessionStorage), // Only persist for the current session to avoid cross-tab bleeding for new letters
    }
  )
);
