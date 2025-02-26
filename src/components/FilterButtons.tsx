import { useState, useEffect } from 'react';
import { Project } from '../types/Project';

interface FilterButtonsProps {
  projects: Project[];
  onSortedProjectsChange: (projects: Project[]) => void;
}

export const FilterButtons = ({ projects, onSortedProjectsChange }: FilterButtonsProps) => {
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>('mob');

  // Date options for the dropdown
  const dateColumns = [
    { value: 'mob', label: 'MOB' },
    { value: 'jeReadyToRoute', label: 'JE Ready to Route' },
    { value: 'jeApproved', label: 'JE Approved' },
    { value: 'class2', label: 'Class 2' },
    { value: 'class3', label: 'Class 3' },
    { value: 'class5', label: 'Class 5' },
    { value: 'negotiatePrice', label: 'Negotiate Price' },
  ];

  useEffect(() => {
    if (projects.length > 0) {
      sortProjects(selectedDateColumn);
    }
  }, [selectedDateColumn, projects]);

  const sortProjects = (dateColumn: string) => {
    // Create a deep copy of projects to avoid modifying the original array
    const sortedProjects = [...projects];

    // Sort projects based on the selected date column
    sortedProjects.sort((a, b) => {
      const dateA = typeof a[dateColumn] === 'string' ? new Date(a[dateColumn] as string) : new Date(9999, 11, 31);
      const dateB = typeof b[dateColumn] === 'string' ? new Date(b[dateColumn] as string) : new Date(9999, 11, 31);
      
      // Sort by date (ascending)
      return dateA.getTime() - dateB.getTime();
    });

    // Add a category field to each project for highlighting
    const categorizedProjects = sortedProjects.map(project => {
      const projectCopy = { ...project };
      const dateValue = project[dateColumn];
      
      if (!dateValue) {
        projectCopy.dateCategory = 'none';
        return projectCopy;
      }

      const projectDate = typeof dateValue === 'string' ? new Date(dateValue) : new Date(9999, 11, 31);
      const today = new Date();
      
      // Set the time component of today to midnight for accurate comparison
      today.setHours(0, 0, 0, 0);
      
      // Calculate the end of current week (next Sunday)
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
      
      // Calculate the end of current month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Calculate the end of next month
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      // Calculate the end of next 3 months
      const endOfNext3Months = new Date(today.getFullYear(), today.getMonth() + 3, 0);

      // Determine category based on date range
      if (projectDate <= endOfWeek) {
        projectCopy.dateCategory = 'thisWeek'; // Red
      } else if (projectDate <= endOfMonth) {
        projectCopy.dateCategory = 'thisMonth'; // Yellow
      } else if (projectDate <= endOfNextMonth) {
        projectCopy.dateCategory = 'nextMonth'; // Light Green
      } else if (projectDate <= endOfNext3Months) {
        projectCopy.dateCategory = 'next3Months'; // Dark Green
      } else {
        projectCopy.dateCategory = 'future'; // No special highlight
      }

      return projectCopy;
    });

    // Pass the sorted and categorized projects back to the parent component
    onSortedProjectsChange(categorizedProjects);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label 
          htmlFor="dateColumnSelector" 
          style={{ 
            fontWeight: 'bold', 
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)'
          }}
        >
          Sort by:
        </label>
        <select
          id="dateColumnSelector"
          value={selectedDateColumn}
          onChange={(e) => setSelectedDateColumn(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-md)',
            minWidth: '200px'
          }}
        >
          {dateColumns.map((column) => (
            <option key={column.value} value={column.value}>
              {column.label}
            </option>
          ))}
        </select>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginTop: '10px',
        fontSize: 'var(--font-size-sm)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#ffcdd2', 
            borderRadius: '2px' 
          }}></div>
          <span>This Week</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#fff9c4', 
            borderRadius: '2px' 
          }}></div>
          <span>This Month</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#c8e6c9', 
            borderRadius: '2px' 
          }}></div>
          <span>Next Month</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundColor: '#81c784', 
            borderRadius: '2px' 
          }}></div>
          <span>Next 3 Months</span>
        </div>
      </div>
    </div>
  );
};

export default FilterButtons;