
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';
import { HoloButton } from '../../../components/ui/HoloButton';
import { X, Save, Loader, CheckCircle, AlertTriangle, Calculator } from 'lucide-react';
import { FiscalYear } from '../types';
import { reportService } from '../../../services/reportService';
import { fiscalService } from '../../../services/accounting/fiscalService';
import { formatCurrency } from '../lib/utils';

interface CloseYearModalProps {
    year: FiscalYear;
    onClose: () => void;
    onSuccess: () => void;
}

export const CloseYearModal: React.FC<CloseYearModalProps> = ({ year, onClose, onSuccess }) => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';
    const { modalRef, headerRef, position, size, handleDragStart } = useDraggableAndResizable({ initialSize: { width: 600, height: 600 } });

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<{revenue: number, expenses: number, net: number} | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            setIsLoading(true);
            // Fetch P&L for the year date range
            const data = await reportService.getIncomeStatement(); // In real app, pass date range
            // Mock calculation based on fetched data
            const revenue = data.data?.filter(r => r.account_type === 'revenue').reduce((s, r) => s + r.net_amount, 0) || 0;
            const expenses = data.data?.filter(r => r.account_type === 'expense').reduce((s, r) => s + r.net_amount, 0) || 0;
            setSummary({ revenue, expenses, net: revenue - expenses });
            setIsLoading(false);
        };
        loadSummary();
    }, [year]);

    const handleConfirmClose = async () => {
        setIsLoading(true);
        await fiscalService.closeFiscalYear(year.id, summary);
        setIsLoading(false);
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
            <div
                ref={modalRef}
                style={{ ...position, ...size }}
                className={`fixed rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 ${isDark ? 'bg-gray-900 border-red-500/50' : 'bg-white border-red-200'}`}
                onMouseDown={e => e.stopPropagation()}
            >
                <div ref={headerRef} onMouseDown={handleDragStart} className={`p-6 border-b flex items-center justify-between cursor-move ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
                    <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                        <AlertTriangle /> إقفال السنة المالية {year.name}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <Loader className="animate-spin text-cyan-400" size={40} />
                            <p className="text-gray-500">جاري معالجة البيانات المالية...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className={`p-4 rounded-lg border text-sm ${isDark ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                                تنبيه: هذا الإجراء سيقوم بإنشاء قيود إقفال آلية وترحيل صافي الربح/الخسارة إلى حساب الأرباح المبقاة. لا يمكن التراجع عن هذا الإجراء بسهولة.
                            </div>

                            <h4 className="font-bold text-lg flex items-center gap-2">
                                <Calculator className="text-cyan-400"/> ملخص الأداء
                            </h4>
                            
                            <div className={`rounded-xl p-6 space-y-4 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span>إجمالي الإيرادات</span>
                                    <span className="font-mono font-bold text-green-500">{formatCurrency(summary?.revenue || 0, settings.baseCurrency)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>إجمالي المصروفات</span>
                                    <span className="font-mono font-bold text-orange-500">{formatCurrency(summary?.expenses || 0, settings.baseCurrency)}</span>
                                </div>
                                <div className="border-t border-gray-600 my-2"></div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-bold">صافي الربح (للترحيل)</span>
                                    <span className={`font-mono font-black ${(summary?.net || 0) >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                                        {formatCurrency(summary?.net || 0, settings.baseCurrency)}
                                    </span>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500">
                                سيتم إنشاء قيد يومية رقم <strong>#CLOSE-{year.name}</strong> بتاريخ {year.endDate}.
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg">{t.cancel}</button>
                    <HoloButton variant="danger" icon={CheckCircle} onClick={handleConfirmClose} disabled={isLoading}>
                        تأكيد الإقفال النهائي
                    </HoloButton>
                </div>
            </div>
        </div>
    );
};
