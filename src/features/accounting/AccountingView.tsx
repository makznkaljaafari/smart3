
import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { BookCopy, BookOpen, BookKey, ShieldCheck, CalendarRange, Building2, RefreshCw, Globe, FileText } from 'lucide-react';
import { ChartOfAccountsView } from './components/ChartOfAccountsView';
import { JournalEntriesView } from './components/JournalEntriesView';
import { GeneralLedgerView } from './components/GeneralLedgerView';
import { AccountingAuditView } from './components/AccountingAuditView';
import { FiscalYearsView } from './components/FiscalYearsView';
import { FixedAssetsView } from './components/FixedAssetsView';
import { BankReconciliationView } from './components/BankReconciliationView';
import { TaxReturnView } from './components/TaxReturnView';
import { FXRevaluationModal } from './components/FXRevaluationModal';
import { HoloButton } from '../../components/ui/HoloButton';

type AccountingTab = 'chartOfAccounts' | 'journalEntries' | 'generalLedger' | 'audit' | 'fiscalYears' | 'fixedAssets' | 'reconciliation' | 'taxReturn';

export const AccountingView: React.FC = () => {
    const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<AccountingTab>('audit');
    const [showFXModal, setShowFXModal] = useState(false);

    const tabs: { id: AccountingTab; label: string; icon: React.ElementType }[] = [
        { id: 'audit', label: t.accountingAudit || 'الفحص الشامل', icon: ShieldCheck },
        { id: 'taxReturn', label: 'الإقرار الضريبي', icon: FileText },
        { id: 'reconciliation', label: 'تسوية بنكية', icon: RefreshCw },
        { id: 'fixedAssets', label: 'الأصول الثابتة', icon: Building2 },
        { id: 'fiscalYears', label: 'السنوات المالية', icon: CalendarRange },
        { id: 'chartOfAccounts', label: t.chartOfAccounts, icon: BookCopy },
        { id: 'journalEntries', label: t.journalEntries, icon: BookKey },
        { id: 'generalLedger', label: t.generalLedger, icon: BookOpen },
    ];
    
    const renderContent = () => {
        switch(activeTab) {
            case 'chartOfAccounts': return <ChartOfAccountsView />;
            case 'journalEntries': return <JournalEntriesView />;
            case 'generalLedger': return <GeneralLedgerView />;
            case 'audit': return <AccountingAuditView />;
            case 'fiscalYears': return <FiscalYearsView />;
            case 'fixedAssets': return <FixedAssetsView />;
            case 'reconciliation': return <BankReconciliationView />;
            case 'taxReturn': return <TaxReturnView />;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.accounting}</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{t.accountingManagement}</p>
                </div>
                <HoloButton variant="secondary" icon={Globe} onClick={() => setShowFXModal(true)}>إعادة تقييم العملات</HoloButton>
            </div>
            
            <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex items-stretch gap-2 overflow-x-auto pb-1`}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap
                                ${isActive 
                                    ? 'border-cyan-500 text-cyan-400' 
                                    : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
            
            <div className="mt-6">
                {renderContent()}
            </div>

            {showFXModal && <FXRevaluationModal onClose={() => setShowFXModal(false)} />}
        </div>
    );
};
