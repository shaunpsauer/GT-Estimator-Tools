import { useState } from "react";
import {  
  Home,
  Settings,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  ChevronUp,
  List,
  Save
} from "react-feather";
import { parseExcelFile } from '../services/excelService';
import { Project } from '../types/Project';
import React from 'react';

interface SidebarProps {
  onSettingsClick?: () => void;
  onCollapse: (collapsed: boolean) => void;
  onViewSD09?: () => void;
  onHomeClick: () => void;
  currentView: 'home' | 'sd09' | 'saved-projects';
  onProjectsLoad?: (projects: Project[]) => void;
  onViewSavedProjects?: () => void;
}

const Sidebar = ({ 
  onSettingsClick, 
  onCollapse, 
  onViewSD09, 
  onHomeClick,
  currentView,
  onProjectsLoad,
  onViewSavedProjects
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onCollapse(!isCollapsed);
  };

  // Add ref to store file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const projects = await parseExcelFile(file);
      onProjectsLoad?.(projects);
      onViewSD09?.();
    } catch (error) {
      console.error('Error parsing Excel file:', error);
    }
  };

  const handleRefresh = async () => {
    // Simply trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add handler to trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const SidebarButton = ({ 
    icon: Icon, 
    label, 
    onClick,
    hasSubmenu,
    isActive 
  }: { 
    icon: typeof Home; 
    label: string; 
    onClick?: () => void;
    hasSubmenu?: boolean;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className="button sidebar-button"
      style={{
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        textTransform: 'none',
        width: isCollapsed ? '60px' : '100%',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        backgroundColor: isActive ? 'var(--primary-dark)' : 'transparent',
      }}
    >
      <Icon size={30} />
      {!isCollapsed && (
        <>
          <span style={{ flex: 1 }}>{label}</span>
          {hasSubmenu && (isSubmenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
        </>
      )}
    </button>
  );

  const SubMenuItem = ({ 
    icon: Icon, 
    label,
    onClick 
  }: { 
    icon: typeof Home; 
    label: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="button sidebar-button"
      style={{
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        textTransform: 'none',
        width: isCollapsed ? '60px' : '100%',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        paddingLeft: isCollapsed ? 'var(--spacing-md)' : 'var(--spacing-xl)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <Icon size={20} />
      {!isCollapsed && <span>{label}</span>}
    </button>
  );

  return (
    <div
      style={{
        boxShadow: '2px 0 10px 0 var(--shadow-color)',
        boxSizing: 'border-box',
        width: isCollapsed ? '100px' : '250px',
        background: 'var(--primary-color)',
        color: 'var(--text-light)',
        height: '100vh',
        //padding: 'var(--spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease-in-out',
      }}
    >
      <button
        onClick={handleCollapse}
        className="button"
        style={{
          color: 'var(--text-light)',
          marginBottom: 'var(--spacing-lg)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-sm)',
        }}
      >
        {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </button>

      <SidebarButton 
        icon={Home} 
        label="Home"
        onClick={onHomeClick}
        isActive={currentView === 'home'}
      />

      <div>
        <SidebarButton 
          icon={Search} 
          label="SD-09" 
          hasSubmenu={true}
          isActive={isSubmenuOpen || currentView === 'sd09' || currentView === 'saved-projects'}
          onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
        />
        
        {isSubmenuOpen && (
          <div style={{ 
            overflow: 'hidden',
            transition: 'height 0.3s ease-in-out',
          }}>
            <SubMenuItem 
              icon={Save} 
              label="Saved Projects"
              onClick={onViewSavedProjects}
            />
            <SubMenuItem 
              icon={List} 
              label="View SD-09"
              onClick={onViewSD09}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <SubMenuItem 
              icon={Upload} 
              label="Upload File"
              onClick={handleUploadClick}
            />
            <SubMenuItem 
              icon={RefreshCw} 
              label="Refresh Data"
              onClick={handleRefresh}
            />
            <SubMenuItem 
              icon={Settings} 
              label="Display Settings"
              onClick={onSettingsClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 