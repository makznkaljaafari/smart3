
import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { NewSalesInvoice } from './components/NewSalesInvoice';
import { SalesReturn } from './components/SalesReturn';
import { SalesHistory } from './components/SalesHistory';
import { DollarSign, FileText, TrendingDown, TrendingUp, History } from 'lucide-react';
import { formatCurrency } from '../expenses/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../services/salesService';

type SalesTab = 'history' | 'invoice' | 'return';

export const SalesView: React.FC = () => {
  const { theme, lang, settings } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    settings: state.settings,
  }));
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<SalesTab>('history');

  const { data: statsData } = useQuery({
      queryKey: ['salesStats'],
      queryFn: salesService.getSalesStats,
  });

  const stats = statsData?.data || {
      todayTotal: 0,
      todayCount: 0,
      todayReturns: 0,
      netSales: 0
  };

  const tabs = [
    { id: 'history', label: 'سجل المبيعات', icon: History },
    { id: 'invoice', label: t.newSalesInvoice, icon: FileText },
    { id: 'return', label: t.salesReturn, icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.sales}</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{'إنشاء فواتير المبيعات وإدارة المرتجعات'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SciFiCard theme={theme} title={t.todaysTotalSales} value={formatCurrency(stats.todayTotal, settings.baseCurrency)} icon={TrendingUp} color="green" />
        <SciFiCard theme={theme} title={t.todaysInvoiceCount} value={stats.todayCount.toString()} icon={FileText} color="cyan" />
        <SciFiCard theme={theme} title={t.todaysTotalReturns} value={formatCurrency(stats.todayReturns, settings.baseCurrency)} icon={TrendingDown} color="orange" />
        <SciFiCard theme={theme} title={t.netSales} value={formatCurrency(stats.netSales, settings.baseCurrency)} icon={DollarSign} color="purple" />
      </div>

      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex items-stretch gap-2`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SalesTab)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors
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
        {activeTab === 'history' && <SalesHistory />}
        {activeTab === 'invoice' && <NewSalesInvoice />}
        {activeTab === 'return' && <SalesReturn />}
      </div>
    </div>
  );
};
