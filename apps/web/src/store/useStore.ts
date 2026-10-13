import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

export type TabType = 'margin' | 'odc' | 'slider' | 'roster' | 'audit';

interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedDeveloperId: string;
  setSelectedDeveloperId: (id: string) => void;
  isJsoxModalOpen: boolean;
  openJsoxModal: () => void;
  closeJsoxModal: () => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Initial theme from localStorage or default dark
const initialTheme = (localStorage.getItem('sbifpt-theme') as 'dark' | 'light') || 'dark';
if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useStore = create<AppState>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sbifpt-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    }),

  activeTab: 'margin',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedDeveloperId: '',
  setSelectedDeveloperId: (id) => set({ selectedDeveloperId: id }),

  isJsoxModalOpen: false,
  openJsoxModal: () => set({ isJsoxModalOpen: true }),
  closeJsoxModal: () => set({ isJsoxModalOpen: false }),

  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration ?? 4500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
