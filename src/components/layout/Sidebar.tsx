
import React, { useCallback, useRef, useMemo } from 'react';
import { Activity, Users, Wallet, CreditCard, FileText, BarChart3, Zap, Settings, Cpu, ChevronLeft, ChevronRight, BookCopy, Package, ShoppingCart, Truck, Building, Users2, Briefcase, Car } from 'lucide-react';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { ROUTES } from '../../constants/routes';
import { useSwipe } from '../../hooks/useSwipe';
import { SidebarItem } from './Sidebar/SidebarItem';
import { SidebarProfile } from './Sidebar/SidebarProfile';

export const Sidebar: React.FC = () => {
  const { lang, sidebarWidth, theme, mobileMenuOpen, sidebarPreCollapseWidth, currentCompany, userRole } = useZustandStore(state => ({
    lang: state.lang,
    sidebarWidth: state.sidebarWidth,
    theme: state.theme,
    mobileMenuOpen: state.mobileMenuOpen,
    sidebarPreCollapseWidth: state.sidebarPreCollapseWidth,
    currentCompany: state.currentCompany,
    userRole: state.userRole,
  }));
  const setState = useZustandStore.setState;
  const t = translations[lang];
  const isRTL = lang === 'ar';
  const isResizing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = isRTL ? document.body.offsetWidth - event.clientX : event.clientX;
      const minWidth = 180;
      const maxWidth = 400;
      let finalWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setState({ sidebarWidth: finalWidth });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [lang, setState, isRTL]);

  const allMenuItems = useMemo(() => [
    { path: ROUTES.DASHBOARD, icon: Activity, label: t.dashboard },
    { path: ROUTES.SALES, icon: ShoppingCart, label: t.sales },
    { path: ROUTES.VEHICLES, icon: Car, label: 'سجل السيارات' }, // Added Vehicles
    { path: ROUTES.PURCHASES, icon: Truck, label: t.purchases },
    { path: ROUTES.PROJECTS, icon: Briefcase, label: t.projects },
    { path: ROUTES.CUSTOMERS, icon: Users, label: t.customers },
    { path: ROUTES.SUPPLIERS, icon: Building, label: t.suppliers },
    { path: ROUTES.DEBTS, icon: Wallet, label: t.debts },
    { path: ROUTES.EXPENSES, icon: CreditCard, label: t.expenses },
    { path: ROUTES.INVENTORY, icon: Package, label: t.inventory },
    { path: ROUTES.NOTES, icon: FileText, label: t.notes },
    { path: ROUTES.REPORTS, icon: BarChart3, label: t.reports },
    { path: ROUTES.ACCOUNTING, icon: BookCopy, label: t.accounting },
    { path: ROUTES.TEAM, icon: Users2, label: t.teamManagement },
    { path: ROUTES.INTEGRATIONS, icon: Zap, label: t.integrations },
    { path: ROUTES.SETTINGS, icon: Settings, label: t.settings }
  ], [t]);

  const menuItems = useMemo(() => {
    if (!userRole) return [];
    const adminManagerRoles = new Set(['owner', 'admin', 'manager']);
    const employeeRoutes = new Set<string>([
        ROUTES.DASHBOARD, ROUTES.EXPENSES, ROUTES.NOTES, ROUTES.SETTINGS,
        ROUTES.CUSTOMERS, ROUTES.SALES, ROUTES.PURCHASES, ROUTES.VEHICLES
    ]);

    if (adminManagerRoles.has(userRole)) {
        return allMenuItems;
    }
    if (userRole === 'employee') {
        return allMenuItems.filter(item => employeeRoutes.has(item.path));
    }
    return [];
  }, [userRole, allMenuItems]);
  
  const handleCollapseToggle = () => {
    const collapsedWidth = 80;
    const currentWidth = sidebarWidth;
    const preCollapse = sidebarPreCollapseWidth || 256;
    const isCurrentlyCollapsed = currentWidth <= collapsedWidth;

    if (isCurrentlyCollapsed) {
      setState({ sidebarWidth: preCollapse });
    } else {
      setState({ sidebarWidth: collapsedWidth, sidebarPreCollapseWidth: currentWidth });
    }
  };
  
  const sidebarCollapsed = sidebarWidth < 100;
  const isDesktopCollapsed = sidebarCollapsed && !mobileMenuOpen;

  const closeMenu = useCallback(() => {
    if (mobileMenuOpen) {
      setState({ mobileMenuOpen: false });
    }
  }, [mobileMenuOpen, setState]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: !isRTL ? closeMenu : undefined,
    onSwipeRight: isRTL ? closeMenu : undefined,
  });

  const isDark = !theme.startsWith('light');
  const bgClass = isDark 
    ? 'bg-[rgba(var(--bg-secondary-rgb),0.65)] backdrop-blur-2xl border-r border-[rgba(255,255,255,0.08)]' 
    : 'bg-white/90 backdrop-blur-xl border-r border-slate-200';
  
  return (
    <aside
      data-tour-id="sidebar"
      style={{ width: mobileMenuOpen ? '256px' : `${sidebarWidth}px` }}
      className={`fixed ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-screen z-50
      transform transition-transform duration-300 ease-out
      ${mobileMenuOpen ? 'translate-x-0' : (isRTL ? 'lg:translate-x-0 translate-x-full' : 'lg:translate-x-0 -translate-x-full')}
      lg:transition-[width] lg:duration-300
      flex flex-col shadow-2xl
      ${bgClass}
      `}
      {...swipeHandlers}
    >
       <div 
        onMouseDown={handleMouseDown}
        className={`absolute top-0 ${isRTL ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'} w-4 h-full cursor-col-resize z-50 group hidden lg:block`}
      >
        <div className={`w-0.5 h-full mx-auto transition-all duration-300 ${isDark ? 'bg-white/10 group-hover:bg-cyan-500 group-hover:w-[2px] group-hover:shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-200 group-hover:bg-cyan-400'}`} />
      </div>

      <div data-tour-id="sidebar-header" className={`p-5 flex-shrink-0 ${isDark ? 'border-b border-white/5' : 'border-b border-slate-100'}`}>
        <div className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isDesktopCollapsed && (
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative group">
                <Cpu size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0 transition-opacity duration-300">
                <h2 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentCompany?.name || 'Smart Finance'}</h2>
                <p className={`text-xs truncate ${isDark ? 'text-cyan-400' : 'text-slate-500'}`}>{lang === 'ar' ? 'إدارة مالية' : 'Financial Mgmt'}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleCollapseToggle}
            className={`p-2 rounded-lg hidden lg:flex transition-all duration-200 ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            {sidebarCollapsed ? (isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />) : (isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent" aria-label="Main Navigation" data-tour-id="sidebar-nav">
        {!isDesktopCollapsed && (
          <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {t.mainMenu}
          </div>
        )}
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            isCollapsed={isDesktopCollapsed}
            isRTL={isRTL}
          />
        ))}
      </nav>

      <SidebarProfile isCollapsed={isDesktopCollapsed} isDark={isDark} />
    </aside>
  );
};
