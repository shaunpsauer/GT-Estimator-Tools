import { Dialog, DialogContent, Typography, Button, Box, Divider, TextField, Tab, Tabs } from "@mui/material";
import { X, Clock, AlertTriangle } from "react-feather";
import { Project, ProjectChanges } from "../types/Project";
import { useState, useEffect, useCallback } from "react";
import SqlServerApi, { ExcelProjectChange } from "../services/SqlServerApi";
import React from 'react';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
}

interface Field {
  key: keyof Omit<Project, '_changes' | 'dateCategory' | 'order_number'>;
  label: string;
}

interface Section {
  title: string;
  fields: Field[];
}

// Type guard to check if a value is a ProjectChanges object
const isProjectChanges = (value: unknown): value is ProjectChanges => {
  return typeof value === 'object' && value !== null && '_changes' in value;
};

// Helper function to safely convert any value to a string
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  
  // Handle ProjectChanges type
  if (isProjectChanges(value)) {
    return ''; // Skip _changes field
  }
  
  // Convert the value to string
  const stringValue = String(value);
  
  // Check if it's a date field (matches DD-MM-YY pattern)
  const datePattern = /^(\d{2})-(\d{2})-(\d{2})$/;
  const match = stringValue.match(datePattern);
  
  if (match) {
    const [_, day, month, year] = match;
    return `${month}/${day}/${year}`;
  }
  
  return stringValue;
};

// Helper function to create title text
const createTitleText = (pmoId: string, order: string, prefix: string): string => {
  return `${prefix}${String(pmoId)} - ${String(order)}`;
};

