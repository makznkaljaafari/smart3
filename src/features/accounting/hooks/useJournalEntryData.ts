
import { useState, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { JournalEntry, Toast } from '../../../types';
import { journalService } from '../../../services/accounting/journalService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

interface UseJournalEntryDataProps {
    mode?: 'paginated' | 'all';
}

/**
 * Custom hook to manage state and business logic for Journal Entries using React Query.
 */
export const useJournalEntryData = ({ mode = 'paginated' }: UseJournalEntryDataProps = {}) => {
    const { authUser, currentCompany } = useZustandStore(state => ({
        authUser: state.authUser,
        currentCompany: state.currentCompany
    }));
    const queryClient = useQueryClient();
    
    // Pagination & Filtering State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState({
        search: '',
        dateFrom: '',
        dateTo: '',
        referenceType: 'all'
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
            setCurrentPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);
    
    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query ---
    // Conditional fetching based on mode
    const queryKey = mode === 'paginated' 
        ? ['journalEntries', currentCompany?.id, currentPage, pageSize, debouncedSearch, filters.dateFrom, filters.dateTo, filters.referenceType]
        : ['journalEntries', 'all', currentCompany?.id];

    const queryFn = mode === 'paginated'
        ? () => journalService.getJournalEntriesPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            referenceType: filters.referenceType
        })
        : () => journalService.getJournalEntries(); // Keep bulk fetch for Ledger

    const { data, isLoading, isError, error: queryError } = useQuery({
        queryKey,
        queryFn,
        enabled: !!currentCompany?.id,
        placeholderData: mode === 'paginated' ? keepPreviousData : undefined,
    });

    const journalEntries = (data?.data as JournalEntry[]) || [];
    const totalCount = (data as any)?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // --- Mutation ---
    const saveMutation = useMutation({
        mutationFn: async (entryData: Omit<JournalEntry, 'id' | 'company_id'>) => {
            if (!authUser) throw new Error("Not authenticated");
            const { error } = await journalService.saveJournalEntry(entryData);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            addToast('Journal entry created successfully', 'success');
        },
        onError: (err: any) => {
            addToast(err.message || 'Failed to save entry', 'error');
        }
    });

    const saveJournalEntry = async (entryData: Omit<JournalEntry, 'id' | 'company_id'>) => {
        await saveMutation.mutateAsync(entryData);
    };

    const refetch = () => queryClient.invalidateQueries({ queryKey: ['journalEntries'] });

    return {
        journalEntries,
        isLoading,
        error: isError ? (queryError as Error).message : null,
        saveJournalEntry,
        refetch,
        // Pagination & Filter Controls
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalCount,
        totalPages,
        filters,
        setFilters,
    };
};
