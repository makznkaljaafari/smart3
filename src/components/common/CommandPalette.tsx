import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { translations } from '../../lib/i18n';
import { ROUTES } from '../../constants/routes';
import { Search, Activity, Users, Wallet, CreditCard, BarChart3, Settings, Package, ShoppingCart, Truck, Building, CornerDownLeft, Loader } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { inventoryService } from '../../services/inventoryService';

interface CommandPaletteProps {
  onClose: () => void;
}

type CommandItem = {
  type: 'page' | 'customer' | 'product';
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  path?: string;
  data?: any;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const { theme, lang } = useZustandStore(s => ({
      theme: s.theme,
      lang: s.lang
  }));
  const t = translations[lang];
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = !theme.startsWith('light');

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Async Search State
  const [customerResults, setCustomerResults] = useState<CommandItem[]>([]);
  const [productResults, setProductResults] = useState<CommandItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const pages: CommandItem[] = useMemo(() => [
    { type: 'page', id: 'dashboard', title: t.dashboard, icon: Activity, path: ROUTES.DASHBOARD },
    { type: 'page', id: 'sales', title: t.sales, icon: ShoppingCart, path: ROUTES.SALES },
    { type: 'page', id: 'purchases', title: t.purchases, icon: Truck, path: ROUTES.PURCHASES },
    { type: 'page', id: 'customers', title: t.customers, icon: Users, path: ROUTES.CUSTOMERS },
    { type: 'page', id: 'suppliers', title: t.suppliers, icon: Building, path: ROUTES.SUPPLIERS },
    { type: 'page', id: 'debts', title: t.debts, icon: Wallet, path: ROUTES.DEBTS },
    { type: 'page', id: 'expenses', title: t.expenses, icon: CreditCard, path: ROUTES.EXPENSES },
    { type: 'page', id: 'inventory', title: t.inventory, icon: Package, path: ROUTES.INVENTORY },
    { type: 'page', id: 'reports', title: t.reports, icon: BarChart3, path: ROUTES.REPORTS },
    { type: 'page', id: 'settings', title: t.settings, icon: Settings, path: ROUTES.SETTINGS },
  ], [t]);
  
  // Debounced Search Effect
  useEffect(() => {
      const searchData = async () => {
          if (!query || query.length < 2) {
              setCustomerResults([]);
              setProductResults([]);
              return;
          }
          
          setIsSearching(true);
          try {
              // Parallel Fetch for Customers and Products
              const [customersResponse, productsResponse] = await Promise.all([
                  customerService.getCustomersPaginated({ search: query, pageSize: 4 }),
                  inventoryService.getProductsPaginated({ search: query, pageSize: 4 })
              ]);

              const customers: CommandItem[] = customersResponse.data.map(c => ({
                  type: 'customer' as const,
                  id: c.id,
                  title: c.name,
                  subtitle: c.phone,
                  icon: Users,
                  data: c,
                  path: ROUTES.CUSTOMERS 
              }));

              const products: CommandItem[] = productsResponse.data.map(p => ({
                  type: 'product' as const,
                  id: p.id,
                  title: p.name,
                  subtitle: `${p.sku} - ${p.manufacturer || ''}`,
                  icon: Package,
                  data: p,
                  path: ROUTES.INVENTORY
              }));

              setCustomerResults(customers);
              setProductResults(products);
          } catch (e) {
              console.error(e);
          } finally {
              setIsSearching(false);
          }
      };

      const timeoutId = setTimeout(searchData, 300);
      return () => clearTimeout(timeoutId);
  }, [query]);


  const filteredItems = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    const pageResults = pages.filter((p: CommandItem) => p.title.toLowerCase().includes(lowerQuery));
    return [...pageResults, ...customerResults, ...productResults];
  }, [query, pages, customerResults, productResults]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]); 

  const handleSelect = (item: CommandItem) => {
    if (item.path) {
        navigate(item.path);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onClose]);

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'page': return lang === 'ar' ? 'صفحة' : 'Page';
          case 'customer': return lang === 'ar' ? 'عميل' : 'Customer';
          case 'product': return lang === 'ar' ? 'منتج' : 'Product';
          default: return '';
      }
  }

  const getTypeColor = (type: string) => {
       switch(type) {
          case 'page': return 'bg-purple-500/20 text-purple-400';
          case 'customer': return 'bg-blue-500/20 text-blue-400';
          case 'product': return 'bg-cyan-500/20 text-cyan-400';
          default: return 'bg-gray-500/20 text-gray-400';
      }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center pt-20" onMouseDown={onClose}>
      <div 
        className={`w-full max-w-2xl border rounded-2xl shadow-2xl flex flex-col overflow-hidden h-fit max-h-[70vh]
            ${isDark ? 'bg-[#1a1600] border-[#ffd700]/30 shadow-[#ffd700]/10' : 'bg-white border-slate-200'}
        `}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-[#ffd700]/20' : 'border-slate-200'}`}>
          {isSearching ? <Loader className="animate-spin text-cyan-400" size={20}/> : <Search className={isDark ? 'text-gray-400' : 'text-slate-400'} />}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? "ابحث عن الصفحات، العملاء، أو المنتجات..." : "Search for pages, customers, or products..."}
            className={`w-full bg-transparent outline-none text-lg ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
          <div className={`text-xs border rounded px-2 py-1 ${isDark ? 'text-gray-400 border-gray-700' : 'text-slate-400 border-slate-300'}`}>ESC</div>
        </div>
        <div className="overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            <ul>
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li
                    key={`${item.type}-${item.id}`}
                    onMouseMove={() => setSelectedIndex(index)}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === index 
                            ? (isDark ? 'bg-[#ffd700]/10' : 'bg-slate-100') 
                            : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</span>
                          {item.subtitle && <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{item.subtitle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
                            {getTypeLabel(item.type)}
                         </span>
                         {selectedIndex === index && <CornerDownLeft className={isDark ? 'text-[#ffd700]' : 'text-slate-400'} size={16} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={`text-center p-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {query ? (lang === 'ar' ? 'لا توجد نتائج.' : 'No results found.') : (lang === 'ar' ? 'ابدأ الكتابة للبحث...' : 'Start typing to search...')}
            </div>
          )}
        </div>
        <div className={`p-2 border-t text-[10px] text-center ${isDark ? 'border-white/5 text-gray-600' : 'border-slate-100 text-gray-400'}`}>
             Search Products, Customers, and Pages
        </div>
      </div>
    </div>
  );
};