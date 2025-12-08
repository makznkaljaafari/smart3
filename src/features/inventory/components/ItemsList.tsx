
import React, { useMemo } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { SciFiCard } from '../../../components/ui/SciFiCard';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useInventoryData } from '../hooks/useInventoryData';
import { ProductDataTable } from './ProductDataTable';
import { ProductFormModal } from './ProductFormModal';
import { ProductDetailsModal } from './ProductDetailsModal';
import { Plus, Search, Package, DollarSign, AlertTriangle, ChevronLeft, ChevronRight, ServerCrash, ScanLine, Brain, X, Loader, UploadCloud } from 'lucide-react';
import { QuickStockAdjustModal } from './QuickStockAdjustModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency } from '../../../lib/formatters';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { Product } from '../../../types';

const InventorySkeleton = ({ theme }: { theme: string }) => {
    const shimmerColor = theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200';
    return (
        <div className="space-y-4 animate-pulse">
             {/* Mobile Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {[...Array(4)].map((_, i) => (
                     <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                        <div className="flex justify-between">
                            <div className={`h-5 w-1/2 ${shimmerColor} rounded`}></div>
                            <div className={`h-8 w-20 ${shimmerColor} rounded`}></div>
                        </div>
                        <div className={`h-3 w-1/3 mt-2 ${shimmerColor} rounded`}></div>
                         <div className="flex justify-between mt-6">
                            <div className={`h-4 w-16 ${shimmerColor} rounded`}></div>
                            <div className={`h-4 w-16 ${shimmerColor} rounded`}></div>
                         </div>
                     </div>
                ))}
            </div>

            {/* Desktop Table Skeleton */}
            <div className={`hidden lg:block rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'}`}>
                <div className={`h-10 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'}`}></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex items-center p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/4 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/6 ${shimmerColor} rounded mr-4`}></div>
                        <div className={`h-4 w-1/12 ${shimmerColor} rounded`}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ItemsList: React.FC = () => {
    const { theme, lang, settings } = useZustandStore(state => ({ 
        theme: state.theme, 
        lang: state.lang, 
        settings: state.settings,
    }));
    const t = translations[lang];
    const navigate = useNavigate();

    const {
        stats,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        paginatedProducts,
