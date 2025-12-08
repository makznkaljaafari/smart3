import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Printer, Download, Send, Cpu } from 'lucide-react';
import { translations } from '../../../lib/i18n';

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
  const { companyProfile } = settings;

  return (
    <div className="printable-report-container">
      {/* This header is only for printing */}
      <div className="print-header">
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
                  <h2 className="font-bold text-2xl">{title}</h2>
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
              {onPrint && <HoloButton variant="secondary" onClick={onPrint}><Printer size={18} /> {t.print}</HoloButton>}
              {onExport && <HoloButton variant="primary" onClick={onExport}><Download size={18} /> {t.exportCsv}</HoloButton>}
            </div>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
      
      {/* This footer is only for printing */}
      <div className="print-footer">
          Page <span className="page-number"></span>
      </div>
    </div>
  );
};