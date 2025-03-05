import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Project, VisibleColumns } from "../types/Project";
import { ToggleSwitch } from "./ToggleSwitch";
import SqlServerApi, { DataUpload } from "../services/SqlServerApi";
import ProjectDetails from "./ProjectDetails";
import SearchBar from "./SearchBar";
import * as Icons from "react-feather";
import * as XLSX from "xlsx";
import { formatDate } from "../utils/dateUtils";
import UploadHistory from "./UploadHistory";

interface Sd09Props {
  projects: Project[];
  visibleColumns: VisibleColumns;
  onSelectedProjectsChange?: (projects: Project[]) => void;
  onSaveProjects?: (projects: Project[]) => void;
  onSettingsClick?: () => void;
  onViewSavedProjects?: () => void;
  onProjectsLoad?: (projects: Project[]) => void;
}

// Convert Excel date serial number to MM/DD/YY format
const convertExcelDate = (serialNumber: number): string => {
  const date = new Date((serialNumber - 25569) * 86400 * 1000);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

export const Sd09 = ({
  projects,
  visibleColumns,
  onSelectedProjectsChange,
  onSaveProjects,
  onSettingsClick,
  onViewSavedProjects,
  onProjectsLoad,
}: Sd09Props) => {
  // States
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [pinnedColumns, setPinnedColumns] = useState<{ [key: string]: boolean }>({
    pmoId: false,
    order: false,
  });
  const [existingProjectIds, setExistingProjectIds] = useState<Set<number>>(new Set());
  const [latestUpload, setLatestUpload] = useState<DataUpload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(true);
  const pageSize = 100; // Number of projects to load per page
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  // Ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Ref to track if data has been loaded
  const dataLoadedRef = React.useRef<boolean>(false);
  // Add loading flags to prevent duplicate API calls
  const [isLoadingExistingProjects, setIsLoadingExistingProjects] = useState<boolean>(false);
  const [isLoadingLatestUpload, setIsLoadingLatestUpload] = useState<boolean>(false);
  const [isLoadingExcelProjects, setIsLoadingExcelProjects] = useState<boolean>(false);

  // Add toggle pinned column function
  const togglePinnedColumn = useCallback((column: string) => {
    setPinnedColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  }, []);

  // Update the settings order to move PMO ID and Order after Post Estimate
  const settingsOrder: (keyof VisibleColumns)[] = [
    "costEstimator", "costEstimatorRequest", "ade", "projectManager",
    "projectEngineer", "designEstimator", "constructionContractor", "bundleId",
    "postEstimate", "pmoId", "order", "multipleOrder", "mat", "projectName",
    "workStream", "workType", "engrPlanYear", "constPlanYear", "commitmentDate",
    "station", "line", "mp1", "mp2", "city", "county", "class5", "class4",
    "class3", "class2", "negotiatePrice", "jeReadyToRoute", "jeApproved",
    "estimateAnalysis", "thirtyPercentDesignReviewMeeting",
    "thirtyPercentDesignAvailable", "sixtyPercentDesignReviewMeeting",
    "sixtyPercentDesignAvailable", "ninetyPercentDesignReviewMeeting",
    "ninetyPercentDesignAvailable", "ifc", "ntp", "mob", "tieIn", "enro",
    "unitCapture"
  ];

  // Load existing projects and latest upload on mount
  useEffect(() => {
    // Check if data has already been loaded in this session
    if (!dataLoadedRef.current) {
      console.log("Initial data load for Sd09");
      
      // Check if already have projects passed from props
      if (projects && projects.length > 0) {
        console.log(`Using ${projects.length} projects passed from props`);
        // Extract project IDs from the passed projects
        const projectIds = new Set(projects.map(p => p.id));
        setExistingProjectIds(projectIds);
        
        // Only load latest upload and Excel projects
        const loadPartialData = async () => {
          await loadLatestUpload();
          await loadExcelProjects(1); // Start with page 1
        };
        
        loadPartialData();
      } else {
        // Load all data sequentially to avoid race conditions
        const loadInitialData = async () => {
          await loadExistingProjects();
          await loadLatestUpload();
          await loadExcelProjects(1); // Start with page 1
        };
        
        loadInitialData();
      }
      
      // Mark data as loaded
      dataLoadedRef.current = true;
    } else {
      console.log("Sd09 data already loaded, skipping initial load");
    }
    
    // Clean up function
    return () => {
      // Reset loading flags when component unmounts
      setIsLoadingExistingProjects(false);
      setIsLoadingLatestUpload(false);
      setIsLoadingExcelProjects(false);
      setIsLoadingMore(false);
      
      // We don't need to reset the dataLoadedRef on unmount
      // as we want to remember that data was loaded during this session
    };
  }, [projects]);

  const loadExistingProjects = async () => {
    if (isLoadingExistingProjects || existingProjectIds.size > 0) return;
    
    setIsLoadingExistingProjects(true);
    try {
      const existingProjects = await SqlServerApi.getProjects();
      setExistingProjectIds(new Set(existingProjects.map((p) => p.id)));
    } catch (error) {
      setExistingProjectIds(new Set());
    } finally {
      setIsLoadingExistingProjects(false);
    }
  };

  const loadLatestUpload = async () => {
    if (isLoadingLatestUpload || latestUpload) return;
    
    setIsLoadingLatestUpload(true);
    try {
      const upload = await SqlServerApi.getLatestUpload();
      setLatestUpload(upload);
    } catch (error) {
      setLatestUpload(null);
    } finally {
      setIsLoadingLatestUpload(false);
    }
  };

  const loadExcelProjects = async (page: number = currentPage) => {
    if (isLoadingExcelProjects) return;
    
    setIsLoadingExcelProjects(true);
    setIsLoadingMore(true);
    
    try {
      const result = await SqlServerApi.getExcelProjects(page, pageSize);
      const filteredProjects = result.projects.filter(p => !existingProjectIds.has(p.id));
      
      if (page === 1) {
        onProjectsLoad?.(filteredProjects);
      } else {
        const existingProjects = [...filteredProjects];
        onProjectsLoad?.(existingProjects);
      }

      setCurrentPage(page);
      setTotalProjects(result.total);
      setHasMoreProjects(page * pageSize < result.total);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoadingExcelProjects(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreProjects = () => {
    if (!isLoadingMore && hasMoreProjects) {
      loadExcelProjects(currentPage + 1);
    }
  };

  // Format cell values (with basic date formatting)
  const formatCellValue = (column: string, value: any) => {
    if (!value) return "N/A";
    const dateColumns = [
      "class5",
      "class4",
      "class3",
      "class2",
      "negotiatePrice",
      "jeReadyToRoute",
      "jeApproved",
      "thirtyPercentDesignReviewMeeting",
      "thirtyPercentDesignAvailable",
      "sixtyPercentDesignReviewMeeting",
      "sixtyPercentDesignAvailable",
      "ninetyPercentDesignReviewMeeting",
      "ninetyPercentDesignAvailable",
      "ifc",
      "ntp",
      "mob",
      "tieIn",
      "enro",
      "unitCapture",
    ];
    if (dateColumns.includes(column)) {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === "string" && value.includes("/")) return value;
    }
    return String(value);
  };

  // Define formatted labels once
  const formattedLabels: Record<string, string> = {
    // Team Members
    costEstimator: "Cost Est.",
    costEstimatorRequest: "Cost Est. Req.",
    projectManager: "PM",
    projectEngineer: "Proj. Eng.",
    designEstimator: "Design Est.",
    constructionContractor: "Contractor",
    ade: "ADE",

    // Project Info
    pmoId: "PMO ID",
    order: "Order",
    multipleOrder: "Multi Order",
    bundleId: "Bundle ID",
    postEstimate: "Post Est.",
    mat: "MAT",
    projectName: "Project",
    workStream: "Work Stream",
    workType: "Work Type",
    station: "Station",
    line: "LINE",
    city: "City",
    county: "County",

    // Years & Dates
    engrPlanYear: "Eng. Year",
    constPlanYear: "Const. Year",
    commitmentDate: "Commit Date",

    // Milestones
    thirtyPercentDesignReviewMeeting: "30% Review",
    thirtyPercentDesignAvailable: "30% Design",
    sixtyPercentDesignReviewMeeting: "60% Review",
    sixtyPercentDesignAvailable: "60% Design",
    ninetyPercentDesignReviewMeeting: "90% Review",
    ninetyPercentDesignAvailable: "90% Design",
    ifc: "IFC",
    class5: "CLASS 5",
    class4: "CLASS 4",
    class3: "CLASS 3",
    class2: "CLASS 2",
    negotiatePrice: "Neg. Price",
    jeReadyToRoute: "JE Ready",
    jeApproved: "JE Appr.",
    estimateAnalysis: "Est. Analysis",
    ntp: "NTP",
    mob: "MOB",
    mp1: "MP1",
    mp2: "MP2",
    tieIn: "Tie-in",
    enro: "ENRO",
    unitCapture: "Unit Cap.",
  };

  const formatColumnName = (column: string): string => {
    return (
      formattedLabels[column] ||
      column
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
    );
  };

  const parseSearchTerm = (searchTerm: string) => {
    const match = searchTerm.match(/^([^:]+):(.+)$/);
    if (match) {
      const [_, column, value] = match;
      return { column: column.trim(), value: value.trim() };
    }
    return null;
  };

  // Memoize filtered projects to avoid unnecessary re-computations
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      return appliedFilters.every((filter) => {
        const parsedFilter = parseSearchTerm(filter);
        if (parsedFilter) {
          // Column-specific search
          const { column, value } = parsedFilter;
          const columnKey = Object.keys(visibleColumns).find((key) => {
            return formatColumnName(key).toLowerCase() === column.toLowerCase();
          });
          if (columnKey && visibleColumns[columnKey as keyof VisibleColumns]) {
            const projectValue = project[columnKey as keyof Project];
            return (
              projectValue !== undefined &&
              String(projectValue).toLowerCase().includes(value.toLowerCase())
            );
          }
          return false;
        }
        // Normal search across visible columns
        return Object.entries(project)
          .filter(([key]) => visibleColumns[key as keyof VisibleColumns])
          .some(([_, value]) =>
            String(value).toLowerCase().includes(filter.toLowerCase())
          );
      });
    });
  }, [projects, appliedFilters, visibleColumns]);

  // Handle "Select All" using useCallback
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(filteredProjects.map((p) => p.id));
    setSelectedProjects((prev) =>
      prev.size === allIds.size ? new Set() : allIds
    );
  }, [filteredProjects]);

  // Handle selecting a single project
  const handleSelectProject = useCallback(
    (projectId: number) => {
      setSelectedProjects((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(projectId)) {
          newSelected.delete(projectId);
        } else {
          newSelected.add(projectId);
        }
        // Notify parent of selected projects change
        onSelectedProjectsChange?.(
          filteredProjects.filter((p) => newSelected.has(p.id))
        );
        return newSelected;
      });
    },
    [filteredProjects, onSelectedProjectsChange]
  );

  // Handle adding selected projects (bulk add if available)
  const handleAddToMyProjects = useCallback(async () => {
    const selectedProjectsList = filteredProjects.filter(
      (p) => selectedProjects.has(p.id) && !existingProjectIds.has(p.id)
    );
    
    if (selectedProjectsList.length === 0) {
      console.log("No new projects to add or all selected projects already exist");
      return;
    }
    
    console.log(`Attempting to add ${selectedProjectsList.length} projects to database`);
    
    try {
      // Add projects one by one
      const addedProjects = [];
      const failedProjects = [];
      
      for (const project of selectedProjectsList) {
        try {
          // Create a clean copy of the project with only the fields we need
          const cleanProject = {
            id: Number(project.id),
            costEstimator: project.costEstimator || '',
            costEstimatorRequest: project.costEstimatorRequest || '',
            ade: project.ade || '',
            projectManager: project.projectManager || '',
            projectEngineer: project.projectEngineer || '',
            designEstimator: project.designEstimator || '',
            constructionContractor: project.constructionContractor || '',
            bundleId: project.bundleId || '',
            postEstimate: project.postEstimate || '',
            pmoId: project.pmoId || '',
            order: project.order || '',
            multipleOrder: project.multipleOrder || '',
            mat: project.mat || '',
            projectName: project.projectName || '',
            workStream: project.workStream || '',
            workType: project.workType || '',
            engrPlanYear: project.engrPlanYear,
            constPlanYear: project.constPlanYear,
            commitmentDate: project.commitmentDate || '',
            station: project.station || '',
            line: project.line || '',
            mp1: project.mp1 || '',
            mp2: project.mp2 || '',
            city: project.city || '',
            county: project.county || '',
            class5: project.class5 || '',
            class4: project.class4 || '',
            class3: project.class3 || '',
            class2: project.class2 || '',
            negotiatePrice: project.negotiatePrice || '',
            jeReadyToRoute: project.jeReadyToRoute || '',
            jeApproved: project.jeApproved || '',
            estimateAnalysis: project.estimateAnalysis || '',
            thirtyPercentDesignReviewMeeting: project.thirtyPercentDesignReviewMeeting || '',
            thirtyPercentDesignAvailable: project.thirtyPercentDesignAvailable || '',
            sixtyPercentDesignReviewMeeting: project.sixtyPercentDesignReviewMeeting || '',
            sixtyPercentDesignAvailable: project.sixtyPercentDesignAvailable || '',
            ninetyPercentDesignReviewMeeting: project.ninetyPercentDesignReviewMeeting || '',
            ninetyPercentDesignAvailable: project.ninetyPercentDesignAvailable || '',
            ifc: project.ifc || '',
            ntp: project.ntp || '',
            mob: project.mob || '',
            tieIn: project.tieIn || '',
            enro: project.enro || '',
            unitCapture: project.unitCapture || '',
            // Add a timestamp to track when the project was added
            last_updated: new Date().toISOString(),
          };
          
          console.log(`Adding project ${cleanProject.id} to database`);
          await SqlServerApi.addProject(cleanProject);
          console.log(`Successfully added project ${cleanProject.id}`);
          addedProjects.push(cleanProject.id);
          
          // Add the project ID to the existingProjectIds set to prevent it from showing in Sd09
          setExistingProjectIds(prev => {
            const newSet = new Set(prev);
            newSet.add(cleanProject.id);
            return newSet;
          });
        } catch (error) {
          console.error(`Failed to add project ${project.id}:`, error);
          failedProjects.push(project.id);
          // Continue with the next project instead of stopping the entire process
        }
      }
      
      // Show a summary of the operation
      if (addedProjects.length > 0) {
        console.log(`Successfully added ${addedProjects.length} projects: ${addedProjects.join(', ')}`);
      }
      
      if (failedProjects.length > 0) {
        console.error(`Failed to add ${failedProjects.length} projects: ${failedProjects.join(', ')}`);
      }
      
      // Reload projects from the database
      await loadExistingProjects();
      console.log("Finished adding projects and reloaded existing projects");
      
      // Clear the selection after adding projects
      setSelectedProjects(new Set());
      
      // Dispatch a custom event to notify other components that projects have been added
      const event = new CustomEvent('projectsAdded', { 
        detail: { addedProjects, failedProjects } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error in bulk add process:", error);
    }
  }, [filteredProjects, selectedProjects, existingProjectIds, loadExistingProjects]);


  // Memoized cell style function to avoid recreating this function for every cell
  const getCellStyle = useCallback(
    (
      isPinned: boolean = false,
      column?: string,
      isHeader: boolean = false,
      rowIndex?: number
    ) => ({
      padding: "4px 8px",
      borderBottom: "1px solid var(--border-light)",
      position: isPinned || isHeader ? "sticky" as const : "static" as const,
      left: isPinned
        ? column === "select"
          ? "0px"
          : column === "pmoId"
          ? "80px"
          : column === "order"
          ? "160px"
          : undefined
        : undefined,
      top: isHeader ? 0 : undefined,
      zIndex: isHeader ? (isPinned ? 3 : 2) : isPinned ? 1 : 0,
      backgroundColor: isHeader
        ? "var(--bg-secondary)"
        : isPinned
        ? rowIndex !== undefined && rowIndex % 2 === 0
          ? "#f8f9fa"
          : "white"
        : "inherit",
      ...(isPinned
        ? {
            borderRight: "1px solid var(--border-color)",
            boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
          }
        : {}),
      whiteSpace: "nowrap" as const,
    }),
    []
  );

  // Filter management functions
  const handleApplyFilter = (filter: string) => {
    setAppliedFilters((prev) => [...prev, filter]);
  };

  const handleRemoveFilter = (indexToRemove: number) => {
    setAppliedFilters((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleClearAllFilters = () => {
    setAppliedFilters([]);
    setSearchValue("");
  };

  // Row styling based on category
  const rowStyles: Record<string, string> = {
    thisWeek: "#ffcdd2",
    thisMonth: "#fff9c4",
    nextMonth: "#c8e6c9",
    next3Months: "#81c784",
  };

  const getRowStyle = (category: string) => ({
    backgroundColor: rowStyles[category] || "white",
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log(`Starting upload of file: ${file.name}`);
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 30);
          setUploadProgress(progress);
        }
      };
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Failed to read file data");
          
          setUploadProgress(20);
          const workbook = XLSX.read(data, { type: "array" });
          
          setUploadProgress(30);
          
          // Assume the first sheet is the one we want
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON with header row option and raw values
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: 3,  // Start from row 4 (0-based index)
            raw: true, // Get raw values for proper date handling
            defval: '', // Set default value for empty cells
            header: 1  // Use 1-based array of values instead of objects
          }) as any[][];  // Type assertion for the array
          console.log(`Converted Excel to JSON: ${jsonData.length} rows`);
          
          // Get headers from the first row and clean them
          const headers = jsonData[0].map((header: string) => String(header).trim());
          console.log('Excel headers:', headers);
          
          // Map the Excel data to our Project type (skip the header row)
          const mappedProjects = jsonData.slice(1).map((row: any[], index) => {
            // Create a map of column values using headers
            const rowData: { [key: string]: any } = {};
            headers.forEach((header, i) => {
              if (header) {  // Only map non-empty headers
                rowData[header] = row[i];
              }
            });
            
            // Log the PMO ID and Order values with more detail
            const pmoId = rowData['PMO ID'];
            const order = rowData['Order'];
            console.log(`Row ${index + 1} Data:`, {
              pmoId,
              order,
              rawPmoId: row[headers.indexOf('PMO ID')],
              rawOrder: row[headers.indexOf('Order')],
              headerIndexes: {
                pmoId: headers.indexOf('PMO ID'),
                order: headers.indexOf('Order')
              }
            });
            
            // Use the Row column as ID, fallback to index + 1
            const id = rowData['Row'] || index + 1;
            
            // Helper function to convert dates
            const convertDate = (value: any) => {
              if (!value) return '';
              if (typeof value === 'number') {
                return convertExcelDate(value);
              }
              // If it's already a string in DD-MM-YY format, convert to MM/DD/YY
              const datePattern = /^(\d{2})-(\d{2})-(\d{2})$/;
              const match = String(value).match(datePattern);
              if (match) {
                const [_, day, month, year] = match;
                return `${month}/${day}/${year}`;
              }
              return value;
            };

            // Helper function to ensure string values
            const ensureString = (value: any) => {
              if (value === undefined || value === null) return '';
              return String(value).trim();
            };

            // Helper function to ensure number values
            const ensureNumber = (value: any) => {
              if (value === undefined || value === null) return 0;
              const num = Number(value);
              return isNaN(num) ? 0 : num;
            };
            
            const project: Project = {
              id: Number(id),
              costEstimator: ensureString(rowData['Cost Estimator']),
              costEstimatorRequest: ensureString(rowData['Cost Estimator Request']),
              ade: ensureString(rowData['ADE']),
              projectManager: ensureString(rowData['Project Manager']),
              projectEngineer: ensureString(rowData['Project Engineer']),
              designEstimator: ensureString(rowData['Design Estimator']),
              constructionContractor: ensureString(rowData['Construction Contractor']),
              bundleId: ensureString(rowData['Bundle ID']),
              postEstimate: ensureString(rowData['Post Estimate']),
              pmoId: ensureString(rowData['PMO ID']),
              order: ensureString(rowData['Order']),
              multipleOrder: ensureString(rowData['Multiple Order']),
              mat: ensureString(rowData['MAT']),
              projectName: ensureString(rowData['Project Name']),
              workStream: ensureString(rowData['Work Stream']),
              workType: ensureString(rowData['Work Type']),
              engrPlanYear: ensureNumber(rowData['Engr Plan Year']),
              constPlanYear: ensureNumber(rowData['Const Plan Year']),
              commitmentDate: convertDate(rowData['Commitment Date']),
              station: ensureString(rowData['Station']),
              line: ensureString(rowData['Line']),
              mp1: ensureString(rowData['MP1']),
              mp2: ensureString(rowData['MP2']),
              city: ensureString(rowData['City']),
              county: ensureString(rowData['County']),
              class5: convertDate(rowData['Class 5']),
              class4: convertDate(rowData['Class 4']),
              class3: convertDate(rowData['Class 3']),
              class2: convertDate(rowData['Class 2']),
              negotiatePrice: convertDate(rowData['Negotiate Price']),
              jeReadyToRoute: convertDate(rowData['JE Ready to Route']),
              jeApproved: convertDate(rowData['JE Approved']),
              estimateAnalysis: convertDate(rowData['Estimate Analysis']),
              thirtyPercentDesignReviewMeeting: convertDate(rowData['30% Design Review Meeting']),
              thirtyPercentDesignAvailable: convertDate(rowData['30% Design Available']),
              sixtyPercentDesignReviewMeeting: convertDate(rowData['60% Design Review Meeting']),
              sixtyPercentDesignAvailable: convertDate(rowData['60% Design Available']),
              ninetyPercentDesignReviewMeeting: convertDate(rowData['90% Design Review Meeting']),
              ninetyPercentDesignAvailable: convertDate(rowData['90% Design Available']),
              ifc: convertDate(rowData['IFC']),
              ntp: convertDate(rowData['NTP']),
              mob: convertDate(rowData['MOB']),
              tieIn: convertDate(rowData['Tie-In']),
              enro: convertDate(rowData['ENRO']),
              unitCapture: convertDate(rowData['Unit Capture'])
            };
            
            return project;
          });
          
          console.log(`Mapped ${mappedProjects.length} projects from Excel data`);
          setUploadProgress(50);
          
          try {
            // Upload to the server
            console.log(`Uploading ${mappedProjects.length} projects to server...`);
            
            // Break up the progress during server upload
            const uploadProgressInterval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev < 85) { // Cap at 85% until we get server response
                  return prev + 1;
                }
                return prev;
              });
            }, 500);
            
            const result = await SqlServerApi.createUpload(
              file.name,
              "User", // TODO: Replace with actual user name when available
              mappedProjects
            );
            
            clearInterval(uploadProgressInterval);
            setUploadProgress(90);
            
            console.log(`Upload successful: ${result.projectCount} projects uploaded`);
            
            // Reload the latest upload and Excel projects
            await loadLatestUpload();
            await loadExcelProjects(1);
            
            setUploadProgress(100);
          } catch (uploadError: any) {
            console.error("Error uploading to server:", uploadError);
            alert(`Error uploading to server: ${uploadError?.message || "Unknown error"}`);
          }
        } catch (error: any) {
          console.error("Error processing Excel file:", error);
          alert(`Error processing Excel file: ${error?.message || "Unknown error"}`);
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = (event) => {
        console.error("FileReader error:", event);
        alert("Error reading file");
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(`Error uploading file: ${error?.message || "Unknown error"}`);
      setIsUploading(false);
    }
  };

  // Handle selecting an upload from the history
  const handleSelectUpload = useCallback(async (uploadId: number) => {
    try {
      console.log(`Loading projects from upload ${uploadId}...`);
      const uploadProjects = await SqlServerApi.getUploadProjects(uploadId);
      console.log(`Loaded ${uploadProjects.length} projects from upload ${uploadId}`);
      
      // Filter out projects that are already saved
      const filteredProjects = uploadProjects.filter(p => !existingProjectIds.has(p.id));
      console.log(`Filtered to ${filteredProjects.length} projects (excluding saved projects)`);
      
      // Update the projects in the parent component
      if (onProjectsLoad) {
        onProjectsLoad(filteredProjects);
      }
    } catch (error) {
      console.error(`Error loading projects from upload ${uploadId}:`, error);
    }
  }, [existingProjectIds, onProjectsLoad]);

  const renderLoadMoreButton = () => {
    if (!hasMoreProjects) return null;
    
    return (
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          onClick={loadMoreProjects}
          disabled={isLoadingMore}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoadingMore ? '#ccc' : 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoadingMore ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoadingMore ? 'Loading...' : `Load More (${totalProjects - currentPage * pageSize} remaining)`}
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        margin: "0",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        background: "white",
        borderRadius: "0",
        padding: "20px",
        boxShadow: "none",
        position: "relative",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          width: "100%",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "white",
            background: "var(--primary-color)",
            margin: 0,
            borderRadius: "5px 5px 0 0",
          }}
        >
          SD-09 Viewer
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
            style={{ display: "none" }}
            id="excel-upload"
          />
        </div>
        
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          {latestUpload ? (
            <>
              <span>Last Updated:</span>
              <span style={{ fontWeight: "bold" }}>
                {formatDate(new Date(latestUpload.upload_date))}
              </span>
              <span style={{ fontSize: "12px" }}>
                ({latestUpload.file_name})
              </span>
            </>
          ) : (
            <span>No Excel data uploaded yet</span>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            width: "400px",
            textAlign: "center"
          }}
        >
          <div style={{ marginBottom: "15px", color: "var(--primary-color)", fontWeight: "bold" }}>
            {uploadProgress < 20 && "Reading Excel file..."}
            {uploadProgress >= 20 && uploadProgress < 40 && "Processing data..."}
            {uploadProgress >= 40 && uploadProgress < 50 && "Mapping fields..."}
            {uploadProgress >= 50 && uploadProgress < 85 && "Uploading to server..."}
            {uploadProgress >= 85 && uploadProgress < 100 && "Finalizing..."}
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "rgba(0,0,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                backgroundColor: "var(--primary-color)",
                borderRadius: "4px",
                transition: "width 0.3s ease-in-out",
              }}
            />
          </div>
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            {uploadProgress}% Complete
          </div>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onApplyFilter={handleApplyFilter}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          appliedFilters={appliedFilters}
          placeholder="Search schedule items..."
          columnNames={formattedLabels}
        />
      </div>

      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        {["pmoId", "order"].map(column => (
          <button
            key={column}
            onClick={() => togglePinnedColumn(column)}
            style={{
              padding: "4px 8px",
              backgroundColor: pinnedColumns[column]
                ? "var(--primary-color)"
                : "#f8f9fa",
              color: pinnedColumns[column] ? "white" : "black",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {pinnedColumns[column] ? "Unpin" : "Pin"} {column === "pmoId" ? "PMO ID" : "Order"}
            {pinnedColumns[column] ? (
              <Icons.MinusCircle size={14} />
            ) : (
              <Icons.PlusCircle size={14} />
            )}
          </button>
        ))}
      </div>

      <div className="content-area">
        {/* 
          TODO: Performance Optimization for Large Datasets (6500+ rows)
          Consider implementing virtual scrolling using a library like 'react-window' or 'react-virtualized'
          This would significantly improve rendering performance by only rendering visible rows
          Example implementation:
          1. npm install react-window
          2. Import: import { FixedSizeList as List } from 'react-window';
          3. Replace the table with a virtualized list component
        */}
        <div className="table-container" style={{ 
          overflow: 'auto', 
          maxHeight: 'calc(100vh - 350px)',
          marginBottom: '30px'
        }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th
                  style={{
                    ...getCellStyle(true, "select", true),
                    width: "80px",
                    minWidth: "80px",
                  }}
                >
                  <ToggleSwitch
                    checked={selectedProjects.size === filteredProjects.length}
                    onChange={handleSelectAll}
                    label="Select All"
                  />
                </th>
                {pinnedColumns.pmoId && (
                  <th
                    style={{
                      ...getCellStyle(true, "pmoId", true),
                      width: "80px",
                    }}
                  >
                    PMO ID
                  </th>
                )}
                {pinnedColumns.order && (
                  <th
                    style={{
                      ...getCellStyle(true, "order", true),
                      width: "80px",
                    }}
                  >
                    Order
                  </th>
                )}
                {settingsOrder.map(
                  (column) =>
                    visibleColumns[column] &&
                    !pinnedColumns[column] && (
                      <th
                        key={column}
                        style={getCellStyle(false, undefined, true)}
                      >
                        {formatColumnName(column)}
                      </th>
                    )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    style={{
                      cursor: "pointer",
                      backgroundColor: project.dateCategory
                        ? getRowStyle(project.dateCategory).backgroundColor
                        : index % 2 === 0
                        ? "#f8f9fa"
                        : "white",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f5f5f5")
                    }
                    onMouseLeave={(e) => {
                      const bgColor = project.dateCategory
                        ? getRowStyle(project.dateCategory).backgroundColor || "white"
                        : index % 2 === 0
                        ? "#f8f9fa"
                        : "white";
                      e.currentTarget.style.backgroundColor = bgColor;
                    }}
                    onClick={(e) => {
                      // Prevent row expansion when clicking on the select toggle
                      if ((e.target as HTMLElement).closest("td")?.cellIndex === 0) {
                        return;
                      }
                      setExpandedProject(project);
                    }}
                  >
                    <td style={getCellStyle(true, "select")}>
                      <ToggleSwitch
                        checked={selectedProjects.has(project.id)}
                        onChange={() => handleSelectProject(project.id)}
                      />
                    </td>
                    {pinnedColumns.pmoId && (
                      <td style={getCellStyle(true, "pmoId", false, index)}>
                        {project.pmoId}
                      </td>
                    )}
                    {pinnedColumns.order && (
                      <td style={getCellStyle(true, "order", false, index)}>
                        {project.order}
                      </td>
                    )}
                    {settingsOrder.map(
                      (column) =>
                        visibleColumns[column] &&
                        !pinnedColumns[column] && (
                          <td key={column} style={getCellStyle(false, undefined, false, index)}>
                            {formatCellValue(
                              column,
                              project[column as keyof Project]
                            )}
                          </td>
                        )
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      Object.values(visibleColumns).filter(Boolean).length + 1
                    }
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {projects.length === 0
                      ? "Please select an SD-09 Excel file to load projects"
                      : "No matching results found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--primary-color)",
          padding: "10px 20px",
          marginTop: "auto",
          borderRadius: "0 0 5px 5px",
        }}
      >
        <button
          onClick={async () => {
            if (selectedProjects.size > 0) {
              if (onSaveProjects) {
                const projectsToSave = projects.filter((p) =>
                  selectedProjects.has(p.id)
                );
                onSaveProjects(projectsToSave);
              }
              await handleAddToMyProjects();
              setSelectedProjects(new Set());
            }
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "white",
            color: "var(--primary-color)",
            border: "none",
            borderRadius: "0",
            cursor: selectedProjects.size === 0 ? "not-allowed" : "pointer",
            opacity: selectedProjects.size === 0 ? 0.6 : 1,
            fontWeight: "bold",
          }}
        >
          Save Selected ({selectedProjects.size})
        </button>

        <div style={{ display: "flex", gap: "40px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              color: "white",
            }}
          >
            <Icons.Upload size={24} />
            <span style={{ fontSize: "12px" }}>Upload</span>
          </button>

          <button
            onClick={() => setShowUploadHistory(!showUploadHistory)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              color: showUploadHistory ? "yellow" : "white",
            }}
          >
            <Icons.Clock size={24} />
            <span style={{ fontSize: "12px" }}>History</span>
          </button>

          <button
            onClick={onSettingsClick}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              color: "white",
            }}
          >
            <Icons.Settings size={24} />
            <span style={{ fontSize: "12px" }}>Settings</span>
          </button>

          <button
            onClick={onViewSavedProjects}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              color: "white",
            }}
          >
            <Icons.Save size={24} />
            <span style={{ fontSize: "12px" }}>Saved</span>
          </button>
        </div>

        <div
          style={{
            backgroundColor: "white",
            color: "var(--primary-color)",
            borderRadius: "4px",
            padding: "6px 12px",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Showing {filteredProjects.length} Items
        </div>
      </div>

      {showUploadHistory && (
        <div style={{ padding: "10px 20px" }}>
          <UploadHistory onSelectUpload={handleSelectUpload} />
        </div>
      )}

      <div style={{ 
        padding: '20px 0', 
        margin: '20px 0',
        textAlign: 'center',
        clear: 'both'
      }}>
        {renderLoadMoreButton()}
      </div>

      {expandedProject && (
        <ProjectDetails
          project={expandedProject}
          onClose={() => setExpandedProject(null)}
        />
      )}
    </div>
  );
};

export default Sd09;
