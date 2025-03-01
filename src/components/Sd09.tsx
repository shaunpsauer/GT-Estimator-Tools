import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { Project, VisibleColumns } from "../types/Project";
import { PlusCircle, MinusCircle, Upload, Settings, Save } from "react-feather";
import { ToggleSwitch } from "./ToggleSwitch";
import { db } from "../services/db";
import ProjectDetails from "./ProjectDetails";
import SearchBar from "./SearchBar";
import { parseExcelFile } from "../services/excelService";

interface Sd09Props {
  projects: Project[];
  visibleColumns: VisibleColumns;
  onSelectedProjectsChange?: (projects: Project[]) => void;
  onSaveProjects?: (projects: Project[]) => void;
  onSettingsClick?: () => void;
  onViewSavedProjects?: () => void;
  onProjectsLoad?: (projects: Project[]) => void;
  onViewSD09?: () => void;
}

export const Sd09 = ({
  projects,
  visibleColumns,
  onSelectedProjectsChange,
  onSaveProjects,
  onSettingsClick,
  onViewSavedProjects,
  onProjectsLoad,
  onViewSD09,
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

  // Order for displaying columns
  const settingsOrder: (keyof VisibleColumns)[] = [
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

  // Ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load existing projects on mount
  useEffect(() => {
    loadExistingProjects();
  }, []);

  const loadExistingProjects = async () => {
    try {
      const existingProjects = await db.getProjects();
      setExistingProjectIds(new Set(existingProjects.map((p) => p.id)));
    } catch (error) {
      console.error("Error loading existing projects:", error);
      // Set to empty set to avoid undefined errors
      setExistingProjectIds(new Set());
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
    (project: Project) => {
      setSelectedProjects((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(project.id)) {
          newSelected.delete(project.id);
        } else {
          newSelected.add(project.id);
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
    try {
      // If your db service supports bulk insert, use it here.
      if (db.addProject) {
        for (const project of selectedProjectsList) {
          await db.addProject(project);
        }
      } else {
        for (const project of selectedProjectsList) {
          await db.addProject(project);
        }
      }
      // Reload projects from the database
      await loadExistingProjects();
    } catch (error) {
      console.error("Error adding project(s):", error);
    }
  }, [filteredProjects, selectedProjects, existingProjectIds]);

  const togglePinnedColumn = (column: string) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Improved getCellStyle for readability
  const getCellStyle = (
    isPinned: boolean = false,
    column?: string,
    isHeader: boolean = false,
    rowIndex?: number
  ) => {
    const baseStyle = {
      padding: "4px 8px",
      borderBottom: "1px solid var(--border-light)",
      whiteSpace: "nowrap" as const,
    };

    if (isPinned) {
      let left: string | undefined;
      if (column === "select") left = "0px";
      else if (column === "pmoId") left = "80px";
      else if (column === "order") left = "160px";

      return {
        ...baseStyle,
        position: "sticky" as const,
        left,
        top: isHeader ? 0 : undefined,
        zIndex: isHeader ? 3 : 1,
        backgroundColor: isHeader
          ? "#e9ecef"
          : rowIndex !== undefined && rowIndex % 2 === 0
          ? "#f8f9fa"
          : "white",
        borderRight: "1px solid var(--border-color)",
        boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)",
        height: isHeader ? "24px" : "32px",
      };
    } else if (isHeader) {
      return { ...baseStyle, backgroundColor: "#e9ecef", height: "24px" };
    }
    return { ...baseStyle, height: "32px" };
  };

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
  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const projects = await parseExcelFile(file);
        onProjectsLoad?.(projects);
        onViewSD09?.();
      } catch (error) {
        console.error("Error parsing Excel file:", error);
      }
    },
    [onProjectsLoad, onViewSD09]
  );

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
          Schedule Items
        </h2>
        <p>
          Upload the SD-09 schedule using the upload button. You can use the
          settings button to select only the columns you need. The full item
          details can be accessed by clicking on the row. Use the Search box for
          finding specific items. Click "Save Selected" at the bottom to save
          items to the Save Projects area.
        </p>
      </div>

      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => togglePinnedColumn("pmoId")}
          style={{
            padding: "4px 8px",
            backgroundColor: pinnedColumns.pmoId
              ? "var(--primary-color)"
              : "#f8f9fa",
            color: pinnedColumns.pmoId ? "white" : "black",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {pinnedColumns.pmoId ? "Unpin" : "Pin"} PMO ID
          {pinnedColumns.pmoId ? (
            <MinusCircle size={14} />
          ) : (
            <PlusCircle size={14} />
          )}
        </button>

        <button
          onClick={() => togglePinnedColumn("order")}
          style={{
            padding: "4px 8px",
            backgroundColor: pinnedColumns.order
              ? "var(--primary-color)"
              : "#f8f9fa",
            color: pinnedColumns.order ? "white" : "black",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {pinnedColumns.order ? "Unpin" : "Pin"} Order
          {pinnedColumns.order ? (
            <MinusCircle size={14} />
          ) : (
            <PlusCircle size={14} />
          )}
        </button>
      </div>

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

      <div className="table-container">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            position: "relative",
            paddingRight: "20px",
            marginRight: "-20px",
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
                      onChange={() => handleSelectProject(project)}
                    />
                  </td>
                  {pinnedColumns.pmoId && (
                    <td style={getCellStyle(true, "pmoId", false, index)}>
                      {project.pmoId}
                    </td>
                  )}
                  {pinnedColumns.order && (
                    <td style={getCellStyle(true, "order")}>
                      {project.order}
                    </td>
                  )}
                  {settingsOrder.map(
                    (column) =>
                      visibleColumns[column] &&
                      !pinnedColumns[column] && (
                        <td key={column} style={getCellStyle()}>
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
                  colSpan={Object.keys(visibleColumns).length}
                  style={{
                    textAlign: "center",
                    padding: "20px",
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
            <Upload size={24} />
            <span style={{ fontSize: "12px" }}>Upload</span>
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
            <Settings size={24} />
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
            <Save size={24} />
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
