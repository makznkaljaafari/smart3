
import React from 'react';
import { useZustandStore } from '../../../../store/useStore';
import { translations } from '../../../../lib/i18n';
import { HoloButton } from '../../../../components/ui/HoloButton';
import { Building2, Phone, MapPin, Edit, Calendar, Banknote, Clock } from 'lucide-react';

interface InvoiceHeaderProps {
    date: string;
    setDate: (date: string) => void;
    invoiceType: 'cash' | 'credit';
    setInvoiceType: (type: 'cash' | 'credit') => void;
    onEditProfile: () => void;
    invoiceNumber?: string;
    setInvoiceNumber?: (val: string) => void;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
    date,
    setDate,
    invoiceType,
    setInvoiceType,
    onEditProfile,
    invoiceNumber,
    setInvoiceNumber
}) => {
    const { theme, lang, settings } = useZustandStore();
    const t = translations[lang];

    // Merge profile and company profile for display
    const displayProfile = {
        name: settings.companyProfile.name || settings.profile.name,
        phone: settings.companyProfile.phone1 || settings.profile.phone,
        address: settings.companyProfile.address,
        logo: settings.companyProfile.logoUrl || settings.profile.avatar
    };

    return (
        <div className={`relative p-6 rounded-2xl mb-6 border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700' : 'bg-slate-50 border-slate-200'}`}>
            <HoloButton onClick={onEditProfile} className="!absolute !top-4 !right-4 !py-1.5 !px-3 !text-xs opacity-70 hover:opacity-100">
                <Edit size={14} /> {t.edit}
            </HoloButton>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                {/* Company Info */}
                <div className="flex items-start gap-5">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        {displayProfile.logo ? (
                            <img src={displayProfile.logo} alt="Company Logo" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Building2 size={32} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div className="pt-1">
                        <h2 className={`font-bold text-xl mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{displayProfile.name}</h2>
                        <div className="space-y-1 text-sm opacity-70">
                            {displayProfile.phone && (
                                <p className="flex items-center gap-2"><Phone size={14}/> {displayProfile.phone}</p>
                            )}
                            {displayProfile.address && (
                                <p className="flex items-center gap-2"><MapPin size={14}/> {displayProfile.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Meta */}
                <div className="text-left min-w-[150px]">
                    <h1 className={`text-2xl font-black uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>فاتورة مبيعات</h1>
                    <div className="space-y-2">
                        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white border border-slate-200'}`}>
                            <span className="text-xs text-gray-500 font-bold">#</span>
                            {setInvoiceNumber ? (
                                <input 
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={e => setInvoiceNumber(e.target.value)}
                                    className="bg-transparent p-0 focus:ring-0 border-0 text-right w-24 text-sm font-bold font-mono"
                                />
                            ) : (
                                <span className="font-mono font-bold">INV-NEW</span>
                            )}
                        </div>
                        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white border border-slate-200'}`}>
                            <Calendar size={14} className="text-gray-500" />
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                className="bg-transparent p-0 focus:ring-0 border-0 text-right w-24 text-sm font-medium" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider with Toggle */}
            <div className="relative mt-8 border-t border-dashed border-gray-600/30">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className={`flex items-center p-1 rounded-full border shadow-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
                        <button
                            onClick={() => setInvoiceType('cash')}
                            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                                invoiceType === 'cash'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            <Banknote size={14} />
                            <span>نقداً</span>
                        </button>
                        <button
                            onClick={() => setInvoiceType('credit')}
                            className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                                invoiceType === 'credit'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            <Clock size={14} />
                            <span>آجل</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
