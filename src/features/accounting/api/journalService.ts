
import { supabase } from '../../../lib/supabaseClient';
import { JournalEntry } from '../types';
import { getStore } from '../../../lib/storeAccess';

// Correct schema columns
const JOURNAL_ENTRY_SELECT = `
  id,
  company_id,
  entry_date,
  description,
  total_debit,
  total_credit,
  reference_type,
  reference_id,
  created_by,
  created_at,
  lines:journal_lines (
    id,
    account_id,
    debit,
    credit,
    note
  )
`;

export interface GetJournalEntriesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    referenceType?: string | 'all';
}

export const journalService = {
  /**
   * Fetches all journal entries for the current company (Legacy/Export).
   */
  async getJournalEntries() {
    const companyId = getStore().getState().currentCompany?.id;
    if (!companyId) return { data: [], error: new Error("No active company") };

    const { data, error } = await supabase
      .from('journal_entries')
      .select(JOURNAL_ENTRY_SELECT)
      .eq('company_id', companyId)
      .order('entry_date', { ascending: false });

    if (error) return { data: [], error };

    const mappedData = (data || []).map((entry: any) => ({
      id: entry.id,
      company_id: entry.company_id,
      date: entry.entry_date,
      description: entry.description,
      createdBy: entry.created_by || '', // Added default empty string
      referenceType: entry.reference_type,
      referenceId: entry.reference_id,
      lines: (entry.lines || []).map((line: any) => ({
        id: line.id,
        accountId: line.account_id,
        debit: line.debit,
        credit: line.credit,
        note: line.note
      }))
    }));

    return { data: mappedData as JournalEntry[], error: null };
  },

  /**
   * Fetches paginated journal entries.
   */
  async getJournalEntriesPaginated({ 
      page = 1, 
      pageSize = 10, 
      search = '', 
      dateFrom, 
      dateTo, 
      referenceType = 'all' 
  }: GetJournalEntriesParams) {
      const companyId = getStore().getState().currentCompany?.id;
      if (!companyId) return { data: [], count: 0, error: new Error("No active company") };

      let query = supabase
        .from('journal_entries')
        .select(JOURNAL_ENTRY_SELECT, { count: 'exact' })
        .eq('company_id', companyId);

      if (search) {
          query = query.ilike('description', `%${search}%`);
      }
      
      if (dateFrom) query = query.gte('entry_date', dateFrom);
      if (dateTo) query = query.lte('entry_date', dateTo);
      
      if (referenceType && referenceType !== 'all') {
          query = query.eq('reference_type', referenceType);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('entry_date', { ascending: false })
        .range(from, to);
      
      if (error) return { data: [], count: 0, error };

      const mappedData = (data || []).map((entry: any) => ({
        id: entry.id,
        company_id: entry.company_id,
        date: entry.entry_date,
        description: entry.description,
        createdBy: entry.created_by || '',
        referenceType: entry.reference_type,
        referenceId: entry.reference_id,
        lines: (entry.lines || []).map((line: any) => ({
          id: line.id,
          accountId: line.account_id,
          debit: line.debit,
          credit: line.credit,
          note: line.note
        }))
      }));

      return { data: mappedData as JournalEntry[], count: count || 0, error: null };
  },

  /**
   * Saves a manual journal entry directly to the database.
   */
  async saveJournalEntry(entryData: Omit<JournalEntry, 'id' | 'company_id'>) {
    const companyId = getStore().getState().currentCompany?.id;
    const userId = getStore().getState().authUser?.id;

    if (!companyId) return { data: null, error: new Error("No active company selected.") };
    
    const totalDebit = entryData.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entryData.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { data: null, error: new Error(`Journal Entry is not balanced.`) };
    }

    const headerToSave = {
        company_id: companyId,
        entry_date: entryData.date,
        description: entryData.description,
        reference_type: entryData.referenceType || 'manual_journal',
        reference_id: entryData.referenceId || null,
        created_by: userId,
        total_debit: totalDebit,
        total_credit: totalCredit
    };

    const { data: newEntry, error: headerError } = await supabase
      .from('journal_entries')
      .insert(headerToSave)
      .select('id')
      .single();

    if (headerError) return { error: headerError };

    const linesToSave = entryData.lines.map(line => ({
      journal_entry_id: newEntry.id,
      company_id: companyId,
      account_id: line.accountId,
      debit: line.debit,
      credit: line.credit,
      note: line.note || entryData.description 
    }));

    const { error: linesError } = await supabase.from('journal_lines').insert(linesToSave);
    
    if (linesError) {
        await supabase.from('journal_entries').delete().eq('id', newEntry.id);
        return { error: linesError };
    }

    return { data: newEntry, error: null };
  },
  
    async createCashExpense(params: { companyId: string, amount: number, date: string, notes?: string, createdBy?: string }) {
        const { error } = await supabase.rpc('post_cash_expense', {
            p_company_id: params.companyId,
            p_amount: params.amount,
            p_date: params.date,
            p_notes: params.notes || null,
            p_created_by: params.createdBy || null
        });
        if (error) throw error;
    },

    async createCashIncome(params: { companyId: string, amount: number, date: string, notes?: string, createdBy?: string }) {
        const { error } = await supabase.rpc('post_cash_income', {
            p_company_id: params.companyId,
            p_amount: params.amount,
            p_date: params.date,
            p_notes: params.notes || null,
            p_created_by: params.createdBy || null
        });
        if (error) throw error;
    },
    
    async createTaxReturnEntry(params: { 
        taxPayableAccountId: string;
        bankAccountId: string;
        outputTax: number; 
        inputTax: number; 
        netPayable: number; 
        period: string;
    }) {
        const companyId = getStore().getState().currentCompany?.id;
        const user = getStore().getState().authUser;
        if(!companyId) throw new Error("No Company");

        const lines = [];
        if (params.outputTax > 0) {
            lines.push({ accountId: params.taxPayableAccountId, debit: params.outputTax, credit: 0, note: `Clear Output Tax` });
        }
        if (params.inputTax > 0) {
             lines.push({ accountId: params.taxPayableAccountId, debit: 0, credit: params.inputTax, note: `Clear Input Tax` });
        }
        if (params.netPayable > 0) {
             lines.push({ accountId: params.bankAccountId, debit: 0, credit: params.netPayable, note: `VAT Payment` });
        } else if (params.netPayable < 0) {
             lines.push({ accountId: params.bankAccountId, debit: Math.abs(params.netPayable), credit: 0, note: `VAT Refund` });
        }
        
        await this.saveJournalEntry({
            date: new Date().toISOString().split('T')[0],
            description: `VAT Settlement - ${params.period}`,
            createdBy: user?.name || '',
            referenceType: 'tax_return',
            lines: lines as any[]
        });
    }
};
