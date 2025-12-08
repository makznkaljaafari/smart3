
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useZustandStore } from '../../store/useStore';
import { eventBus, notifyAll } from '../../lib/events';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AIAssistant } from './AIAssistant';
import { CheckCircle, XCircle, Info, X, UploadCloud } from 'lucide-react';
import { Toast as ToastType, AppTheme } from '../../types';
import { useAutomationEngine } from '../../hooks/useAutomationEngine';
import { NeuralBackground } from '../ui/NeuralBackground';
import { translations } from '../../lib/i18n';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { OnboardingGuide } from '../common/OnboardingGuide';
import { BottomNavBar } from './BottomNavBar';
import { useSwipe } from '../../hooks/useSwipe';
import { syncService } from '../../services/syncService';

/**
 * A single toast notification component.
 * It handles its own display lifecycle, including enter/exit animations and auto-dismissal.
 */
const Toast: React.FC<{ toast: ToastType; onRemove: (id: string) => void, theme: AppTheme }> = ({ toast, onRemove, theme }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle className="text-emerald-400" />,
    error: <XCircle className="text-red-400" />,
    info: <Info className="text-cyan-400" />,
    warning: <Info className="text-orange-400" />,
  };
  
  const toastStyle = !theme.startsWith('light') 
    ? 'bg-[rgb(var(--bg-tertiary-rgb))] border-[rgb(var(--border-primary-rgb))] text-[rgb(var(--text-primary-rgb))]'
    : 'bg-white border-slate-200/80 text-slate-800 shadow-lg';
  
  const animationClasses = exiting ? 'animate-toast-exit' : 'animate-toast-enter';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${toastStyle} ${animationClasses}`}>
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }} className="p-1 rounded-full hover:bg-gray-500/20">
        <X size={16} className={!theme.startsWith('light') ? 'text-gray-400' : 'text-slate-500'} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
    const { toasts, theme } = useZustandStore(state => ({ toasts: state.toasts, theme: state.theme }));
    const removeToast = useZustandStore(state => state.removeToast);

    return (
        <div className="fixed top-20 right-0 z-[100] p-4 space-y-2 w-full max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} theme={theme} />
            ))}
        </div>
    );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, lang, sidebarWidth, settings, mobileMenuOpen } = useZustandStore(state => ({
    theme: state.theme,
    lang: state.lang,
    sidebarWidth: state.sidebarWidth,
    settings: state.settings,
    mobileMenuOpen: state.mobileMenuOpen,
  }));
  const setState = useZustandStore.setState;
  const isRTL = lang === 'ar';
  const t = translations[lang];

  // Initialize the client-side automation engine
  useAutomationEngine();
  
  useEffect(() => {
    const on = () => {
        setState({ isOffline: false });
        // Trigger Sync when back online
        syncService.processQueue();
    };
    const off = () => setState({ isOffline: true });
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    
    // Check initial state
    if (navigator.onLine) {
        syncService.processQueue();
    } else {
        setState({ isOffline: true });
    }

    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [setState]);

  useEffect(() => {
    const unsub = eventBus.subscribe((e) => {
      notifyAll(e, settings);
    });
    return () => unsub();
  }, [settings]);

  useEffect(() => {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.body.dataset.theme = theme;
      document.body.dataset.accent = settings.appearance.accentColor;
      document.body.dataset.glow = settings.appearance.glowIntensity;
      document.body.dataset.animation = settings.appearance.animationIntensity;
      document.documentElement.dataset.fontSize = settings.appearance.fontSize;
      if (settings.appearance.font === 'tajawal') {
        document.body.classList.add('font-tajawal');
      } else {
        document.body.classList.remove('font-tajawal');
      }
  }, [isRTL, lang, settings.appearance, theme])
  
  const openMenu = useCallback(() => {
    if (!mobileMenuOpen) {
      setState({ mobileMenuOpen: true });
    }
  }, [mobileMenuOpen, setState]);

  const closeMenu = useCallback(() => {
    if (mobileMenuOpen) {
      setState({ mobileMenuOpen: false });
    }
  }, [mobileMenuOpen, setState]);

  const swipeHandlers = useSwipe({
    onSwipeRight: !isRTL ? openMenu : closeMenu,
    onSwipeLeft: isRTL ? openMenu : closeMenu,
  });

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
       <style>{`
        @media (min-width: 1024px) {
          .main-content-wrapper {
            transition: margin 300ms ease-in-out;
            ${isRTL ? 'margin-right' : 'margin-left'}: ${sidebarWidth}px;
          }
        }
      `}</style>
      {settings.appearance.backgroundAnimations && <NeuralBackground theme={theme} />}
      <Sidebar />
      <div 
        data-tour-id="main-content"
        className="main-content-wrapper"
        {...swipeHandlers}
      >
        <TopBar />
        <main className="p-4 sm:p-6 md:p-8 pb-20 lg:pb-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      <AIAssistant />
      <ToastContainer />
      <OnboardingGuide />
      <BottomNavBar />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={closeMenu}
          {...swipeHandlers}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
