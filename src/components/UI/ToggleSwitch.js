import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label, 
  description, 
  size = 'medium',
  hapticFeedback = true 
}) => {
  const { triggerHaptic } = usePreferences();

  const handleChange = (e) => {
    if (hapticFeedback) {
      triggerHaptic('light');
    }
    onChange(e);
  };

  const sizeClasses = {
    small: 'w-8 h-5 after:h-4 after:w-4',
    medium: 'w-11 h-6 after:h-5 after:w-5',
    large: 'w-14 h-7 after:h-6 after:w-6'
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
          {label}
        </h4>
        {description && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {description}
          </p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className="sr-only peer"
        />
        <div className={`${sizeClasses[size]} bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all dark:border-gray-600 peer-checked:bg-primary-600`}></div>
      </label>
    </div>
  );
};

export default ToggleSwitch;