// Helper function to format field names for display
const formatFieldName = (fieldName: string): string => {
  // Handle special cases first
  if (fieldName === 'pmoId') return 'PMO ID';
  if (fieldName === 'mp1') return 'MP1';
  if (fieldName === 'mp2') return 'MP2';
  if (fieldName === 'ifc') return 'IFC';
  if (fieldName === 'ntp') return 'NTP';
  if (fieldName === 'mob') return 'MOB';
  if (fieldName === 'ade') return 'ADE';
  if (fieldName === 'jeApproved') return 'JE Approved';
  if (fieldName === 'jeReadyToRoute') return 'JE Ready to Route';
  if (fieldName === 'enro') return 'ENRO';
  
  // For other cases, split by camelCase and capitalize each word
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/([0-9]+)/g, ' $1') // Add space before numbers
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Helper function to format dates from DD-MM-YY to MM/DD/YY
const formatDate = (value: string): string => {
  // Check if the value matches the DD-MM-YY pattern
  const datePattern = /^(\d{2})-(\d{2})-(\d{2})$/;
  const match = value.match(datePattern);
  
  if (match) {
    const [_, day, month, year] = match;
    return `${month}/${day}/${year}`;
  }
  
  return value;
};

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onClose }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [projectChanges, setProjectChanges] = useState<ExcelProjectChange[]>([]);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);

  // Load project changes from the API
  const loadProjectChanges = useCallback(async () => {
    setIsLoadingChanges(true);
    try {
      // Get the latest upload
      const latestUpload = await SqlServerApi.getLatestUpload();
      if (!latestUpload) {
        console.log("No uploads found");
        setProjectChanges([]);
        return;
      }

      // Get all uploads to find the previous one
      const uploads = await SqlServerApi.getUploads();
      if (uploads.length < 2) {
        console.log("Not enough uploads to compare changes");
        setProjectChanges([]);
        return;
      }

      // Get the second most recent upload
      const previousUpload = uploads[1];

      // Get changes between the latest and previous upload for this project
      const changes = await SqlServerApi.getUploadChanges(latestUpload.id, previousUpload.id);
      
      // Filter changes for this specific project
      const projectSpecificChanges = changes.filter(change => 
        change.project_id === project.id
      );
      
      setProjectChanges(projectSpecificChanges);
      console.log(`Loaded ${projectSpecificChanges.length} changes for project ${project.id}`);
    } catch (error) {
      console.error("Error loading project changes:", error);
      setProjectChanges([]);
    } finally {
      setIsLoadingChanges(false);
    }
  }, [project.id]);

  // Load notes from localStorage when component mounts
  useEffect(() => {
    const savedNotes = localStorage.getItem(`project-notes-${project.pmoId}-${project.order}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [project.pmoId, project.order]);

  // Load project changes when the component mounts or when the project changes
  useEffect(() => {
    loadProjectChanges();
  }, [loadProjectChanges]);

  // Save notes to localStorage whenever they change
  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    localStorage.setItem(`project-notes-${project.pmoId}-${project.order}`, newNotes);
  };

  // Handle closing the notes dialog
  const handleCloseNotes = () => {
    setShowNotes(false);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'var(--success-color, #4caf50)';
      case 'removed':
        return 'var(--error-color, #f44336)';
      case 'modified':
        return 'var(--warning-color, #ff9800)';
      default:
        return 'var(--text-primary, #333)';
    }
  };

  const sections: Section[] = [
    {
      title: "Project Information",
      fields: [
        { key: "projectName", label: "Project Name" },
        { key: "pmoId", label: "PMO ID" },
        { key: "order", label: "Order" },
        { key: "multipleOrder", label: "Multiple Order" },
        { key: "bundleId", label: "Bundle ID" },
        { key: "mat", label: "MAT" },
        { key: "workStream", label: "Work Stream" },
        { key: "workType", label: "Work Type" },
        { key: "engrPlanYear", label: "Engineering Plan Year" },
        { key: "constPlanYear", label: "Construction Plan Year" },
        { key: "commitmentDate", label: "Commitment Date" }
      ]
    },
    {
      title: "Location Information",
      fields: [
        { key: "station", label: "Station" },
        { key: "line", label: "Line" },
        { key: "city", label: "City" },
        { key: "county", label: "County" },
        { key: "mp1", label: "MP1" },
        { key: "mp2", label: "MP2" }
      ]
    },
    {
      title: "Project Team",
      fields: [
        { key: "costEstimator", label: "Cost Estimator" },
        { key: "costEstimatorRequest", label: "Cost Estimator Request" },
        { key: "projectManager", label: "Project Manager" },
        { key: "projectEngineer", label: "Project Engineer" },
        { key: "designEstimator", label: "Design Estimator" },
        { key: "constructionContractor", label: "Construction Contractor" },
        { key: "ade", label: "ADE" },
        { key: "postEstimate", label: "Post Estimate" }
      ]
    },
    {
      title: "Design Milestones",
      fields: [
        { key: "thirtyPercentDesignReviewMeeting", label: "30% Design Review Meeting" },
        { key: "thirtyPercentDesignAvailable", label: "30% Design Available" },
        { key: "sixtyPercentDesignReviewMeeting", label: "60% Design Review Meeting" },
        { key: "sixtyPercentDesignAvailable", label: "60% Design Available" },
        { key: "ninetyPercentDesignReviewMeeting", label: "90% Design Review Meeting" },
        { key: "ninetyPercentDesignAvailable", label: "90% Design Available" },
        { key: "ifc", label: "IFC" }
      ]
    },
    {
      title: "Estimate Classes",
      fields: [
        { key: "class5", label: "Class 5" },
        { key: "class4", label: "Class 4" },
        { key: "class3", label: "Class 3" },
        { key: "class2", label: "Class 2" },
        { key: "negotiatePrice", label: "Negotiate Price" },
        { key: "jeReadyToRoute", label: "JE Ready to Route" },
        { key: "jeApproved", label: "JE Approved" },
        { key: "estimateAnalysis", label: "Estimate Analysis" }
      ]
    },
    {
      title: "Construction Milestones",
      fields: [
        { key: "ntp", label: "NTP" },
        { key: "mob", label: "MOB" },
        { key: "tieIn", label: "Tie-In" },
        { key: "enro", label: "ENRO" },
        { key: "unitCapture", label: "Unit Capture" }
      ]
    }
  ];

  return (
    <>
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="project-details-dialog-title"
      >
        <Box sx={{
          backgroundColor: "var(--primary-color)",
          color: "white",
          padding: "var(--spacing-md) var(--spacing-lg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Box
            id="project-details-dialog-title"
            component="h6"
            sx={{
              margin: 0,
              fontWeight: "bold",
              fontSize: "1.25rem",
              lineHeight: 1.6,
              letterSpacing: "0.0075em"
            }}
          >
            {createTitleText(project.pmoId, project.order, "Project Details: ")}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => setShowNotes(true)}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                '&:hover': {
                  backgroundColor: "rgba(255, 255, 255, 0.3)"
                }
              }}
            >
              Add Notes
            </Button>
            <Button
              onClick={onClose}
              sx={{
                minWidth: 'auto',
                padding: 1,
                color: 'white',
                '&:hover': { backgroundColor: 'var(--primary-dark)' }
              }}
              aria-label="Close dialog"
            >
              <X size={24} />
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="project details tabs">
            <Tab label="Details" id="tab-0" aria-controls="tabpanel-0" />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Change History
                  {projectChanges.length > 0 && (
                    <AlertTriangle 
                      size={16} 
                      color="var(--warning-color, #ff9800)"
                      style={{ marginBottom: -2 }}
                    />
                  )}
                </Box>
              } 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ padding: 0 }}>
          {/* Details Tab */}
          <div
            role="tabpanel"
            hidden={activeTab !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
            style={{ padding: 'var(--spacing-md)' }}
          >
            <Box sx={{ padding: 'var(--spacing-md)' }}>
              {sections.map((section, sectionIndex) => (
                <Box key={section.title} sx={{ marginBottom: "var(--spacing-lg)" }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: "bold", 
                    marginBottom: "var(--spacing-sm)",
                    color: "var(--primary-color)"
                  }}>
                    {section.title}
                  </Typography>
                  <Divider sx={{ marginBottom: "var(--spacing-md)" }} />
                  <Box sx={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "var(--spacing-md)"
                  }}>
                    {section.fields.map((field) => {
                      const value = project[field.key];
                      const displayValue = formatValue(value);
                      return (
                        <Box key={field.key} sx={{ marginBottom: "var(--spacing-sm)" }}>
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: "bold",
                            color: "var(--text-secondary)"
                          }}>
                            {field.label}
                          </Typography>
                          <Box sx={{ 
                            fontFamily: 'var(--font-family)',
                            fontSize: 'var(--font-size-md)',
                            color: 'var(--text-primary)'
                          }}>
                            {displayValue}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  {sectionIndex < sections.length - 1 && <Divider sx={{ margin: "16px 0" }} />}
                </Box>
              ))}
            </Box>
          </div>

          {/* Change History Tab */}
          <div
            role="tabpanel"
            hidden={activeTab !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
            style={{ padding: 'var(--spacing-md)' }}
          >
            {isLoadingChanges ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
                <Typography>Loading changes...</Typography>
              </Box>
            ) : projectChanges.length > 0 ? (
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: "bold", 
                  marginBottom: "var(--spacing-sm)",
                  color: "var(--primary-color)"
                }}>
                  Recent Changes
                </Typography>
                <Divider sx={{ marginBottom: "var(--spacing-md)" }} />
                
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Project Change Type</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>PMO ID</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Field</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Old Value</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectChanges.map((change, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 12 }}>
                            <span style={{ 
                              color: getChangeTypeColor(change.change_type),
                              fontWeight: 'bold',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: `${getChangeTypeColor(change.change_type)}20`
                            }}>
                              {change.change_type}
                            </span>
                          </td>
                          <td style={{ padding: 12 }}>{project.pmoId}</td>
                          <td style={{ padding: 12 }}>{formatFieldName(change.field_name)}</td>
                          <td style={{ padding: 12 }}>{formatDate(change.old_value || '-')}</td>
                          <td style={{ padding: 12 }}>{formatDate(change.new_value || '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 3, gap: 2 }}>
                <Clock size={48} color="var(--text-secondary, #666)" />
                <Typography variant="h6">No Recent Changes</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  There are no recorded changes for this project between the two most recent uploads.
                </Typography>
              </Box>
            )}
          </div>
        </DialogContent>

        <Box sx={{
          borderTop: "1px solid var(--border-light)",
          padding: "var(--spacing-md)",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "var(--bg-secondary)"
        }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              backgroundColor: "var(--primary-color)",
              color: "white",
              '&:hover': {
                backgroundColor: "var(--primary-dark)"
              }
            }}
          >
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Notes Dialog */}
      {showNotes && (
        <Dialog
          open={true}
          onClose={handleCloseNotes}
          maxWidth="sm"
          fullWidth
          aria-labelledby="notes-dialog-title"
          hideBackdrop={false}
          disableEnforceFocus={false}
          disableAutoFocus={false}
          container={document.body}
        >
          <Box sx={{
            backgroundColor: "var(--primary-color)",
            color: "white",
            padding: "var(--spacing-md) var(--spacing-lg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Box
              id="notes-dialog-title"
              component="h6"
              sx={{
                margin: 0,
                fontWeight: "bold",
                fontSize: "1.25rem",
                lineHeight: 1.6,
                letterSpacing: "0.0075em"
              }}
            >
              {createTitleText(project.pmoId, project.order, "Notes for ")}
            </Box>
            <Button
              onClick={handleCloseNotes}
              sx={{
                minWidth: 'auto',
                padding: 1,
                color: 'white',
                '&:hover': { backgroundColor: 'var(--primary-dark)' }
              }}
              aria-label="Close notes"
            >
              <X size={24} />
            </Button>
          </Box>
          <DialogContent sx={{ padding: "var(--spacing-lg)" }}>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={notes}
              onChange={handleNotesChange}
              placeholder="Enter your notes here..."
              variant="outlined"
              aria-label="Project notes"
              autoFocus
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProjectDetails; 