
import { supabase } from '../../../lib/supabaseClient';
import { getStore } from '../../../lib/storeAccess';
import { ReconciliationTransaction } from '../../accounting/types';
import { journalService } from './journalService';

export const reconciliationService = {
    /**
     * Get unreconciled transactions for a specific account up to a date.
     */
    async getUnreconciledTransactions(accountId: string, dateTo: string): Promise<{ data: ReconciliationTransaction[], error: any }> {
        const companyId = getStore().getState().currentCompany?.id;
        
        // Filter by is_reconciled = false (or null)
        const { data, error } = await supabase
            .from('journal_lines')
            .select(`
                id, debit, credit, note, is_reconciled,
                journal_entries (entry_date, description)
            `)
            .eq('account_id', accountId)
            .eq('company_id', companyId)
            .is('is_reconciled', false) // Only fetch unreconciled
            .lte('journal_entries.entry_date', dateTo); 
            
        if (error) return { data: [], error };

        const transactions: ReconciliationTransaction[] = (data || []).map((line: any) => ({
            id: line.id,
            date: line.journal_entries?.entry_date || '', // Default empty string
            description: line.journal_entries?.description || line.note || 'Transaction',
            amount: line.debit - line.credit, 
            isCleared: false // Initially unchecked in UI
        }));

        return { data: transactions, error: null };
    },

    /**
     * Perform FX Revaluation.
     * Calculates the difference between the GL balance (in Base Currency) and the 
     * Actual Foreign Balance converted at the NEW Rate.
     */
    async calculateFXRevaluation(accountId: string, newRate: number) {
        const accounts = getStore().getState().accounts;
        const account = accounts.find(a => a.id === accountId);
        if (!account) throw new Error("Account not found");

        // 1. Get Current Balance in Base Currency (from Ledger)
        // We fetch sum of debits/credits (base currency value) from journal lines
        // Assuming debit/credit in journal_lines are stored in base currency amounts
        const { data } = await supabase.rpc('get_account_balance_base', { p_account_id: accountId });
        const bookBalanceBase = data || 0;
        
        // Current Foreign Balance (from account view, assumed to track foreign units if multi-currency supported natively)
        // Note: In simple systems, 'balance' is often base currency. 
        // If we track foreign currency amount, we might need a separate ledger or verify `vw_account_balances` logic.
        // For this implementation, let's assume `account.balance` is the FOREIGN currency balance (e.g. 100 USD).
        const foreignBalance = account.balance; 
        
        // 2. Calculate what the Base Balance SHOULD be at new rate
        const targetBaseBalance = foreignBalance * newRate;
        
        // 3. Difference
        const diff = targetBaseBalance - bookBalanceBase;
        
        return {
            foreignBalance,
            bookBalanceBase,
            targetBaseBalance,
            diff, // Positive = Gain (for Asset), Negative = Loss (for Asset)
            account
        };
    },

    /**
     * Post Revaluation Journal Entry
     */
    async postRevaluation(accountId: string, diff: number, gainLossAccountId: string) {
        const user = getStore().getState().authUser;
        
        if (Math.abs(diff) < 0.01) return;

        const isGain = diff > 0;
        
        const lines = [];
        if (isGain) {
            lines.push({ accountId: accountId, debit: diff, credit: 0, note: 'FX Revaluation Gain' });
            lines.push({ accountId: gainLossAccountId, debit: 0, credit: diff, note: 'FX Revaluation Gain' });
        } else {
            const absDiff = Math.abs(diff);
            lines.push({ accountId: gainLossAccountId, debit: absDiff, credit: 0, note: 'FX Revaluation Loss' });
            lines.push({ accountId: accountId, debit: 0, credit: absDiff, note: 'FX Revaluation Loss' });
        }

        await journalService.saveJournalEntry({
            date: new Date().toISOString().split('T')[0],
            description: 'Foreign Currency Revaluation',
            createdBy: user?.name,
            referenceType: 'revaluation',
            lines: lines.map(l => ({...l, id: crypto.randomUUID()}))
        });
    }
};
