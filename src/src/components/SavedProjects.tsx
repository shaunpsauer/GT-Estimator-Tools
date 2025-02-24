import { useState, useEffect } from "react";
import { Project, VisibleColumns } from "../types/Project";
import { MinusCircle } from "react-feather";
import { ToggleSwitch } from "./ToggleSwitch";
import ProjectDetails from "./ProjectDetails";
import SearchBar from "./SearchBar";
import { db } from '../services/db';

interface SavedProjectsProps {
  projects: Project[];
  visibleColumns: VisibleColumns;
  onRemoveProjects?: (projects: Project[]) => void;
}

export const SavedProjects = ({
  projects,
  visibleColumns,
  onRemoveProjects,
}: SavedProjectsProps) => {
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [expandedProject, setExpandedProject] = useState<Project | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const handleRemoveProjects = async () => {
    const selectedProjectsList = projects.filter(p => selectedProjects.has(p.id));
    
    for (const project of selectedProjectsList) {
      try {
        await db.deleteProject(project.id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
    
    if (onRemoveProjects) {
      onRemoveProjects(selectedProjectsList);
    }
    setSelectedProjects(new Set());
  };

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

  const handleSearch = (terms: string, _isApplied: boolean, isCleared: boolean) => {
    setSearchValue(terms);
    if (isCleared) {
      setAppliedFilters([]);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchValue && appliedFilters.length === 0) return true;
    
    const searchTerms = [...appliedFilters, searchValue].filter(Boolean);
    return searchTerms.some(term => {
      const searchTerm = term.toLowerCase();
      return Object.entries(project).some(([key, value]) => {
        if (visibleColumns[key as keyof VisibleColumns]) {
          return String(value).toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
  });

  const formatColumnHeader = (key: string): string => {
    const capitalizeWords = (str: string) => {
      return str
        .split(/(?=[A-Z])|[\s_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    switch(key) {
      case 'costEstimator': return 'Cost Est.';
      case 'costEstimatorRequest': return 'Cost Est. Req.';
      case 'projectManager': return 'PM';
      case 'projectEngineer': return 'PE';
      case 'designEstimator': return 'Design Est.';
      case 'constructionContractor': return 'Const. Cont.';
      case 'bundleId': return 'Bundle ID';
      case 'postEstimate': return 'Post Est.';
      case 'pmoId': return 'PMO ID';
      case 'multipleOrder': return 'Multiple Order';
      case 'workStream': return 'Work Stream';
      case 'workType': return 'Work Type';
      case 'engrPlanYear': return 'Engr Plan Year';
      case 'constructionPlanYear': return 'Const. Plan Year';
      case 'commitmentDate': return 'Commit. Date';
      case 'ade': return 'ADE';
      case 'mat': return 'MAT';
      case 'mp1': return 'MP1';
      case 'mp2': return 'MP2';
      case 'ifc': return 'IFC';
      case 'mob': return 'MOB';
      case 'thirtyPercentDesignAvailable': return '30% Design';
      case 'sixtyPercentDesignReviewMeeting': return '60% Review';
      case 'sixtyPercentDesignAvailable': return '60% Design';
      case 'ninetyPercentDesignReviewMeeting': return '90% Review';
      case 'ninetyPercentDesignAvailable': return '90% Design';
      case 'jeReadyToRoute': return 'JE Ready';
      case 'jeApproved': return 'JE Approved';
      case 'estimateAnalysis': return 'Est. Analysis';
      case 'negotiatePrice': return 'Neg. Price';
      default: return capitalizeWords(key);
    }
  };

  const formatCellValue = (column: string, value: any): string => {
    if (value === null || value === undefined) return '';
    
    switch (column) {
      case 'thirtyPercentDesignAvailable':
      case 'sixtyPercentDesignAvailable':
      case 'ninetyPercentDesignAvailable':
      case 'ifc':
      case 'ntp':
      case 'mob':
      case 'tieIn':
      case 'enro':
        return value ? 'Yes' : 'No';
      case 'commitmentDate':
      case 'jeReadyToRoute':
      case 'jeApproved':
        return value ? new Date(value).toLocaleDateString() : '';
      default:
        return String(value);
    }
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
      marginTop: "25px",
      marginBottom: "25px",
      maxWidth: "calc(100% - 50px)",
      width: "100%",
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
        backgroundColor: "var(--primary-color)",
        color: "white",
        padding: "10px 20px",
        marginBottom: "20px",
        borderRadius: "4px",
        fontWeight: "bold",
        textAlign: "center"
      }}>
        Saved Projects
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button className="button" style={{ padding: "8px 16px" }}>
          Pin PMO ID
        </button>
        <button className="button" style={{ padding: "8px 16px" }}>
          Pin Order
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <SearchBar onSearch={handleSearch} />
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
                  checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                  onChange={() => {
                    setSelectedProjects(
                      selectedProjects.size === filteredProjects.length 
                        ? new Set() 
                        : new Set(filteredProjects.map(p => p.id))
                    );
                  }}
                />
              </th>
              {settingsOrder.map((column) => 
                visibleColumns[column] && (
                  <th key={column} style={getCellStyle(false, undefined, true)}>
                    {formatColumnHeader(column)}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr
                key={project.id}
                style={{
                  cursor: "pointer",
                  backgroundColor: project.id % 2 === 0 ? "#f8f9fa" : "transparent",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = project.id % 2 === 0 ? "#f8f9fa" : "transparent")}
                onClick={() => setExpandedProject(project)}
              >
                <td style={{
                  ...getCellStyle(true, 'select', false, index),
                }}>
                  <ToggleSwitch
                    checked={selectedProjects.has(project.id)}
                    onChange={() => {
                      const newSelected = new Set(selectedProjects);
                      if (selectedProjects.has(project.id)) {
                        newSelected.delete(project.id);
                      } else {
                        newSelected.add(project.id);
                      }
                      setSelectedProjects(newSelected);
                    }}
                  />
                </td>
                {settingsOrder.map((column) => 
                  visibleColumns[column] && (
                    <td key={column} style={getCellStyle(false, undefined, false, index)}>
                      {formatCellValue(column, project[column])}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ 
        marginTop: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <button
          onClick={handleRemoveProjects}
          style={{
            backgroundColor: selectedProjects.size > 0 ? "var(--primary-color)" : "#e0e0e0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: selectedProjects.size > 0 ? "pointer" : "not-allowed",
            opacity: selectedProjects.size > 0 ? 1 : 0.7,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            position: "relative",
            zIndex: 1
          }}
          disabled={selectedProjects.size === 0}
        >
          <MinusCircle size={16} />
          Remove Selected ({selectedProjects.size})
        </button>

        <div style={{
          backgroundColor: "var(--bg-secondary)",
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

export default SavedProjects; 