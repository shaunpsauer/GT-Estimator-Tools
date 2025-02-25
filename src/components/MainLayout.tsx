import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Sd09 from './Sd09';
import SavedProjects from './SavedProjects';
import { SettingsCard } from './SettingsCard';
import { Project, VisibleColumns } from '../types/Project';
import '../styles/global.css';
import { storageService } from '../services/storageService';
import { db } from '../services/db';

interface MainLayoutProps {
  children: ReactNode;
  onProjectsLoad?: (projects: Project[]) => void;
}

type ViewType = 'home' | 'sd09' | 'saved-projects';

const MainLayout = ({ children, onProjectsLoad }: MainLayoutProps) => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    return storageService.loadVisibleColumns() || {
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
      constructionPlanYear: true,
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
      unitCapture: true
    };
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    return storageService.loadProjects() || [];
  });

  const [savedProjects, setSavedProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadSavedProjects();
  }, []);

  const loadSavedProjects = async () => {
    try {
      const projects = await db.getProjects();
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading saved projects:', error);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleSettingsApply = (newSettings: Partial<VisibleColumns>) => {
    setVisibleColumns(prev => {
      const updated = { ...prev, ...newSettings };
      storageService.saveVisibleColumns(updated);
      return updated;
    });
  };

  const handleViewSD09 = () => {
    setCurrentView('sd09');
  };

  const handleHomeClick = () => {
    setCurrentView('home');
  };

  const handleViewSavedProjects = () => {
    setCurrentView('saved-projects');
  };

  const handleProjectsLoad = async (newProjects: Project[]) => {
    setProjects(newProjects);
    onProjectsLoad?.(newProjects);
    storageService.saveProjects(newProjects);
  };

  return (
    <div className="app-container" style={{
      display: 'flex',
      minHeight: '100vh',
    }}>
      <Sidebar 
        onSettingsClick={handleSettingsClick}
        onCollapse={() => {}}
        onViewSD09={handleViewSD09}
        onHomeClick={handleHomeClick}
        onViewSavedProjects={handleViewSavedProjects}
        currentView={currentView}
        onProjectsLoad={handleProjectsLoad}
      />

      <main style={{
        flex: 1,
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--bg-secondary)',
        transition: 'margin-left 0.3s ease-in-out',
        marginLeft: '20px',
      }}>
        <div className="content-container card" style={{
          maxWidth: '2200px',
          margin: '0 auto',
          minHeight: 'calc(100vh - var(--spacing-xl) * 2)',
        }}>
          {currentView === 'home' ? children : 
           currentView === 'sd09' ? (
            <Sd09 
              projects={projects}
              visibleColumns={visibleColumns}
              onSaveProjects={(projectsToSave) => {
                setSavedProjects(prev => {
                  const newProjects = projectsToSave.filter(p => 
                    !prev.find(sp => sp.id === p.id)
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
                setSavedProjects(prev => 
                  prev.filter(p => !removedProjects.find(rp => rp.id === p.id))
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