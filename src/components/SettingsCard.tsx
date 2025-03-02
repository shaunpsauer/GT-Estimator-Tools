import { useEffect, useState, useMemo } from "react";
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

const settingsOrder: (keyof VisibleColumns)[] = [
  "costEstimator", "costEstimatorRequest", "ade", "projectManager",
  "projectEngineer", "designEstimator", "constructionContractor", "bundleId",
  "postEstimate", "pmoId", "order", "multipleOrder", "mat", "projectName",
  "workStream", "workType", "engrPlanYear", "constPlanYear", "commitmentDate",
  "station", "line", "mp1", "mp2", "city", "county", "class5", "class4",
  "class3", "class2", "negotiatePrice", "jeReadyToRoute", "jeApproved",
  "estimateAnalysis", "thirtyPercentDesignAvailable",
  "sixtyPercentDesignReviewMeeting", "sixtyPercentDesignAvailable",
  "ninetyPercentDesignReviewMeeting", "ninetyPercentDesignAvailable", "ifc",
  "ntp", "mob", "tieIn", "enro", "unitCapture"
];

const formatLabel = (key: string) => {
  const formattedLabels: Record<string, string> = {
    costEstimator: "Cost Estimator", projectManager: "Project Manager",
    constructionContractor: "Construction Contractor", ade: "ADE", pmoId: "PMO ID",
    order: "Order", mat: "MAT", projectName: "Project Name", workStream: "Work Stream",
    workType: "Work Type", constPlanYear: "Construction Plan Year",
    jeReadyToRoute: "JE Ready to Route", jeApproved: "JE Approved",
    estimateAnalysis: "Estimate Analysis", ntp: "NTP", mob: "MOB", ifc: "IFC",
    mp1: "MP1", mp2: "MP2", line: "LINE", costEstimatorRequest: "Cost Estimator Request",
    projectEngineer: "Project Engineer", designEstimator: "Design Estimator",
    bundleId: "Bundle ID", postEstimate: "Post Estimate", multipleOrder: "Multiple Order",
    station: "Station", city: "City", county: "County", enro: "ENRO", unitCapture: "Unit Capture"
  };

  return key.toLowerCase().includes("percent") && key.toLowerCase().includes("design")
    ? key.replace(/thirty/i, "30%").replace(/sixty/i, "60%")
      .replace(/ninety/i, "90%").replace(/([A-Z])/g, " $1").trim()
    : formattedLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
};

export const SettingsCard = ({ isOpen, onClose, onApply, currentSettings }: SettingsCardProps) => {
  const [settings, setSettings] = useState<Partial<VisibleColumns>>(currentSettings);

  // Memoized count to avoid recalculating on every render
  const selectedCount = useMemo(() => Object.values(settings).filter(Boolean).length, [settings]);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const toggleSetting = (key: keyof VisibleColumns) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, [key]: !prev[key] };

      // Ensure at least 3 columns remain active
      if (Object.values(updatedSettings).filter(Boolean).length < 3) {
        return prev;
      }
      return updatedSettings;
    });
  };

  const toggleAll = () => {
    const enableAll = selectedCount !== settingsOrder.length;
    const newSettings = settingsOrder.reduce(
      (acc, key) => ({ ...acc, [key]: enableAll }), {} as Partial<VisibleColumns>
    );

    // Ensure at least 3 remain on
    if (!enableAll) {
      newSettings.costEstimator = true;
      newSettings.pmoId = true;
      newSettings.order = true;
    }
    setSettings(newSettings);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <Box sx={{
        backgroundColor: "var(--primary-color)", color: "white", padding: "16px 24px",
        textAlign: "center", borderTopLeftRadius: "8px", borderTopRightRadius: "8px"
      }}>
        <Typography component="h2" sx={{ fontWeight: "bold", fontSize: "20px", mb: "4px" }}>
          Display Settings
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "14px", fontWeight: 500, opacity: 0.9 }}>
          Select at least <strong>3</strong> columns to display.
        </Typography>
      </Box>

      <DialogContent>
        <FormGroup>
          <Box display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>Select All</Typography>
            <ToggleSwitch checked={selectedCount === settingsOrder.length} onChange={toggleAll} />
          </Box>
          <Divider sx={{ my: 1 }} />

          {settingsOrder.map((key) => (
            <Box key={key} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
              <Typography variant="body1">{formatLabel(key)}</Typography>
              <ToggleSwitch checked={settings[key] ?? false} onChange={() => toggleSetting(key)} />
            </Box>
          ))}
        </FormGroup>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{ mx: 1, px: 3, fontWeight: "bold", borderRadius: 2, textTransform: "uppercase" }}
        >
          CANCEL
        </Button>
        <Button
          onClick={() => { onApply(settings); onClose(); }}
          variant="contained"
          color="primary"
          sx={{ mx: 1, px: 3, fontWeight: "bold", borderRadius: 2, textTransform: "uppercase" }}
        >
          APPLY
        </Button>
      </DialogActions>
    </Dialog>
  );
};
