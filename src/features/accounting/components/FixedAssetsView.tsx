
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { FixedAsset } from '../types';
import { fixedAssetService } from '../../../services/accounting/fixedAssetService';
import { HoloButton } from '../../../components/ui/HoloButton';
import { Plus, Calculator, TrendingDown, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { FixedAssetFormModal } from './FixedAssetFormModal';
import { LoadingState } from '../../../components/common/LoadingState';

export const FixedAssetsView: React.FC = () => {
    const { theme, lang, settings, addToast } = useZustandStore();
    const t = translations[lang];
    const isDark = theme === 'dark';

    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isRunningDepreciation, setIsRunningDepreciation] = useState(false);

    const loadAssets = async () => {
        setIsLoading(true);
        const { data } = await fixedAssetService.getAssets();
        setAssets(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadAssets();
    }, []);

    const handleSaveAsset = async (data: Partial<FixedAsset>) => {
        const { error } = await fixedAssetService.saveAsset(data, !data.id);
        if (error) {
            addToast({ message: `Error saving asset: ${error.message}`, type: 'error' });
        } else {
            addToast({ message: 'Asset saved successfully', type: 'success' });
            setShowForm(false);
            loadAssets();
        }
    };

    const handleRunDepreciation = async () => {
        if (!confirm('هل تريد تشغيل حساب الإهلاك لهذا الشهر؟ سيتم إنشاء قيود يومية تلقائياً للأصول النشطة.')) return;
        
        setIsRunningDepreciation(true);
        const today = new Date().toISOString().split('T')[0];
        const { count, totalAmount } = await fixedAssetService.runMonthlyDepreciation(today);
        
        setIsRunningDepreciation(false);
        if (count > 0) {
             addToast({ message: `تم إنشاء قيود إهلاك لـ ${count} أصل بقيمة إجمالية ${formatCurrency(totalAmount!, settings.baseCurrency)}.`, type: 'success' });
             loadAssets();
        } else {
             addToast({ message: 'لا توجد أصول مؤهلة للإهلاك هذا الشهر.', type: 'info' });
        }
    };

    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>الأصول الثابتة</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>إدارة الأصول وحساب الإهلاك.</p>
                </div>
                <div className="flex gap-2">
                    <HoloButton variant="secondary" icon={Calculator} onClick={handleRunDepreciation} disabled={isRunningDepreciation}>
                        {isRunningDepreciation ? 'جاري الحساب...' : 'تشغيل الإهلاك الشهري'}
                    </HoloButton>
                    <HoloButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>إضافة أصل</HoloButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => {
                    const depreciatedPercent = asset.cost > 0 ? ((asset.cost - (asset.currentBookValue || 0)) / asset.cost) * 100 : 0;
                    
                    return (
                        <div key={asset.id} className={`p-5 rounded-xl border transition-all group hover:-translate-y-1 ${isDark ? 'bg-gray-900/40 border-gray-700 hover:border-purple-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                                        <LayoutGrid size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</h4>
                                        <p className="text-xs text-gray-500 font-mono">{asset.assetNumber}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${asset.status === 'active' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-gray-400 border-gray-500/20'}`}>
                                    {asset.status}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">تكلفة الشراء</span>
                                    <span className="font-mono font-bold">{formatCurrency(asset.cost, settings.baseCurrency)}</span>
                                </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">القيمة الدفترية</span>
                                    <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{formatCurrency(asset.currentBookValue || 0, settings.baseCurrency)}</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>الإهلاك ({Math.round(depreciatedPercent)}%)</span>
                                    <TrendingDown size={12}/>
                                </div>
                                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${depreciatedPercent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {assets.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                        <p>لا توجد أصول ثابتة مسجلة.</p>
                    </div>
                 )}
            </div>

            {showForm && (
                <FixedAssetFormModal 
                    onClose={() => setShowForm(false)} 
                    onSave={handleSaveAsset}
                />
            )}
        </div>
    );
};
