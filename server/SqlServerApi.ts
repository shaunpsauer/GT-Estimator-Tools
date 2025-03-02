import { Project } from '../src/types/Project';

const API_URL = 'http://localhost:3001/api';

const SqlServerApi = {
  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async getProject(id: number): Promise<Project> {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async addProject(project: Project): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async updateProject(project: Project): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async deleteProject(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  async getProjectChanges(id: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/projects/${id}/changes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project changes: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
};

export default SqlServerApi;
