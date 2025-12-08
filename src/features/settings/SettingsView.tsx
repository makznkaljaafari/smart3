
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useZustandStore } from '../../store/useStore';
import { defaultSettings } from '../../store/slices/settingsSlice';
import { translations } from '../../lib/i18n';
import { HoloButton } from '../../components/ui/HoloButton';
import { SettingsState, PageSettings, Toast } from '../../types';
import { Save, User, DollarSign, Eye, Database, FileText, PiggyBank, LayoutDashboard, Zap, BookCopy, Package, ChevronRight, Info } from 'lucide-react';

import { CurrencySettings } from './components/CurrencySettings';
import { ProfileSettings } from './components/ProfileSettings';
import { AppearanceSettings } from './components/AppearanceSettings';
import { PageSettingsSection } from './components/PageSettingsSection';
import { DataSettings } from './components/DataSettings';
import { BudgetSettings } from './components/BudgetSettings';
import { profileService } from '../../services/profileService';
import { settingsService } from '../../services/settingsService';
import { AccountingSettings } from './components/AccountingSettings';
import { DashboardSettings } from './components/DashboardSettings';
import { InventorySettings } from './components/InventorySettings';
import { AboutSection } from './components/AboutSection';

type SettingsTab = 'profile' | 'appearance' | 'dashboard' | 'currencies' | 'inventory' | 'accounting' | 'budgets' | 'page' | 'data' | 'about';

export const SettingsView: React.FC = () => {
  const { settings, lang, theme, authUser, currentCompany } = useZustandStore(state => ({
    settings: state.settings,
    lang: state.lang,
    theme: state.theme,
    authUser: state.authUser,
    currentCompany: state.currentCompany,
  }));
  const setState = useZustandStore.setState;
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [local, setLocal] = useState<SettingsState>(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const prevCompanyIdRef = useRef(currentCompany?.id);
  
  // Sync entire settings object ONLY when company changes
  useEffect(() => {
    if (currentCompany?.id !== prevCompanyIdRef.current) {
        setLocal(settings);
        prevCompanyIdRef.current = currentCompany?.id;
    }
  }, [currentCompany?.id, settings]);

  // Specifically sync exchange rates if they are updated in the background (e.g. via data fetch)
  useEffect(() => {
      setLocal(prev => ({ ...prev, exchangeRates: settings.exchangeRates }));
  }, [settings.exchangeRates]);
  
  const addToast = (message: string, type: Toast['type']) => {
      setState(s => ({ ...s, toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
  }

  const save = async () => {
    if (!authUser) {
        addToast('User not authenticated', 'error');
        return;
    }
    setIsSaving(true);

    try {
        // 1. Save User Profile & Preferences (to Auth Metadata)
        const { error: profileError } = await profileService.updateProfileAndSettings(local);
        if (profileError) throw profileError;

        // 2. Save Company Settings (Currency, Lang, etc. to DB)
        if (currentCompany) {
            const { error: companyError } = await settingsService.updateCompanySettings(currentCompany.id, local);
            if (companyError) throw companyError;
        }

        // 3. Update Local State
        const newTheme = local.appearance.theme === 'system' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
          : local.appearance.theme;

        setState(s => ({ 
          ...s,
          settings: local, 
          lang: local.profile.locale, 
          currency: local.baseCurrency, 
          theme: newTheme,
        }));
        
        addToast(t.successSaved, 'success');
    } catch (error: any) {
        console.error(error);
        addToast(error.message || 'Failed to save settings', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const resetPageDefaults = (page: keyof PageSettings) => {
    setLocal((prev) => ({ ...prev, page: { ...prev.page, [page]: defaultSettings.page[page] } }));
  };
  
  const tabs = useMemo(() => [
    { id: 'profile', label: t.profile, icon: User },
    { id: 'appearance', label: t.appearance, icon: Eye },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'currencies', label: t.currencies, icon: DollarSign },
    { id: 'inventory', label: t.inventoryAndSales, icon: Package },
    { id: 'accounting', label: t.accountingDefaults, icon: BookCopy },
    { id: 'budgets', label: t.budgets, icon: PiggyBank },
    { id: 'page', label: t.pageSettings, icon: FileText },
    { id: 'data', label: t.dataManagement, icon: Database },
    { id: 'about', label: t.about || 'About', icon: Info },
  ], [t]);

  const renderContent = () => {
    const commonProps = { localSettings: local, setLocalSettings: setLocal, t, theme, lang };
    switch (activeTab) {
      case 'profile': return <ProfileSettings {...commonProps} />;
      case 'appearance': return <AppearanceSettings {...commonProps} />;
      case 'dashboard': return <DashboardSettings {...commonProps} />;
      case 'currencies': return <CurrencySettings {...commonProps} />;
      case 'inventory': return <InventorySettings {...commonProps} />;
      case 'accounting': return <AccountingSettings {...commonProps} />;
      case 'budgets': return <BudgetSettings {...commonProps} />;
      case 'page': return <PageSettingsSection {...commonProps} onReset={resetPageDefaults} />;
      case 'data': return <DataSettings t={t} theme={theme} />;
      case 'about': return <AboutSection t={t} theme={theme} />;
      default: return <ProfileSettings {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      {/* Mobile Select */}
      <div className="lg:hidden mb-4">
        <div className={`relative p-1 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
            className={`w-full p-3 bg-transparent outline-none appearance-none font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}
            >
            {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 rotate-90" size={16} />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 rounded-2xl border overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-900/40 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                {t.settings}
            </h3>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? (isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-cyan-50 text-cyan-700')
                    : (isDark ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-slate-600 hover:bg-slate-50')
                  }
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <tab.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span>{tab.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" />}
                
                {/* Hover Glint */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-thin">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderContent()}
            </div>
        </div>
        
        {activeTab !== 'about' && (
            <div className={`sticky bottom-0 pt-4 mt-4 border-t flex justify-end bg-gradient-to-t ${isDark ? 'from-[rgb(var(--bg-primary-rgb))] via-[rgb(var(--bg-primary-rgb))] to-transparent border-white/10' : 'from-slate-50 via-slate-50 to-transparent border-slate-200'}`}>
              <HoloButton icon={Save} variant="success" onClick={save} disabled={isSaving} className="shadow-lg shadow-green-500/20">
                {isSaving ? t.saving : t.saveChanges}
              </HoloButton>
            </div>
        )}
      </main>
    </div>
  );
};
