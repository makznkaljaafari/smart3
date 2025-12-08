import { useState, useCallback, useEffect } from 'react';
import { useZustandStore } from '../../../store/useStore';
import { Account, Toast } from '../../../types';
import { accountService } from '../../../services/accountService';

/**
 * Custom hook to manage all state and business logic for the Chart of Accounts.
 * This includes fetching accounts, handling loading/error states, and providing
 * functions to save (create/update) and seed default accounts.
 *
 * @returns An object containing the accounts state and handler functions.
 */
export const useAccountData = () => {
    const { accounts, authUser, accountsLoading, accountsError } = useZustandStore();
    const { fetchAccounts } = useZustandStore.getState();
    
    const [isSeeding, setIsSeeding] = useState(false);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        useZustandStore.setState(s => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] }));
    }, []);

    const saveAccount = useCallback(async (accountData: Partial<Account>) => {
        if (!authUser) throw new Error("Not authenticated");
        
        const isNew = !accountData.id;
        const { error } = await accountService.saveAccount(accountData, isNew);
        
        if (error) {
            addToast(error.message, 'error');
            throw error;
        }
        
        await fetchAccounts(); // Refetch
        addToast(isNew ? 'Account created successfully' : 'Account updated successfully', 'success');
    }, [authUser, addToast, fetchAccounts]);

    const seedAccounts = useCallback(async () => {
        if (!authUser) throw new Error("Not authenticated");
        setIsSeeding(true);
        const { error } = await accountService.seedDefaultAccounts();
        if (error) {
            addToast(error.message, 'error');
        } else {
            addToast('Default accounts created successfully.', 'success');
            await fetchAccounts(); // refetch to show the new accounts
        }
        setIsSeeding(false);
    }, [authUser, addToast, fetchAccounts]);


    return {
        accounts,
        isLoading: accountsLoading,
        error: accountsError,
        saveAccount,
        refetch: fetchAccounts,
        isSeeding,
        seedAccounts,
    };
};