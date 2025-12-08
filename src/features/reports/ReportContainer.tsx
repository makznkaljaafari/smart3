import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { HoloButton } from '../../components/ui/HoloButton';
import { Printer, Download, Send, Cpu, Loader } from 'lucide-react';
import { translations } from '../../lib/i18n';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PrintPreviewModal } from './components/PrintPreviewModal';


interface ReportContainerProps {
  title: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  onPrint?: () => void;
  onExport?: () => void;
  onSend?: () => void;
}

export const ReportContainer: React.FC<ReportContainerProps> = ({ title, children, filters, onPrint, onExport, onSend }) => {
  const { theme, lang, settings } = useZustandStore(state => ({ 
      theme: state.theme, 
      lang: state.lang,
      settings: state.settings 
  }));
  const t = translations[lang];
  const { companyProfile, appearance } = settings;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const reportElement = document.querySelector('.printable-report-container') as HTMLElement;
    if (!reportElement) {
        setIsGeneratingPdf(false);
        return;
    }

    document.body.classList.add('pdf-generation-mode');
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        // In a real app, you might want a toast notification here
    } finally {
        document.body.classList.remove('pdf-generation-mode');
        setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      <div className="printable-report-container">
       <div className="print-header hidden" style={{ borderBottomColor: appearance.documentAccentColor || '#333' }}>
          <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                  {companyProfile.logoUrl ? (
                      <img src={companyProfile.logoUrl} alt="Company Logo" className="w-16 h-16 object-contain" />
                  ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Cpu size={32} className="text-gray-500"/>
                      </div>
                  )}
                  <div>
                      <h1 className="font-bold text-xl">{companyProfile.name}</h1>
                      <p className="text-sm text-gray-600">{companyProfile.address}</p>
                      <p className="text-sm text-gray-600">{companyProfile.phone1}</p>
                  </div>
              </div>
              <div className="text-right">
                  <h2 className="font-bold text-2xl" style={{ color: appearance.documentAccentColor || 'black' }}>{title}</h2>
                  <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
              </div>
          </div>
      </div>

      <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'} flex flex-wrap gap-4 items-center justify-between no-print`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {filters}
            <div className="flex gap-2">
              {onSend && <HoloButton variant="secondary" onClick={onSend}><Send size={18} /> {t.send}</HoloButton>}
              <HoloButton variant="secondary" onClick={() => setShowPrintPreview(true)}><Printer size={18} /> {t.print}</HoloButton>
              <HoloButton variant="secondary" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                {isGeneratingPdf ? t.saving : t.downloadPDF}
              </HoloButton>
              {onExport && <HoloButton variant="primary" onClick={onExport}><Download size={18} /> {t.exportCsv}</HoloButton>}
            </div>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
      
      <div className="print-footer hidden">
          {companyProfile.footerText && <div className="footer-custom-text">{companyProfile.footerText}</div>}
          <span className="page-number"></span>
      </div>
    </div>
    {showPrintPreview && (
        <PrintPreviewModal title={title} onClose={() => setShowPrintPreview(false)}>
            {children}
        </PrintPreviewModal>
    )}
    </>
  );
};