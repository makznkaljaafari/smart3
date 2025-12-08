
import { useState, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { eventBus } from '../../../lib/events';
import { Expense, ExpenseCategory, ExpenseStatus, ExpensePriority } from '../types';
import { AppEvent, LangCode, Toast } from '../../../types';
import { CATEGORY_CONFIG } from '../lib/utils';
import { expenseService } from '../api/expenseService';
import { syncService } from '../../../services/syncService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface ExpenseFilters {
  category: ExpenseCategory | 'all';
  status: ExpenseStatus | 'all';
  priority: ExpensePriority | 'all';
  searchQuery: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useExpenseData = () => {
  const { lang, settings, authUser, currentCompany, isOffline } = useZustandStore(state => ({
    lang: state.lang,
    settings: state.settings,
    authUser: state.authUser,
    currentCompany: state.currentCompany,
    isOffline: state.isOffline,
  }));
  const t = translations[lang];
  const location = useLocation();
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState<ExpenseFilters>(
    location.state?.initialFilters || { category: 'all', status: 'all', priority: 'all', searchQuery: '' }
  );
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.searchQuery), 500);
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = settings.page.expenses.pageSize || 10;
  
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
  }, []);

  // --- React Query: List ---
  const { data: expensesData, isLoading: expensesLoading, isError: isExpenseError, error: expenseErrorObj } = useQuery({
      queryKey: ['expenses', currentCompany?.id, currentPage, pageSize, filters, debouncedSearch],
      queryFn: () => expenseService.getExpensesPaginated({
          page: currentPage,
          pageSize,
          category: filters.category,
          status: filters.status,
          priority: filters.priority,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          search: debouncedSearch
      }),
      placeholderData: keepPreviousData,
      enabled: !!currentCompany?.id,
  });

  // --- React Query: Stats ---
  const { data: statsData } = useQuery({
      queryKey: ['expenseStats', currentCompany?.id],
      queryFn: () => expenseService.getExpenseStats(),
      enabled: !!currentCompany?.id,
  });

  const expenses = expensesData?.data || [];
  const totalCount = expensesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const stats = useMemo(() => {
    const rawExpenses = statsData?.data || [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const totalThisMonth = rawExpenses
      .filter((e: any) => {
        const expDate = new Date(e.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      
    const categoryTotals = rawExpenses.reduce((acc: Record<string, number>, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    const mostSpent = Object.entries(categoryTotals).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    
    return {
      totalThisMonth,
      mostSpentCategory: mostSpent ? CATEGORY_CONFIG[mostSpent[0] as ExpenseCategory]?.label : '-',
      totalEntries: totalCount, // Use totalCount from paginated response for accuracy
    };
  }, [statsData, totalCount]);

  // --- Handlers ---

  const handleOpenForm = useCallback(() => {
    setEditingExpense(null);
    setShowFormModal(true);
  }, []);
  
  const handleCloseForm = useCallback(() => {
    setShowFormModal(false);
    setEditingExpense(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedExpense(null);
  }, []);

  // Save Mutation
  const saveMutation = useMutation({
      mutationFn: async (data: { expense: Partial<Expense>, isNew: boolean }) => {
          const expenseData = {
            ...data.expense,
            updatedDate: new Date().toISOString(),
            isRecurringTemplate: data.expense.recurrence && data.expense.recurrence !== 'none',
          };

          // Offline Handling
          if (isOffline) {
            const tempId = data.isNew ? `temp-${Date.now()}` : data.expense.id!;
            const offlineExpense = { ...expenseData, id: tempId, company_id: currentCompany?.id } as Expense;
            
            if (data.isNew) {
                syncService.enqueue({ type: 'CREATE_EXPENSE', payload: offlineExpense, tempId });
            } else {
                syncService.enqueue({ type: 'UPDATE_EXPENSE', payload: offlineExpense });
            }
            return { offline: true, data: offlineExpense, isNew: data.isNew };
          }

          const { error } = await expenseService.saveExpense(expenseData, data.isNew);
          if (error) throw error;
          return { offline: false, data: expenseData, isNew: data.isNew };
      },
      onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expenseStats'] });
          
          if (result.offline) {
              addToast(lang === 'ar' ? 'تم الحفظ دون اتصال.' : 'Saved offline.', 'warning');
          } else {
              addToast(result.isNew ? t.expenseAddedSuccess : t.expenseUpdatedSuccess, 'success');
              if (result.isNew) {
                const event: AppEvent = {
                    id: crypto.randomUUID(), type: 'EXPENSE_CREATED',
                    payload: { category: result.data.category, amount: result.data.amount, currency: result.data.currency },
                    at: new Date().toISOString(), lang: lang as LangCode,
                };
                eventBus.publish(event);
              }
          }
          handleCloseForm();
      },
      onError: (err: any) => addToast(err.message, 'error')
  });

  const handleSave = async (data: Partial<Expense>) => {
    if (!authUser) { addToast('User not authenticated.', 'error'); return; }
    await saveMutation.mutateAsync({ expense: data, isNew: !editingExpense });
  };

  // Delete Mutation
  const deleteMutation = useMutation({
      mutationFn: async (id: string) => {
          if (isOffline) {
              syncService.enqueue({ type: 'DELETE_EXPENSE', payload: id });
              return { offline: true };
          }
          const { error } = await expenseService.deleteExpense(id);
          if (error) throw error;
          return { offline: false };
      },
      onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expenseStats'] });
          if (result.offline) {
              addToast(lang === 'ar' ? 'تم الحذف محلياً.' : 'Deleted locally.', 'warning');
          } else {
              addToast(t.expenseDeletedSuccess, 'info');
          }
      },
      onError: (err: any) => addToast(err.message, 'error')
  });

  const handleDelete = useCallback(async (id: string) => {
    if (confirm(t.areYouSureDelete)) {
      await deleteMutation.mutateAsync(id);
    }
  }, [t, deleteMutation]);
  
  const handleViewDetails = useCallback((expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowFormModal(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ category: 'all', status: 'all', priority: 'all', searchQuery: '', dateFrom: '', dateTo: '' });
  }, []);
  
  const handleExport = useCallback(() => {
      // Implement export logic
  }, []);

  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
     // Implement import logic
  }, []);

  return {
    stats,
    filters,
    setFilters,
    showAdvancedFilters,
    setShowAdvancedFilters,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    paginatedExpenses: expenses,
    filteredExpenses: expenses, // Pagination handled by query
    totalPages,
    selectedExpense,
    showDetailsModal,
    showFormModal,
    editingExpense,
    expensesLoading,
    expensesError: isExpenseError ? (expenseErrorObj as Error).message : null,
    handleViewDetails,
    handleEdit,
    handleDelete,
    handleSave,
    handleExport,
    handleImport,
    clearFilters,
    handleOpenForm,
    handleCloseForm,
    handleCloseDetails,
  };
};
