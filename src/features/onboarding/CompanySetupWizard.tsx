
import React, { useState, useEffect, useRef } from 'react';
import { useZustandStore } from '../../store/useStore';
import { accountService } from '../../services/accountService';
import { profileService } from '../../services/profileService';
import { accountMappingService } from '../../services/accounting/accountMapping';
import { HoloButton } from '../../components/ui/HoloButton';
import { Loader, CheckCircle, ArrowRight, Settings, BookCopy, X, RefreshCw } from 'lucide-react';
import { translations } from '../../lib/i18n';
import { SettingsState } from '../../types';

export const CompanySetupWizard: React.FC = () => {
    const { currentCompany, settings, fetchAccounts, setSettings, lang, theme, isDataReady, addToast } = useZustandStore(state => ({
        currentCompany: state.currentCompany,
        accounts: state.accounts, // Note: We'll fetch fresh accounts in the effect to avoid dependency loops
        settings: state.settings,
        fetchAccounts: state.fetchAccounts,
        setSettings: state.setSettings,
        lang: state.lang,
        theme: state.theme,
        isDataReady: state.isDataReady,
        addToast: state.addToast,
    }));
    const t = translations[lang];
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Ref to track if we already tried auto-setup for this company session
    const setupAttemptedRef = useRef<string | null>(null);

    // Automatic Setup Logic
    useEffect(() => {
        const performAutoSetup = async () => {
            if (!currentCompany || !isDataReady) return;
            
            // Prevent running multiple times for the same company session
            if (setupAttemptedRef.current === currentCompany.id) return;
            setupAttemptedRef.current = currentCompany.id;

            const state = useZustandStore.getState();
            const currentAccounts = state.accounts || [];
            const { accounting } = state.settings;

            const hasAccounts = currentAccounts.length > 0;
            const isMapped = accounting && accounting.defaultSalesAccountId && accounting.defaultAccountsReceivableId;

            // If everything looks good, do nothing
            if (hasAccounts && isMapped) return;

            setIsProcessing(true);
            
            try {
                // 1. Auto-Seed Accounts if missing
                if (!hasAccounts) {
                    await accountService.seedDefaultAccounts(state.settings.baseCurrency);
                    await fetchAccounts(); 
                }

                // 2. Auto-Map Accounts
                const { accounts: freshAccounts } = useZustandStore.getState();
                
                if (freshAccounts && freshAccounts.length > 0) {
                    const findId = (keywords: string[]) => {
                        const account = freshAccounts.find(a => 
                            !a.isPlaceholder && keywords.some(k => a.name.toLowerCase().includes(k.toLowerCase()))
                        );
                        return account?.id || '';
                    };

                    const mapping = {
                        accountsReceivableId: findId(['Receivable', 'الذمم المدينة', 'عملاء']),
                        accountsPayableId: findId(['Payable', 'الذمم الدائنة', 'موردين']),
                        defaultRevenueAccountId: findId(['Sales', 'Revenue', 'مبيعات', 'إيرادات']),
                        inventoryAccountId: findId(['Inventory', 'مخزون']),
                        cogsAccountId: findId(['Cost of Goods', 'COGS', 'تكلفة']),
                        cashAccountId: findId(['Cash', 'نقد', 'صندوق']),
                        bankAccountId: findId(['Bank', 'بنك', 'مصرف']),
                        taxPayableAccountId: findId(['Tax', 'VAT', 'ضريبة']),
                        defaultExpenseAccountId: findId(['General Expense', 'مصروفات']),
                        defaultSalariesExpenseId: findId(['Salaries Expense', 'رواتب']),
                        defaultSalariesPayableId: findId(['Salaries Payable', 'رواتب مستحقة']),
                        defaultGeneralExpenseAccountId: findId(['General', 'عامة']),
                        defaultCashSalesAccountId: findId(['Cash', 'نقد']),
                        defaultInventoryAdjustmentAccountId: findId(['Adjustment', 'تسوية']),
                    };

                    // Update DB
                    await accountMappingService.updateCompanyAccountMap(currentCompany.id, mapping);

                    // Update Local State
                    const newAccountingSettings: SettingsState['accounting'] = {
                        defaultAccountsReceivableId: mapping.accountsReceivableId || '',
                        defaultAccountsPayableId: mapping.accountsPayableId || '',
                        defaultSalesAccountId: mapping.defaultRevenueAccountId || '',
                        defaultInventoryAccountId: mapping.inventoryAccountId || '',
                        defaultCogsAccountId: mapping.cogsAccountId || '',
                        defaultCashSalesAccountId: mapping.defaultCashSalesAccountId || '',
                        defaultSalariesExpenseId: mapping.defaultSalariesExpenseId || '',
                        defaultSalariesPayableId: mapping.defaultSalariesPayableId || '',
                        defaultGeneralExpenseAccountId: mapping.defaultGeneralExpenseAccountId || '',
                        defaultInventoryAdjustmentAccountId: mapping.defaultInventoryAdjustmentAccountId || '',
                    };

                    const newSettings = { ...state.settings, accounting: newAccountingSettings };
                    await profileService.updateProfileAndSettings(newSettings);
                    setSettings(newSettings);
                    
                    // console.log('Auto-setup completed successfully');
                }
            } catch (e) {
                console.error("Auto setup failed:", e);
                // If automation fails, fallback to showing the UI so user can retry manually
                setStep(hasAccounts ? 2 : 1);
                setIsOpen(true);
            } finally {
                setIsProcessing(false);
            }
        };

        performAutoSetup();
    }, [currentCompany, isDataReady]); // Only depend on company ID and readiness, not accounts array directly to avoid loops

    // Manual Handlers (Fallback)
    const handleSeedAccounts = async () => {
        setIsProcessing(true);
        try {
            await accountService.seedDefaultAccounts(settings.baseCurrency);
            await fetchAccounts();
            addToast({ message: 'تم إنشاء الحسابات الافتراضية بنجاح', type: 'success' });
            setStep(2);
        } catch (e: any) {
            console.error(e);
            const errorMsg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error');
            addToast({ message: `Failed to create accounts: ${errorMsg}`, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutoMap = async () => {
        if (!currentCompany) return;
        setIsProcessing(true);
        addToast({ message: 'جاري تحليل الحسابات...', type: 'info' });

        try {
            await fetchAccounts();
            const { accounts: freshAccounts } = useZustandStore.getState();
            
            if (!freshAccounts || freshAccounts.length === 0) {
                addToast({ message: 'لا توجد حسابات لربطها. يرجى إنشاء الحسابات أولاً.', type: 'error' });
                setStep(1);
                setIsProcessing(false);
                return;
            }

            const findId = (keywords: string[]) => {
                const account = freshAccounts.find(a => 
                    !a.isPlaceholder && keywords.some(k => a.name.toLowerCase().includes(k.toLowerCase()))
                );
                return account?.id || '';
            };

            const mapping = {
                accountsReceivableId: findId(['Receivable', 'الذمم المدينة', 'عملاء']),
                accountsPayableId: findId(['Payable', 'الذمم الدائنة', 'موردين']),
                defaultRevenueAccountId: findId(['Sales', 'Revenue', 'مبيعات', 'إيرادات']),
                inventoryAccountId: findId(['Inventory', 'مخزون']),
                cogsAccountId: findId(['Cost of Goods', 'COGS', 'تكلفة']),
                cashAccountId: findId(['Cash', 'نقد', 'صندوق']),
                bankAccountId: findId(['Bank', 'بنك', 'مصرف']),
                taxPayableAccountId: findId(['Tax', 'VAT', 'ضريبة']),
                defaultExpenseAccountId: findId(['General Expense', 'مصروفات']),
                defaultSalariesExpenseId: findId(['Salaries Expense', 'رواتب']),
                defaultSalariesPayableId: findId(['Salaries Payable', 'رواتب مستحقة']),
                defaultGeneralExpenseAccountId: findId(['General', 'عامة']),
                defaultCashSalesAccountId: findId(['Cash', 'نقد']),
                defaultInventoryAdjustmentAccountId: findId(['Adjustment', 'تسوية']),
            };

            const mappedCount = Object.values(mapping).filter(Boolean).length;
            if (mappedCount < 5) {
                addToast({ message: `تم العثور على ${mappedCount} حسابات فقط. قد تحتاج للربط اليدوي في الإعدادات.`, type: 'warning' });
            }

            const { error } = await accountMappingService.updateCompanyAccountMap(currentCompany.id, mapping);
            if (error) throw error;

            const newAccountingSettings: SettingsState['accounting'] = {
                defaultAccountsReceivableId: mapping.accountsReceivableId || '',
                defaultAccountsPayableId: mapping.accountsPayableId || '',
                defaultSalesAccountId: mapping.defaultRevenueAccountId || '',
                defaultInventoryAccountId: mapping.inventoryAccountId || '',
                defaultCogsAccountId: mapping.cogsAccountId || '',
                defaultCashSalesAccountId: mapping.defaultCashSalesAccountId || '',
                defaultSalariesExpenseId: mapping.defaultSalariesExpenseId || '',
                defaultSalariesPayableId: mapping.defaultSalariesPayableId || '',
                defaultGeneralExpenseAccountId: mapping.defaultGeneralExpenseAccountId || '',
                defaultInventoryAdjustmentAccountId: mapping.defaultInventoryAdjustmentAccountId || '',
            };

            const newSettings = { ...settings, accounting: newAccountingSettings };
            await profileService.updateProfileAndSettings(newSettings);
            setSettings(newSettings);

            addToast({ message: 'تم ربط الحسابات بنجاح!', type: 'success' });
            setStep(3);

        } catch (e: any) {
            console.error("Auto Map Error:", e);
            addToast({ message: `فشل الربط التلقائي: ${e.message || 'Unknown error'}`, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinish = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
            <div className={`relative w-full max-w-lg rounded-2xl p-8 shadow-2xl border-2 ${theme === 'dark' ? 'bg-gray-900 border-cyan-500/50' : 'bg-white border-slate-200'}`}>
                
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 text-gray-500 transition-colors"
                    title="Skip Setup"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">{t.companySetup || 'إعداد الشركة'}</h2>
                    <p className="text-gray-500">لنقم بتجهيز النظام المحاسبي لشركتك.</p>
                </div>

                <div className="flex justify-center mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex items-center ${i < 3 ? 'w-full' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                {step > i ? <CheckCircle size={16} /> : i}
                            </div>
                            {i < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > i ? 'bg-cyan-500' : 'bg-gray-700'}`} />}
                        </div>
                    ))}
                </div>

                <div className="min-h-[200px] flex flex-col items-center justify-center text-center">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right">
                            <BookCopy size={48} className="mx-auto text-purple-400" />
                            <h3 className="text-xl font-semibold">إنشاء شجرة الحسابات</h3>
                            <p className="text-gray-400 text-sm">سيتم إنشاء مجموعة قياسية من الحسابات (الأصول، الخصوم، المصروفات، الإيرادات) للبدء.</p>
                            <HoloButton variant="primary" onClick={handleSeedAccounts} disabled={isProcessing} className="w-full justify-center">
                                {isProcessing ? <Loader className="animate-spin" /> : 'إنشاء الحسابات الافتراضية'}
                            </HoloButton>
                             <button onClick={() => setStep(2)} className="text-xs text-gray-500 hover:text-cyan-400 underline mt-4">
                                لدي حسابات بالفعل، انتقل للربط
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right">
                            <Settings size={48} className="mx-auto text-orange-400" />
                            <h3 className="text-xl font-semibold">ربط الحسابات التلقائي</h3>
                            <p className="text-gray-400 text-sm">سيتم ربط الحسابات التي تم إنشاؤها بإعدادات النظام لضمان عمل الفواتير والقيود بشكل صحيح.</p>
                            <HoloButton variant="primary" onClick={handleAutoMap} disabled={isProcessing} className="w-full justify-center">
                                {isProcessing ? <Loader className="animate-spin" /> : 'ربط الحسابات تلقائياً'}
                            </HoloButton>
                            
                            <button onClick={() => handleSeedAccounts()} className="flex items-center gap-2 text-xs text-gray-500 hover:text-cyan-400 mt-2 mx-auto">
                                <RefreshCw size={12} /> إعادة إنشاء الحسابات
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right">
                            <CheckCircle size={64} className="mx-auto text-green-400" />
                            <h3 className="text-xl font-semibold">تم الإعداد بنجاح!</h3>
                            <p className="text-gray-400 text-sm">نظامك جاهز الآن. يمكنك البدء بإضافة العملاء والفواتير.</p>
                            <HoloButton variant="success" onClick={handleFinish} className="w-full justify-center">
                                ابدأ العمل <ArrowRight className="ml-2" />
                            </HoloButton>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
