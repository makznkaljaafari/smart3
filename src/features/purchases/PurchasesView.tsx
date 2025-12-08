
import React, { useState } from 'react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { SciFiCard } from '../../components/ui/SciFiCard';
import { NewPurchaseInvoice } from './components/NewPurchaseInvoice';
import { PurchaseReturn } from './components/PurchaseReturn';
import { PurchaseHistory } from './components/PurchaseHistory';
import { DollarSign, FileText, TrendingDown, Truck, History, UploadCloud } from 'lucide-react';
import { formatCurrency } from '../expenses/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useQuery } from '@tanstack/react-query';
import { purchaseService } from '../../services/purchaseService';

type PurchasesTab = 'history' | 'invoice' | 'return';

export const PurchasesView: React.FC = () => {
  const { theme, lang, settings } = useZustandStore(state => ({
      theme: state.theme,
      lang: state.lang,
      settings: state.settings,
  }));
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<PurchasesTab>('history');
  const navigate = useNavigate();

  // Fetch stats from server
  const { data: statsData } = useQuery({
      queryKey: ['purchaseStats'],
      queryFn: purchaseService.getPurchaseStats,
  });

  const stats = statsData?.data || {
      todayTotal: 0,
      todayCount: 0,
      todayReturns: 0,
      netPurchases: 0,
  };

  const tabs = [
    { id: 'history', label: t.purchaseHistory, icon: History },
    { id: 'invoice', label: t.newPurchaseInvoice, icon: FileText },
    { id: 'return', label: t.purchaseReturn, icon: TrendingDown },
    { id: 'import', label: t.importFromFile, icon: UploadCloud },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.purchases}</h1>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>{'إدارة فواتير المشتريات والموردين'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SciFiCard theme={theme} title={t.todaysTotalPurchases} value={formatCurrency(stats.todayTotal, settings.baseCurrency)} icon={Truck} color="green" />
        <SciFiCard theme={theme} title={t.todaysPurchaseCount} value={stats.todayCount.toString()} icon={FileText} color="cyan" />
        <SciFiCard theme={theme} title={t.todaysTotalReturns} value={formatCurrency(stats.todayReturns, settings.baseCurrency)} icon={TrendingDown} color="orange" />
        <SciFiCard theme={theme} title={'صافي المشتريات'} value={formatCurrency(stats.netPurchases, settings.baseCurrency)} icon={DollarSign} color="purple" />
      </div>

      <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'} flex items-stretch gap-2`}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                  if (tab.id === 'import') {
                      navigate(ROUTES.PURCHASES_IMPORT);
                  } else {
                      setActiveTab(tab.id as PurchasesTab)
                  }
              }}
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
        {activeTab === 'history' && <PurchaseHistory />}
        {activeTab === 'invoice' && <NewPurchaseInvoice />}
        {activeTab === 'return' && <PurchaseReturn />}
      </div>
    </div>
  );
};
