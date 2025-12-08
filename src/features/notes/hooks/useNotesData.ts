
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { translations } from '../../../lib/i18n';
import { Note, NoteCategory, NoteStatus, Toast } from '../../../types';
import { noteService } from '../api/noteService';
import { syncService } from '../../../services/syncService';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

type SortField = 'date' | 'title' | 'priority' | 'category';
type SortOrder = 'asc' | 'desc';

export const useNotesData = () => {
    const { lang, authUser, settings, currentCompany, isOffline } = useZustandStore(state => ({
        lang: state.lang,
        authUser: state.authUser,
        settings: state.settings,
        currentCompany: state.currentCompany,
        isOffline: state.isOffline,
    }));
    const t = translations[lang];
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [sort, setSort] = useState<{ field: SortField; order: SortOrder }>({ field: 'date', order: 'desc' });
    const [filters, setFilters] = useState({
        category: 'all' as NoteCategory | 'all',
        status: 'all' as NoteStatus | 'all',
        searchQuery: '',
        dateFrom: '',
        dateTo: ''
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Check if pageSize exists on settings.page.notes, else default to 12
    const pageSize = settings.page.notes && 'pageSize' in settings.page.notes ? settings.page.notes.pageSize : 12; 

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    
    const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(filters.searchQuery), 500);
        return () => clearTimeout(timer);
    }, [filters.searchQuery]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    // --- React Query ---
    const queryKey = ['notes', currentCompany?.id, currentPage, pageSize, debouncedSearch, filters.category, filters.status, filters.dateFrom, filters.dateTo];

    const { data, isLoading, isError, error } = useQuery({
        queryKey,
        queryFn: () => noteService.getNotesPaginated({
            page: currentPage,
            pageSize,
            search: debouncedSearch,
            category: filters.category,
            status: filters.status,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        }),
        placeholderData: keepPreviousData,
        enabled: !!currentCompany?.id,
    });

    const notes = data?.data || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Stats Calculation
    const stats = useMemo(() => ({
        total: totalCount,
        active: notes.filter(n => n.status === 'active').length,
        pinned: notes.filter(n => n.isPinned).length,
        favorites: notes.filter(n => n.isFavorite).length,
        reminders: notes.filter(n => n.hasReminder && n.reminderDate && new Date(n.reminderDate) > new Date()).length,
        overdue: notes.filter(n => n.dueDate && new Date(n.dueDate) < new Date() && n.status === 'active').length,
    }), [notes, totalCount]);

    // Sorting
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            let comparison = 0;
            switch (sort.field) {
                case 'title': comparison = a.title.localeCompare(b.title, lang); break;
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    comparison = priorityOrder[b.priority] - priorityOrder[a.priority]; break;
                default: comparison = new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime(); break;
            }
            return sort.order === 'asc' ? comparison : -comparison;
        });
    }, [notes, sort, lang]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (data: { note: Partial<Note>, isNew: boolean }) => {
            const dataToSave = {
                ...data.note,
                author: authUser?.name,
                updatedDate: new Date().toISOString(),
            };
            if (data.isNew) {
                dataToSave.createdDate = new Date().toISOString();
            }
            
            // Offline Handling
            if (isOffline) {
                const tempId = data.isNew ? `temp-${Date.now()}` : data.note.id!;
                const offlineNote = { ...dataToSave, id: tempId } as Note;
                
                if (data.isNew) {
                    syncService.enqueue({ type: 'CREATE_NOTE', payload: offlineNote, tempId });
                } else {
                    syncService.enqueue({ type: 'UPDATE_NOTE', payload: offlineNote });
                }
                
                return { offline: true, data: offlineNote, isNew: data.isNew };
            }

            const { error } = await noteService.saveNote(dataToSave, data.isNew);
            if (error) throw error;
            return { offline: false, isNew: data.isNew };
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (result.offline) {
                addToast(lang === 'ar' ? 'تم الحفظ دون اتصال. ستتم المزامنة لاحقاً.' : 'Saved offline. Will sync when online.', 'warning');
            } else {
                addToast(t.noteSavedSuccess, 'success');
            }
            handleCloseModals();
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (isOffline) {
                syncService.enqueue({ type: 'DELETE_NOTE', payload: id });
                return { offline: true };
            }
            const { error } = await noteService.deleteNote(id);
            if (error) throw error;
            return { offline: false };
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey });
            const previousData = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.filter((note: Note) => note.id !== id),
                    count: old.count - 1,
                };
            });
            return { previousData };
        },
        onSuccess: (result) => {
            if (result.offline) {
                addToast(lang === 'ar' ? 'تم الحذف محلياً.' : 'Deleted locally.', 'warning');
            } else {
                addToast(t.noteDeletedSuccess, 'info');
            }
            setIsDeleting(false);
            setDeletingNoteId(null);
        },
        onError: (err: any, id, context) => {
            addToast(err.message, 'error');
            setIsDeleting(false);
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData);
            }
        },
        onSettled: () => {
             queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async (data: { id: string, key: 'isPinned' | 'isFavorite', value: boolean }) => {
             if (isOffline) {
                 const note = notes.find(n => n.id === data.id);
                 if (note) {
                     const updatedNote = { ...note, [data.key]: data.value };
                     syncService.enqueue({ type: 'UPDATE_NOTE', payload: updatedNote });
                 }
                 return;
             }
             const { error } = await noteService.toggleNote(data.id, data.key, data.value);
             if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: (err: any) => addToast(err.message, 'error')
    });

    const handleCloseModals = useCallback(() => {
        setShowDetailsModal(false);
        setShowFormModal(false);
        setSelectedNote(null);
        setEditingNote(null);
        setDeletingNoteId(null);
    }, []);

    const handleOpenForm = () => {
        setEditingNote(null);
        setShowFormModal(true);
    };

    const handleSave = async (noteData: Partial<Note>) => {
        if (!authUser) throw new Error("Not authenticated");
        await saveMutation.mutateAsync({ note: noteData, isNew: !editingNote });
    };

    const handleDelete = (id: string) => {
        setDeletingNoteId(id);
    };

    const confirmDelete = async () => {
        if (!deletingNoteId) return;
        setIsDeleting(true);
        await deleteMutation.mutateAsync(deletingNoteId);
    };

    const cancelDelete = () => {
        setDeletingNoteId(null);
    };

    const handleToggle = async (id: string, key: 'isPinned' | 'isFavorite') => {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        await toggleMutation.mutateAsync({ id, key, value: !note[key] });
    };
    
    const handleViewDetails = (note: Note) => { setSelectedNote(note); setShowDetailsModal(true); };
    const handleEdit = (note: Note) => { setEditingNote(note); setShowFormModal(true); };
    
    const handleSort = (field: string) => {
         // Cast string to specific sort field or ignore if invalid
         const validFields: SortField[] = ['date', 'title', 'priority', 'category'];
         if (validFields.includes(field as SortField)) {
            const safeField = field as SortField;
            if (sort.field === safeField) setSort(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
            else setSort({ field: safeField, order: 'desc' });
         }
    };

    return {
        stats,
        viewMode, setViewMode,
        sort, handleSort,
        filters, setFilters,
        showAdvancedFilters, setShowAdvancedFilters,
        filteredNotes: sortedNotes,
        selectedNote,
        showDetailsModal,
        showFormModal,
        editingNote,
        notesLoading: isLoading,
        notesError: isError ? (error as Error).message : null,
        handleSave,
        handleDelete,
        handleToggle,
        handleViewDetails,
        handleEdit,
        handleOpenForm,
        handleCloseModals,
        deletingNoteId,
        isDeleting,
        confirmDelete,
        cancelDelete,
        currentPage, setCurrentPage,
        totalPages
    };
};
