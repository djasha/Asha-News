import React, { useState } from 'react';

const SourceLogo = ({ sourceName, size = 'sm', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  // Generate logo URL based on source name
  const getLogoUrl = (name) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanName}.com`;
  };

  // Generate initials fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate background color based on source name
  const getBackgroundColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-pink-500'
    ];
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (imageError || !sourceName) {
    return (
      <div className={`${sizeClasses[size]} ${getBackgroundColor(sourceName)} rounded-full flex items-center justify-center text-white font-medium text-xs ${className}`}>
        {getInitials(sourceName || 'UN')}
      </div>
    );
  }

  return (
    <img
      src={getLogoUrl(sourceName)}
      alt={`${sourceName} logo`}
      className={`${sizeClasses[size]} rounded-full object-cover bg-surface-elevated-light dark:bg-surface-elevated-dark ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default SourceLogo;
