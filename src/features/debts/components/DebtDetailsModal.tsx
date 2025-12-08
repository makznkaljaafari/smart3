
import React from 'react';
import { Debt } from '../../../types';
import {
  X, DollarSign, User, Phone, Mail, Building,
  FileText, Receipt, Info, Hash, Calendar, CalendarDays, Wallet, Edit2, AlertTriangle,
} from 'lucide-react';
import { 
  getStatusIcon, getStatusLabel, formatCurrency, formatDate,
  isOverdue, getPaymentMethodIcon, getPaymentMethodLabel, formatShortDate
} from '../lib/utils';
import { HoloButton } from '../../../components/ui/HoloButton';
import { useDraggableAndResizable } from '../../../hooks/useDraggableAndResizable';


interface DebtDetailsModalProps {
  debt: Debt;
  onClose: () => void;
  onEdit: (debt: Debt) => void;
  onAddPayment: (debt: Debt) => void;
}

const DetailItem: React.FC<{icon: React.ElementType, label: string, value?: string | React.ReactNode, fullWidth?: boolean}> = ({icon: Icon, label, value, fullWidth}) => {
  if (!value && typeof value !== 'number') return null;
  return (
    <div className={`${fullWidth ? 'md:col-span-2' : ''} flex items-start gap-3`}>
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <div className="text-base font-semibold text-gray-200">{value}</div>
      </div>
    </div>
  );
};

export const DebtDetailsModal: React.FC<DebtDetailsModalProps> = ({ debt, onClose, onEdit, onAddPayment }) => {
  const { modalRef, headerRef, position, size, handleDragStart, handleResizeStart } = useDraggableAndResizable({
    initialSize: { width: 800, height: 750 },
    minSize: { width: 600, height: 500 }
  });

  const StatusIcon = getStatusIcon(debt.status);
  const paymentPercentage = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0;
  const overdue = isOverdue(debt.dueDate, debt.status);

  return (
    <div className="fixed inset-0 bg-black/75 z-50" onMouseDown={onClose}>
      <div 
        ref={modalRef}
        style={{
            '--modal-x': `${position.x}px`,
            '--modal-y': `${position.y}px`,
            '--modal-width': `${size.width}px`,
            '--modal-height': `${size.height}px`,
        } as React.CSSProperties}
        className="fixed inset-0 lg:inset-auto lg:left-[var(--modal-x)] lg:top-[var(--modal-y)] lg:w-[var(--modal-width)] lg:h-auto lg:max-h-[90vh] bg-gray-900 rounded-none lg:rounded-2xl w-full flex flex-col overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header 
          ref={headerRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="bg-transparent text-white p-6 border-b border-cyan-500/30 cursor-move"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{debt.customerName}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-black/30 border border-white/20"><StatusIcon className="w-4 h-4" />{getStatusLabel(debt.status)}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
          </div>
          {overdue && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg border border-red-400/50"><AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">هذا الدين متأخر عن موعد الاستحقاق!</span>
            </div>
          )}
        </header>

        <main className="overflow-y-auto flex-1 p-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-gray-700"><p className="text-sm text-blue-400">المبلغ الكلي</p><p className="text-xl font-bold text-white">{formatCurrency(debt.amount, debt.currency)}</p></div>
            <div className="bg-slate-800 p-4 rounded-xl border border-gray-700"><p className="text-sm text-green-400">المدفوع</p><p className="text-xl font-bold text-green-400">{formatCurrency(debt.paidAmount, debt.currency)}</p></div>
            <div className="bg-slate-800 p-4 rounded-xl border border-gray-700"><p className="text-sm text-red-400">المتبقي</p><p className="text-xl font-bold text-red-400">{formatCurrency(debt.remainingAmount, debt.currency)}</p></div>
          </section>

          <section className="p-4 bg-slate-800 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-gray-300">نسبة السداد</span><span className="text-lg font-bold text-white">{paymentPercentage.toFixed(1)}%</span></div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${paymentPercentage}%` }} /></div>
          </section>
          
          <section>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="w-5 h-5 text-cyan-400" /> معلومات العميل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800 p-4 rounded-xl border border-gray-700">
                <DetailItem icon={Phone} label="رقم الجوال" value={debt.customerPhone} />
                <DetailItem icon={Mail} label="البريد الإلكتروني" value={debt.customerEmail} />
                <DetailItem icon={Building} label="الشركة" value={debt.customerCompany} fullWidth={true} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> معلومات الدين</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 bg-slate-800 p-4 rounded-xl border border-gray-700">
                <DetailItem icon={Receipt} label="رقم الفاتورة" value={debt.invoiceNumber} />
                <DetailItem icon={Calendar} label="تاريخ الإنشاء" value={formatDate(debt.createdDate)} />
                <DetailItem icon={CalendarDays} label="تاريخ الاستحقاق" value={formatDate(debt.dueDate)} />
                <DetailItem icon={Info} label="الوصف" value={debt.description} fullWidth />
                <DetailItem icon={FileText} label="ملاحظات" value={debt.notes} fullWidth />
                {debt.tags && debt.tags.length > 0 && 
                    <DetailItem 
                        icon={Hash} 
                        label="الوسوم" 
                        value={
                            <div className="flex flex-wrap gap-2">
                                {debt.tags.map(t => <span key={t} className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full text-sm border border-cyan-500/30">#{t}</span>)}
                            </div>
                        } 
                        fullWidth
                    />
                }
            </div>
          </section>

          {debt.payments.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-cyan-400" /> سجل الدفعات ({debt.payments.length})</h3>
              <div className="space-y-3">
                {debt.payments.map(p => {
                  const Icon = getPaymentMethodIcon(p.method);
                  return (
                    <div key={p.id} className="bg-slate-800 border border-gray-700 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500/20 text-green-300 p-2 rounded-lg border border-green-500/40"><Icon className="w-5 h-5" /></div>
                            <div>
                                <p className="font-bold text-white text-lg">{formatCurrency(p.amount, p.currency)}</p>
                                {p.exchangeRateUsed && <p className="text-sm text-gray-400">≈ {formatCurrency(p.amountInDebtCurrency, debt.currency)}</p>}
                                <p className="text-sm text-gray-400">{getPaymentMethodLabel(p.method)}</p>
                            </div>
                        </div>
                        <div className="text-left"><p className="text-sm font-semibold text-gray-200">{formatShortDate(p.date)}</p>{p.receiptNumber && <p className="text-xs text-gray-500">إيصال: {p.receiptNumber}</p>}</div>
                      </div>
                      {p.notes && <p className="text-sm text-gray-300 mt-2 pt-2 border-t border-gray-700">{p.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-cyan-500/30 p-4 bg-gray-900 mt-auto">
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-700 font-semibold transition-colors">إغلاق</button>
            <HoloButton variant="secondary" icon={Edit2} onClick={() => { onEdit(debt); onClose(); }}>تعديل</HoloButton>
            {debt.status !== 'paid' && debt.status !== 'cancelled' && <HoloButton variant="success" icon={DollarSign} onClick={() => { onAddPayment(debt); onClose(); }}>تسجيل دفعة</HoloButton>}
          </div>
        </footer>
        <div 
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-20 text-gray-500 hover:text-cyan-400 transition-colors hidden lg:block"
          title="Resize"
        >
          <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};