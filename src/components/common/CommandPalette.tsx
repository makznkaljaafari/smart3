
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { ROUTES } from '../../constants/routes';
import { Search, Calculator, Users, FileText, Settings, Box, BarChart3 } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  type: 'page' | 'customer' | 'product';
  path: string;
  icon?: React.ElementType;
}

interface CommandPaletteProps {
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const { customers, products, lang } = useZustandStore(state => ({
    customers: state.customers || [], // Fallback if undefined in store initial state
    products: state.products || [],
    lang: state.lang
  }));
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const pages: CommandItem[] = [
    { id: 'dashboard', title: 'Dashboard / لوحة التحكم', type: 'page', path: ROUTES.DASHBOARD, icon: BarChart3 },
    { id: 'sales', title: 'New Sale / مبيعات', type: 'page', path: ROUTES.SALES, icon: Calculator },
    { id: 'customers', title: 'Customers / العملاء', type: 'page', path: ROUTES.CUSTOMERS, icon: Users },
    { id: 'inventory', title: 'Inventory / المخزون', type: 'page', path: ROUTES.INVENTORY, icon: Box },
    { id: 'expenses', title: 'Expenses / المصروفات', type: 'page', path: ROUTES.EXPENSES, icon: FileText },
    { id: 'settings', title: 'Settings / الإعدادات', type: 'page', path: ROUTES.SETTINGS, icon: Settings },
  ];

  const customerResults: CommandItem[] = customers.map(c => ({
    id: `cust-${c.id}`,
    title: c.name,
    type: 'customer',
    path: ROUTES.CUSTOMERS, // In real app, could nav to details
    icon: Users
  }));

  const productResults: CommandItem[] = products.map(p => ({
    id: `prod-${p.id}`,
    title: p.name,
    type: 'product',
    path: ROUTES.INVENTORY,
    icon: Box
  }));

  const filteredItems = useMemo(() => {
    if (!query) return pages;
    const lowerQuery = query.toLowerCase();
    
    const matchedPages = pages.filter(p => p.title.toLowerCase().includes(lowerQuery));
    const matchedCustomers = customerResults.filter(c => c.title.toLowerCase().includes(lowerQuery)).slice(0, 5);
    const matchedProducts = productResults.filter(p => p.title.toLowerCase().includes(lowerQuery)).slice(0, 5);

    return [...matchedPages, ...matchedCustomers, ...matchedProducts];
  }, [query, pages, customerResults, productResults]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleSelect = (item: CommandItem) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onMouseDown={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border dark:border-slate-700 flex flex-col"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b dark:border-slate-700">
          <Search className="text-gray-400 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-lg text-slate-900 dark:text-white placeholder:text-gray-500"
            placeholder={lang === 'ar' ? "اكتب أمرًا أو ابحث..." : "Type a command or search..."}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-xs text-gray-400 border border-gray-600 rounded px-2 py-0.5">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found.</div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? 'bg-cyan-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
              >
                {item.icon && <item.icon size={18} className={index === selectedIndex ? 'text-white' : 'text-gray-400'} />}
                <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className={`text-xs ${index === selectedIndex ? 'text-cyan-100' : 'text-gray-500'}`}>{item.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
