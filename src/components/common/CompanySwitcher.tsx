import React from 'react';
import { useZustandStore } from '../../store/useStore';
import { ChevronsUpDown } from 'lucide-react';

export const CompanySwitcher: React.FC = () => {
    const { currentCompany, userCompanies, switchCompany, theme } = useZustandStore(s => ({
        currentCompany: s.currentCompany,
        userCompanies: s.userCompanies,
        switchCompany: s.switchCompany,
        theme: s.theme,
    }));

    if (userCompanies.length <= 1) {
        return null;
    }

    const selectClasses = `w-full appearance-none rounded-lg p-2 border focus:ring-cyan-500 focus:border-cyan-500 text-sm font-semibold
        ${theme === 'dark' 
            ? 'bg-gray-800 text-white border-gray-700' 
            : 'bg-slate-100 text-slate-900 border-slate-300'}`;

    return (
        <div className="relative">
            <select
                value={currentCompany?.id || ''}
                onChange={(e) => switchCompany(e.target.value)}
                className={selectClasses}
                aria-label="Switch Company"
            >
                {userCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                        {company.name}
                    </option>
                ))}
            </select>
            <ChevronsUpDown size={16} className={`absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}/>
        </div>
    );
};
