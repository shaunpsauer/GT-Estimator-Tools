import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onApplyFilter: (filter: string) => void;
  onRemoveFilter: (indexToRemove: number) => void;
  onClearAllFilters: () => void;
  appliedFilters: string[];
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onApplyFilter,
  onRemoveFilter,
  onClearAllFilters,
  appliedFilters,
  placeholder
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowTooltip(false);
    onChange(e.target.value);
  };

  const applyCurrentFilter = () => {
    if (value.trim()) {
      onApplyFilter(value.trim());
      onChange("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        position: "relative",
        width: "100%",
        gap: "15px"
      }}>
        <div style={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: "500px"
        }}>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            style={{
              padding: "8px 12px",
              width: "100%",
              fontSize: "14px",
              borderRadius: "4px",
              border: isFocused ? `2px solid var(--primary-color)` : `1px solid var(--border-color)`,
              boxShadow: `0 2px 4px rgba(0,0,0,0.05)`,
              outline: "none",
              transition: "all 0.2s ease-in-out",
              boxSizing: "border-box",
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowTooltip(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setShowTooltip(false), 200);
            }}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === "Enter" && applyCurrentFilter()}
          />
          <div
            className="search-tooltip"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "white",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              padding: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 1000,
              width: "280px",
              display: showTooltip ? "block" : "none",
              marginTop: "4px",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Search Tips:</h4>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "12px" }}>
              <li>Type normally to search across all columns</li>
              <li>Use "Column: Value" to search specific columns</li>
              <li>Examples:</li>
              <ul style={{ padding: "0 0 0 16px" }}>
                <li>Cost Est.: John Smith</li>
                <li>Line: 300A</li>
                <li>PM: Jane Doe</li>
              </ul>
            </ul>
          </div>
        </div>
        <div style={{ 
          display: "flex", 
          gap: "15px", 
          flexShrink: 0
        }}>
          <button
            onClick={applyCurrentFilter}
            disabled={!value.trim()}
            className="button button-primary"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              cursor: value.trim() ? "pointer" : "not-allowed",
              opacity: value.trim() ? 1 : 0.6,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Apply Filter
          </button>
          {appliedFilters.length > 0 && (
            <button
              onClick={onClearAllFilters}
              className="button"
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                border: `1px solid var(--border-color)`,
                backgroundColor: "white",
                flexShrink: 0,
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {appliedFilters.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {appliedFilters.map((filter, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "16px",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <span>{filter}</span>
              <button
                onClick={() => onRemoveFilter(index)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 