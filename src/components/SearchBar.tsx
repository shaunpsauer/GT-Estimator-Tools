import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setCurrentSearch(newSearch);
    onChange(newSearch);
  };

  const applyCurrentFilter = () => {
    if (currentSearch.trim()) {
      const newFilters = [...appliedFilters, currentSearch.trim()];
      setAppliedFilters(newFilters);
      onChange(currentSearch.trim());
      setCurrentSearch("");
    }
  };

  const removeFilter = (indexToRemove: number) => {
    const newFilters = appliedFilters.filter((_, index) => index !== indexToRemove);
    setAppliedFilters(newFilters);
    onChange(currentSearch);
  };

  const clearAllFilters = () => {
    setAppliedFilters([]);
    setCurrentSearch("");
    onChange("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          style={{
            padding: "8px 12px",
            width: "100%",
            minWidth: "200px",
            maxWidth: "300px",
            fontSize: "14px",
            borderRadius: "4px",
            border: isFocused ? `2px solid var(--primary-color)` : `1px solid var(--border-color)`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.05)`,
            outline: "none",
            transition: "all 0.2s ease-in-out",
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === "Enter" && applyCurrentFilter()}
        />
        <button
          onClick={applyCurrentFilter}
          disabled={!currentSearch.trim()}
          className="button button-primary"
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: currentSearch.trim() ? "pointer" : "not-allowed",
            opacity: currentSearch.trim() ? 1 : 0.6,
            whiteSpace: "nowrap",
          }}
        >
          Apply Filter
        </button>
        {(appliedFilters.length > 0 || currentSearch) && (
          <button
            onClick={clearAllFilters}
            className="button"
            style={{
              padding: "10px 20px",
              fontSize: "var(--font-size-md)",
              border: `1px solid var(--border-color)`,
              backgroundColor: "white",
            }}
          >
            Clear All
          </button>
        )}
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
                onClick={() => removeFilter(index)}
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