// Shared utilities for bias visualization components
export const getBiasSegmentData = (segment, leftCount, centerCount, rightCount) => {
  const total = leftCount + centerCount + rightCount;
  const leftPercentage = (leftCount / total) * 100;
  const centerPercentage = (centerCount / total) * 100;
  const rightPercentage = (rightCount / total) * 100;

  switch (segment) {
    case 'left':
      return { 
        count: leftCount, 
        percentage: leftPercentage, 
        label: 'Left-leaning', 
        fullLabel: 'Left-leaning sources',
        color: 'bias-left' 
      };
    case 'center':
      return { 
        count: centerCount, 
        percentage: centerPercentage, 
        label: 'Center', 
        fullLabel: 'Center sources',
        color: 'bias-center' 
      };
    case 'right':
      return { 
        count: rightCount, 
        percentage: rightPercentage, 
        label: 'Right-leaning', 
        fullLabel: 'Right-leaning sources',
        color: 'bias-right' 
      };
    default:
      return null;
  }
};

export const handleTooltipMouseEnter = (segment, event, setHoveredSegment, setTooltipPosition, interactive, showTooltip) => {
  if (!interactive || !showTooltip) return;
  
  setHoveredSegment(segment);
  const rect = event.currentTarget.getBoundingClientRect();
  setTooltipPosition({
    x: rect.left + rect.width / 2,
    y: rect.top - 10
  });
};

export const handleTooltipMouseLeave = (setHoveredSegment, interactive) => {
  if (!interactive) return;
  setHoveredSegment(null);
};

export const calculateBiasPercentages = (leftCount, centerCount, rightCount) => {
  const total = leftCount + centerCount + rightCount;
  if (total === 0) return { leftPercentage: 0, centerPercentage: 0, rightPercentage: 0, total: 0 };
  
  return {
    leftPercentage: (leftCount / total) * 100,
    centerPercentage: (centerCount / total) * 100,
    rightPercentage: (rightCount / total) * 100,
    total
  };
};
