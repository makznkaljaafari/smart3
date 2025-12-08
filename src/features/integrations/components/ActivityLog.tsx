import React from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { CheckCircle, XCircle } from 'lucide-react';
import { AppEventType } from '../../../types';

const EVENT_TYPE_LABELS: Record<AppEventType, string> = {
    DEBT_CREATED: 'Debt Created',
    DEBT_SETTLED: 'Debt Settled',
    EXPENSE_CREATED: 'Expense Created',
    INCOME_CREATED: 'Income Created',
    NOTE_CREATED: 'Note Created',
    CUSTOMER_CREATED: 'Customer Created',
    BACKUP_CREATED: 'Backup Created',
    BACKUP_RESTORED: 'Backup Restored',
    SMART_ALERT: 'Smart Alert',
    SCHEDULED_REPORT_READY: 'Scheduled Report',
    LOW_STOCK_ALERT: 'Low Stock Alert',
    SALES_INVOICE_SEND: 'Sales Invoice Sent',
    PURCHASE_INVOICE_SEND: 'Purchase Invoice Sent',
    PAYMENT_RECEIPT_SEND: 'Payment Receipt Sent',
    ACCOUNT_STATEMENT_SEND: 'Account Statement Sent',
    DEBT_REMINDER_SEND: 'Debt Reminder Sent',
    SHOW_ADD_EXPENSE_MODAL: 'UI: Show Add Expense',
    SHOW_ADD_DEBT_MODAL: 'UI: Show Add Debt',
    SHOW_ADD_CUSTOMER_MODAL: 'UI: Show Add Customer',
};

export const ActivityLog: React.FC = () => {
    const { automationLogs, theme, lang } = useZustandStore(state => ({
        automationLogs: state.automationLogs,
        theme: state.theme,
        lang: state.lang,
    }));
    const t = translations[lang];

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' سنوات' : ' years ago');
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' أشهر' : ' months ago');
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' أيام' : ' days ago');
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' ساعات' : ' hours ago');
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + (lang === 'ar' ? ' دقائق' : ' minutes ago');
        return lang === 'ar' ? 'الآن' : 'just now';
    };

    if (automationLogs.length === 0) {
        return (
            <div className={`p-8 text-center rounded-2xl border ${theme === 'dark' ? 'border-gray-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <p>{t.noAutomationActivity}</p>
            </div>
        );
    }
    
    return (
        <div className={`rounded-lg overflow-x-auto border ${theme === 'dark' ? 'border-gray-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <table className="w-full text-sm responsive-table">
            <thead className={theme === 'dark' ? 'bg-gray-800/50' : 'bg-slate-50'}>
              <tr className="text-left">
                <th className="p-3 font-semibold">Event</th>
                <th className="p-3 font-semibold">Details</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {automationLogs.map(log => (
                <tr key={log.id} className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-200'}`}>
                  <td className="p-3 font-medium" data-label="Event">{EVENT_TYPE_LABELS[log.event] || log.event}</td>
                  <td className={`p-3 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`} data-label="Details">{log.details}</td>
                  <td className="p-3" data-label="Status">
                    {log.status === 'success' ? (
                        <span className="flex items-center gap-1 text-green-400"><CheckCircle size={16} /> Success</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400"><XCircle size={16} /> Failed</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-gray-500" data-label="Time">{timeAgo(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    );
};