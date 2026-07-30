"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Save, Download, Loader2, Mail, X, CheckCircle2, FileText, FileImage, ChevronLeft, ChevronRight, FileType, ArrowLeft, Edit3 } from "lucide-react";
import { useDocumentBuilderStore } from "../../store/documentBuilderStore";
import { useAuthStore } from "../../store/authStore";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { documentsApi } from "../../api/documents";
import { getErrorMessage } from "../../api/client";

type EmailStep = 'format' | 'rename' | 'compose' | 'success';
type AttachmentFormat = 'pdf' | 'word' | 'image';

const FORMAT_CONFIG: Record<AttachmentFormat, { label: string; ext: string; contentType: string; description: string; badge: string; color: string }> = {
  pdf:   { label: 'PDF',        ext: 'pdf',  contentType: 'application/pdf',                   description: 'Best for sharing — preserves layout perfectly',   badge: 'PDF',  color: 'text-red-600 bg-red-50 border-red-200' },
  word:  { label: 'Word (DOC)', ext: 'doc',  contentType: 'application/msword',                description: 'Editable format — recipient can modify content',   badge: 'DOC',  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  image: { label: 'Image (JPG)',ext: 'jpg',  contentType: 'image/jpeg',                        description: 'Image snapshot — great for quick previews',        badge: 'JPG',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export default function BuilderHeader() {
  const { documentId, setDocumentId, documentType, candidateDetails, branding, saveStatus, setSaveStatus } = useDocumentBuilderStore();
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportModal(false);
      }
    };
    if (exportModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportModal]);

  // Email wizard state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<EmailStep>('format');
  const [selectedFormat, setSelectedFormat] = useState<AttachmentFormat>('pdf');
  const [fileName, setFileName] = useState('');
  const [sentFileName, setSentFileName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset wizard state whenever modal opens
  useEffect(() => {
    if (emailModalOpen) {
      setEmailStep('format');
      setSelectedFormat('pdf');
      setEmailError('');
      const company = candidateDetails?.companyName || 'Company';
      const candName = (candidateDetails as any)?.candidateName || '';
      const defaultSubject = documentType === 'offer'
        ? `Job Offer Letter - ${company}`
        : `Joining Letter - ${company}`;
      setSubject(defaultSubject);
      const candEmail = (candidateDetails as any)?.candidateEmail || (candidateDetails as any)?.email || '';
      setToEmail(candEmail);
      const safeName = (candName || 'Document').replace(/\s+/g, '_');
      setFileName(`${documentType === 'offer' ? 'Offer_Letter' : 'Joining_Letter'}_${safeName}`);
    }
  }, [emailModalOpen, documentType, candidateDetails]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        await documentsApi.update(documentId, { title, type, status: 'draft', candidateDetails, contentJSON: { html: contentHtml } });
      } else {
        const { data: newDoc } = await documentsApi.create({ title, type, status: 'draft', candidateDetails, contentJSON: { html: contentHtml } });
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

  // ─── File generation helpers ────────────────────────────────────────────────

  const capturePageA4Canvas = async (page: HTMLElement) => {
    const orig = { w: page.style.width, mw: page.style.maxWidth, nw: page.style.minWidth, h: page.style.height };
    page.style.width = '794px';
    page.style.maxWidth = '794px';
    page.style.minWidth = '794px';
    page.style.height = '1123px';

    let canvas: HTMLCanvasElement;
    try {
      canvas = await htmlToImage.toCanvas(page, {
        quality: 0.95,
        pixelRatio: 2,
        skipFonts: true,
        fontEmbedCSS: '',
        cacheBust: false,
      });
    } catch (e) {
      console.warn('[Export Warning] High-DPI canvas export failed, trying standard fallback:', e);
      canvas = await htmlToImage.toCanvas(page, {
        quality: 0.95,
        skipFonts: true,
        fontEmbedCSS: '',
      });
    } finally {
      page.style.width = orig.w;
      page.style.maxWidth = orig.mw;
      page.style.minWidth = orig.nw;
      page.style.height = orig.h;
    }
    return canvas;
  };

  const generatePdfBase64 = async (): Promise<string> => {
    const pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < pages.length; i++) {
      const canvas = await capturePageA4Canvas(pages[i]);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }
    // jsPDF output as base64 string (strip the data URI prefix)
    return pdf.output('datauristring').split(',')[1];
  };

  const generateImageBase64 = async (): Promise<string> => {
    const pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
    if (pages.length === 0) throw new Error('No page found');
    const canvas = await capturePageA4Canvas(pages[0]);
    return canvas.toDataURL('image/jpeg', 1.0).split(',')[1];
  };

  const generateWordBase64 = (): string => {
    const details: Record<string, any> = candidateDetails || {};
    const safeBr: Record<string, any> = branding || {};
    let bodyHtml = (typeof useDocumentBuilderStore.getState().content === 'string' && useDocumentBuilderStore.getState().content.trim() !== '')
      ? useDocumentBuilderStore.getState().content
      : '<p>Dear {{candidate_name}},</p><p>We are thrilled to offer you the position of <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>.</p>';

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
      '<style>@page { size: 210mm 297mm; margin: 20mm; } body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.35; color: #0f172a; } table { border-collapse: collapse; width: 100%; } td { vertical-align: top; } p { margin: 0 0 10pt 0; } h1 { font-family: "Times New Roman", serif; font-size: 16pt; font-weight: bold; text-align: center; margin: 15pt 0 20pt 0; text-transform: uppercase; }</style>',
      '</head><body>',
      `<div style="height:6px;background-color:${topBorderColor};margin-bottom:20px;"></div>`,
      '<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-bottom:1px solid #e2e8f0;padding-bottom:15px;">',
      '<tr><td width="60%" align="left">',
      safeBr.logoUrl ? `<img src="${safeBr.logoUrl}" width="80" height="80" /><br/>` : '',
      `<strong style="font-size:14pt;color:${topBorderColor};text-transform:uppercase;">${details.companyName || 'STUDLYF INC.'}</strong></td>`,
      '<td width="40%" align="right" style="font-size:9.5pt;color:#64748b;line-height:1.4;">',
      details.companyAddress ? `<div>${(details.companyAddress).replace(/\n/g, '<br/>')}</div>` : `<div>Hyderabad, Telangana, India</div>`,
      details.companyPhone ? `<div>${details.companyPhone}</div>` : '',
      details.companyEmail ? `<div>${details.companyEmail}</div>` : '',
      details.companyWebsite ? `<div>${details.companyWebsite}</div>` : '',
      '</td></tr></table>',
      '<h1>', documentType === 'offer' ? 'JOB OFFER LETTER' : 'LETTER OF JOINING', '</h1>',
      '<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">',
      `<tr><td width="60%" align="left"><strong style="font-size:11pt;">${details.candidateName || '[Candidate Name]'}</strong><br/><span style="font-size:10pt;color:#475569;">${details.candidateAddress || '[Candidate Address]'}</span></td>`,
      `<td width="40%" align="right" style="font-size:10pt;"><strong>Date:</strong> ${todayStr}</td></tr></table>`,
      `<div style="font-size:11pt;line-height:1.4;text-align:justify;margin-bottom:30px;">${bodyHtml}</div>`,
      '<table border="0" cellpadding="0" cellspacing="0" style="margin-top:40px;"><tr>',
      `<td width="50%" align="left">${safeBr.sealUrl ? `<img src="${safeBr.sealUrl}" width="90" height="90" />` : ''}</td>`,
      `<td width="50%" align="right"><p style="font-weight:bold;margin-bottom:30px;">For ${details.companyName || 'Studlyf Inc.'},</p>`,
      safeBr.signatureUrl ? `<img src="${safeBr.signatureUrl}" height="50" style="margin-bottom:5px;" /><br/>` : '',
      `<div style="border-top:1px solid #cbd5e1;width:180px;margin-left:auto;padding-top:5px;"><strong style="font-size:10.5pt;">${details.hrRepresentative || 'Human Resources'}</strong><br/><span style="font-size:9.5pt;color:#64748b;">${details.companyName || 'Authorized Signatory'}</span></div></td>`,
      '</tr></table></body></html>',
    ].join('\n');

    // Convert to base64 via Blob + FileReader would be async — use btoa with BOM
    const bom = '\ufeff';
    return btoa(unescape(encodeURIComponent(bom + wordDocHtml)));
  };

  // ─── Step navigation ────────────────────────────────────────────────────────

  const handleFormatNext = () => {
    setEmailError('');
    setEmailStep('rename');
  };

  const handleRenameNext = () => {
    setEmailError('');
    if (!fileName.trim()) { setEmailError('Please enter a file name.'); return; }
    setEmailStep('compose');
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!toEmail) { setEmailError('Recipient email is required.'); return; }
    if (!validateEmail(toEmail)) { setEmailError('Please enter a valid email address.'); return; }
    if (!documentId) { setEmailError('No document ID found. Please save the document first.'); return; }

    setIsSendingEmail(true);
    try {
      const fmt = FORMAT_CONFIG[selectedFormat];
      const fullFilename = `${fileName.trim().replace(/\s+/g, '_')}.${fmt.ext}`;
      const details = (candidateDetails as any) || {};
      const company = details.companyName || 'Studlyf Inc.';
      const candName = details.candidateName || 'Candidate';
      const docLabel = documentType === 'offer' ? 'Job Offer Letter' : 'Joining Letter';

      // Build a clean, professional email body (not the raw DOM)
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
          <div style="height: 5px; background: linear-gradient(90deg, #2D136F, #6366f1); border-radius: 4px 4px 0 0;"></div>
          <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
            <h2 style="margin: 0 0 8px 0; color: #2D136F; font-size: 20px;">${docLabel}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0 0 24px 0;">From ${company}</p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Dear ${candName},</p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Please find your <strong>${docLabel}</strong> attached to this email as a <strong>${fmt.badge}</strong> file 
              (<em>${fullFilename}</em>).
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              If you have any questions or require further clarification, please do not hesitate to reach out.
            </p>
            <p style="font-size: 15px; margin: 0 0 4px 0;">Warm regards,</p>
            <p style="font-size: 15px; font-weight: bold; margin: 0;">${company} — HR Team</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Powered by STUDLYF HR Platform</p>
          </div>
        </div>`;

      let base64Content = '';
      if (selectedFormat === 'pdf') {
        base64Content = await generatePdfBase64();
      } else if (selectedFormat === 'image') {
        base64Content = await generateImageBase64();
      } else {
        base64Content = generateWordBase64();
      }

      await documentsApi.sendEmail(documentId, {
        to_email: toEmail,
        subject,
        html_content: htmlContent,
        attachment: { filename: fullFilename, content: base64Content, contentType: fmt.contentType },
      });

      setSentFileName(fullFilename);
      setToast({ message: 'Email sent successfully with attachment!', type: 'success' });
      setEmailStep('success');
    } catch (err) {
      console.error(err);
      const errMsg = getErrorMessage(err, 'Failed to send email. Please try again.');
      setEmailError(errMsg);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      let pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pages.length === 0) {
        const container = document.getElementById('document-preview-container');
        if (container) pages = [container as HTMLElement];
      }

      if (pages.length === 0) {
        setToast({ message: "No document preview page found to export.", type: "error" });
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const imgCanvas = await capturePageA4Canvas(page);
        const imgData = imgCanvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      const candName = (candidateDetails as any)?.candidateName || 'Candidate';
      const safeName = candName.replace(/\s+/g, '_');
      const filename = `Studlyf_${documentType === 'offer' ? 'Offer' : 'Joining'}_Letter_${safeName}.pdf`;

      pdf.save(filename);
      setToast({ message: "PDF Letter exported successfully!", type: "success" });
    } catch (error) {
      console.error("Export failed", error);
      setToast({ message: "Failed exporting PDF. Please try again.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    setIsExporting(true);
    setExportModal(false);
    try {
      let pages = Array.from(document.querySelectorAll('.a4-page')) as HTMLElement[];
      if (pages.length === 0) {
        const container = document.getElementById('document-preview-container');
        if (container) pages = [container as HTMLElement];
      }

      if (pages.length === 0) {
        setToast({ message: "No document preview page found to export.", type: "error" });
        return;
      }

      const candName = (candidateDetails as any)?.candidateName || 'Candidate';
      const safeName = candName.replace(/\s+/g, '_');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const imgCanvas = await capturePageA4Canvas(page);
        const dataUrl = imgCanvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Studlyf_${documentType === 'offer' ? 'Offer' : 'Joining'}_Letter_${safeName}_Page_${i + 1}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setToast({ message: "JPG Image exported successfully!", type: "success" });
    } catch (error) {
      console.error("JPG Export failed", error);
      setToast({ message: "Failed exporting JPG image.", type: "error" });
    } finally {
      setIsExporting(false);
    }
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
        '<strong style="font-size: 14pt; color: ', topBorderColor, '; text-transform: uppercase;">', details.companyName || 'STUDLYF INC.', '</strong></td>',
        '<td width="40%" align="right" style="font-size: 9.5pt; color: #64748b; line-height: 1.4;">',
        details.companyAddress ? `<div>${(details.companyAddress).replace(/\n/g, '<br/>')}</div>` : `<div>Hyderabad, Telangana, India</div>`,
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

      const candName = (candidateDetails as any)?.candidateName || 'Candidate';
      const safeName = candName.replace(/\s+/g, '_');
      const filename = `Studlyf_${documentType === 'offer' ? 'Offer' : 'Joining'}_Letter_${safeName}.doc`;

      const blob = new Blob(['\ufeff', wordDocHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: "Editable Word (DOC) document exported successfully!", type: "success" });
    } catch (error) {
      console.error("DOCX Export failed", error);
      setToast({ message: "Failed exporting Word document.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  // Title rename state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const displayTitle = customTitle.trim() || (
    candidateDetails?.candidateName
      ? `${documentType === 'offer' ? 'Offer' : 'Joining'} Letter — ${candidateDetails.candidateName}`
      : `${documentType === 'offer' ? 'Offer' : 'Joining'} Letter Draft`
  );

  const handleTitleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsEditingTitle(false);
    if (!customTitle.trim()) return;

    if (documentId) {
      try {
        await documentsApi.update(documentId, { title: customTitle.trim() });
        setToast({ message: 'Letter title updated!', type: 'success' });
      } catch (err) {
        console.error('Failed to rename document in header', err);
      }
    }
  };

  return (
    <>
      <header className="w-full h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shrink-0 shadow-2xs">
        {/* Left Side: Back button & Document title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <Link
            to="/documents"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft size={15} /> Back to Letters
          </Link>
          <span className="h-4 w-px bg-slate-200 shrink-0" />
          
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onBlur={() => handleTitleSubmit()}
                  autoFocus
                  placeholder="Enter letter title..."
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Save title"
                >
                  <CheckCircle2 size={15} />
                </button>
              </form>
            ) : (
              <div
                onClick={() => {
                  setCustomTitle(displayTitle);
                  setIsEditingTitle(true);
                }}
                className="group flex items-center gap-2 cursor-pointer hover:bg-slate-100/80 px-2.5 py-1 rounded-lg transition-colors min-w-0"
                title="Click to rename letter"
              >
                <span className="text-xs font-extrabold text-slate-800 truncate">
                  {displayTitle}
                </span>
                <Edit3 size={13} className="text-slate-400 group-hover:text-primary transition-colors shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: 3 Action Buttons */}
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
          
          <div className="relative" ref={exportDropdownRef}>
            <button 
              type="button"
              onClick={() => setExportModal(!exportModal)}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff2a5f] via-[#d946ef] to-[#2d136f] hover:opacity-95 shadow-md shadow-pink-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{isExporting ? 'Exporting...' : 'Export Letter'}</span>
            </button>

            {exportModal && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 p-1">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportPDF(); }}
                  onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-primary rounded-lg transition-colors border-b border-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <span>Export as PDF</span>
                  <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">PDF</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportDOCX(); }}
                  onClick={(e) => { e.stopPropagation(); handleExportDOCX(); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-primary rounded-lg transition-colors border-b border-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <span>Export as DOCX</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Word</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleExportJPG(); }}
                  onClick={(e) => { e.stopPropagation(); handleExportJPG(); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-primary rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Export as Image</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">JPG</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Email Wizard Modal ─────────────────────────────────────────────── */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Send Document via Email</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {emailStep === 'format' && 'Step 1 of 3 — Choose attachment format'}
                    {emailStep === 'rename' && 'Step 2 of 3 — Name your file'}
                    {emailStep === 'compose' && 'Step 3 of 3 — Compose & send'}
                    {emailStep === 'success' && 'Email Delivered'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Progress Bar (Hidden on Success) */}
            {emailStep !== 'success' && (
              <div className="flex gap-1 px-6 pt-4">
                {(['format', 'rename', 'compose'] as EmailStep[]).map((step, i) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      emailStep === step ? 'bg-primary' :
                      (['format', 'rename', 'compose'].indexOf(emailStep) > i) ? 'bg-primary/40' :
                      'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* ── STEP 1: FORMAT SELECTION ── */}
            {emailStep === 'format' && (
              <div className="p-6 space-y-3">
                <p className="text-sm font-semibold text-slate-700 mb-1">Select the format to attach to the email:</p>
                {(Object.entries(FORMAT_CONFIG) as [AttachmentFormat, typeof FORMAT_CONFIG[AttachmentFormat]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedFormat(key)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                      selectedFormat === key
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.color}`}>
                      {key === 'pdf'   && <FileText size={18} />}
                      {key === 'word'  && <FileType size={18} />}
                      {key === 'image' && <FileImage size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{cfg.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.color} uppercase tracking-wider`}>{cfg.badge}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cfg.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selectedFormat === key ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}>
                      {selectedFormat === key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleFormatNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff2a5f] via-[#d946ef] to-[#2d136f] hover:opacity-95 shadow-md shadow-pink-500/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: FILE RENAME ── */}
            {emailStep === 'rename' && (
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Name your attachment file:</p>
                  <p className="text-xs text-slate-400">
                    The file will be sent as <span className={`font-bold text-xs px-1.5 py-0.5 rounded border ${FORMAT_CONFIG[selectedFormat].color}`}>{FORMAT_CONFIG[selectedFormat].badge}</span>
                  </p>
                </div>

                {emailError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                    {emailError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => { setFileName(e.target.value); if (emailError) setEmailError(''); }}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      placeholder="e.g. Offer_Letter_John_Doe"
                      autoFocus
                    />
                    <span className="text-sm text-slate-400 font-mono shrink-0">.{FORMAT_CONFIG[selectedFormat].ext}</span>
                  </div>
                  <p className="text-xs text-slate-400">Preview: <span className="font-mono text-slate-600">{fileName.trim() || 'filename'}.{FORMAT_CONFIG[selectedFormat].ext}</span></p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => { setEmailStep('format'); setEmailError(''); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRenameNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff2a5f] via-[#d946ef] to-[#2d136f] hover:opacity-95 shadow-md shadow-pink-500/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: COMPOSE EMAIL ── */}
            {emailStep === 'compose' && (
              <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                {/* Attachment preview badge */}
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${FORMAT_CONFIG[selectedFormat].color} bg-opacity-30`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${FORMAT_CONFIG[selectedFormat].color}`}>
                    {selectedFormat === 'pdf'   && <FileText size={15} />}
                    {selectedFormat === 'word'  && <FileType size={15} />}
                    {selectedFormat === 'image' && <FileImage size={15} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Attaching:</p>
                    <p className="text-xs text-slate-500 font-mono">{fileName.trim() || 'document'}.{FORMAT_CONFIG[selectedFormat].ext}</p>
                  </div>
                </div>

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
                    value={user?.email || ''}
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
                    onChange={(e) => { setToEmail(e.target.value); if (emailError) setEmailError(''); }}
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
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => { setEmailStep('rename'); setEmailError(''); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff2a5f] via-[#d946ef] to-[#2d136f] hover:opacity-95 shadow-lg shadow-pink-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
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
            )}

            {/* ── STEP 4: SUCCESS POP-UP ── */}
            {emailStep === 'success' && (
              <div className="p-8 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">Sent Successfully!</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Your document has been sent via email to <strong className="text-slate-800">{toEmail}</strong>.
                  </p>
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Recipient</span>
                    <span className="font-medium text-slate-800">{toEmail}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Attachment</span>
                    <span className="font-mono font-bold text-slate-800">{sentFileName}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Format</span>
                    <span className="font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{FORMAT_CONFIG[selectedFormat].badge}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Delivered</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

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
