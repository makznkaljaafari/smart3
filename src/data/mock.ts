import { ExchangeRate } from '../types';
import { Customer } from '../features/customers/types';
import { Debt } from '../features/debts/types';
import { Expense } from '../features/expenses/types';
import { Income } from '../features/income/types';
import { Note } from '../features/notes/types';
import { Account, JournalEntry } from '../features/accounting/types';

// All data is now fetched from Supabase, so mock data is no longer needed.
export const sampleCustomers: Customer[] = [];
export const sampleDebts: Debt[] = [];
export const sampleExpenses: Expense[] = [];
export const sampleIncome: Income[] = [];
export const sampleNotes: Note[] = [];
export const sampleRates: ExchangeRate[] = [];
export const sampleAccounts: Account[] = [];
export const sampleJournalEntries: JournalEntry[] = [];
