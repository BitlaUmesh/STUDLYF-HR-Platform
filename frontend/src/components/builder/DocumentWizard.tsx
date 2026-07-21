"use client";

import React, { useState, useEffect } from "react";
import { useDocumentBuilderStore } from "../../store/documentBuilderStore";
import { FileText, Upload, ChevronDown, ChevronRight, CheckCircle2, Trash2, UserCheck } from "lucide-react";
import { studentsApi, type StudentSearchResult } from "../../api/students";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const defaultContent = "<p>Dear {{candidate_name}},</p><p>We are thrilled to offer you the position of <strong>{{job_title}}</strong> at <strong>{{company_name}}</strong>. Your reporting manager will be <strong>{{reporting_manager}}</strong>, <strong>{{reporting_manager_designation}}</strong>.</p><p>Your annual compensation (CTC) will be <strong>{{salary}}</strong>. Please review the attached terms.</p>";

const editorExtensions = [
  StarterKit,
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
];

export default function DocumentWizard() {
  const { 
    documentType, setDocumentType, 
    branding, updateBranding, 
    candidateDetails, updateCandidateDetails, 
    content, setContent,
    setSaveStatus
  } = useDocumentBuilderStore();
  
  const [expandedSection, setExpandedSection] = useState<string>('candidate');
  const [candidateList, setCandidateList] = useState<StudentSearchResult[]>([]);

  useEffect(() => {
    studentsApi.search('').then((res) => setCandidateList(res.data.results)).catch(console.error);
  }, []);

  const editor = useEditor({
    extensions: editorExtensions,
    content: typeof content === 'string' && content.trim() !== '' 
      ? content 
      : (content as any)?.html || defaultContent,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'hr-document-content max-w-none focus:outline-none min-h-[300px] p-4 text-slate-800 bg-slate-50/50',
      },
    },
  });

  useEffect(() => {
    if (editor && (!content || content.trim() === '')) {
      setContent(editor.getHTML());
    }
  }, [editor, content, setContent]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof branding) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateBranding({ [field]: url });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateCandidateDetails({ [name]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Wizard Progress Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Document Setup</h2>
        <div className="flex items-center gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
           {['Type', 'Branding', 'Candidate', 'Content'].map((step, idx) => (
             <div key={step} className="flex items-center whitespace-nowrap">
               <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                 <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">{idx + 1}</div>
                 {step}
               </div>
               {idx < 3 && <ChevronRight className="w-3 h-3 mx-2 text-slate-300" />}
             </div>
           ))}
        </div>
      </div>

      <div className="p-6 space-y-4">
        
        {/* Document Type Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => toggleSection('type')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" /> Document Type
            </h3>
            {expandedSection === 'type' ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
          </button>
          
          {expandedSection === 'type' && (
            <>
            <div className="p-4 bg-white grid grid-cols-2 gap-3 border-t border-slate-200">
              <button onClick={() => setDocumentType('offer')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${documentType === 'offer' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <FileText size={24} />
                <span className="text-sm font-semibold">Offer Letter</span>
              </button>
              <button onClick={() => setDocumentType('joining')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${documentType === 'joining' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <FileText size={24} />
                <span className="text-sm font-semibold">Joining Letter</span>
              </button>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSaveStatus('Unsaved Changes')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-colors">Save Progress</button>
            </div>
          </>
          )}
        </div>

        {/* Branding Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-slate-300" /> Branding & Design
            </h3>
            {expandedSection === 'branding' ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
          </button>
          
          {expandedSection === 'branding' && (
            <>
            <div className="p-4 bg-white space-y-6 border-t border-slate-200">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Company Logo (Top Left)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-slate-50 relative overflow-hidden h-24 group">
                    {!branding.logoUrl && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />}
                    {branding.logoUrl ? (
                      <>
                        <img src={branding.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                        <button onClick={() => updateBranding({ logoUrl: null })} className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 text-xs font-medium"><Upload size={16} className="mx-auto mb-1" />Upload Logo</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Letterhead (Top Full Width)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-slate-50 relative overflow-hidden h-24 bg-slate-50 group">
                    {!branding.letterheadUrl && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'letterheadUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />}
                    {branding.letterheadUrl ? (
                      <>
                        <img src={branding.letterheadUrl} alt="Letterhead" className="w-full h-full object-cover" />
                        <button onClick={() => updateBranding({ letterheadUrl: null })} className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 text-xs font-medium"><Upload size={16} className="mx-auto mb-1" />Upload Header</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Digital Signature (Bottom Right)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-slate-50 relative overflow-hidden h-20 group">
                    {!branding.signatureUrl && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signatureUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />}
                    {branding.signatureUrl ? (
                      <>
                        <img src={branding.signatureUrl} alt="Signature" className="h-full object-contain mix-blend-multiply" />
                        <button onClick={() => updateBranding({ signatureUrl: null })} className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 text-xs font-medium"><Upload size={16} className="mx-auto mb-1" />Upload Sign</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Company Seal (Bottom Left)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center hover:bg-slate-50 relative overflow-hidden h-20 group">
                    {!branding.sealUrl && <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'sealUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />}
                    {branding.sealUrl ? (
                      <>
                        <img src={branding.sealUrl} alt="Seal" className="h-full object-contain mix-blend-multiply" />
                        <button onClick={() => updateBranding({ sealUrl: null })} className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 text-xs font-medium"><Upload size={16} className="mx-auto mb-1" />Upload Seal</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Document Font</label>
                  <select 
                    value={branding.fontFamily} 
                    onChange={(e) => updateBranding({ fontFamily: e.target.value })}
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none bg-white"
                  >
                    <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                    <option value='Arial, Helvetica, sans-serif'>Arial</option>
                    <option value='"Calibri", "Helvetica Neue", sans-serif'>Calibri</option>
                    <option value='"Georgia", serif'>Georgia</option>
                    <option value='"Verdana", Geneva, sans-serif'>Verdana</option>
                    <option value='"Trebuchet MS", "Lucida Grande", sans-serif'>Trebuchet MS</option>
                    <option value='"Courier New", Courier, monospace'>Courier New</option>
                    <option value='"Palatino Linotype", "Book Antiqua", Palatino, serif'>Palatino</option>
                    <option value='"Impact", Charcoal, sans-serif'>Impact</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Border Color Customizer</label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { name: 'Purple', val: '#2D136F' },
                    { name: 'Blue', val: '#1E3A8A' },
                    { name: 'Corporate Red', val: '#991B1B' },
                    { name: 'Green', val: '#065F46' },
                    { name: 'Teal', val: '#0F766E' },
                    { name: 'Black', val: '#000000' }
                  ].map(color => (
                    <button 
                      key={color.name}
                      onClick={() => updateBranding({ borderColors: { top: color.val, bottom: color.val, divider: color.val } })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${branding.borderColors.top === color.val ? 'ring-2 ring-offset-2 ring-slate-400 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color.val }}
                      title={color.name}
                    />
                  ))}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden ml-2" title="Custom Color">
                    <input 
                      type="color" 
                      value={branding.borderColors.top}
                      onChange={(e) => updateBranding({ borderColors: { top: e.target.value, bottom: e.target.value, divider: e.target.value } })}
                      className="w-8 h-8 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              </div>
              </div>

            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSaveStatus('Unsaved Changes')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-colors">Save Progress</button>
            </div>
          </>
          )}
        </div>

        {/* Candidate Details Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => toggleSection('candidate')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-slate-300" /> Candidate & Job Details
            </h3>
            {expandedSection === 'candidate' ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
          </button>
          
          {expandedSection === 'candidate' && (
            <>
            <div className="p-4 bg-white border-t border-slate-200 space-y-6">
              
              {/* Auto-fill from Talent Pool / Pipeline */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-indigo-600" /> Auto-fill from Candidate Profile
                </label>
                <select
                  onChange={(e) => {
                    const candidateId = e.target.value;
                    if (!candidateId) return;
                    studentsApi.getById(candidateId).then((res) => {
                      const c = res.data;
                      updateCandidateDetails({
                        candidateName: c.name || '',
                        candidateEmail: c.email || '',
                        candidateAddress: c.bio || '',
                        jobTitle: c.skills?.[0] ? `${c.skills[0]} Developer` : candidateDetails.jobTitle,
                      });
                    }).catch(console.error);
                  }}
                  className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a Candidate to Auto-fill Details...</option>
                  {candidateList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Info Group */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Personal Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                    <input type="text" name="candidateName" value={candidateDetails.candidateName} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                    <input type="email" name="candidateEmail" value={candidateDetails.candidateEmail} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
                    <textarea name="candidateAddress" value={candidateDetails.candidateAddress} onChange={handleChange} rows={2} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" />
                  </div>
                </div>
              </div>

              {/* Job Info Group */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Job Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Job Title</label>
                    <input type="text" name="jobTitle" value={candidateDetails.jobTitle} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                    <input type="text" name="department" value={candidateDetails.department} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Work Mode</label>
                    <select name="workMode" value={candidateDetails.workMode} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none bg-white">
                      <option>Remote</option>
                      <option>Hybrid</option>
                      <option>On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Joining Date</label>
                    <input type="date" name="joiningDate" value={candidateDetails.joiningDate} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Salary (CTC)</label>
                    <input type="text" name="salary" value={candidateDetails.salary} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" placeholder="$120,000 / year" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Manager</label>
                    <input type="text" name="reportingManager" value={candidateDetails.reportingManager} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* Company Info Group */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">Company Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
                    <input type="text" name="companyName" value={candidateDetails.companyName} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Address</label>
                    <textarea name="companyAddress" value={candidateDetails.companyAddress} onChange={handleChange} rows={2} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Phone</label>
                    <input type="text" name="companyPhone" value={candidateDetails.companyPhone} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Email</label>
                    <input type="email" name="companyEmail" value={candidateDetails.companyEmail} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Company Website</label>
                    <input type="text" name="companyWebsite" value={candidateDetails.companyWebsite} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">HR Rep Name (Footer)</label>
                    <input type="text" name="hrRepresentative" value={candidateDetails.hrRepresentative} onChange={handleChange} className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>

            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSaveStatus('Unsaved Changes')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-colors">Save Progress</button>
            </div>
          </>
          )}
        </div>

        {/* Content Editor Section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => toggleSection('content')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-slate-300" /> Document Content Editor
            </h3>
            {expandedSection === 'content' ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
          </button>
          
          {expandedSection === 'content' && (
            <>
            <div className="bg-white border-t border-slate-200 flex flex-col">
              
              {/* Tiptap Toolbar */}
              <div className="bg-slate-100/50 border-b border-slate-200 p-2 flex gap-1 flex-wrap sticky top-0 z-10">
                <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 px-2.5 rounded font-bold transition-colors ${editor?.isActive('bold') ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>B</button>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 px-2.5 rounded italic transition-colors ${editor?.isActive('italic') ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>I</button>
                <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`p-1.5 px-2.5 rounded underline transition-colors ${editor?.isActive('underline') ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>U</button>
                
                <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
                
                <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden h-8">
                  <button 
                    onClick={() => {
                      const currentSize = parseInt((branding.fontSize || '11pt').replace('pt', ''));
                      if(currentSize > 8) updateBranding({ fontSize: `${currentSize - 1}pt` });
                    }}
                    className="px-2 h-full hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200 font-medium"
                  >-</button>
                  <span className="px-3 text-xs font-medium text-slate-700 min-w-[40px] text-center">{branding.fontSize || '11pt'}</span>
                  <button 
                    onClick={() => {
                      const currentSize = parseInt((branding.fontSize || '11pt').replace('pt', ''));
                      if(currentSize < 24) updateBranding({ fontSize: `${currentSize + 1}pt` });
                    }}
                    className="px-2 h-full hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200 font-medium"
                  >+</button>
                </div>
                
                <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
                
                <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 px-2.5 rounded transition-colors text-sm font-medium ${editor?.isActive({ textAlign: 'left' }) ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>Left</button>
                <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`p-1.5 px-2.5 rounded transition-colors text-sm font-medium ${editor?.isActive({ textAlign: 'center' }) ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>Center</button>
                
                <div className="w-px h-6 bg-slate-300 mx-1 self-center"></div>
                
                <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 px-2.5 rounded transition-colors text-sm font-medium ${editor?.isActive('bulletList') ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>• Bullets</button>
                <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 px-2.5 rounded transition-colors text-sm font-medium ${editor?.isActive('orderedList') ? 'bg-white shadow-sm border border-slate-200 text-primary' : 'hover:bg-slate-200 text-slate-600'}`}>1. Numbers</button>
              </div>
              
              <EditorContent editor={editor} className="bg-white max-h-[500px] overflow-y-auto custom-scrollbar" />
              
              {/* Variables Helper */}
              <div className="bg-slate-50 border-t border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {['candidate_name', 'job_title', 'salary', 'joining_date', 'company_name', 'reporting_manager', 'candidate_address', 'candidate_email'].map(v => (
                    <span key={v} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded cursor-pointer hover:border-primary hover:text-primary transition-colors" onClick={() => editor?.commands.insertContent(`{{${v}}}`)}>
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSaveStatus('Unsaved Changes')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-colors">Save Progress</button>
            </div>
          </>
          )}
        </div>

      </div>
    </div>
  );
}
