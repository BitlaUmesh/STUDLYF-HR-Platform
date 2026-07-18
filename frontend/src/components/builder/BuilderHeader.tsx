"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Save, Download, Loader2, CheckCircle2, Menu, Bell, Search, ChevronRight, LogOut, User as UserIcon, Mail, X } from "lucide-react";
import { useDocumentBuilderStore } from "@/store/documentBuilderStore";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { sendDocumentEmail } from "@/lib/api";

export default function BuilderHeader() {
  const { documentId, documentType, candidateDetails, saveStatus, setSaveStatus } = useDocumentBuilderStore();
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Email sending state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (emailModalOpen) {
      const company = candidateDetails?.companyName || "Company Name";
      const defaultSubject = documentType === "offer"
        ? `Job Offer Letter - ${company}`
        : `Joining Letter - ${company}`;
      setSubject(defaultSubject);
      setEmailError("");
      setToEmail("");
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
      await sendDocumentEmail(documentId, {
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

  // Auto-Save Mock Logic
  useEffect(() => {
    if (saveStatus === 'Unsaved Changes') {
      const timer = setTimeout(() => {
        setSaveStatus('Saving...');
        setTimeout(() => setSaveStatus('Saved'), 800);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, setSaveStatus]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pages.length > 0) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const imgData = await htmlToImage.toJpeg(page, { quality: 1.0, pixelRatio: 2 });
          
          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
        
        pdf.save(`Studlyf_${documentType}_Letter.pdf`);
      }
    } catch (error) {
      console.error("Export failed", error);
    }
    setIsExporting(false);
  };

  const handleExportJPG = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const input = document.getElementById('document-preview-container');
      if (input) {
        const dataUrl = await htmlToImage.toJpeg(input, { quality: 1.0, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `Studlyf_${documentType}_Letter.jpg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("JPG Export failed", error);
    }
    setIsExporting(false);
  };

  const handleExportDOCX = () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      const input = document.getElementById('document-preview-container');
      if (input) {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
        const footer = "</body></html>";
        const html = header + input.innerHTML + footer;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Studlyf_${documentType}_Letter.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("DOCX Export failed", error);
    }
    setIsExporting(false);
  };

  return (
    <>
      <header className={`fixed top-0 right-0 z-30 flex h-[88px] bg-white border-b border-slate-200 items-center justify-between px-4 sm:px-6 shadow-sm transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'left-0 lg:left-[88px]' : 'left-0 lg:left-[280px]'
      }`}>
        
        {/* Left: Hamburger & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors -ml-2">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/dashboard/documents" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Documents
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {documentType === 'offer' ? 'New Offer Letter' : 'New Joining Letter'}
              {saveStatus === 'Saving...' && <Loader2 size={12} className="animate-spin text-slate-400 ml-1" />}
              {saveStatus === 'Saved' && <CheckCircle2 size={12} className="text-emerald-500 ml-1" />}
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 justify-center px-6">
          <div className="relative w-full max-w-md hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-full border-0 py-2 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-slate-50 transition-all focus:bg-white"
              placeholder="Search variables..."
            />
          </div>
        </div>

        {/* Right: Actions, Notifications, Profile */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <button 
            onClick={() => setSaveStatus('Saved')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Save size={16} className={saveStatus === 'Saved' ? 'text-emerald-500' : 'text-slate-500'} />
            <span className="hidden xl:inline">Save Draft</span>
          </button>

          <button 
            onClick={() => setEmailModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Mail size={16} className="text-slate-500" />
            <span className="hidden xl:inline">Send via Email</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setExportModal(!exportModal)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>

            {exportModal && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-100 flex items-center justify-between">
                  Export as PDF <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Pro</span>
                </button>
                <button onClick={handleExportDOCX} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors border-b border-slate-100 flex items-center justify-between">
                  Export as DOCX <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">New</span>
                </button>
                <button onClick={handleExportJPG} className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between">
                  Export as Image (JPG)
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block h-6 w-px bg-slate-200" />

          {/* Notifications */}
          <button type="button" className="hidden lg:flex p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>

          {/* Profile dropdown */}
          <div className="relative hidden lg:block">
            <button 
              type="button" 
              className="flex items-center p-1 hover:bg-slate-50 rounded-lg transition-colors"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-primary/20">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in slide-in-from-top-2 border border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</p>
                   <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{user?.email}</p>
                </div>
                <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2" onClick={() => setProfileOpen(false)}>
                  <UserIcon size={16} /> Your Profile
                </Link>
                <button onClick={() => { setProfileOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 font-bold flex items-center gap-2 transition-colors">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Backdrop for modals */}
      {(exportModal || profileOpen) && <div className="fixed inset-0 z-20" onClick={() => { setExportModal(false); setProfileOpen(false); }} />}

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
