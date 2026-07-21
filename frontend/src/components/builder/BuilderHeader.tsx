"use client";

import React, { useState, useEffect } from "react";
import { Save, Download, Loader2, Mail, X, CheckCircle2 } from "lucide-react";
import { useDocumentBuilderStore } from "../../store/documentBuilderStore";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { documentsApi } from "../../api/documents";

export default function BuilderHeader() {
  const { documentId, setDocumentId, documentType, candidateDetails, branding, saveStatus, setSaveStatus } = useDocumentBuilderStore();
  const { user } = useAuthStore();
  const { isSidebarCollapsed } = useUiStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportModal, setExportModal] = useState(false);

  // Email sending state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (emailModalOpen) {
      const company = candidateDetails?.companyName || "Company Name";
      const defaultSubject = documentType === "offer"
        ? `Job Offer Letter - ${company}`
        : `Joining Letter - ${company}`;
      setSubject(defaultSubject);
      setEmailError("");
      const candEmail = (candidateDetails as any)?.candidateEmail || (candidateDetails as any)?.email || "";
      setToEmail(candEmail);
    }
  }, [emailModalOpen, documentType, candidateDetails]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      const title = candidateDetails?.candidateName 
        ? `${documentType === 'offer' ? 'Offer' : 'Joining'} Letter - ${candidateDetails.candidateName}` 
        : `${documentType === 'offer' ? 'Offer' : 'Joining'} Letter Draft`;
      const type = documentType === 'offer' ? 'OFFER_LETTER' : 'JOINING_LETTER';
      const contentHtml = useDocumentBuilderStore.getState().content;

      if (documentId) {
        await documentsApi.update(documentId, {
          title,
          type,
          status: "draft",
          candidateDetails,
          contentJSON: { html: contentHtml },
        });
      } else {
        const { data: newDoc } = await documentsApi.create({
          title,
          type,
          status: "draft",
          candidateDetails,
          contentJSON: { html: contentHtml },
        });
        setDocumentId(newDoc.id);
      }

      setSaveStatus('Saved');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setToast({ message: `Letter saved successfully at ${timeStr}!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setSaveStatus('Unsaved Changes');
      setToast({ message: 'Failed to save letter. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    if (!toEmail) {
      setEmailError("Recipient email is required.");
      return;
    }
    
    if (!validateEmail(toEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!documentId) {
      setEmailError("No document ID found. Please save the document first.");
      return;
    }

    const container = document.getElementById("document-preview-container");
    if (!container) {
      setEmailError("Preview container not found. Unable to capture document content.");
      return;
    }
    const htmlContent = container.innerHTML;

    setIsSendingEmail(true);
    try {
      await documentsApi.sendEmail(documentId, {
        to_email: toEmail,
        subject,
        html_content: htmlContent,
      });

      setToast({ message: "Email sent successfully!", type: "success" });
      setEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Failed to send email. Please try again.";
      setEmailError(errMsg);
      setToast({ message: errMsg, type: "error" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const capturePageA4Canvas = async (page: HTMLElement) => {
    const origWidth = page.style.width;
    const origMaxWidth = page.style.maxWidth;
    const origMinWidth = page.style.minWidth;
    const origHeight = page.style.height;

    // Temporarily force exact A4 pixel dimensions in DOM to force proper CSS reflow
    page.style.width = '794px';
    page.style.maxWidth = '794px';
    page.style.minWidth = '794px';
    page.style.height = '1123px';

    const canvas = await htmlToImage.toCanvas(page, {
      quality: 1.0,
      pixelRatio: 2,
    });

    // Restore original preview styling
    page.style.width = origWidth;
    page.style.maxWidth = origMaxWidth;
    page.style.minWidth = origMinWidth;
    page.style.height = origHeight;

    return canvas.toDataURL('image/jpeg', 1.0);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pages.length > 0) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const imgData = await capturePageA4Canvas(page);
          
          if (i > 0) {
            pdf.addPage();
          }

          // Exact A4 aspect ratio rendering (210mm x 297mm)
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
        
        pdf.save(`Studlyf_${documentType}_Letter.pdf`);
        setToast({ message: "PDF Letter exported successfully!", type: "success" });
      }
    } catch (error) {
      console.error("Export failed", error);
      setToast({ message: "Failed exporting PDF. Please try again.", type: "error" });
    }
    setIsExporting(false);
  };

  const handleExportJPG = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const dataUrl = await capturePageA4Canvas(page);
          const link = document.createElement('a');
          link.download = `Studlyf_${documentType}_Letter_Page_${i + 1}.jpg`;
          link.href = dataUrl;
          link.click();
        }
        setToast({ message: "JPG Image exported successfully!", type: "success" });
      }
    } catch (error) {
      console.error("JPG Export failed", error);
      setToast({ message: "Failed exporting JPG.", type: "error" });
    }
    setIsExporting(false);
  };

  const handleExportDOCX = () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const details: Record<string, any> = candidateDetails || {};
      const safeBr: Record<string, any> = branding || {};

      // Replace template variables for Word
      let bodyHtml = (typeof useDocumentBuilderStore.getState().content === 'string' && useDocumentBuilderStore.getState().content.trim() !== '')
        ? useDocumentBuilderStore.getState().content
        : "<p>Dear {{candidate_name}},</p><p>We are thrilled to offer you the position of <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>.</p>";

      const variables: Record<string, string> = {
        '{{candidate_name}}': details.candidateName || '[Candidate Name]',
        '{{candidate_email}}': details.candidateEmail || '[Candidate Email]',
        '{{candidate_address}}': details.candidateAddress || '[Candidate Address]',
        '{{job_title}}': details.jobTitle || '[Job Title]',
        '{{department}}': details.department || '[Department]',
        '{{work_mode}}': details.workMode || '[Work Mode]',
        '{{joining_date}}': details.joiningDate || '[Joining Date]',
        '{{salary}}': details.salary || '[Salary]',
        '{{company_name}}': details.companyName || '[Company Name]',
        '{{reporting_manager}}': details.reportingManager || '[Manager Name]',
        '{{reporting_manager_designation}}': details.reportingManagerDesignation || '[Manager Designation]',
        '{{hr_representative}}': details.hrRepresentative || '[HR Name]',
      };

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        bodyHtml = bodyHtml.replace(regex, `<strong>${value}</strong>`);
      });

      const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const topBorderColor = safeBr.borderColors?.top || '#2D136F';

      const wordDocHtml = [
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
        '<head><meta charset="utf-8"><title>', documentType === 'offer' ? 'Job Offer Letter' : 'Joining Letter', '</title>',
        '<style>@page { size: 210mm 297mm; margin: 20mm; } body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.35; color: #0f172a; background-color: #ffffff; } table { border-collapse: collapse; width: 100%; } td { vertical-align: top; } p { margin: 0 0 10pt 0; } h1 { font-family: "Times New Roman", serif; font-size: 16pt; font-weight: bold; text-align: center; margin: 15pt 0 20pt 0; text-transform: uppercase; color: #0f172a; }</style>',
        '</head><body>',
        '<div style="height: 6px; background-color: ', topBorderColor, '; margin-bottom: 20px;"></div>',
        '<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">',
        '<tr><td width="60%" align="left">',
        safeBr.logoUrl ? `<img src="${safeBr.logoUrl}" width="80" height="80" style="width:80px; height:80px; margin-bottom: 8px;" /><br/>` : '',
        '<strong style="font-size: 14pt; color: ', topBorderColor, '; text-transform: uppercase;">', details.companyName || 'STUDLYF INC.', '</strong><br/>',
        '<span style="font-size: 9.5pt; color: #64748b;">', (details.companyAddress || 'Hyderabad, Telangana, India').replace(/\n/g, '<br/>'), '</span></td>',
        '<td width="40%" align="right" style="font-size: 9.5pt; color: #64748b; line-height: 1.4;">',
        details.companyPhone ? `<div>${details.companyPhone}</div>` : '',
        details.companyEmail ? `<div>${details.companyEmail}</div>` : '',
        details.companyWebsite ? `<div>${details.companyWebsite}</div>` : '',
        '</td></tr></table>',
        '<h1>', documentType === 'offer' ? 'JOB OFFER LETTER' : 'LETTER OF JOINING', '</h1>',
        '<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">',
        '<tr><td width="60%" align="left"><strong style="font-size: 11pt; color: #0f172a;">', details.candidateName || '[Candidate Name]', '</strong><br/><span style="font-size: 10pt; color: #475569;">', details.candidateAddress || '[Candidate Address]', '</span></td>',
        '<td width="40%" align="right" style="font-size: 10pt; color: #0f172a;"><strong>Date:</strong> ', todayStr, '</td></tr></table>',
        '<div style="font-size: 11pt; line-height: 1.4; text-align: justify; margin-bottom: 30px;">', bodyHtml, '</div>',
        '<table border="0" cellpadding="0" cellspacing="0" style="margin-top: 40px;"><tr>',
        '<td width="50%" align="left">', safeBr.sealUrl ? `<img src="${safeBr.sealUrl}" width="90" height="90" style="width:90px; height:90px;" />` : '', '</td>',
        '<td width="50%" align="right" style="text-align: right;"><p style="font-weight: bold; margin-bottom: 30px;">For ', details.companyName || 'Studlyf Inc.', ',</p>',
        safeBr.signatureUrl ? `<img src="${safeBr.signatureUrl}" height="50" style="height:50px; margin-bottom: 5px;" /><br/>` : '',
        '<div style="border-top: 1px solid #cbd5e1; width: 180px; margin-left: auto; padding-top: 5px;"><strong style="font-size: 10.5pt; color: #0f172a;">', details.hrRepresentative || 'Human Resources', '</strong><br/><span style="font-size: 9.5pt; color: #64748b;">', details.companyName || 'Authorized Signatory', '</span></div></td>',
        '</tr></table></body></html>'
      ].join('\n');

      const blob = new Blob(['\ufeff', wordDocHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Studlyf_${documentType}_Letter.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: "Editable Word (DOCX) document exported successfully!", type: "success" });
    } catch (error) {
      console.error("DOCX Export failed", error);
      setToast({ message: "Failed exporting Word document.", type: "error" });
    }
    setIsExporting(false);
  };

  return (
    <>
      <header className={`fixed top-0 right-0 z-30 flex h-[72px] bg-white border-b border-slate-200 items-center justify-end px-6 shadow-xs transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'left-0 lg:left-[88px]' : 'left-0 lg:left-[280px]'
      }`}>
        
        {/* Only 3 Action Buttons */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin text-primary" /> : <Save size={15} className={saveStatus === 'Saved' ? 'text-emerald-500' : 'text-slate-500'} />}
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button 
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
          >
            <Mail size={15} className="text-slate-500" />
            <span>Send via Email</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setExportModal(!exportModal)}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isExporting ? 'Exporting...' : 'Export Letter'}</span>
            </button>

            {exportModal && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-100 flex items-center justify-between">
                  Export as PDF <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">PDF</span>
                </button>
                <button onClick={handleExportDOCX} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-100 flex items-center justify-between">
                  Export as DOCX <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Word</span>
                </button>
                <button onClick={handleExportJPG} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between">
                  Export as Image <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">JPG</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Backdrop for modals */}
      {exportModal && <div className="fixed inset-0 z-20" onClick={() => setExportModal(false)} />}

      {/* Email Composition Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Mail size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Send Document via Email</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {emailError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                  {emailError}
                </div>
              )}

              {/* From (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed focus:outline-none"
                  placeholder="sender@company.com"
                />
              </div>

              {/* To */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To (Recipient)</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => {
                    setToEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-medium"
                  placeholder="candidate@email.com"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Email Subject"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300 font-medium text-sm ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <X className="h-5 w-5 text-destructive shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}
    </>
  );
}
