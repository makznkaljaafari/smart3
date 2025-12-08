
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { ROUTES } from '../../constants/routes';
import { translations } from '../../lib/i18n';
import { Activity, ShoppingCart, CreditCard, Plus, Settings, Wallet, Users, X } from 'lucide-react';
import { eventBus } from '../../lib/events';

export const BottomNavBar: React.FC = () => {
    const { lang, theme } = useZustandStore();
    const t = translations[lang];
    const location = useLocation();
    const navigate = useNavigate();
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const isDark = theme !== 'light';

    const menuItems = [
        { path: ROUTES.DASHBOARD, label: t.dashboard, icon: Activity },
        { path: ROUTES.SALES, label: t.sales, icon: ShoppingCart },
        { path: 'ADD', label: t.add, icon: isAddMenuOpen ? X : Plus },
        { path: ROUTES.EXPENSES, label: t.expenses, icon: CreditCard },
        { path: ROUTES.SETTINGS, label: t.settings, icon: Settings },
    ];
    
    const quickAddActions = [
        { label: t.addExpense, icon: CreditCard, event: 'SHOW_ADD_EXPENSE_MODAL', color: 'from-purple-500 to-indigo-600 shadow-purple-500/30' },
        { label: t.addDebt, icon: Wallet, event: 'SHOW_ADD_DEBT_MODAL', color: 'from-orange-400 to-red-500 shadow-orange-500/30' },
        { label: t.addCustomer, icon: Users, event: 'SHOW_ADD_CUSTOMER_MODAL', color: 'from-blue-400 to-cyan-500 shadow-blue-500/30' },
    ];

    const handleNav = (path: string) => {
        if (path === 'ADD') {
            setIsAddMenuOpen(prev => !prev);
        } else {
            setIsAddMenuOpen(false);
            navigate(path);
        }
    };
    
    const handleQuickAdd = (event: 'SHOW_ADD_EXPENSE_MODAL' | 'SHOW_ADD_DEBT_MODAL' | 'SHOW_ADD_CUSTOMER_MODAL') => {
        eventBus.publish({ id: crypto.randomUUID(), type: event, payload: {}, at: new Date().toISOString(), lang });
        setIsAddMenuOpen(false);
    }

    return (
        <>
            {isAddMenuOpen && (
                 <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200" 
                    onClick={() => setIsAddMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* Floating Island Container */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none pb-6 px-4" role="navigation" aria-label="Mobile Bottom Navigation">
                
                {/* Quick Actions Menu */}
                {isAddMenuOpen && (
                     <div className="absolute bottom-28 left-0 right-0 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-10 zoom-in-95 duration-200 pointer-events-auto">
                        {quickAddActions.map((action, index) => (
                            <button 
                                key={action.event} 
                                onClick={() => handleQuickAdd(action.event as any)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`
                                    flex items-center justify-between w-64 p-3 pl-5 pr-3 rounded-2xl shadow-xl transform transition-all active:scale-95 border
                                    ${isDark ? 'bg-slate-800/90 text-white border-slate-700' : 'bg-white/95 text-slate-800 border-slate-100'}
                                    backdrop-blur-md
                                `}
                                aria-label={action.label}
                            >
                                <span className="font-semibold text-sm">{action.label}</span>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${action.color} shadow-lg text-white`}>
                                    <action.icon size={20} aria-hidden="true" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Navbar Island - GOLD THEME */}
                <div className={`
                    pointer-events-auto mx-auto max-w-md h-[72px] rounded-[2rem] flex justify-around items-center px-2 shadow-2xl border backdrop-blur-xl transition-all duration-300
                    ${isDark 
                        ? 'bg-gradient-to-r from-[#2A2305]/90 via-[#382E08]/90 to-[#2A2305]/90 border-yellow-600/30 shadow-[0_8px_32px_rgba(234,179,8,0.15)]' 
                        : 'bg-gradient-to-r from-[#FFFBEB]/95 via-[#FFF7ED]/95 to-[#FFFBEB]/95 border-amber-200 shadow-amber-100/60'
                    }
                `}>
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        
                        // Special styling for the Center ADD button (GOLD THEME)
                        if (item.path === 'ADD') {
                            return (
                                <div key={item.path} className="relative -top-8 mx-2">
                                    <button 
                                        onClick={() => handleNav(item.path)} 
                                        className={`
                                            w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl transition-all duration-300
                                            ring-[6px] ${isDark ? 'ring-[#2A2305]' : 'ring-[#FFFBEB]'}
                                            ${isAddMenuOpen 
                                                ? 'bg-gradient-to-br from-rose-500 to-red-600 rotate-45 shadow-red-500/40' 
                                                : 'bg-gradient-to-tr from-yellow-600 via-amber-500 to-yellow-400 shadow-amber-500/50 hover:shadow-amber-500/70 hover:-translate-y-1'
                                            }
                                        `}
                                        aria-label={isAddMenuOpen ? "Close Menu" : "Open Quick Actions"}
                                        aria-expanded={isAddMenuOpen}
                                    >
                                        <item.icon size={32} strokeWidth={2.5} aria-hidden="true" className={isAddMenuOpen ? "-rotate-45" : ""} />
                                    </button>
                                </div>
                            );
                        }

                        // Standard Nav Items
                        return (
                            <button 
                                key={item.path} 
                                onClick={() => handleNav(item.path)} 
                                className={`
                                    relative flex flex-col items-center justify-center w-14 h-full gap-1 transition-all duration-300 group
                                    ${isActive 
                                        ? (isDark ? 'text-yellow-400' : 'text-amber-700') 
                                        : (isDark ? 'text-yellow-200/40 hover:text-yellow-200' : 'text-amber-900/40 hover:text-amber-800')
                                    }
                                `}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? (isDark ? 'bg-yellow-500/10' : 'bg-amber-100/50') : ''}`}>
                                    <item.icon 
                                        size={24} 
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-active:scale-90'}`}
                                        aria-hidden="true"
                                    />
                                    {isActive && (
                                        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isDark ? 'bg-yellow-400 shadow-[0_0_8px_#FACC15]' : 'bg-amber-600'}`} />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    );
};
