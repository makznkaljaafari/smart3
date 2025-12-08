
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../store/useStore';
import { Product } from '../../types';
import { Input } from '../ui/Input';
import { Search, Loader } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { inventoryService } from '../../services/inventoryService';
import { useQuery } from '@tanstack/react-query';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { theme, currentCompany } = useZustandStore(state => ({ 
      theme: state.theme, 
      currentCompany: state.currentCompany 
  }));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchTerm);
      }, 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products from server based on search
  const { data: productsData, isLoading } = useQuery({
      queryKey: ['productSearch', currentCompany?.id, debouncedSearch],
      queryFn: () => inventoryService.getProductsPaginated({ 
          page: 1, 
          pageSize: 50, // Fetch top 50 matches
          search: debouncedSearch 
      }),
      enabled: !!currentCompany?.id && isOpen,
      staleTime: 1000 * 60 // Cache results for 1 minute
  });

  const filteredProducts = productsData?.data || [];

  if (!isOpen) return null;

  // Updated classes to include full borders (vertical and horizontal)
  const thClasses = `p-2 text-right font-semibold sticky top-0 z-10 text-xs border ${theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-slate-100 text-gray-700 border-slate-300'}`;
  const tdClasses = `p-2 border text-xs ${theme === 'dark' ? 'border-gray-700 text-gray-300' : 'border-slate-300 text-slate-700'}`;

  return (
    <div className="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4" onMouseDown={onClose}>
      <div 
        className={`w-full h-full md:max-w-7xl md:h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-cyan-500/30' : 'bg-white border'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={`p-4 border-b flex flex-col gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>اختر منتج</h3>
          <div className="relative">
             <Input 
                icon={Search} 
                placeholder="ابحث بالاسم، الكود، رقم المنتج، أو الشركة المصنعة..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                className="text-sm"
            />
            {isLoading && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2">
                    <Loader size={16} className="animate-spin text-cyan-500"/>
                </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 && !isLoading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>{searchTerm ? 'لا توجد منتجات مطابقة' : 'ابدأ البحث...'}</p>
             </div>
          ) : (
              <table className="w-full text-sm responsive-table border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClasses} w-10 text-center`}>#</th>
                    <th className={thClasses}>اسم المنتج</th>
                    <th className={thClasses}>رقم المنتج</th>
                    <th className={thClasses}>الشركة الصانعة</th>
                    <th className={thClasses}>سعر الشراء</th>
                    <th className={thClasses}>سعر البيع</th>
                    <th className={thClasses}>المقاس</th>
                    <th className={thClasses}>المواصفات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product: Product, index: number) => (
                    <tr 
                      key={product.id} 
                      className={`cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-cyan-900/20' : 'hover:bg-cyan-50'}`}
                      onClick={() => onSelect(product)}
                    >
                      <td className={`${tdClasses} text-center text-gray-500`}>{index + 1}</td>
                      <td className={`${tdClasses} font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`} data-label="اسم المنتج">{product.name}</td>
                      <td className={tdClasses} data-label="رقم المنتج">{product.itemNumber || '-'}</td>
                      <td className={tdClasses} data-label="الشركة الصانعة">{product.manufacturer || '-'}</td>
                      <td className={`${tdClasses} font-mono`} data-label="سعر الشراء">{formatCurrency(product.costPrice, product.currency)}</td>
                      <td className={`${tdClasses} font-mono text-green-500 font-semibold`} data-label="سعر البيع">{formatCurrency(product.sellingPrice, product.currency)}</td>
                      <td className={tdClasses} data-label="المقاس">{product.size || '-'}</td>
                      <td className={`${tdClasses} max-w-[200px] truncate`} data-label="المواصفات" title={product.specifications}>{product.specifications || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
        
        <div className={`p-3 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'}`}>
            <span className="text-xs text-gray-500">
                {isLoading ? 'جاري التحميل...' : `عدد النتائج: ${filteredProducts.length}`}
            </span>
            <button type="button" onClick={onClose} className={`px-6 py-2 rounded-lg font-semibold text-sm transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>إغلاق</button>
        </div>
      </div>
    </div>
  );
};
