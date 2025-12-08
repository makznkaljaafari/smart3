
import React, { useState, lazy, Suspense } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { BarChart3, Wallet, PieChart, Scale, Brain, Loader } from 'lucide-react';
import { LoadingState } from '../../components/common/LoadingState';

// Lazy Import New Components
const DebtsAgingReport = lazy(() => import('./components/DebtsAgingReport').then(m => ({ default: m.DebtsAgingReport })));
const AccountBalancesReport = lazy(() => import('./components/AccountBalancesReport').then(m => ({ default: m.AccountBalancesReport })));
const IncomeStatementReport = lazy(() => import('./components/IncomeStatementReport').then(m => ({ default: m.IncomeStatementReport })));
const BalanceSheetReport = lazy(() => import('./components/BalanceSheetReport').then(m => ({ default: m.BalanceSheetReport })));
const AIInsightsChat = lazy(() => import('./components/AIInsightsChat').then(m => ({ default: m.AIInsightsChat })));

type ReportTab = 'debtsAging' | 'accountBalances' | 'incomeStatement' | 'balanceSheet' | 'aiInsights';

export const ReportsView: React.FC = () => {
  const { theme, lang } = useZustandStore(state => ({ theme: state.theme, lang: state.lang }));
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<ReportTab>('debtsAging');

  const tabs: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: 'debtsAging', label: t.debtAgingReport, icon: Wallet },
    { id: 'accountBalances', label: t.trialBalance, icon: Scale },
    { id: 'incomeStatement', label: t.profitAndLoss, icon: BarChart3 },
    { id: 'balanceSheet', label: t.balanceSheet, icon: PieChart },
    { id: 'aiInsights', label: t.aiInsightsChat, icon: Brain },
  ];

  const renderContent = () => {
      switch(activeTab) {
          case 'debtsAging': return <DebtsAgingReport />;
          case 'accountBalances': return <AccountBalancesReport />;
          case 'incomeStatement': return <IncomeStatementReport />;
          case 'balanceSheet': return <BalanceSheetReport />;
          case 'aiInsights': return <AIInsightsChat />;
          default: return null;
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.reports}</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>استعراض الأداء المالي والتقارير المحاسبية</p>
      </div>

      <div className={`flex overflow-x-auto border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} no-scrollbar`}>
         {tabs.map(tab => {
             const isActive = activeTab === tab.id;
             return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                        isActive 
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

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
        <Suspense fallback={<LoadingState message={lang === 'ar' ? 'جاري تحميل التقرير...' : 'Loading Report...'} />}>
            {renderContent()}
        </Suspense>
      </div>
    </div>
  );
};
