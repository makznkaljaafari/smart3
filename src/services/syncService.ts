
import { noteService } from './noteService';
import { customerService } from './customerService';
import { expenseService } from './expenseService';
import { useZustandStore } from '../store/useStore';
import { Note } from '../features/notes/types';
import { Customer } from '../features/customers/types';
import { Expense } from '../features/expenses/types';
import { queryClient } from '../lib/reactQuery';

type OfflineAction =
  | { type: 'CREATE_NOTE'; payload: Partial<Note>; tempId: string }
  | { type: 'UPDATE_NOTE'; payload: Partial<Note> }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'CREATE_CUSTOMER'; payload: Partial<Customer>; tempId: string }
  | { type: 'UPDATE_CUSTOMER'; payload: Partial<Customer> }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'CREATE_EXPENSE'; payload: Partial<Expense>; tempId: string }
  | { type: 'UPDATE_EXPENSE'; payload: Partial<Expense> }
  | { type: 'DELETE_EXPENSE'; payload: string };

const STORAGE_KEY = 'offline_action_queue';

export const syncService = {
  getQueue: (): OfflineAction[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  enqueue: (action: OfflineAction) => {
    const queue = syncService.getQueue();
    queue.push(action);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  clearQueue: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  processQueue: async () => {
    const queue = syncService.getQueue();
    if (queue.length === 0) return;

    const { addToast, lang } = useZustandStore.getState();
    let processedCount = 0;
    const failedActions: OfflineAction[] = [];
    
    const t = {
        syncing: lang === 'ar' ? 'جاري مزامنة البيانات المسجلة دون اتصال...' : 'Syncing offline data...',
        complete: lang === 'ar' ? 'تمت المزامنة بنجاح.' : 'Offline sync complete.',
        partial: (s: number, f: number) => lang === 'ar' ? `تمت مزامنة ${s} عملية. فشل ${f}.` : `Synced ${s} items. ${f} failed.`,
    };

    addToast({ message: t.syncing, type: 'info' });

    for (const action of queue) {
      try {
        switch (action.type) {
          // --- NOTES ---
          case 'CREATE_NOTE':
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: noteId, ...noteData } = action.payload as any;
            await noteService.saveNote(noteData, true);
            break;
          case 'UPDATE_NOTE':
            await noteService.saveNote(action.payload, false);
            break;
          case 'DELETE_NOTE':
            await noteService.deleteNote(action.payload);
            break;

          // --- CUSTOMERS ---
          case 'CREATE_CUSTOMER':
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: custId, ...custData } = action.payload as any;
            await customerService.saveCustomer(custData, true);
            break;
          case 'UPDATE_CUSTOMER':
            await customerService.saveCustomer(action.payload, false);
            break;
          case 'DELETE_CUSTOMER':
            await customerService.deleteCustomer(action.payload);
            break;

          // --- EXPENSES ---
          case 'CREATE_EXPENSE':
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: expId, ...expData } = action.payload as any;
            await expenseService.saveExpense(expData, true);
            break;
          case 'UPDATE_EXPENSE':
            await expenseService.saveExpense(action.payload, false);
            break;
          case 'DELETE_EXPENSE':
            await expenseService.deleteExpense(action.payload);
            break;
        }
        processedCount++;
      } catch (error) {
        console.error('Sync failed for action:', action, error);
        failedActions.push(action);
      }
    }

    if (failedActions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failedActions));
      addToast({ message: t.partial(processedCount, failedActions.length), type: 'warning' });
    } else {
      syncService.clearQueue();
      addToast({ message: t.complete, type: 'success' });
    }
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customerStats'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenseStats'] });
    queryClient.invalidateQueries({ queryKey: ['inventoryStats'] });
    queryClient.invalidateQueries({ queryKey: ['salesStats'] });
  }
};
