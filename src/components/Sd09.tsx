import { useState, useEffect } from "react";
import { Project, VisibleColumns } from "../types/Project";
import { PlusCircle, MinusCircle } from "react-feather";
import { ToggleSwitch } from "./ToggleSwitch";
import { db } from "../services/db";
import ProjectDetails from "./ProjectDetails";
import SearchBar from "./SearchBar";

interface Sd09Props {
  projects: Project[];
  visibleColumns: VisibleColumns;
  onSelectedProjectsChange?: (projects: Project[]) => void;
  onSaveProjects?: (projects: Project[]) => void;
}

export const Sd09 = ({
  projects,
  visibleColumns,
  onSelectedProjectsChange,
  onSaveProjects,
}: Sd09Props) => {
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [pinnedColumns, setPinnedColumns] = useState<{[key: string]: boolean}>({
    pmoId: false,
    order: false,
  });
  const [existingProjectIds, setExistingProjectIds] = useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const settingsOrder: (keyof VisibleColumns)[] = [
    'costEstimator',
    'costEstimatorRequest',
    'ade',
    'projectManager',
    'projectEngineer',
    'designEstimator',
    'constructionContractor',
    'bundleId',
    'postEstimate',
    'pmoId',
    'order',
    'multipleOrder',
    'mat',
    'projectName',
    'workStream',
    'workType',
    'engrPlanYear',
    'constructionPlanYear',
    'commitmentDate',
    'station',
    'line',
    'mp1',
    'mp2',
    'city',
    'county',
    'class5',
    'class4',
    'class3',
    'class2',
    'negotiatePrice',
    'jeReadyToRoute',
    'jeApproved',
    'estimateAnalysis',
    'thirtyPercentDesignAvailable',
    'sixtyPercentDesignReviewMeeting',
    'sixtyPercentDesignAvailable',
    'ninetyPercentDesignReviewMeeting',
    'ninetyPercentDesignAvailable',
    'ifc',
    'ntp',
    'mob',
    'tieIn',
    'enro',
    'unitCapture'
  ];

  useEffect(() => {
    loadExistingProjects();
  }, []);

  const loadExistingProjects = async () => {
    try {
      const existingProjects = await db.getProjects();
      setExistingProjectIds(new Set(existingProjects.map(p => p.id)));
    } catch (error) {
      console.error('Error loading existing projects:', error);
    }
  };

  const formatCellValue = (column: string, value: any) => {
    const dateColumns = [
      'class5', 'class4', 'class3', 'class2', 
      'negotiatePrice', 'jeReadyToRoute', 'jeApproved',
      'thirtyPercentDesignAvailable',
      'sixtyPercentDesignReviewMeeting',
      'sixtyPercentDesignAvailable',
      'ninetyPercentDesignReviewMeeting',
      'ninetyPercentDesignAvailable',
      'ifc', 'ntp', 'mob', 'tieIn', 'enro', 'unitCapture'
    ];

    if (dateColumns.includes(column) && value) {
      if (typeof value === 'string' && value.includes('/')) return value;
      return value;
    }
    return value !== undefined ? String(value) : 'N/A';
  };

  const formatColumnName = (column: string): string => {
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
      workStream: "Stream",
      workType: "Type",
      station: "Station",
      line: "LINE",
      city: "City",
      county: "County",
      
      // Years & Dates
      engrPlanYear: "Eng. Year",
      constructionPlanYear: "Const. Year",
      commitmentDate: "Commit Date",
      
      // Milestones
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
      unitCapture: "Unit Cap."
    };
    
    return formattedLabels[column] || column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const filteredProjects = projects
    .filter((project) => {
      // First apply any active search term
      if (searchValue) {
        const searchMatch = Object.entries(project)
          .filter(([key]) => visibleColumns[key as keyof VisibleColumns])
          .some(([_, value]) => 
            String(value).toLowerCase().includes(searchValue.toLowerCase())
          );
        if (!searchMatch) return false;
      }

      // Then apply any fixed filters
      return appliedFilters.every(filter => {
        return Object.entries(project)
          .filter(([key]) => visibleColumns[key as keyof VisibleColumns])
          .some(([_, value]) => 
            String(value).toLowerCase().includes(filter.toLowerCase())
          );
      });
    });

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      const allIds = filteredProjects.map((p) => p.id);
      setSelectedProjects(new Set(allIds));
    }
  };

  const handleSelectProject = (project: Project) => {
    const newSelected = new Set(selectedProjects);
    if (selectedProjects.has(project.id)) {
      newSelected.delete(project.id);
    } else {
      newSelected.add(project.id);
    }
    setSelectedProjects(newSelected);
    onSelectedProjectsChange?.(
      filteredProjects.filter(p => newSelected.has(p.id))
    );
  };

  const handleAddToMyProjects = async () => {
    const selectedProjectsList = filteredProjects
      .filter((p: Project) => selectedProjects.has(p.id))
      .filter((p: Project) => !existingProjectIds.has(p.id));
    
    for (const project of selectedProjectsList) {
      try {
        await db.addProject(project);
      } catch (error) {
        console.error('Error adding project:', error);
      }
    }
    
    setSelectedProjects(new Set());
    loadExistingProjects();
  };

  const togglePinnedColumn = (column: string) => {
    setPinnedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const getCellStyle = (isPinned: boolean = false, column?: string, isHeader: boolean = false, rowIndex?: number) => ({
    padding: "4px 8px",
    borderBottom: "1px solid var(--border-light)",
    position: "sticky" as const,
    left: isPinned ? (
      column === 'select' ? '0px' :
      column === 'pmoId' ? '80px' :
      column === 'order' ? '160px' :
      undefined
    ) : undefined,
    top: isHeader ? 0 : undefined,
    zIndex: isHeader ? (isPinned ? 3 : 2) : (isPinned ? 1 : 0),
    backgroundColor: isPinned 
      ? (isHeader ? "#e9ecef" : (rowIndex !== undefined && rowIndex % 2 === 0 ? "#f8f9fa" : "white"))
      : (isHeader ? "#e9ecef" : "inherit"),
    height: isHeader ? "24px" : "32px",
    ...(isPinned ? {
      borderRight: "1px solid var(--border-color)",
      boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)'
    } : {}),
    whiteSpace: "nowrap" as const,
  });

  return (
    <div style={{
      margin: "25px auto",
      width: "calc(100% - 50px)",
      maxWidth: "100%",
      background: "white",
      borderRadius: "8px",
      padding: "20px",
      boxShadow: "0 5px 35px var(--shadow-color)",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        width: "100%",
        textAlign: "center",
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontSize: "22px",
          fontWeight: "bold",
          color: "white",
          background: "var(--primary-color)",
          margin: 0,
        }}>
          Schedule Items
        </h2>
      </div>

      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => togglePinnedColumn('pmoId')}
          style={{
            padding: "4px 8px",
            backgroundColor: pinnedColumns.pmoId ? "var(--primary-color)" : "#f8f9fa",
            color: pinnedColumns.pmoId ? "white" : "black",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {pinnedColumns.pmoId ? "Unpin" : "Pin"} PMO ID
          {pinnedColumns.pmoId ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
        </button>

        <button
          onClick={() => togglePinnedColumn('order')}
          style={{
            padding: "4px 8px",
            backgroundColor: pinnedColumns.order ? "var(--primary-color)" : "#f8f9fa",
            color: pinnedColumns.order ? "white" : "black",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          {pinnedColumns.order ? "Unpin" : "Pin"} Order
          {pinnedColumns.order ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <SearchBar 
          onSearch={(terms, isApplied, isCleared) => {
            if (isCleared) {
              setSearchValue('');
              setAppliedFilters([]);
              return;
            }
            
            if (isApplied) {
              // Add current search to applied filters
              if (terms.trim()) {
                setAppliedFilters(prev => [...prev, terms.trim()]);
                setSearchValue('');
              }
            } else {
              // Update current search term
              setSearchValue(terms);
            }
          }} 
        />
      </div>

      <div className="table-container" style={{
        flex: 1,
        width: "100%",
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "calc(80vh - 250px)",
        position: "relative",
        zIndex: 0,
        marginTop: "20px",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--border-radius-sm)",
        minWidth: 0,
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          position: "relative",
        }}>
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              <th style={{
                ...getCellStyle(true, 'select', true),
                width: "80px",
                minWidth: "80px",
              }}>
                <ToggleSwitch
                  checked={selectedProjects.size === filteredProjects.length}
                  onChange={handleSelectAll}
                  label="Select All"
                />
              </th>
              {pinnedColumns.pmoId && (
                <th style={{
                  ...getCellStyle(true, 'pmoId', true),
                  width: "80px",
                }}>PMO ID</th>
              )}
              {pinnedColumns.order && (
                <th style={{
                  ...getCellStyle(true, 'order', true),
                  width: "80px",
                }}>Order</th>
              )}
              {settingsOrder.map((column) => 
                visibleColumns[column] && !pinnedColumns[column] && (
                  <th key={column} style={getCellStyle(false, undefined, true)}>
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
                    backgroundColor: project.id % 2 === 0 ? "#f8f9fa" : "transparent",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = project.id % 2 === 0 ? "#f8f9fa" : "transparent")}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("td")?.cellIndex === 0) return;
                    setExpandedProject(project);
                  }}
                >
                  <td style={{
                    ...getCellStyle(true, 'select'),
                  }}>
                    <ToggleSwitch
                      checked={selectedProjects.has(project.id)}
                      onChange={() => handleSelectProject(project)}
                    />
                  </td>
                  {pinnedColumns.pmoId && (
                    <td style={{
                      ...getCellStyle(true, 'pmoId', false, index),
                    }}>{project.pmoId}</td>
                  )}
                  {pinnedColumns.order && (
                    <td style={{
                      ...getCellStyle(true, 'order'),
                    }}>{project.order}</td>
                  )}
                  {settingsOrder.map((column) => 
                    visibleColumns[column] && !pinnedColumns[column] && (
                      <td key={column} style={getCellStyle()}>
                        {formatCellValue(column, project[column as keyof Project])}
                      </td>
                    )
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Object.keys(visibleColumns).length} style={{ 
                  textAlign: "center", 
                  padding: "20px" 
                }}>
                  {projects.length === 0 ? 
                    "Please select an Excel file to load projects" : 
                    "No matching results found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        padding: "0 20px"
      }}>
        <button
          onClick={() => {
            if (selectedProjects.size > 0 && onSaveProjects) {
              const projectsToSave = projects.filter(p => selectedProjects.has(p.id));
              onSaveProjects(projectsToSave);
              // Save to database
              handleAddToMyProjects();
              setSelectedProjects(new Set());
            }
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--primary-color)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedProjects.size === 0 ? "not-allowed" : "pointer",
            opacity: selectedProjects.size === 0 ? 0.6 : 1
          }}
        >
          Save Selected ({selectedProjects.size})
        </button>

        <div style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "black",
          borderRadius: "4px",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
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