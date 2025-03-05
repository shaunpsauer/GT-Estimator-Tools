// src/services/SqlServerApi.ts
import { Project, ProjectChanges } from '../types/Project';

// Define the base API URL from your environment configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

// Add a debounce mechanism to prevent duplicate operations
const pendingOperations = new Map<string, Promise<any>>();
// Add a debounce mechanism to prevent rapid consecutive API calls
const lastApiCallTime = new Map<string, number>();
const MIN_API_CALL_INTERVAL = 300; // milliseconds

// Helper function to debounce API calls
const debounceApiCall = async (key: string, apiCall: () => Promise<any>) => {
  const now = Date.now();
  const lastCallTime = lastApiCallTime.get(key) || 0;
  
  // If the last call was too recent, wait before making the next call
  if (now - lastCallTime < MIN_API_CALL_INTERVAL) {
    const waitTime = MIN_API_CALL_INTERVAL - (now - lastCallTime);
    console.log(`Debouncing API call for ${key}, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update the last call time
  lastApiCallTime.set(key, Date.now());
  
  // Make the API call
  return apiCall();
};

// Interface for database project (with order_number instead of order)
export interface DbProject {
  id: number;
  costEstimator: string;
  costEstimatorRequest: string;
  ade: string;
  projectManager: string;
  projectEngineer: string;
  designEstimator: string;
  constructionContractor: string;
  bundleId: string;
  postEstimate: string;
  pmoId: string;
  order_number: string; // Database uses order_number
  multipleOrder: string;
  mat: string;
  projectName: string;
  workStream: string;
  workType: string;
  engrPlanYear: string; // Store as string in DB
  constPlanYear: string; // Store as string in DB
  commitmentDate: string;
  station: string;
  line: string;
  mp1: string;
  mp2: string;
  city: string;
  county: string;
  class5: string;
  class4: string;
  class3: string;
  class2: string;
  negotiatePrice: string;
  jeReadyToRoute: string;
  jeApproved: string;
  estimateAnalysis: string;
  thirtyPercentDesignReviewMeeting: string;
  thirtyPercentDesignAvailable: string;
  sixtyPercentDesignReviewMeeting: string;
  sixtyPercentDesignAvailable: string;
  ninetyPercentDesignReviewMeeting: string;
  ninetyPercentDesignAvailable: string;
  ifc: string;
  ntp: string;
  mob: string;
  tieIn: string;
  enro: string;
  unitCapture: string;
  version: number;
  is_changed: boolean;
  last_updated: string;
}

// Interface for data uploads
export interface DataUpload {
  id: number;
  upload_date: string;
  file_name: string;
  user_name: string;
  is_active: boolean;
}

// Interface for project changes between uploads
export interface ExcelProjectChange {
  id: number;
  project_id: number;
  project_name: string;
  pmoId: string;
  old_upload_id: number | null;
  new_upload_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'added' | 'removed' | 'modified';
}

// Helper function to convert database model to frontend model
function dbToFrontendProject(dbProject: DbProject): Project {
  // Handle case where order_number might be undefined
  const { order_number, ...rest } = dbProject;
  
  // Convert string representations of numbers to actual numbers
  const engrPlanYear = rest.engrPlanYear ? Number(rest.engrPlanYear) : undefined;
  const constPlanYear = rest.constPlanYear ? Number(rest.constPlanYear) : undefined;
  
  return {
    ...rest,
    // If order is already set (server converted it), use that, otherwise use order_number
    order: (rest as any).order || order_number || '',
    engrPlanYear,
    constPlanYear,
  } as Project;
}

// Helper function to convert frontend model to database model
function frontendToDbProject(project: Project): DbProject {
  // Extract fields to convert
  const { order, engrPlanYear, constPlanYear, ...rest } = project;
  
  // Convert numeric fields to strings for the database
  return {
    ...rest,
    order_number: order || '', // Convert order to order_number for database
    engrPlanYear: engrPlanYear !== undefined ? String(engrPlanYear) : '',
    constPlanYear: constPlanYear !== undefined ? String(constPlanYear) : '',
  } as DbProject;
}

const SqlServerApi = {
  async getProjects(): Promise<Project[]> {
    const apiKey = 'get-projects';
    
    // If there's already a pending operation for this API call, return that promise
    if (pendingOperations.has(apiKey)) {
      console.log(`Operation already in progress for ${apiKey}, reusing promise`);
      return pendingOperations.get(apiKey)!;
    }
    
    const operation = debounceApiCall(apiKey, async () => {
      try {
        console.log("Fetching projects from " + API_BASE_URL + "/projects");
        
        // Add cache busting to prevent browser caching
        const cacheBuster = Date.now();
        const url = `${API_BASE_URL}/projects?_=${cacheBuster}`;
        console.log("Full URL with cache busting:", url);
        
        const response = await fetch(url);
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log(`Response content type: ${response.headers.get('content-type')}`);
        
        if (!response.ok) {
          console.warn(`Failed to fetch projects: ${response.status} ${response.statusText}`);
          return [];
        }
        
        const projects = await response.json();
        console.log(`Received ${projects.length} projects from server`);
        
        return projects.map((p: any) => dbToFrontendProject(p as DbProject));
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      } finally {
        // Remove the operation from the pending map after a short delay
        setTimeout(() => {
          pendingOperations.delete(apiKey);
        }, 1000);
      }
    });
    
    // Store the operation promise in the map
    pendingOperations.set(apiKey, operation);
    return operation;
  },

  async getProject(id: number): Promise<Project> {
    try {
      console.log(`Fetching project ${id} from ${API_BASE_URL}/projects/${id}`);
      const response = await fetch(`${API_BASE_URL}/projects/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(`Error fetching project ${id}:`, errorData || response.statusText);
        throw new Error(`Failed to fetch project ${id}: ${response.status} ${response.statusText}`);
      }
      
      const dbProject = await response.json();
      return dbToFrontendProject(dbProject as DbProject);
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },

  async getProjectChanges(id: number): Promise<ProjectChanges[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/changes`);
      if (!response.ok) throw new Error(`Failed to fetch changes for project ${id}`);
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching changes for project ${id}:`, error);
      throw error;
    }
  },

  async addProject(project: Project): Promise<Project> {
    // Create a unique key for this operation
    const operationKey = `project-${project.id}`;
    
    // Check if this operation is already in progress
    if (pendingOperations.has(operationKey)) {
      console.log(`Operation already in progress for project ${project.id}, reusing promise`);
      return pendingOperations.get(operationKey) as Promise<Project>;
    }
    
    // Create a new promise for this operation
    const operationPromise = (async () => {
      try {
        // First check if the project already exists
        try {
          // Use fetch directly to avoid throwing errors in the console
          const checkResponse = await fetch(`${API_BASE_URL}/projects/${project.id}`);
          
          if (checkResponse.ok) {
            // Project exists, update it instead
            console.log(`Project ${project.id} already exists, updating instead of adding`);
            await this.updateProject(project);
            return project;
          } else if (checkResponse.status === 404) {
            // Project doesn't exist, proceed with add
            console.log(`Project ${project.id} not found (404), proceeding with add operation`);
          } else {
            // Some other error occurred
            console.error(`Error checking if project ${project.id} exists:`, checkResponse.statusText);
          }
        } catch (checkError) {
          // Suppress the error, we'll proceed with the add operation
          console.log(`Error checking if project ${project.id} exists, proceeding with add operation`);
        }
        
        // Convert to DB format
        const dbProject = frontendToDbProject(project);
        
        console.log(`Adding project ${dbProject.id} to ${API_BASE_URL}/projects`);
        
        // Proceed with adding the project
        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dbProject),
        });
        
        if (!response.ok) {
          // Don't throw for non-critical errors
          console.warn(`Failed to add project: ${response.status} ${response.statusText}`);
          return project;
        }
        
        console.log(`Project ${dbProject.id} added successfully`);
        return project;
      } catch (error) {
        console.warn(`Error adding project ${project.id}:`, error);
        // Don't rethrow the error to prevent cascading failures
        return project;
      } finally {
        // Remove the operation from the pending map after a short delay
        setTimeout(() => {
          pendingOperations.delete(operationKey);
        }, 1000);
      }
    })();
    
    // Store the operation promise in the map
    pendingOperations.set(operationKey, operationPromise);
    return operationPromise;
  },

  async updateProject(project: Project): Promise<Project> {
    const operationKey = `update-${project.id}`;
    
    // If there's already a pending operation for this project, return that promise
    if (pendingOperations.has(operationKey)) {
      console.log(`Update operation already in progress for project ${project.id}, reusing promise`);
      return pendingOperations.get(operationKey) as Promise<Project>;
    }
    
    const operation = (async () => {
      try {
        const dbProject = frontendToDbProject(project);
        
        const response = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbProject),
        });
        
        if (!response.ok) {
          console.warn(`Failed to update project ${project.id}: ${response.status} ${response.statusText}`);
          
          // If it's a 404, the project doesn't exist, try to add it instead
          if (response.status === 404) {
            console.log(`Project ${project.id} not found for update, trying to add it instead`);
            return this.addProject(project);
          }
          
          // For other errors, log but don't throw
          const errorData = await response.json().catch(() => null);
          console.warn('Update error details:', errorData);
          return project;
        }
        
        console.log(`Project ${project.id} updated successfully`);
        return project;
      } catch (error) {
        console.warn(`Error updating project ${project.id}:`, error);
        // Don't rethrow the error to prevent cascading failures
        return project;
      } finally {
        // Remove the operation from the pending map after a short delay
        setTimeout(() => {
          pendingOperations.delete(operationKey);
        }, 1000);
      }
    })();
    
    // Store the operation promise in the map
    pendingOperations.set(operationKey, operation);
    return operation;
  },

  async deleteProject(id: number): Promise<void> {
    const operationKey = `delete-${id}`;
    
    // If there's already a pending operation for this project, return that promise
    if (pendingOperations.has(operationKey)) {
      console.log(`Delete operation already in progress for project ${id}, reusing promise`);
      return pendingOperations.get(operationKey)!;
    }
    
    const operation = (async () => {
      try {
        console.log(`Deleting project ${id}...`);
        const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          let errorMessage = `Failed to delete project ${id}: ${response.status} ${response.statusText}`;
          
          try {
            const errorData = await response.json();
            console.warn(`Error deleting project ${id}:`, errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            console.warn('Could not parse error response:', parseError);
          }
          
          // If it's a 404, the project doesn't exist, so we can consider it "deleted"
          if (response.status === 404) {
            console.log(`Project ${id} not found (404), considering it already deleted`);
            return;
          }
          
          // For other errors, log but don't throw
          console.warn(errorMessage);
          return;
        }
        
        console.log(`Project ${id} deleted successfully`);
      } catch (error) {
        console.warn(`Error deleting project ${id}:`, error);
        // Don't rethrow the error to prevent cascading failures
      } finally {
        // Remove the operation from the pending map after a short delay
        setTimeout(() => {
          pendingOperations.delete(operationKey);
        }, 1000);
      }
    })();
    
    // Store the operation promise in the map
    pendingOperations.set(operationKey, operation);
    return operation;
  },

  async getUploads(): Promise<DataUpload[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error fetching uploads:', errorData || response.statusText);
        throw new Error(`Failed to fetch uploads: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching uploads:', error);
      throw error;
    }
  },

  async getLatestUpload(): Promise<DataUpload | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/latest`).catch(error => {
        // Handle network errors like connection refused
        console.warn(`Network error when fetching latest upload: ${error.message}`);
        return null;
      });
      
      // If fetch failed with a network error
      if (!response) {
        console.log('Returning null due to network error');
        return null;
      }
      
      if (!response.ok) {
        // For 404 errors (no uploads), just return null instead of throwing
        if (response.status === 404) {
          console.log('No latest upload found (404), returning null');
          return null;
        }
        
        const errorData = await response.json().catch(() => null);
        console.warn('Error fetching latest upload:', errorData || response.statusText);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Error fetching latest upload:', error);
      return null; // Return null instead of throwing
    }
  },

  async getUploadProjects(uploadId: number): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/${uploadId}/projects`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(`Error fetching projects for upload ${uploadId}:`, errorData || response.statusText);
        throw new Error(`Failed to fetch projects for upload ${uploadId}: ${response.status} ${response.statusText}`);
      }
      
      const projects = await response.json();
      return projects.map((p: any) => dbToFrontendProject(p as DbProject));
    } catch (error) {
      console.error(`Error fetching projects for upload ${uploadId}:`, error);
      throw error;
    }
  },

  async getUploadChanges(newUploadId: number, oldUploadId?: number): Promise<ExcelProjectChange[]> {
    try {
      let url = `${API_BASE_URL}/uploads/${newUploadId}/changes`;
      if (oldUploadId) {
        url += `?oldId=${oldUploadId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(`Error fetching changes for upload ${newUploadId}:`, errorData || response.statusText);
        throw new Error(`Failed to fetch changes for upload ${newUploadId}: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching changes for upload ${newUploadId}:`, error);
      throw error;
    }
  },

  async createUpload(fileName: string, userName: string, projects: Project[]): Promise<{ uploadId: number; uploadDate: string; projectCount: number }> {
    try {
      console.log(`Creating upload with ${projects.length} projects...`);
      
      // Convert frontend projects to DB format
      const dbProjects = projects.map(p => frontendToDbProject(p));
      
      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          userName,
          projects: dbProjects,
        }),
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to create upload: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('Error creating upload:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log(`Upload created successfully with ID ${result.uploadId}`);
      return result;
    } catch (error) {
      console.error('Error creating upload:', error);
      throw error;
    }
  },

  async getExcelProjects(page: number = 1, pageSize: number = 100): Promise<{projects: Project[], total: number}> {
    try {
      console.log(`Fetching Excel projects from API (page ${page}, pageSize ${pageSize})...`);
      const response = await fetch(`${API_BASE_URL}/excel-projects?page=${page}&pageSize=${pageSize}`).catch(error => {
        // Handle network errors like connection refused
        console.warn(`Network error when fetching Excel projects: ${error.message}`);
        return null;
      });
      
      // If fetch failed with a network error
      if (!response) {
        console.log('Returning empty array due to network error');
        return {projects: [], total: 0};
      }
      
      if (!response.ok) {
        // For 404 errors (no uploads), just return an empty array
        if (response.status === 404) {
          console.log("No uploads found, returning empty array");
          return {projects: [], total: 0};
        }
        
        const errorData = await response.json().catch(() => null);
        console.warn('Error fetching excel projects:', errorData || response.statusText);
        return {projects: [], total: 0};
      }
      
      const result = await response.json();
      const projects = result.projects || result;
      const total = result.total || projects.length;
      
      console.log(`Received ${projects.length} Excel projects from API (page ${page} of ${Math.ceil(total/pageSize)})`);
      return {
        projects: projects.map((p: any) => dbToFrontendProject(p as DbProject)),
        total
      };
    } catch (error) {
      console.warn('Error fetching excel projects:', error);
      return {projects: [], total: 0}; // Return empty array on error
    }
  },

  // Add other API methods as needed
};

export default SqlServerApi;