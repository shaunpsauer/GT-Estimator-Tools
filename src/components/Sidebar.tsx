import { useState } from "react";
import {
  Home,
  Settings,
  Upload,
  Search,
  List,
  Save,
} from "react-feather";
import { parseExcelFile } from "../services/excelService";
import { Project } from "../types/Project";
import React from "react";
import { Tooltip } from "@mui/material";

interface SidebarProps {
  onSettingsClick?: () => void;
  onViewSD09?: () => void;
  onHomeClick: () => void;
  currentView: "home" | "sd09" | "saved-projects";
  onProjectsLoad?: (projects: Project[]) => void;
  onViewSavedProjects?: () => void;
}

const Sidebar = ({
  onSettingsClick,
  onViewSD09,
  onHomeClick,
  currentView,
  onProjectsLoad,
  onViewSavedProjects,
}: SidebarProps) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const projects = await parseExcelFile(file);
      onProjectsLoad?.(projects);
      onViewSD09?.();
    } catch (error) {
      console.error("Error parsing Excel file:", error);
    }
  };

  const SidebarButton = ({
    icon: Icon,
    onClick,
    isActive,
    tooltip,
  }: {
    icon: any;
    onClick?: () => void;
    isActive?: boolean;
    tooltip: string;
  }) => (
    <Tooltip title={tooltip} placement="right">
      <button
        onClick={onClick}
        className="button sidebar-button"
        style={{
          width: "100%",
          padding: "var(--spacing-sm) var(--spacing-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--spacing-md)",
          backgroundColor: isActive ? "var(--primary-dark)" : "transparent",
        }}
      >
        <Icon size={30} />
      </button>
    </Tooltip>
  );

  const SubMenuItem = ({
    icon: Icon,
    onClick,
    tooltip,
  }: {
    icon: any;
    onClick?: () => void;
    tooltip: string;
  }) => (
    <Tooltip title={tooltip} placement="right">
      <button
        onClick={onClick}
        className="button sidebar-button"
        style={{
          width: "100%",
          padding: "var(--spacing-sm) var(--spacing-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--spacing-md)",
          fontSize: "var(--font-size-sm)",
        }}
      >
        <Icon size={20} />
      </button>
    </Tooltip>
  );

  return (
    <div
      style={{
        boxShadow: "2px 0 10px 0 var(--shadow-color)",
        boxSizing: "border-box",
        width: "100px",
        background: "var(--primary-color)",
        color: "var(--text-light)",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--spacing-md) 0",
      }}
    >
      <SidebarButton
        icon={Home}
        onClick={onHomeClick}
        isActive={currentView === "home"}
        tooltip="Home"
      />

      <div style={{ width: "100%" }}>
        <SidebarButton
          icon={Search}
          isActive={
            isSubmenuOpen ||
            currentView === "sd09" ||
            currentView === "saved-projects"
          }
          onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
          tooltip="SD-09"
        />

        {isSubmenuOpen && (
          <div>
            <SubMenuItem
              icon={Save}
              onClick={onViewSavedProjects}
              tooltip="Saved Projects"
            />
            <SubMenuItem 
              icon={List} 
              onClick={onViewSD09}
              tooltip="SD-09 Viewer"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <SubMenuItem
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              tooltip="Upload SD-09"
            />
            <SubMenuItem
              icon={Settings}
              onClick={onSettingsClick}
              tooltip="Settings"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
