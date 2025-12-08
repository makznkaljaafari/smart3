
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Brain, Menu, Search, Trash2, Info, Command, Download, Wifi, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { ROUTES } from '../../constants/routes';
import { Toast } from '../../types';
import { CommandPalette } from '../common/CommandPalette';
import { useQueryClient } from '@tanstack/react-query';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { Tooltip } from '../ui/Tooltip';

export const TopBar: React.FC = () => {
  const { theme, lang, isOffline, isSyncing, manualSync, notifications, markNotificationRead, clearNotifications } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    isOffline: state.isOffline,
    isSyncing: state.isSyncing,
    manualSync: state.manualSync,
    notifications: state.notifications,
    markNotificationRead: state.markNotificationRead,
    clearNotifications: state.clearNotifications,
  }));
  const setState = useZustandStore.setState;
  const queryClient = useQueryClient();
  const { isInstallable, promptInstall } = useInstallPrompt();

  const t = translations[lang];
  const isRTL = lang === 'ar';
  const location = useLocation();
  const isDark = !theme.startsWith('light');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSync = async () => {
    await Promise.all([
        manualSync(), 
        queryClient.invalidateQueries()
    ]);
  };
  
  const getPageTitle = () => {
    const currentPath = location.pathname;
    const routeKey = (Object.keys(ROUTES) as Array<keyof typeof ROUTES>).find(
      key => ROUTES[key] === currentPath
    );

    switch (routeKey) {
        case 'DASHBOARD': return t.dashboard;
        case 'SALES': return t.sales;
        case 'PURCHASES': return t.purchases;
        case 'PURCHASES_IMPORT': return t.importPurchaseInvoice;
        case 'CUSTOMERS': return t.customers;
        case 'SUPPLIERS': return t.suppliers;
        case 'DEBTS': return t.debts;
        case 'EXPENSES': return t.expenses;
        case 'INCOME': return t.income;
        case 'INVENTORY': return t.inventory;
        case 'NOTES': return t.notes;
        case 'REPORTS': return t.reports;
        case 'ACCOUNTING': return t.accounting;
        case 'TEAM': return t.teamManagement;
        case 'SETTINGS': return t.settings;
        case 'INTEGRATIONS': return t.integrations;
        case 'PROJECTS': return t.projects;
        default: return 'Smart Finance';
    }
  };

  const pageTitle = getPageTitle();
  
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' سنوات' : ' years ago');
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' أشهر' : ' months ago');
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' أيام' : ' days ago');
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' ساعات' : ' hours ago');
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' دقائق' : ' minutes ago');
    return lang === 'ar' ? 'الآن' : 'just now';
  };

  // Styles
  // Gold Theme Backgrounds
  const glassHeader = isDark 
    ? 'bg-gradient-to-r from-[#1a1600] via-[#332b00] to-[#1a1600] backdrop-blur-xl border-b border-[#ffd700]/20 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
    : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 backdrop-blur-xl border-b border-amber-200 shadow-sm';

  // Silver Icon Styles
  const buttonBase = `
    relative p-2 rounded-xl transition-all duration-300 group overflow-hidden 
    ${isDark 
        ? 'hover:bg-white/10 text-slate-300 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
        : 'hover:bg-amber-100 text-slate-500 hover:text-slate-800'
    }
  `;
  
  // Metallic Silver Gradient Text for Title
  const titleClass = isDark
    ? 'text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-400 drop-shadow-sm'
    : 'text-slate-800';

  return (
    <>
      <header className={`sticky top-0 h-16 z-30 w-full transition-all duration-300 ${glassHeader}`}>
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Left Side: Title & Mobile Menu */}
          <div className="flex flex-shrink-0 items-center gap-3 min-w-0">
              <button
                onClick={() => setState(s => ({...s, mobileMenuOpen: !s.mobileMenuOpen}))}
                className={`p-2 rounded-xl lg:hidden ${buttonBase}`}
                aria-label={t.mainMenu || "Toggle menu"}
              >
                <Menu size={22} className={isDark ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]' : ''} />
              </button>
              
              <div className="flex flex-col">
                  <h1 className={`text-lg font-bold tracking-tight ${titleClass}`}>
                    {pageTitle}
                  </h1>
                  {location.pathname === ROUTES.DASHBOARD && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Wifi size={10} className={isOffline ? 'text-red-500' : 'text-green-500'}/> {isOffline ? 'Offline' : 'Online'}</span>
                      </div>
                  )}
              </div>
          </div>

          {/* Center: Prominent Search Bar */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-xl border transition-all duration-300 group
                    ${isDark 
                        ? 'bg-black/20 border-white/10 text-slate-300 hover:bg-black/30 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                        : 'bg-white/60 border-amber-200 text-slate-600 hover:bg-white hover:border-amber-300'
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <Search size={18} className={isDark ? 'text-slate-400 group-hover:text-white' : 'text-amber-600'} />
                    <span className="text-sm font-medium opacity-70 group-hover:opacity-100">
                        {lang === 'ar' ? 'بحث عن عملاء، منتجات، صفحات...' : 'Search customers, products, pages...'}
                    </span>
                </div>
                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    <Command size={10} />
                    <span>K</span>
                </div>
            </button>
          </div>

          {/* Right Side: Actions (Silver Theme) */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Mobile Search Trigger */}
            <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className={`md:hidden ${buttonBase}`}
            >
                <Search size={20} className={isDark ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]' : ''} />
            </button>

            {/* Install App Button */}
            {isInstallable && (
                <Tooltip content="Install App">
                    <button
                        onClick={promptInstall}
                        className={`${buttonBase} !text-green-400`}
                    >
                        <Download size={20} className={isDark ? 'drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : ''} />
                    </button>
                </Tooltip>
            )}

            {/* Sync Button */}
            <Tooltip content={t.autoSync}>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`${buttonBase} ${isSyncing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <RefreshCw size={20} className={`${isSyncing ? 'animate-spin text-cyan-400' : (isDark ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]' : '')}`} />
              </button>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip content={!theme.startsWith('light') ? t.light : t.dark}>
              <button
                onClick={() => setState((s) => ({ theme: !s.theme.startsWith('light') ? 'light' : 'dark', settings: { ...s.settings, appearance: { ...s.settings.appearance, theme: !s.theme.startsWith('light') ? 'light' : 'dark' } } }))}
                className={buttonBase}
              >
                {!theme.startsWith('light') ? <Sun size={20} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" /> : <Moon size={20} />}
              </button>
            </Tooltip>
            
            {/* Language Toggle */}
             <Tooltip content={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
               <button
                onClick={() => setState((s) => ({ lang: s.lang === 'ar' ? 'en' : 'ar' }))}
                className={`hidden md:flex items-center justify-center w-9 h-9 rounded-xl border transition-all 
                ${isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                    : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-slate-700'
                } text-xs font-bold`}
              >
                {lang === 'ar' ? 'EN' : 'عربي'}
              </button>
            </Tooltip>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
                <Tooltip content={lang === 'ar' ? 'الإشعارات' : 'Notifications'}>
                  <button 
                      onClick={() => setIsNotificationsOpen(prev => !prev)} 
                      className={`${buttonBase} ${isNotificationsOpen ? (isDark ? 'bg-white/10 text-white' : 'bg-amber-200 text-slate-900') : ''}`}
                  >
                    <Bell size={20} className={isDark ? 'drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]' : ''} />
                    {unreadCount > 0 && (
                       <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-[rgb(var(--bg-secondary-rgb))]">
                          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                       </span>
                    )}
                  </button>
                </Tooltip>
                
                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-4 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden border transition-all animate-modal-enter ${isDark ? 'bg-[rgb(var(--bg-secondary-rgb))] border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200'}`}>
                      <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                        <h3 className="font-semibold flex items-center gap-2">
                            <Bell size={16} className={isDark ? 'text-cyan-400' : 'text-cyan-600'}/> 
                            {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        {notifications.length > 0 && (
                            <button onClick={clearNotifications} className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1">
                                <Trash2 size={12}/> {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
                            </button>
                        )}
                      </div>
                       <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                        {notifications.length > 0 ? (
                           notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b transition-colors hover:bg-opacity-50 ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} ${!n.read ? (isDark ? 'bg-cyan-500/5' : 'bg-cyan-50') : ''}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'} ${!n.read ? 'font-semibold' : ''}`}>{n.message}</p>
                                    {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0 shadow-[0_0_5px_cyan]"></div>}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[10px] text-gray-500 font-mono">{timeAgo(n.timestamp)}</span>
                                    {!n.read && (
                                        <button onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} className="text-[10px] text-cyan-400 hover:underline">
                                            {lang === 'ar' ? 'تحديد كمقروء' : 'Mark read'}
                                        </button>
                                    )}
                                </div>
                            </div>
                           ))
                        ) : (
                           <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                            <div className={`p-4 rounded-full mb-3 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <Info size={24} className="opacity-50"/>
                            </div>
                            <p className="text-sm">{lang === 'ar' ? 'لا توجد إشعارات حالياً.' : 'No notifications yet.'}</p>
                           </div>
                        )}
                       </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </header>
      {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />}
    </>
  );
};
