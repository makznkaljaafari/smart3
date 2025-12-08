
import { useState, useCallback, useEffect, useRef } from 'react';
import { Expense, ExpenseCategory, Attachment, ExpenseStatus, ExpensePriority, RecurrenceType, PaymentMethod, CurrencyCode } from '../types';
import { useZustandStore } from '../../../store/useStore';
import { storageService } from '../../../services/storageService';
import { useAISuggestions } from './useAISuggestions';
import { translations } from '../../../lib/i18n';

interface UseExpenseFormProps {
    expense?: Expense;
    onSave: (expense: Partial<Expense>) => Promise<void>;
    onClose: () => void;
}

export const useExpenseForm = ({ expense, onSave, onClose }: UseExpenseFormProps) => {
    const { accounts, settings, lang, addToast } = useZustandStore(state => ({
        accounts: state.accounts,
        settings: state.settings,
        lang: state.lang,
        addToast: state.addToast,
    }));
    const t = translations[lang];
    const isEdit = !!expense;

    const [formData, setFormData] = useState<Partial<Expense>>(
        expense || {
            title: '',
            description: '',
            category: 'parts',
            amount: 0,
            currency: settings.baseCurrency,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            priority: 'medium',
            recurrence: 'none',
            isRecurringTemplate: false,
            createdDate: new Date().toISOString(),
            attachments: []
        }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const suggestionTimeout = useRef<number | null>(null);

    const { 
        isSuggestingCategory, 
        isSuggestingAccounts, 
        getCategorySuggestion, 
        getAccountSuggestions 
    } = useAISuggestions();

    const handleChange = useCallback((field: keyof Expense, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    }, [errors]);

    const handleSuggestCategory = useCallback(async (title: string) => {
        const suggestedCategory = await getCategorySuggestion(title);
        if (suggestedCategory) {
            handleChange('category', suggestedCategory);
        }
    }, [getCategorySuggestion, handleChange]);

    const handleSuggestAccounts = useCallback(async () => {
        if (!formData.title) return;
        const suggestions = await getAccountSuggestions(formData.title, accounts);
        if (suggestions) {
            handleChange('expenseAccountId', suggestions.expenseAccountId);
            handleChange('paymentAccountId', suggestions.paymentAccountId);
        }
    }, [getAccountSuggestions, handleChange, formData.title, accounts]);

    // Auto-suggest category when title changes (if not editing)
    useEffect(() => {
        if (formData.title && !isEdit) {
            if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
            suggestionTimeout.current = window.setTimeout(() => {
                handleSuggestCategory(formData.title!);
            }, 1000);
        }
        return () => {
            if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
        };
    }, [formData.title, isEdit, handleSuggestCategory]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = t.expenseTitle + ' مطلوب';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = t.expenseAmount + ' مطلوب وأكبر من صفر';
        if (!formData.date) newErrors.date = t.expenseDate + ' مطلوب';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save expense:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        const fileNames = newFiles.map(f => f.name);
        setUploadingFiles(prev => [...prev, ...fileNames]);

        const uploadPromises = newFiles.map(async file => {
            const { publicUrl, error } = await storageService.uploadAttachment(file);
            if (error) {
                addToast({ message: `Failed to upload ${file.name}: ${error.message}`, type: 'error' });
                return null;
            }
            return {
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type,
                url: publicUrl!,
                uploadDate: new Date().toISOString()
            };
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r !== null) as Attachment[];

        handleChange('attachments', [...(formData.attachments || []), ...successfulUploads]);
        setUploadingFiles(prev => prev.filter(name => !fileNames.includes(name)));
    };

    const removeAttachment = (id: string) => {
        handleChange('attachments', formData.attachments?.filter(att => att.id !== id));
    };

    return {
        formData,
        errors,
        isSaving,
        isDragging,
        setIsDragging,
        uploadingFiles,
        isSuggestingCategory,
        isSuggestingAccounts,
        handleChange,
        handleSuggestAccounts,
        handleSubmit,
        handleFileChange,
        removeAttachment,
        accounts,
    };
};
