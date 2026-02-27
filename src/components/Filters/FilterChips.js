import React from 'react';

const FilterChips = ({ 
  options, 
  selectedValue, 
  onChange, 
  label,
  multiSelect = false,
  className = ''
}) => {
  const handleChipClick = (value) => {
    if (multiSelect) {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onChange(newValues);
    } else {
      onChange(selectedValue === value ? null : value);
    }
  };

  const isSelected = (value) => {
    if (multiSelect) {
      return Array.isArray(selectedValue) && selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const displayLabel = typeof option === 'string' ? option : option.label;
          const selected = isSelected(value);
          
          return (
            <button
              key={value}
              onClick={() => handleChipClick(value)}
              className={`px-3 py-2 text-sm font-medium rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0 sm:py-1.5 ${
                selected
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-primary-300 dark:border-primary-700 hover:bg-accent-paper-light dark:hover:bg-accent-paper-dark'
              }`}
              aria-pressed={selected}
              aria-label={`${selected ? 'Remove' : 'Add'} ${displayLabel} filter`}
            >
              {displayLabel}
              {selected && multiSelect && (
                <span className="ml-1 text-xs">×</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterChips;
