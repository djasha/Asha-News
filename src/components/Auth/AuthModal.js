import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 pointer-events-none">
          <div className="relative w-full max-w-md bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl shadow-2xl pointer-events-auto">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-surface-light dark:bg-surface-dark rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Form Content */}
            <div className="p-6">
              {mode === 'login' ? (
                <LoginForm 
                  onSwitchToRegister={handleSwitchMode}
                  onClose={onClose}
                />
              ) : (
                <RegisterForm 
                  onSwitchToLogin={handleSwitchMode}
                  onClose={onClose}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
