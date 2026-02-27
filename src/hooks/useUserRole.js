import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for role-based access control
 * Returns role checking functions
 */
const useUserRole = () => {
  const { user } = useAuth();
  
  const userRole = user?.role || 'user';

  // Check if user is admin
  const isAdmin = () => userRole === 'admin';

  // Check if user is moderator
  const isModerator = () => userRole === 'moderator';

  // Check if user has admin or moderator access
  const isStaff = () => userRole === 'admin' || userRole === 'moderator';

  // Check if user has specific role
  const hasRole = (role) => userRole === role;

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => roles.includes(userRole);

  // Get display name for current role
  const getRoleDisplay = () => {
    const roleNames = {
      admin: 'Administrator',
      moderator: 'Moderator',
      premium: 'Premium User',
      user: 'User'
    };
    return roleNames[userRole] || 'User';
  };

  return {
    userRole,
    isAdmin: isAdmin(),
    isModerator: isModerator(),
    isStaff: isStaff(),
    hasRole,
    hasAnyRole,
    getRoleDisplay: getRoleDisplay()
  };
};

export default useUserRole;
