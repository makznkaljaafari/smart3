import { StateCreator } from 'zustand';
import { LangCode, Toast, AppTheme, AppNotification } from '../../types';

export interface UiSlice {
    theme: AppTheme;
    lang: LangCode;
    sidebarWidth: number;
    sidebarPreCollapseWidth: number;
    mobileMenuOpen: boolean;
    toasts: Toast[];
    notifications: AppNotification[];
    isOffline: boolean;
    // Actions
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
    theme: 'dark',
    lang: 'ar',
    sidebarWidth: 256,
    sidebarPreCollapseWidth: 256,
    mobileMenuOpen: false,
    toasts: [],
    notifications: [],
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : true,
    addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }] })),
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    addNotification: (notification) => set((state) => ({
        notifications: [
            { ...notification, id: crypto.randomUUID(), timestamp: new Date().toISOString(), read: false },
            ...state.notifications
        ].slice(0, 100) // Keep max 100 notifications
    })),
    markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),
    clearNotifications: () => set({ notifications: [] }),
});