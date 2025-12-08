
import React from 'react';
import { Customer } from '../../../types';
import { Phone, Mail, MapPin, Users, User } from 'lucide-react';
import { useZustandStore } from '../../../../store/useStore';

interface CustomerContactInfoProps {
  customer: Customer;
}

export const CustomerContactInfo: React.FC<CustomerContactInfoProps> = ({ customer }) => {
  const { theme } = useZustandStore(state => ({ theme: state.theme }));
  const isDark = theme === 'dark';
  
  const cardBg = isDark ? 'bg-gray-800/40 border-white/5' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`p-5 rounded-xl border ${cardBg}`}>
      <h4 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <User className="text-purple-400" size={18}/> المعلومات الشخصية
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
        <div className="flex items-center gap-3">
          <Phone size={16} className="text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">الهاتف</p>
            <p className={isDark ? 'text-gray-200' : 'text-slate-700'}>{customer.phone}</p>
          </div>
        </div>
        {customer.email && (
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">البريد الإلكتروني</p>
              <p className={isDark ? 'text-gray-200' : 'text-slate-700'}>{customer.email}</p>
            </div>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">العنوان</p>
              <p className={isDark ? 'text-gray-200' : 'text-slate-700'}>{customer.address}</p>
            </div>
          </div>
        )}
        {customer.company && (
          <div className="flex items-center gap-3">
            <Users size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">الشركة</p>
              <p className={isDark ? 'text-gray-200' : 'text-slate-700'}>{customer.company}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
