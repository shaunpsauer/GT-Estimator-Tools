import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types/Project';
import { Calendar, ChevronDown } from 'react-feather';

interface DateFilterProps {
  projects: Project[];
  onApplyFilter: (filteredProjects: Project[], filterType: string) => void;
  onClearFilter: () => void;
}

const dateFields = [
  { key: 'commitmentDate', label: 'Commitment Date' },
  { key: 'class5', label: 'Class 5' },
  { key: 'class4', label: 'Class 4' },
  { key: 'class3', label: 'Class 3' },
  { key: 'class2', label: 'Class 2' },
  { key: 'jeReadyToRoute', label: 'JE Ready' },
  { key: 'jeApproved', label: 'JE Approved' },
  { key: 'mob', label: 'mob' },
  { key: 'ifc', label: 'IFC' }
];

const filterOptions = [
  { key: 'upcoming30days', label: 'Next 30 Days', days: 30 },
  { key: 'upcoming60days', label: 'Next 60 Days', days: 60 },
  { key: 'upcoming90days', label: 'Next 90 Days', days: 90 },
  { key: 'pastDue', label: 'Past Due', days: 0 }
];

const Dropdown = ({ style, children }: { style: React.CSSProperties, children: React.ReactNode }) => {
  return createPortal(
    <div style={{
      ...style,
      position: 'fixed',
      zIndex: 9999,
    }}>
      {children}
    </div>,
    document.body
  );
};

export const DateFilterButtons: React.FC<DateFilterProps> = ({ 
  projects, 
  onApplyFilter,
  onClearFilter
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState(dateFields[0]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectDateField = (field: typeof dateFields[0]) => {
    setSelectedDateField(field);
    setIsDropdownOpen(false);
    setActiveFilter(null);
    onClearFilter();
  };

  const getFilteredProjects = (filterKey: string, days: number) => {
    const today = new Date();
    const fieldKey = selectedDateField.key;
    
    return projects.filter(project => {
      const dateValue = project[fieldKey];
      if (!dateValue || typeof dateValue !== 'string') return false;
      
      try {
        const projectDate = new Date(dateValue);
        
        if (isNaN(projectDate.getTime())) return false;
        
        if (filterKey === 'pastDue') {
          return projectDate < today;
        } else {
          const timeDiff = projectDate.getTime() - today.getTime();
          const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return dayDiff >= 0 && dayDiff <= days;
        }
      } catch (e) {
        return false;
      }
    });
  };

  const handleFilterClick = (filterKey: string, days: number) => {
    if (activeFilter === filterKey) {
      setActiveFilter(null);
      onClearFilter();
      return;
    }
    
    const filteredProjects = getFilteredProjects(filterKey, days);
    setActiveFilter(filterKey);
    onApplyFilter(filteredProjects, `${selectedDateField.label} - ${filterKey}`);
  };

  return (
    <div className="responsive-filters" style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '150px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            <span>{selectedDateField.label}</span>
          </div>
          <ChevronDown size={14} />
        </button>

        {isDropdownOpen && (
          <Dropdown style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            boxShadow: '0 4px 6px var(--shadow-dark)',
            width: '150px',
          }}>
            {dateFields.map((field) => (
              <div
                key={field.key}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  cursor: 'pointer',
                  backgroundColor: selectedDateField.key === field.key ? 'var(--bg-secondary)' : 'transparent',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: 'var(--font-size-sm)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 
                  selectedDateField.key === field.key ? 'var(--bg-secondary)' : 'transparent'}
                onClick={() => selectDateField(field)}
              >
                {field.label}
              </div>
            ))}
          </Dropdown>
        )}
      </div>

      {filterOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => handleFilterClick(option.key, option.days)}
          className={`button ${activeFilter === option.key ? 'button-primary' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default DateFilterButtons;