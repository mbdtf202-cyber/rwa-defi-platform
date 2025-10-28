import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  walletAddress?: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Notification state
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  removeNotification: (id: string) => void;

  // Transaction state
  pendingTransactions: Array<{
    hash: string;
    type: string;
    status: 'pending' | 'success' | 'failed';
  }>;
  addTransaction: (hash: string, type: string) => void;
  updateTransactionStatus: (hash: string, status: 'success' | 'failed') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // UI state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Notification state
      notifications: [],
      addNotification: (type, message) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              id: Math.random().toString(36).substr(2, 9),
              type,
              message,
              timestamp: Date.now(),
            },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // Transaction state
      pendingTransactions: [],
      addTransaction: (hash, type) =>
        set((state) => ({
          pendingTransactions: [
            ...state.pendingTransactions,
            { hash, type, status: 'pending' },
          ],
        })),
      updateTransactionStatus: (hash, status) =>
        set((state) => ({
          pendingTransactions: state.pendingTransactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),
    }),
    {
      name: 'rwa-defi-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
