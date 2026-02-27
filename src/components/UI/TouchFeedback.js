import React, { useState } from 'react';

const TouchFeedback = ({ children, className = '', disabled = false, onPress, ...props }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsPressed(true);
    props.onTouchStart?.(e);
  };

  const handleTouchEnd = (e) => {
    if (disabled) return;
    setIsPressed(false);
    onPress?.(e);
    props.onTouchEnd?.(e);
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    setIsPressed(true);
    props.onMouseDown?.(e);
  };

  const handleMouseUp = (e) => {
    if (disabled) return;
    setIsPressed(false);
    onPress?.(e);
    props.onMouseUp?.(e);
  };

  const handleMouseLeave = (e) => {
    setIsPressed(false);
    props.onMouseLeave?.(e);
  };

  const handleClick = (e) => {
    if (disabled) return;
    onPress?.(e);
    props.onClick?.(e);
  };

  return (
    <div
      {...props}
      className={`${className} ${
        isPressed && !disabled 
          ? 'transform scale-95 opacity-80' 
          : ''
      } transition-all duration-150 ease-out touch-manipulation ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default TouchFeedback;
