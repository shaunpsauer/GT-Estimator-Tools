import { VisibleColumns } from '../types/Project';

const STORAGE_KEYS = {
  visibleColumns: 'sd09-visible-columns',
} as const;

export const storageService = {
  saveVisibleColumns(columns: VisibleColumns) {
    localStorage.setItem(STORAGE_KEYS.visibleColumns, JSON.stringify(columns));
  },

  loadVisibleColumns(): VisibleColumns | null {
    const saved = localStorage.getItem(STORAGE_KEYS.visibleColumns);
    return saved ? JSON.parse(saved) : null;
  }
}; 