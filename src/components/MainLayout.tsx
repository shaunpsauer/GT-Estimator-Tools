import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Sd09 from "./Sd09";
import SavedProjects from "./SavedProjects";
import { SettingsCard } from "./SettingsCard";
import { Project, VisibleColumns, ProjectChanges } from "../types/Project";
import "../styles/global.css";
import { storageService } from "../services/storageService";
import SqlServerApi from "../services/SqlServerApi";

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
  const [isLoadingSavedProjects, setIsLoadingSavedProjects] = useState<boolean>(false);

  useEffect(() => {
    // Load saved projects when component mounts, but only once
    loadSavedProjects();

    // Set up event listeners for view changes and project additions
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{view: ViewType}>;
      setCurrentView(customEvent.detail.view);
      // Don't reload data here - we'll handle that in a separate effect if needed
    };

    const handleProjectsAdded = () => {
      // Force reload saved projects when projects are explicitly added
      loadSavedProjects(true);
    };

    window.addEventListener("changeView", handleViewChange);
    window.addEventListener("projectsAdded", handleProjectsAdded);

    // Set up an interval to periodically refresh projects (every 5 minutes)
    const intervalId = setInterval(() => loadSavedProjects(true), 5 * 60 * 1000);

    // Clean up event listeners and interval on component unmount
    return () => {
      window.removeEventListener("changeView", handleViewChange);
      window.removeEventListener("projectsAdded", handleProjectsAdded);
      clearInterval(intervalId);
      
      // Reset loading flag when component unmounts
      setIsLoadingSavedProjects(false);
    };
  }, []);

  // Separate effect to handle view changes without reloading data unnecessarily
  useEffect(() => {
    // We don't need to reload data when switching views
    // The data is already loaded and stored in state
    console.log(`View changed to: ${currentView}`);
  }, [currentView]);

  const loadSavedProjects = async (forceReload = false) => {
    try {
      // Check if we're already loading or if we have data and don't need to force reload
      if (isLoadingSavedProjects) {
        console.log("Already loading saved projects, skipping duplicate call");
        return;
      }
      
      if (savedProjects.length > 0 && !forceReload) {
        console.log("Saved projects already loaded, skipping reload");
        return;
      }
      
      // Set loading flag to prevent duplicate calls
      setIsLoadingSavedProjects(true);
      
      console.log("Loading saved projects from database in MainLayout...");
      const projects = await SqlServerApi.getProjects();
      console.log(`Loaded ${projects.length} projects from database in MainLayout`);
      
      // Update the savedProjects state with the loaded projects
      setSavedProjects(projects);
      
      // Reset loading flag
      setIsLoadingSavedProjects(false);
      
      // Do NOT update the projects state with saved projects
      // This ensures saved projects only appear in SavedProjects and not in Sd09
    } catch (error) {
      console.error("Error loading saved projects:", error);
      // Reset loading flag even on error
      setIsLoadingSavedProjects(false);
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
    // Just change the view, don't reload data
    setCurrentView("sd09");
  };

  const handleHomeClick = () => {
    // Just change the view, don't reload data
    setCurrentView("home");
  };

  const handleViewSavedProjects = () => {
    // Just change the view, don't reload data
    setCurrentView("saved-projects");
  };

  const handleProjectsLoad = async (newProjects: Project[]) => {
    // Load existing saved projects to compare against
    const existingSaved = await SqlServerApi.getProjects();
    console.log(`Loaded ${existingSaved.length} existing saved projects for comparison`);

    // Create a set of saved project IDs for quick lookup
    const savedProjectIds = new Set(existingSaved.map(p => p.id));
    
    // Filter out projects that are already saved from the new projects
    // This ensures saved projects don't appear in the Sd09 view
    const filteredNewProjects = newProjects.filter(p => !savedProjectIds.has(p.id));
    console.log(`Filtered out ${newProjects.length - filteredNewProjects.length} already saved projects`);

    // Merge new projects with existing ones, updating when identifiers match
    setProjects((prevProjects) => {
      // Start with previous projects that are not saved
      const nonSavedPrevProjects = prevProjects.filter(p => !savedProjectIds.has(p.id));
      const mergedProjects = [...nonSavedPrevProjects];

      filteredNewProjects.forEach((newProject) => {
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

      // Update projects in database sequentially to avoid race conditions
      (async () => {
        try {
          // Process projects one by one to avoid race conditions
          for (const project of updatedSaved) {
            await SqlServerApi.deleteProject(project.id);
            // Add a small delay to ensure deletion completes
            await new Promise(resolve => setTimeout(resolve, 100));
            await SqlServerApi.addProject(project);
          }
        } catch (error) {
          console.error("Error updating projects in DB:", error);
        }
      })();

      return updatedSaved;
    });

    onProjectsLoad?.(filteredNewProjects);
  };

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "var(--bg-secondary)",
        overflow: "hidden",
      }}
    >
      <Sidebar
        onSettingsClick={handleSettingsClick}
        onViewSD09={handleViewSD09}
        onHomeClick={handleHomeClick}
        onViewSavedProjects={handleViewSavedProjects}
        currentView={currentView}
        onProjectsLoad={handleProjectsLoad}
      />

      <main
        style={{
          flex: 1,
          padding: "0",
          backgroundColor: "var(--bg-secondary)",
          marginLeft: "110px",
          width: "calc(100% - 110px)",
          display: "flex",
          justifyContent: "center",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1600px",
            margin: "25px",
            height: "calc(100vh - 50px)",
            backgroundColor: "var(--bg-primary)",
            borderRadius: "var(--border-radius-md)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            overflow: "auto",
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
              onSettingsClick={handleSettingsClick}
              onViewSavedProjects={handleViewSavedProjects}
              onProjectsLoad={handleProjectsLoad}
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
