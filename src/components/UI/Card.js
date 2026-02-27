import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-lg shadow-md border border-border-light dark:border-border-dark ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-border-light dark:border-border-dark ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};
