
import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingAuditService } from '../../../services/accounting/accountingAuditService';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Loader, AlertTriangle, CheckCircle, XCircle, ShieldCheck, ArrowRight, RefreshCw, AlertOctagon, Info, Download } from 'lucide-react';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

export const AccountingAuditView: React.FC = () => {
    const { theme, lang, settings, currentCompany } = useZustandStore();
    const t = translations[lang];
    const navigate = useNavigate();
    const isDark = theme === 'dark';
    
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['accountingAudit'],
        queryFn: accountingAuditService.runAudit,
    });

    const handleExportReport = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        
        try {
            // Dynamic imports for heavy libraries
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = reportRef.current;
            // Force specific background for capture to avoid transparency issues
            const originalBg = element.style.backgroundColor;
            element.style.backgroundColor = isDark ? '#0f172a' : '#ffffff';
            
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: isDark ? '#0f172a' : '#ffffff'
            });
            
            element.style.backgroundColor = originalBg; // Restore

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 30;

            pdf.setFontSize(18);
            pdf.text("System Health Audit Report", 105, 20, { align: "center" });
            pdf.setFontSize(10);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 25, { align: "center" });
            
            pdf.addImage(imgData, 'PNG', 0, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (e) {
            console.error("Export failed", e);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center h-96 gap-4"><Loader className="animate-spin text-cyan-400" size={40} /><p className="text-gray-500">جاري فحص البيانات المحاسبية...</p></div>;
    }

    if (!data) return null;

    const getSeverityColor = (severity: string) => {
        switch(severity) {
            case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
            case 'warning': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
            case 'info': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
            default: return 'text-gray-400';
        }
    };

    const getSeverityIcon = (severity: string) => {
         switch(severity) {
            case 'critical': return <AlertOctagon size={24} />;
            case 'warning': return <AlertTriangle size={24} />;
            default: return <Info size={24} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Actions Bar */}
            <div className="flex justify-end gap-3">
                <HoloButton variant="secondary" onClick={() => refetch()} disabled={isRefetching}>
                    <RefreshCw size={16} className={`mr-2 ${isRefetching ? 'animate-spin' : ''}`}/> إعادة الفحص
                </HoloButton>
                <HoloButton variant="primary" onClick={handleExportReport} disabled={isExporting}>
                    {isExporting ? <Loader size={16} className="animate-spin mr-2"/> : <Download size={16} className="mr-2"/>} 
                    تصدير التقرير (PDF)
                </HoloButton>
            </div>

            {/* Report Content Area */}
            <div ref={reportRef} className={`p-6 rounded-3xl space-y-8 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SciFiCard 
                        theme={theme} 
                        title="مؤشر صحة النظام" 
                        value={`${data.score}%`} 
                        icon={ShieldCheck} 
                        color={data.score === 100 ? 'green' : data.score > 70 ? 'orange' : 'red'} 
                    />
                    
                    <div className={`p-5 rounded-2xl border flex flex-col justify-center items-center text-center transition-all ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <p className="text-sm text-gray-500 mb-2">حالة التوازن (Trial Balance)</p>
                        {data.isBalanced ? (
                            <div className="flex items-center gap-2 text-green-400 font-bold text-xl">
                                <CheckCircle /> متوازن
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-400 font-bold text-xl animate-pulse">
                                <XCircle /> غير متوازن
                            </div>
                        )}
                        {!data.isBalanced && (
                            <p className="text-xs text-gray-400 mt-2 font-mono">الفرق: {formatCurrency(Math.abs(data.totalDebit - data.totalCredit), settings.baseCurrency)}</p>
                        )}
                    </div>
                    
                     <div className={`p-5 rounded-2xl border flex flex-col justify-center items-center text-center transition-all ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                         <p className="text-sm text-gray-500 mb-2">المشاكل المكتشفة</p>
                         <p className={`text-3xl font-bold ${data.issues.length > 0 ? 'text-orange-400' : 'text-green-400'}`}>{data.issues.length}</p>
                         <p className="text-xs text-gray-400 mt-2">
                            {data.issues.length === 0 ? 'النظام يعمل بكفاءة' : 'يرجى مراجعة التفاصيل أدناه'}
                         </p>
                    </div>
                </div>

                {/* Issues List */}
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className={`p-4 border-b flex items-center gap-2 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-slate-50'}`}>
                        <ShieldCheck size={20} className="text-cyan-400" />
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>تقرير الفحص التفصيلي</h3>
                    </div>
                    
                    {data.issues.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center text-gray-500">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck size={48} className="text-green-500" />
                            </div>
                            <h4 className="text-xl font-bold text-green-500 mb-2">النظام سليم تماماً!</h4>
                            <p className="text-sm opacity-70 max-w-md">لم يتم العثور على أي أخطاء محاسبية، والقيود متوازنة، والإعدادات مكتملة.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700/30">
                            {data.issues.map((issue) => (
                                <div key={issue.id} className={`p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-slate-50'}`}>
                                    <div className="flex gap-4 items-start">
                                        <div className={`p-3 rounded-xl flex-shrink-0 ${getSeverityColor(issue.severity)}`}>
                                            {getSeverityIcon(issue.severity)}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{issue.title}</h4>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{issue.description}</p>
                                            
                                            {issue.severity === 'critical' && (
                                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                                    Critical Issue
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {issue.actionPath && (
                                        <HoloButton 
                                            variant="secondary" 
                                            onClick={() => navigate(issue.actionPath!)} 
                                            className="whitespace-nowrap text-xs flex-shrink-0"
                                            // Hide button during export as navigation doesn't work in PDF
                                            style={{ display: isExporting ? 'none' : 'flex' }}
                                        >
                                            {issue.actionLabel || 'إصلاح'} <ArrowRight size={14} className="ml-1 rtl:rotate-180" />
                                        </HoloButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Report Footer */}
                <div className={`p-4 rounded-lg text-center text-sm ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-slate-100 text-slate-600'}`}>
                    <p>تم إجراء هذا الفحص تلقائياً بواسطة نظام Smart Finance AI.</p>
                    <p className="text-xs mt-1 opacity-70">ID: {currentCompany?.id} • {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};
