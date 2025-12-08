
import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Printer, Cpu, Phone, MapPin, Calendar } from 'lucide-react';

interface PrintPreviewModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ title, children, onClose }) => {
  const { lang, settings } = useZustandStore();
  const t = translations[lang];
  const { companyProfile, appearance, profile } = settings;

  const handlePrint = () => {
    // This class will be used by @media print to hide everything else
    document.body.classList.add('is-printing-from-preview');
    window.print();
  };

  // Listen for afterprint event to clean up
  window.onafterprint = () => {
    document.body.classList.remove('is-printing-from-preview');
    window.onafterprint = null;
  };

  // Parse title to separate "Sales Invoice" from "#INV-123"
  const parts = title.split('#');
  const docTitle = parts[0];
  const docNumber = parts.length > 1 ? parts[1] : '';

  // FALLBACK LOGIC: Use Company Profile, fallback to User Profile if missing
  // This ensures the invoice isn't empty if the user only set up their personal profile
  const logoToUse = companyProfile.logoUrl || profile.avatar;
  const nameToUse = companyProfile.name !== 'اسم شركتك' ? companyProfile.name : profile.name;
  const phoneToUse = companyProfile.phone1 !== 'رقم الهاتف 1' ? companyProfile.phone1 : profile.phone;
  const addressToUse = companyProfile.address !== 'عنوان شركتك هنا' ? companyProfile.address : '';

  return (
    <div className="print-preview-overlay fixed inset-0 bg-black/80 z-[100] flex flex-col items-center p-0 md:p-4 no-print">
      <div className="print-preview-toolbar w-full max-w-4xl bg-gray-800 md:rounded-t-lg p-3 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-white">{t.printPreview}: {title}</h3>
        <div className="flex gap-2">
          <HoloButton variant="primary" icon={Printer} onClick={handlePrint}>{t.print}</HoloButton>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700"><X className="text-white" /></button>
        </div>
      </div>
      <div className="print-preview-content-area w-full max-w-4xl flex-1 overflow-y-auto bg-gray-500 p-2 md:p-8">
        <div className="print-preview-paper bg-white text-black shadow-2xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
          
          {/* Professional Header */}
          <div className="print-header mb-8" style={{ borderBottom: `3px solid ${appearance.documentAccentColor || '#000'}` }}>
              <div className="flex justify-between items-start pb-6">
                  {/* Company Details Section */}
                  <div className="flex gap-5 flex-1 items-center">
                      {logoToUse ? (
                          <div className="w-24 h-24 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 p-1 flex-shrink-0">
                            <img src={logoToUse} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                      ) : (
                          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                              <Cpu size={40}/>
                          </div>
                      )}
                      
                      <div className="flex flex-col justify-center">
                          <h1 className="font-black text-2xl text-black mb-2 leading-tight uppercase">{nameToUse}</h1>
                          
                          <div className="space-y-1 text-sm text-gray-600 font-medium">
                              {addressToUse && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-gray-800 mt-0.5 flex-shrink-0" />
                                    <span>{addressToUse}</span>
                                </div>
                              )}
                              
                              {(phoneToUse || companyProfile.phone2) && (
                                <div className="flex flex-wrap gap-x-3 items-center">
                                  {phoneToUse && (
                                    <div className="flex items-center gap-1">
                                        <Phone size={14} className="text-gray-800 flex-shrink-0" />
                                        <span dir="ltr" className="font-mono text-sm">{phoneToUse}</span>
                                    </div>
                                  )}
                                  
                                  {companyProfile.phone2 && companyProfile.phone2 !== 'رقم الهاتف 2' && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <div className="flex items-center gap-1">
                                            <span dir="ltr" className="font-mono text-sm">{companyProfile.phone2}</span>
                                        </div>
                                    </>
                                  )}
                                </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Document Meta Section (Opposite Side) */}
                  <div className="text-right flex flex-col items-end">
                      <h2 className="font-black text-3xl uppercase tracking-wide mb-2" style={{ color: appearance.documentAccentColor || 'black' }}>
                        {docTitle}
                      </h2>
                      {docNumber && (
                        <div className="flex items-center gap-2 text-gray-700 mb-1 bg-gray-100 px-3 py-1 rounded">
                            <span className="text-sm font-bold uppercase tracking-wider">{t.invoiceNumber}:</span>
                            <span className="font-mono font-bold text-lg">#{docNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                        <Calendar size={14} />
                        <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          <div className="report-body-preview px-8 py-2">
            {children}
          </div>
          
          {/* Footer */}
          <div className="print-footer mt-auto pt-8 px-8 pb-8">
              <div className="border-t-2 border-gray-100 pt-6 flex flex-col items-center">
                {companyProfile.footerText ? (
                    <div className="footer-custom-text text-sm font-medium text-gray-600 mb-2 whitespace-pre-wrap text-center max-w-2xl">{companyProfile.footerText}</div>
                ) : (
                    <div className="text-xs text-gray-400 italic mb-2">Thank you for your business</div>
                )}
                
                <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-2">
                    <span>{nameToUse}</span>
                    <span>&bull;</span>
                    <span dir="ltr" className="page-number"></span>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
