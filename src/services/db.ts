import { Project } from '../types/Project';

class DatabaseService {
  private dbName = 'sd09-viewer';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', { keyPath: 'id' });
          store.createIndex('pmoId', 'pmoId', { unique: false });
          store.createIndex('order', 'order', { unique: false });
        }
      };
    });
  }

  async addProject(project: Project): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      
      // Check if project already exists
      const getRequest = store.get(project.id);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // Project exists, update it
          const updateRequest = store.put(project);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          // New project, add it
          const addRequest = store.add(project);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteProject(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const db = new DatabaseService();
