import { Dialog, DialogContent, Typography, Button, Box, Divider, TextField, Tab, Tabs } from "@mui/material";
import { X, Clock } from "react-feather";
import { Project } from "../types/Project";
import { useState, useEffect, useCallback } from "react";
import SqlServerApi, { ExcelProjectChange } from "../services/SqlServerApi";

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
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
    if (activeTab === 1) {
      loadProjectChanges();
    }
  }, [activeTab, loadProjectChanges]);

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

  const sections = [
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
        { key: "mp2", label: "MP2" },
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
        { key: "ade", label: "ADE" }
      ]
    },
    {
      title: "Design Milestones",
      fields: [
        { key: "engrPlanYear", label: "Engineering Plan Year" },
        { key: "thirtyPercentDesignReviewMeeting", label: "30% Design Review Meeting"},
        { key: "thirtyPercentDesignAvailable", label: "30% Design Available" },
        { key: "sixtyPercentDesignReviewMeeting", label: "60% Design Review Meeting" },
        { key: "sixtyPercentDesignAvailable", label: "60% Design Available" },
        { key: "ninetyPercentDesignReviewMeeting", label: "90% Design Review Meeting" },
        { key: "ninetyPercentDesignAvailable", label: "90% Design Available" },
        { key: "ifc", label: "IFC" }
      ]
    },
    {
      title: "Estimating Milestones",
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
        { key: "constPlanYear", label: "Construction Plan Year" },
        { key: "commitmentDate", label: "Commitment Date" },
        { key: "ntp", label: "NTP" },
        { key: "mob", label: "MOB" },
        { key: "tieIn", label: "Tie-in" },
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
          <Typography variant="h6" id="project-details-dialog-title" sx={{ fontWeight: "bold" }}>
            Project Details: {project.pmoId} - {project.order}
          </Typography>
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
            <Tab label="Change History" id="tab-1" aria-controls="tabpanel-1" />
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
            {sections.map((section, index) => (
              <Box key={index} sx={{ marginBottom: "var(--spacing-lg)" }}>
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
                  {section.fields.map((field, fieldIndex) => (
                    <Box key={fieldIndex} sx={{ marginBottom: "var(--spacing-sm)" }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: "bold",
                        color: "var(--text-secondary)"
                      }}>
                        {field.label}
                      </Typography>
                      <Typography variant="body1">
                        {project[field.key as keyof Project] !== undefined && project[field.key as keyof Project] !== null 
                          ? String(project[field.key as keyof Project]) 
                          : "-"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
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
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Field</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Change Type</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>Old Value</th>
                        <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>New Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectChanges.map((change, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 12 }}>{change.field_name}</td>
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
                          <td style={{ padding: 12 }}>{change.old_value || '-'}</td>
                          <td style={{ padding: 12 }}>{change.new_value || '-'}</td>
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

      {/* Render the notes dialog conditionally to avoid nesting issues */}
      {showNotes && (
        <Dialog
          open={true}
          onClose={handleCloseNotes}
          maxWidth="sm"
          fullWidth
          aria-labelledby="notes-dialog-title"
          // Ensure this dialog is not hidden from screen readers
          hideBackdrop={false}
          disableEnforceFocus={false}
          disableAutoFocus={false}
          // Use a different container to avoid nesting dialogs
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
            <Typography variant="h6" id="notes-dialog-title" sx={{ fontWeight: "bold" }}>
              Notes for {project.pmoId} - {project.order}
            </Typography>
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