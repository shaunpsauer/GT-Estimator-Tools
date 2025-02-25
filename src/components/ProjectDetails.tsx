import { Dialog, DialogContent, Typography, Button, Box, Divider } from "@mui/material";
import { X } from "react-feather";
import { Project } from "../types/Project";

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetails = ({ project, onClose }: ProjectDetailsProps) => {
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
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--border-radius-md)",
          overflow: "hidden",
          boxShadow: "0 5px 35px var(--shadow-color)"
        }
      }}
    >
      <Box sx={{
        backgroundColor: "var(--primary-color)",
        color: "white",
        padding: "var(--spacing-md) var(--spacing-lg)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Project Details
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            padding: 1,
            color: 'white',
            '&:hover': { backgroundColor: 'var(--primary-dark)' }
          }}
        >
          <X size={24} />
        </Button>
      </Box>

      <DialogContent sx={{ padding: "var(--spacing-lg)" }}>
        {sections.map((section, index) => (
          <Box key={section.title} sx={{ mb: index < sections.length - 1 ? 3 : 0 }}>
            <Typography variant="h6" sx={{ 
              color: "var(--primary-color)",
              fontWeight: "bold",
              mb: 1
            }}>
              {section.title}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 2
            }}>
              {section.fields.map(field => (
                <Box key={field.key} sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ 
                    color: "var(--text-primary)",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    mb: 0.5
                  }}>
                    {field.label}
                  </Typography>
                  <Typography sx={{
                    fontWeight: "normal",
                    color: "var(--text-secondary)"
                  }}>
                    {String(project[field.key as keyof Project] || 'N/A')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
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
  );
};

export default ProjectDetails; 