import { useState } from 'react';
import MainLayout from './components/MainLayout';
import './styles/global.css';
import { Project } from './types/Project';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);

  const handleProjectsLoad = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  return (
    <MainLayout onProjectsLoad={handleProjectsLoad}>
      <div style={{
        textAlign: 'center',
        padding: 'var(--spacing-xl)',
      }}>
        <h1 style={{ color: 'var(--primary-color)' }}>
          Welcome to The App
        </h1>
        <p>
          Start building your features here
        </p>
      </div>
    </MainLayout>
  );
}

export default App;
