import React, { useEffect, useState } from "react";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { ToggleSwitch } from "./ToggleSwitch";
import { VisibleColumns } from "../types/Project";

interface SettingsCardProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (columns: Partial<VisibleColumns>) => void;
  currentSettings: VisibleColumns;
}

const formatLabel = (key: string) => {
  const formattedLabels: Record<string, string> = {
    costEstimator: "Cost Estimator",
    projectManager: "Project Manager",
    constructionContractor: "Construction Contractor",
    ade: "ADE",
    pmoId: "PMO ID",
    order: "Order",
    mat: "MAT",
    projectName: "Project Name",
    workStream: "Work Stream",
    workType: "Work Type",
    constructionPlanYear: "Construction Plan Year",
    jeReadyToRoute: "JE Ready to Route",
    jeApproved: "JE Approved",
    estimateAnalysis: "Estimate Analysis",
    ntp: "NTP",
    mob: "MOB",
    ifc: "IFC",
    mp1: "MP1",
    mp2: "MP2",
    line: "LINE",
    costEstimatorRequest: "Cost Estimator Request",
    projectEngineer: "Project Engineer",
    designEstimator: "Design Estimator",
    bundleId: "Bundle ID",
    postEstimate: "Post Estimate",
    multipleOrder: "Multiple Order",
    station: "Station",
    city: "City",
    county: "County",
    enro: "ENRO",
    unitCapture: "Unit Capture"
  };
  
  if (key.toLowerCase().includes('percent') && key.toLowerCase().includes('design')) {
    return key
      .replace(/thirty/i, '30%')
      .replace(/sixty/i, '60%')
      .replace(/ninety/i, '90%')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }
  
  return formattedLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// Define the transition component properly
const SlideTransition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
  }
);

export const SettingsCard = ({
  isOpen,
  onClose,
  onApply,
  currentSettings,
}: SettingsCardProps) => {
  const [settings, setSettings] = useState<Partial<VisibleColumns>>(currentSettings);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const count = Object.values(settings).filter(Boolean).length;
    setSelectedCount(count);
  }, [settings]);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const toggleSetting = (key: keyof VisibleColumns) => {
    setSettings(prev => {
      // If trying to turn off a toggle
      if (prev[key]) {
        // Count how many are currently on
        const currentlyOn = Object.values(prev).filter(Boolean).length;
        // Don't allow turning off if only 3 are on
        if (currentlyOn <= 3) {
          return prev;
        }
      }
      
      // Otherwise toggle the setting
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
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

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 500);
  };

  const handleApply = () => {
    onApply(settings);
    handleClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      fullWidth 
      maxWidth="xs"
      TransitionComponent={SlideTransition}
      TransitionProps={{ 
        in: isOpen && !isExiting,
      }}
      PaperProps={{
        sx: {
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "5px 4px 20px var(--shadow-color)"
        }
      }}
    >
      <Box sx={{
        backgroundColor: "var(--primary-color)",
        color: "white",
        padding: "16px 24px",
        textAlign: "center",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px"
      }}>
        <Typography 
          component="h2" 
          sx={{ 
            fontWeight: "bold", 
            fontSize: "20px",
            lineHeight: 1.2,
            marginBottom: "4px"
          }}
        >
          Display Settings
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: "14px", 
            fontWeight: 500,
            opacity: 0.9
          }}
        >
          Select at least <strong>3</strong> columns to display.
        </Typography>
      </Box>

      <DialogContent>
        <FormGroup>
          <Box display="flex" alignItems="center" justifyContent="space-between" paddingY={0.5}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Select All</Typography>
            <ToggleSwitch
              checked={selectedCount === settingsOrder.length}
              onChange={() => {
                setSettings(settingsOrder.reduce((acc, key) => ({
                  ...acc,
                  [key]: selectedCount === settingsOrder.length ? (
                    // When turning all off, keep these three on
                    key === 'costEstimator' || 
                    key === 'pmoId' || 
                    key === 'order'
                  ) : true // When turning all on, set everything to true
                }), {} as Partial<VisibleColumns>));
              }}
            />
          </Box>
          
          <Divider sx={{ my: 1 }} />

          {settingsOrder.map((key) => (
            <Box key={key} display="flex" alignItems="center" justifyContent="space-between" paddingY={0.5}>
              <Typography variant="body1">{formatLabel(key)}</Typography>
              <ToggleSwitch
                checked={settings[key as keyof VisibleColumns] ?? false}
                onChange={() => toggleSetting(key as keyof VisibleColumns)}
              />
            </Box>
          ))}
        </FormGroup>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", paddingBottom: 2 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          color="primary"
          sx={{ 
            mx: 1, 
            px: 3, 
            fontWeight: "bold",
            borderRadius: 2, 
            textTransform: "uppercase",
            transition: "0.2s",
            "&:hover": { backgroundColor: "var(--bg-secondary)" }
          }}
        >
          CANCEL
        </Button>
        
        <Button 
          onClick={handleApply} 
          variant="contained" 
          color="primary"
          sx={{ 
            mx: 1, 
            px: 3, 
            fontWeight: "bold",
            borderRadius: 2, 
            textTransform: "uppercase",
            transition: "0.2s",
            "&:hover": { backgroundColor: "var(--primary-dark)" }
          }}
        >
          APPLY
        </Button>
      </DialogActions>
    </Dialog>
  );
};