
import { Project, VisibleColumns } from "../types/Project";
import { MinusCircle, PlusCircle } from "react-feather";
import { ToggleSwitch } from "./ToggleSwitch";
import SqlServerApi from "../../server/SqlServerApi";
import ProjectDetails from "./ProjectDetails";
import SearchBar from "./SearchBar";
import DateFilterButtons from "./FilterButtons";
import { useState, useEffect, useMemo, useCallback } from "react";

interface SavedProjectsProps {
  projects: Project[];
  visibleColumns: VisibleColumns;
  onSelectedProjectsChange?: (projects: Project[]) => void;
  onRemoveProjects?: (projects: Project[]) => void;
}

// Extract constant values outside component
const SETTINGS_ORDER: (keyof VisibleColumns)[] = [
  "costEstimator",
  "costEstimatorRequest",
  "ade",
  "projectManager",
  "projectEngineer",
  "designEstimator",
  "constructionContractor",
  "bundleId",
  "postEstimate",
  "pmoId",
  "order",
  "multipleOrder",
  "mat",
  "projectName",
  "workStream",
  "workType",
  "engrPlanYear",
  "constPlanYear",
  "commitmentDate",
  "station",
  "line",
  "mp1",
  "mp2",
  "city",
  "county",
  "class5",
  "class4",
  "class3",
  "class2",
  "negotiatePrice",
  "jeReadyToRoute",
  "jeApproved",
  "estimateAnalysis",
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

const DATE_COLUMNS = [
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

// Pre-define column formatting map
const COLUMN_LABELS: Record<string, string> = {
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
  workStream: "Stream",
  workType: "Type",
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

// Row styling for different categories
const ROW_STYLES: Record<string, React.CSSProperties> = {
  thisWeek: { backgroundColor: '#ffcdd2' }, // Red
  nextWeek: { backgroundColor: '#fff9c4' }, // Yellow
  thisMonth: { backgroundColor: '#c8e6c9' }, // Light green
  next3Months: { backgroundColor: '#81c784' }, // Dark green
  default: {},
};

// Create a formatter function outside the component to avoid recreating it
const formatColumnName = (column: string): string => {
  return COLUMN_LABELS[column] || 
    column.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

export const SavedProjects = ({
  projects,
  visibleColumns,
  onSelectedProjectsChange,
  onRemoveProjects,
}: SavedProjectsProps) => {
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [pinnedColumns, setPinnedColumns] = useState<{ [key: string]: boolean }>({
    pmoId: false,
    order: false,
  });
  const [dateFilteredProjects, setDateFilteredProjects] = useState<Project[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  // Load projects from IndexedDB only once on component mount
  useEffect(() => {
    SqlServerApi.getProjects()
      .catch(error => console.error("Error loading existing projects:", error));
  }, []);

  // Memoize the parsing of search terms for better performance
  const parseSearchTerm = useCallback((searchTerm: string) => {
    const match = searchTerm.match(/^([^:]+):(.+)$/);
    if (match) {
      const [_, column, value] = match;
      return { column: column.trim(), value: value.trim() };
    }
    return null;
  }, []);

  // Memoized filtered projects - this is the most expensive calculation
  const filteredProjects = useMemo(() => {
    // Start with either date-filtered projects or all projects
    const baseProjects = dateFilteredProjects.length > 0 ? dateFilteredProjects : projects;
    
    if (appliedFilters.length === 0) return baseProjects;
    
    return baseProjects.filter((project) => {
      return appliedFilters.every((filter) => {
        const parsedFilter = parseSearchTerm(filter);
        
        if (parsedFilter) {
          // Handle column-specific search
          const { column, value } = parsedFilter;
          
          // Find the matching column key from the visible columns
          const columnKey = Object.keys(visibleColumns).find(key => {
            const formattedName = formatColumnName(key);
            // Case-insensitive comparison
            return formattedName.toLowerCase() === column.toLowerCase();
          });

          if (columnKey && visibleColumns[columnKey as keyof VisibleColumns]) {
            const projectValue = project[columnKey as keyof Project];
            return projectValue !== undefined && 
                   String(projectValue).toLowerCase().includes(value.toLowerCase());
          }
          
          return false;
        }

        // Normal search across all columns
        return Object.entries(project)
          .filter(([key]) => visibleColumns[key as keyof VisibleColumns])
          .some(([_, value]) =>
            String(value).toLowerCase().includes(filter.toLowerCase())
          );
      });
    });
  }, [projects, appliedFilters, dateFilteredProjects, visibleColumns, parseSearchTerm]);

  // Memoized cell style function to avoid recreating this function for every cell
  const getCellStyle = useCallback((
    isPinned: boolean = false,
    column?: string,
    isHeader: boolean = false,
    rowIndex?: number
  ) => ({
    padding: "4px 8px",
    borderBottom: "1px solid var(--border-light)",
    position: "sticky" as const,
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
      ? "#e9ecef"
      : isPinned
      ? rowIndex !== undefined && rowIndex % 2 === 0
        ? "#f8f9fa"
        : "white"
      : "inherit",
    height: isHeader ? "24px" : "32px",
    ...(isPinned
      ? {
          borderRight: "1px solid var(--border-color)",
          boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
        }
      : {}),
    whiteSpace: "nowrap" as const,
  }), []);

  // Optimize event handlers with useCallback
  const handleRemoveProjects = useCallback(async () => {
    const selectedProjectsList = projects.filter((p) => selectedProjects.has(p.id));

    // Use Promise.all for better performance with multiple async operations
    await Promise.all(
      selectedProjectsList.map(project => 
        SqlServerApi.deleteProject(project.id)
          .catch(error => console.error(`Error deleting project ${project.id}:`, error))
      )
    );

    if (onRemoveProjects) {
      onRemoveProjects(selectedProjectsList);
    }
    
    setSelectedProjects(new Set());
  }, [projects, selectedProjects, onRemoveProjects]);

  const handleSelectAll = useCallback(() => {
    setSelectedProjects(prev => 
      prev.size === filteredProjects.length
        ? new Set()
        : new Set(filteredProjects.map(p => p.id))
    );
  }, [filteredProjects]);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProjects(prev => {
      const newSelected = new Set(prev);
      if (prev.has(project.id)) {
        newSelected.delete(project.id);
      } else {
        newSelected.add(project.id);
      }
      
      // Notify parent component if callback exists
      if (onSelectedProjectsChange) {
        const selectedProjs = filteredProjects.filter(p => newSelected.has(p.id));
        onSelectedProjectsChange(selectedProjs);
      }
      
      return newSelected;
    });
  }, [filteredProjects, onSelectedProjectsChange]);

  const togglePinnedColumn = useCallback((column: string) => {
    setPinnedColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  }, []);

  const handleDateFilter = useCallback((filtered: Project[]) => {
    setDateFilteredProjects(filtered);
  }, []);

  const handleApplyFilter = useCallback((filter: string) => {
    setAppliedFilters(prev => [...prev, filter]);
  }, []);

  const handleRemoveFilter = useCallback((indexToRemove: number) => {
    setAppliedFilters(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setAppliedFilters([]);
    setSearchValue("");
  }, []);

  // Component for rendering cell content (memoize heavy DOM operations)
  const CellContent = useCallback(({ column, value, project }: { 
    column: string; 
    value: any; 
    project: Project;
  }) => {
    const hasChanged = project._changes && column in project._changes;
    const isDateColumn = DATE_COLUMNS.includes(column);
    
    const cellContent = 
      isDateColumn && value
        ? typeof value === "string" && value.includes("/")
          ? value
          : value
        : value !== undefined
        ? String(value)
        : "N/A";

    if (hasChanged) {
      return (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 0, 0.2)",
            padding: "2px 4px",
            borderRadius: "2px",
            position: "relative",
            cursor: "help",
          }}
          title={`Changed from: ${project._changes![column as keyof Project]}`}
        >
          {cellContent}
        </div>
      );
    }

    return <>{cellContent}</>;
  }, []);

  // Memoize column header rendering to avoid recreating elements on every render
  const tableHeaders = useMemo(() => {
    return (
      <tr style={{ background: "var(--bg-secondary)" }}>
        <th
          style={{
            ...getCellStyle(true, "select", true),
            width: "80px",
            minWidth: "80px",
          }}
        >
          <ToggleSwitch
            checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
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
        {SETTINGS_ORDER.map(
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
    );
  }, [getCellStyle, pinnedColumns, visibleColumns, selectedProjects.size, filteredProjects.length, handleSelectAll]);

  // Main component render
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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
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
          Saved Projects
        </h2>
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
              <MinusCircle size={14} />
            ) : (
              <PlusCircle size={14} />
            )}
          </button>
        ))}
      </div>

      <div
        className="responsive-container"
        style={{ marginBottom: "20px", gap: "var(--spacing-md)" }}
      >
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onApplyFilter={handleApplyFilter}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          appliedFilters={appliedFilters}
          placeholder="Search projects..."
          columnNames={COLUMN_LABELS}
        />
        <DateFilterButtons
          projects={projects}
          onSortedProjectsChange={handleDateFilter}
        />
      </div>

      <div className="table-container">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            position: "relative",
          }}
        >
          <thead>
            {tableHeaders}
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => {
                const rowCategory = project.dateCategory as string;
                const rowStyle = rowCategory ? ROW_STYLES[rowCategory] || ROW_STYLES.default : {};
                
                return (
                  <tr
                    key={project.id}
                    style={{
                      cursor: "pointer",
                      ...rowStyle
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                    onMouseLeave={(e) => {
                      const bgColor = rowCategory
                        ? ROW_STYLES[rowCategory]?.backgroundColor
                        : index % 2 === 0 ? "#f8f9fa" : "white";
                      e.currentTarget.style.backgroundColor = bgColor || "#ffffff";
                    }}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest("td")?.cellIndex === 0
                      )
                        return;
                      setExpandedProject(project);
                    }}
                  >
                    <td
                      style={{
                        ...getCellStyle(true, "select"),
                      }}
                    >
                      <ToggleSwitch
                        checked={selectedProjects.has(project.id)}
                        onChange={() => handleSelectProject(project)}
                      />
                    </td>
                    {pinnedColumns.pmoId && (
                      <td
                        style={{
                          ...getCellStyle(true, "pmoId", false, index),
                        }}
                      >
                        {project.pmoId}
                      </td>
                    )}
                    {pinnedColumns.order && (
                      <td
                        style={{
                          ...getCellStyle(true, "order", false, index),
                        }}
                      >
                        {project.order}
                      </td>
                    )}
                    {SETTINGS_ORDER.map(
                      (column) =>
                        visibleColumns[column] &&
                        !pinnedColumns[column] && (
                          <td key={column} style={getCellStyle()}>
                            <CellContent 
                              column={column}
                              value={project[column as keyof Project]}
                              project={project}
                            />
                          </td>
                        )
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={Object.keys(visibleColumns).length + 1}
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  {projects.length === 0
                    ? "Please select an Excel file to load projects"
                    : "No matching results found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
          onClick={handleRemoveProjects}
          style={{
            padding: "8px 16px",
            backgroundColor: "white",
            color: "var(--primary-color)",
            border: "none",
            borderRadius: "0",
            cursor: selectedProjects.size > 0 ? "pointer" : "not-allowed",
            opacity: selectedProjects.size > 0 ? 1 : 0.6,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          disabled={selectedProjects.size === 0}
        >
          <MinusCircle size={16} />
          Remove Selected ({selectedProjects.size})
        </button>

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

      {expandedProject && (
        <ProjectDetails
          project={expandedProject}
          onClose={() => setExpandedProject(null)}
        />
      )}
    </div>
  );
};

export default SavedProjects;