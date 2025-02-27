import { useState } from "react";
import {
  Home,
  Settings,
  Upload,
  RefreshCw,
  Search,
  List,
  Save,
} from "react-feather";
import { parseExcelFile } from "../services/excelService";
import { Project } from "../types/Project";
import React from "react";

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

  const handleRefresh = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const SidebarButton = ({
    icon: Icon,
    onClick,
    isActive,
  }: {
    icon: typeof Home;
    onClick?: () => void;
    isActive?: boolean;
  }) => (
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
  );

  const SubMenuItem = ({
    icon: Icon,
    onClick,
  }: {
    icon: typeof Home;
    onClick?: () => void;
  }) => (
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
        />

        {isSubmenuOpen && (
          <div>
            <SubMenuItem
              icon={Save}
              onClick={onViewSavedProjects}
            />
            <SubMenuItem 
              icon={List} 
              onClick={onViewSD09} 
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
            />
            <SubMenuItem
              icon={RefreshCw}
              onClick={handleRefresh}
            />
            <SubMenuItem
              icon={Settings}
              onClick={onSettingsClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
