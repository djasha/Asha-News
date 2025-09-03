import React, { useState } from 'react';
import ResponsiveHeader from './ResponsiveHeader';
import MobileMenu from './MobileMenu';
import MobileFooter from './MobileFooter';
import BottomNavigation from './BottomNavigation';

const MobileLayout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark paper-texture">
      {/* Responsive Header */}
      <ResponsiveHeader 
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isMenuOpen}
      />

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
      />

      {/* Main Content */}
      <main className="pt-32 lg:pt-36 pb-20 lg:pb-safe min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />

      {/* Mobile Footer - Only visible on desktop */}
      <div className="hidden lg:block">
        <MobileFooter />
      </div>
    </div>
  );
};

export default MobileLayout;
