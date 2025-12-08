
import React, { useState, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { Customer, Supplier } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { User, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../../services/customerService';
import { supplierService } from '../../../services/supplierService';

interface CustomerSupplierSearchProps {
    type: 'customer' | 'supplier';
    onSelect: (entity: Customer | Supplier | null) => void;
    initialName?: string | null;
    t: Record<string, string>;
}

export const CustomerSupplierSearch: React.FC<CustomerSupplierSearchProps> = ({ type, onSelect, initialName, t }) => {
    const { currentCompany } = useZustandStore(s => ({ currentCompany: s.currentCompany }));
    const [search, setSearch] = useState(initialName || '');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);
    
    const { data: results, isLoading } = useQuery({
        queryKey: ['entitySearch', type, currentCompany?.id, debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch) return [];
            if (type === 'customer') {
                const res = await customerService.getCustomersPaginated({ search: debouncedSearch, pageSize: 10 });
                return res.data;
            } else {
                const res = await supplierService.getSuppliersPaginated({ search: debouncedSearch, pageSize: 10 });
                return res.data;
            }
        },
        enabled: !!currentCompany?.id && showDropdown && debouncedSearch.length > 0
    });
        
    const handleSelect = (entity: Customer | Supplier) => {
        onSelect(entity);
        setSearch(entity.name);
        setShowDropdown(false);
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        if (e.target.value !== initialName) {
            onSelect(null); // Clear selection if user types
        }
        setShowDropdown(true);
    };

    const labelText = type === 'customer' ? t.customerInfo : t.supplierInfo;
    const placeholderText = type === 'customer' ? t.searchCustomer : t.searchSupplier;

    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    icon={User}
                    type="text"
                    placeholder={placeholderText}
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="!p-2 pr-8"
                />
                {isLoading && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        <Loader size={14} className="animate-spin text-gray-400"/>
                    </div>
                )}
            </div>
            
            {showDropdown && results && results.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map((e: any) => (
                        <div key={e.id} onMouseDown={() => handleSelect(e)} className="p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0">
                            <p className="font-semibold text-sm text-white">{e.name}</p>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{e.phone}</span>
                                {e.company && <span>{e.company}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {showDropdown && debouncedSearch && !isLoading && results?.length === 0 && (
                 <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 text-center text-xs text-gray-400">
                    لا توجد نتائج.
                 </div>
            )}
        </div>
    );
};
