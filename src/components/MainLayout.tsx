import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Sd09 from "./Sd09";
import SavedProjects from "./SavedProjects";
import { SettingsCard } from "./SettingsCard";
import { Project, VisibleColumns, ProjectChanges } from "../types/Project";
import "../styles/global.css";
import { storageService } from "../services/storageService";
import { db } from "../services/db";

interface MainLayoutProps {
  children: ReactNode;
  onProjectsLoad?: (projects: Project[]) => void;
}

type ViewType = "home" | "sd09" | "saved-projects";

const MainLayout = ({ children, onProjectsLoad }: MainLayoutProps) => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    return (
      storageService.loadVisibleColumns() || {
        costEstimator: true,
        costEstimatorRequest: true,
        ade: true,
        projectManager: true,
        projectEngineer: true,
        designEstimator: true,
        constructionContractor: true,
        bundleId: true,
        postEstimate: true,
        pmoId: true,
        order: true,
        multipleOrder: true,
        mat: true,
        projectName: true,
        workStream: true,
        workType: true,
        engrPlanYear: true,
        constPlanYear: true,
        commitmentDate: true,
        station: true,
        line: true,
        mp1: true,
        mp2: true,
        city: true,
        county: true,
        class5: true,
        class4: true,
        class3: true,
        class2: true,
        negotiatePrice: true,
        jeReadyToRoute: true,
        jeApproved: true,
        estimateAnalysis: true,
        thirtyPercentDesignReviewMeeting: true,
        thirtyPercentDesignAvailable: true,
        sixtyPercentDesignReviewMeeting: true,
        sixtyPercentDesignAvailable: true,
        ninetyPercentDesignReviewMeeting: true,
        ninetyPercentDesignAvailable: true,
        ifc: true,
        ntp: true,
        mob: true,
        tieIn: true,
        enro: true,
        unitCapture: true,
      }
    );
  });

  const [projects, setProjects] = useState<Project[]>([]);

  const [savedProjects, setSavedProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadSavedProjects();

    // Add event listener for the custom event
    const handleViewChange = (event: Event) => {
      const CustomEvent = event as CustomEvent;
      // button calls
      switch (CustomEvent.detail) {
        case "sd09":
          setCurrentView("sd09");
          break;
        case "saved-projects":
          setCurrentView("saved-projects");
          break;
        default:
          setCurrentView("home");
      }
    };

    window.addEventListener("changeView", handleViewChange);
  }, []);

  const loadSavedProjects = async () => {
    try {
      const projects = await db.getProjects();
      setSavedProjects(projects);
    } catch (error) {
      console.error("Error loading saved projects:", error);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleSettingsApply = (newSettings: Partial<VisibleColumns>) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, ...newSettings };
      storageService.saveVisibleColumns(updated);
      return updated;
    });
  };

  const handleViewSD09 = () => {
    setCurrentView("sd09");
  };

  const handleHomeClick = () => {
    setCurrentView("home");
  };

  const handleViewSavedProjects = () => {
    setCurrentView("saved-projects");
  };

  const handleProjectsLoad = async (newProjects: Project[]) => {
    // Load existing saved projects to compare against
    const existingSaved = await db.getProjects();

    // Merge new projects with existing ones, updating when identifiers match
    setProjects((prevProjects) => {
      const mergedProjects = [...prevProjects];

      newProjects.forEach((newProject) => {
        const existingIndex = mergedProjects.findIndex(
          (p) => p.id === newProject.id
        );
        const savedVersion = existingSaved.find((p) => p.id === newProject.id);

        if (existingIndex >= 0) {
          // Compare with saved version if exists
          const changes: ProjectChanges = {};
          if (savedVersion) {
            Object.keys(newProject).forEach((key) => {
              if (
                key !== "_changes" &&
                key !== "is_changed" &&
                key !== "last_updated" &&
                newProject[key as keyof Project] !==
                  savedVersion[key as keyof Project]
              ) {
                const value = savedVersion[key as keyof Project];
                if (
                  typeof value === "string" ||
                  typeof value === "number" ||
                  typeof value === "boolean" ||
                  value === undefined
                ) {
                  changes[key] = value;
                }
              }
            });
          }

          // Update existing project
          mergedProjects[existingIndex] = {
            ...newProject,
            _changes: Object.keys(changes).length > 0 ? changes : undefined,
            is_changed: Object.keys(changes).length > 0,
            last_updated: new Date().toISOString(),
          };
        } else {
          // Add new project
          mergedProjects.push(newProject);
        }
      });

      return mergedProjects;
    });

    // Update saved projects if they exist in the new data
    setSavedProjects((prevSaved) => {
      const updatedSaved = prevSaved.map((savedProject) => {
        const updatedVersion = newProjects.find(
          (p) => p.id === savedProject.id
        );
        if (updatedVersion) {
          return {
            ...updatedVersion,
            last_updated: new Date().toISOString(),
          };
        }
        return savedProject;
      });

      // Update IndexedDB
      updatedSaved.forEach(async (project) => {
        try {
          await db.deleteProject(project.id);
          await db.addProject(project);
        } catch (error) {
          console.error("Error updating project in DB:", error);
        }
      });

      return updatedSaved;
    });

    onProjectsLoad?.(newProjects);
  };

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        onSettingsClick={handleSettingsClick}
        onCollapse={() => {}}
        onViewSD09={handleViewSD09}
        onHomeClick={handleHomeClick}
        onViewSavedProjects={handleViewSavedProjects}
        currentView={currentView}
        onProjectsLoad={handleProjectsLoad}
      />

      <main
        style={{
          flex: 1,
          padding: "var(--spacing-sm)",
          backgroundColor: "var(--bg-secondary)",
          transition: "margin-left 0.3s ease-in-out",
          marginLeft: "0",
          width: "100%", // Ensure main takes full width available
          display: "flex",
          justifyContent: "center", // Center the content horizontally
        }}
      >
        <div
          style={{
            width: "100%", // Take full width of parent
            maxWidth: "calc(100% - 200px", // Maximum width on large screens
            margin: "25px", // Remove auto margins and let flex handle centering
            marginRight: "50px",
            minHeight: "90vh", // Use viewport height units for responsive height
            backgroundColor: "var(--bg-primary)",
            borderRadius: "var(--border-radius-md)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {currentView === "home" ? (
            children
          ) : currentView === "sd09" ? (
            <Sd09
              projects={projects}
              visibleColumns={visibleColumns}
              onSaveProjects={(projectsToSave) => {
                setSavedProjects((prev) => {
                  const newProjects = projectsToSave.filter(
                    (p) => !prev.find((sp) => sp.id === p.id)
                  );
                  return [...prev, ...newProjects];
                });
              }}
            />
          ) : (
            <SavedProjects
              projects={savedProjects}
              visibleColumns={visibleColumns}
              onRemoveProjects={(removedProjects) => {
                setSavedProjects((prev) =>
                  prev.filter(
                    (p) => !removedProjects.find((rp) => rp.id === p.id)
                  )
                );
              }}
            />
          )}
        </div>
      </main>

      <SettingsCard
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        onApply={handleSettingsApply}
        currentSettings={visibleColumns}
      />
    </div>
  );
};

export default MainLayout;
