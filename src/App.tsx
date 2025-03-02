import { useState } from "react";
import MainLayout from "./components/MainLayout";
import "./styles/global.css";
import { Project } from "./types/Project";
//import { Icon } from "@mui/material";
import { Search, Save, AlertTriangle } from "react-feather";

interface NavButton {
  icon: any;
  label: string;
  view: string;
  disabled?: boolean;
}

const SquareButton = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: any;
  label: String;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "150px",
        height: "150px",
        backgroundColor: disabled ? "#cccccc" : "var(--primary-color)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxShadow: "0 5px 15px var(--shadow-color)",
        transition: "transform 0.2s, background-color 0.2s",
        margin: "10px",
        opacity: disabled ? 0.7 : 1,
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "var(--primary-dark)";
          e.currentTarget.style.transform = "translateY(-5px)";
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "var(--primary-color)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      <Icon size={48} style={{ marginBottom: "10px" }} />
      <span style={{ fontWeight: "bold", fontSize: "18px" }}>{label}</span>
    </button>
  );
};

function App() {
  const [, setProjects] = useState<Project[]>([]);

  const handleProjectsLoad = (newProjects: Project[]) => {
    setProjects(newProjects);
  };

  const navButtons: NavButton[] = [
    {
      icon: Search,
      label: "SD-09 Viewer",
      view: "sd09",
    },
    {
      icon: Save,
      label: "Saved Projects",
      view: "saved-projects",
    },
    {
      icon: AlertTriangle,
      label: "Future Tools",
      view: "future-tools",
    },
    {
      icon: AlertTriangle,
      label: "Future Tools",
      view: "future-tools",
    },
  ];

  const handleNavagation = (view: string) => {
    const event = new CustomEvent("changeView", { detail: view });
    window.dispatchEvent(event);
  };

  return (
    <MainLayout onProjectsLoad={handleProjectsLoad}>
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          //textShadow: "0 0 5px var(--primary-color)",
          padding: "var(--spacing-xl)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 200px",
        }}
      >
        <h1 style={{ color: "var(--primary-color)" }}>GT Estimator Tools</h1>
        <p>Select a tool</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "800px",
            gap: "20px",
          }}
        >
          {navButtons.map((button, index) => (
            <SquareButton
              key={index}
              icon={button.icon}
              label={button.label}
              disabled={button.disabled}
              onClick={() => handleNavagation(button.view)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
