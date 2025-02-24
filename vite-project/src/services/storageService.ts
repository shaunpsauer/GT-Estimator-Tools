import { Project, VisibleColumns } from '../types/Project';

const STORAGE_KEYS = {
  visibleColumns: 'sd09-visible-columns',
  projects: 'sd09-projects'
} as const;

export const storageService = {
  saveVisibleColumns(columns: VisibleColumns) {
    localStorage.setItem(STORAGE_KEYS.visibleColumns, JSON.stringify(columns));
  },

  loadVisibleColumns(): VisibleColumns | null {
    const saved = localStorage.getItem(STORAGE_KEYS.visibleColumns);
    return saved ? JSON.parse(saved) : null;
  },

  saveProjects(projects: Project[]) {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  },

  loadProjects(): Project[] | null {
    const saved = localStorage.getItem(STORAGE_KEYS.projects);
    return saved ? JSON.parse(saved) : null;
  }
}; 