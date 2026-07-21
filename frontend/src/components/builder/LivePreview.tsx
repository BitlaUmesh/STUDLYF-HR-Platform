"use client";

import { useEffect, useState } from "react";
import { useDocumentBuilderStore, DEFAULT_DOCUMENT_CONTENT } from "../../store/documentBuilderStore";
import { paginateHtmlContent } from "../../utils/pagination";

export default function LivePreview() {
  const { documentType, branding, candidateDetails, content, templateConfig } = useDocumentBuilderStore();
  const [pages, setPages] = useState<string[]>([]);
  const [isPaginating, setIsPaginating] = useState(true);

  // Parse variables into the content string
  const getRenderedContent = () => {
    let htmlContent = (typeof content === 'string' && content.trim() !== '') ? content : DEFAULT_DOCUMENT_CONTENT;
    const details = candidateDetails || {};
    
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
      htmlContent = htmlContent.replace(regex, `<span class="bg-yellow-100/60 border-b-2 border-yellow-300 font-bold text-slate-900 px-0.5">${value}</span>`);
    });

    return htmlContent;
  };

  useEffect(() => {
    let isMounted = true;
    
    const generatePages = async () => {
      setIsPaginating(true);
      const renderedHtml = getRenderedContent();
      
      const safeBr = branding || {};
      const safeCd = candidateDetails || {};
      const hasLargeHeader = !!safeBr.letterheadUrl || !!safeBr.logoUrl || !!safeCd.companyName;
      const firstPageHeight = hasLargeHeader ? 600 : 800;
      const standardHeight = 900;

      // Use templateConfig typography if available
      const font = templateConfig?.typography?.bodyFont || safeBr.fontFamily || 'Times New Roman';

      const paginatedContent = await paginateHtmlContent(renderedHtml, font, firstPageHeight, standardHeight);
      
      if (isMounted) {
        setPages(paginatedContent);
        setIsPaginating(false);
      }
    };

    const timeoutId = setTimeout(generatePages, 50);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [content, candidateDetails, branding, templateConfig]);

  // Derived styles based on templateConfig
  const safeBranding = branding || {
    logoUrl: null,
    letterheadUrl: null,
    signatureUrl: null,
    sealUrl: null,
    primaryColor: '#2D136F',
    secondaryColor: '#5D22D8',
    fontFamily: 'Times New Roman',
    borderColors: {
      top: '#2D136F',
      bottom: '#2D136F',
      divider: '#2D136F'
    }
  };
  
  const safeCd = candidateDetails || {};
  
  const showBorders = templateConfig ? templateConfig.borders.show : true;
  const borderTopColor = showBorders ? (safeBranding.borderColors?.top || '#2D136F') : 'transparent';
  const borderBottomColor = showBorders ? (safeBranding.borderColors?.bottom || safeBranding.borderColors?.top || '#2D136F') : 'transparent';
  
  const headerStyle = templateConfig?.headerStyle || 'split';
  const titleStyle = templateConfig?.titleStyle || 'centered';
  const signaturePlacement = templateConfig?.signaturePlacement || 'bottom-right';
  const footerDesign = templateConfig?.footerDesign || 'none';
  const dividerType = templateConfig?.dividerType || 'thin';
  const bodyFont = templateConfig?.typography?.bodyFont || safeBranding.fontFamily || 'Times New Roman';
  const lineSpacing = templateConfig?.typography?.lineSpacing || "1.25";

  return (
    <div id="document-preview-container" className="w-full flex flex-col items-center gap-8 pb-12">
      
      {isPaginating && pages.length === 0 && (
        <div className="w-full max-w-[794px] h-[1123px] bg-white shadow-xl flex items-center justify-center text-slate-400 font-medium animate-pulse">
          Generating Document...
        </div>
      )}

      {pages.map((pageHtml, index) => {
        const isFirstPage = index === 0;
        const isLastPage = index === pages.length - 1;

        return (
          <div 
            key={`page-${index}`}
            id={`page-${index}`}
            className="a4-page w-full max-w-[794px] h-[1123px] bg-white shadow-2xl overflow-hidden flex flex-col relative shrink-0 print:shadow-none print:m-0"
            style={{
              borderTop: showBorders ? `12px solid ${borderTopColor}` : 'none',
              borderBottom: showBorders ? `12px solid ${borderBottomColor}` : 'none',
            }}
          >
            {/* Accents for Minimal Corporate */}
            {templateConfig?.cornerAccents && (
               <>
                 <div className="absolute top-0 left-0 w-24 h-24 border-t-[6px] border-l-[6px] m-4" style={{ borderColor: safeBranding.borderColors?.top || '#2D136F' }} />
                 <div className="absolute bottom-0 right-0 w-24 h-24 border-b-[6px] border-r-[6px] m-4" style={{ borderColor: safeBranding.borderColors?.bottom || safeBranding.borderColors?.top || '#2D136F' }} />
               </>
            )}

            {/* Letterhead (Only on First Page) */}
            {isFirstPage && safeBranding.letterheadUrl && (
              <div className="w-full h-32 absolute top-0 left-0 right-0 z-0">
                <img src={safeBranding.letterheadUrl} alt="Letterhead" crossOrigin="anonymous" className="w-full h-full object-cover opacity-90" />
              </div>
            )}

            {/* Content Wrapper */}
            <div className={`flex-1 flex flex-col z-10 px-12 sm:px-16 pb-16 relative ${
              isFirstPage && safeBranding.letterheadUrl ? 'pt-40' : 'pt-16'
            }`}>
              
              {/* Header Details (Only on First Page) */}
              {isFirstPage && !safeBranding.letterheadUrl && (
                <>
                  {headerStyle === 'split' && (
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4 max-w-[60%]">
                        {safeBranding.logoUrl && (
                          <img src={safeBranding.logoUrl} alt="Company Logo" crossOrigin="anonymous" className="w-20 h-20 object-contain shrink-0" />
                        )}
                        <div>
                          {safeCd.companyName && (
                            <div style={{ color: safeBranding.borderColors?.top || '#2D136F', fontSize: '20px', fontWeight: 700, lineHeight: 1.1, textTransform: 'uppercase' }}>
                              {safeCd.companyName.split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                            </div>
                          )}
                          <div className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{safeCd.companyAddress}</div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm space-y-1 font-medium text-slate-500">
                        {safeCd.companyPhone && <div>{safeCd.companyPhone}</div>}
                        {safeCd.companyEmail && <div>{safeCd.companyEmail}</div>}
                        {safeCd.companyWebsite && <div>{safeCd.companyWebsite}</div>}
                      </div>
                    </div>
                  )}

                  {headerStyle === 'centered' && (
                     <div className="flex flex-col items-center justify-center text-center mb-8">
                       {safeBranding.logoUrl && (
                          <img src={safeBranding.logoUrl} alt="Company Logo" crossOrigin="anonymous" className="w-24 h-24 object-contain mb-4" />
                        )}
                        {safeCd.companyName && (
                          <div style={{ color: safeBranding.borderColors?.top || '#2D136F', fontSize: '24px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {safeCd.companyName}
                          </div>
                        )}
                        <div className="text-sm text-slate-500 mt-2">{safeCd.companyAddress}</div>
                     </div>
                  )}

                  {headerStyle === 'left' && (
                    <div className="mb-6 flex items-end justify-between">
                      <div>
                        {safeBranding.logoUrl && <img src={safeBranding.logoUrl} alt="Company Logo" crossOrigin="anonymous" className="w-16 h-16 object-contain mb-2" />}
                        {safeCd.companyName && (
                          <div style={{ color: safeBranding.borderColors?.top || '#2D136F', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {safeCd.companyName}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 text-right">
                         <div>{safeCd.companyAddress}</div>
                      </div>
                    </div>
                  )}

                  {/* Divider Line */}
                  {dividerType === 'thin' && <div className="w-full h-px mb-8 bg-slate-200"></div>}
                  {dividerType === 'horizontal' && <div className="w-full h-[2px] mb-8" style={{ backgroundColor: safeBranding.borderColors?.divider || safeBranding.borderColors?.top || '#2D136F' }}></div>}
                  
                  {/* Document Title */}
                  <div className={`mb-10 ${titleStyle === 'centered' || titleStyle === 'strong-centered' ? 'text-center' : 'text-left'}`}>
                    <h1 className={`${titleStyle === 'strong-centered' ? 'text-2xl font-black tracking-widest' : 'text-lg font-bold tracking-wide'} text-slate-900 uppercase`}>
                      {documentType === 'offer' ? 'JOB OFFER LETTER' : 'LETTER OF JOINING'}
                    </h1>
                  </div>
                  
                  {/* Date & Ref */}
                  <div className="flex justify-between items-end text-sm text-slate-900 font-normal mb-6" style={{ fontFamily: bodyFont, fontSize: '12pt' }}>
                    <div className="flex flex-col">
                      <p className="font-bold">{safeCd.candidateName || '[Candidate Name]'}</p>
                      <p className="text-slate-600 whitespace-pre-wrap">{safeCd.candidateAddress || '[Candidate Address]'}</p>
                    </div>
                    <div className="text-right">
                      <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      {safeCd.documentReferenceId && <p>Ref: {safeCd.documentReferenceId}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* Tiptap HTML Content (Paginated Slice) */}
              <div 
                className="hr-document-content max-w-none text-slate-800"
                style={{
                  fontFamily: bodyFont,
                  fontSize: safeBranding.fontSize || '11pt',
                  fontWeight: 400,
                  lineHeight: lineSpacing,
                  letterSpacing: '0px',
                  wordSpacing: 'normal',
                  textAlign: 'justify',
                }}
                dangerouslySetInnerHTML={{ __html: pageHtml }} 
              />

              {/* Footer Signatures (Only on Last Page) */}
              {isLastPage && (
                <div className={`mt-auto pt-10 flex ${signaturePlacement === 'bottom-right' ? 'justify-end text-right' : signaturePlacement === 'centered' ? 'justify-center text-center' : 'justify-start text-left'} relative`}>
                  <div className={`space-y-2 flex flex-col ${signaturePlacement === 'bottom-right' ? 'items-end' : signaturePlacement === 'centered' ? 'items-center' : 'items-start'}`}>
                    <p className="font-semibold text-slate-800 mb-6">For {safeCd.companyName},</p>
                    <div className="h-16 w-48 relative flex items-center justify-center border-b border-slate-300">
                       {safeBranding.signatureUrl ? (
                          <img src={safeBranding.signatureUrl} alt="Signature" crossOrigin="anonymous" className={`max-h-full max-w-full object-contain mix-blend-multiply absolute bottom-0 ${signaturePlacement === 'bottom-right' ? 'right-0' : signaturePlacement === 'centered' ? '' : 'left-0'}`} />
                       ) : (
                          <span className="text-slate-300 font-caveat text-xl italic absolute bottom-1">Authorized Signatory</span>
                       )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 mt-2">{safeCd.hrRepresentative || 'Human Resources'}</p>
                      <p className="text-sm text-slate-600 font-medium">{safeCd.hrDesignation || safeCd.companyName}</p>
                    </div>
                  </div>
                  
                  {/* Seal Graphic - Only show if not centered */}
                  {signaturePlacement !== 'centered' && (
                    <div className={`w-24 h-24 absolute top-10 ${signaturePlacement === 'bottom-right' ? 'left-0' : 'right-0'} flex items-center justify-center`}>
                       {safeBranding.sealUrl && (
                          <img src={safeBranding.sealUrl} alt="Company Seal" crossOrigin="anonymous" className="max-h-full max-w-full object-contain mix-blend-multiply opacity-80" />
                       )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Configured Footer Design */}
            {footerDesign === 'geometric_strip' && (
               <div className="h-3 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 absolute bottom-0 z-20" />
            )}
            {footerDesign === 'simple' && (
               <div className="h-10 w-full bg-slate-800 flex items-center justify-center text-white/50 text-xs absolute bottom-0 z-20">
                 Confidential & Proprietary - {safeCd.companyName}
               </div>
            )}

            {/* Page Number (Every Page) */}
            <div className={`absolute ${footerDesign !== 'none' ? 'bottom-8' : 'bottom-6'} left-0 w-full flex justify-center z-10`}>
               <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                 Page {index + 1} of {Math.max(1, pages.length)}
               </span>
            </div>

          </div>
        );
      })}

    </div>
  );
}
