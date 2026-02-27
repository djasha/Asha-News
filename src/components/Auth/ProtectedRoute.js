import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute - Route wrapper for role-based access control
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string[]} allowedRoles - Array of roles allowed to access (e.g., ['admin', 'moderator'])
 * @param {string} redirectTo - Where to redirect if unauthorized (default: '/dashboard')
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/dashboard',
  requireAuth = true 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0) {
    const userRole = user?.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      // Unauthorized - show access denied
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark p-4">
          <div className="max-w-md w-full bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Access Denied
            </h2>
            
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              You don't have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users only.
            </p>
            
            <div className="space-y-3">
              <a
                href={redirectTo}
                className="block w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </a>
              <a
                href="/"
                className="block w-full px-4 py-2 border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-lg font-medium hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                Return Home
              </a>
            </div>
            
            {user && (
              <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <p>Signed in as: <span className="font-medium">{user.email}</span></p>
                <p>Your role: <span className="font-medium">{userRole}</span></p>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // User is authorized
  return children;
};

export default ProtectedRoute;
