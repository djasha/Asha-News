import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuTdnqYtbmlyuTAr5p531gBQBzS0xEAQ4",
  authDomain: "ashanews-c2bc2.firebaseapp.com",
  projectId: "ashanews-c2bc2",
  storageBucket: "ashanews-c2bc2.firebasestorage.app",
  messagingSenderId: "177464917453",
  appId: "1:177464917453:web:12b057179f9d375b6d1884",
  measurementId: "G-3ZCMPVCFZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Analytics (only if supported in browser)
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
}).catch(err => {
  console.log('Analytics not supported:', err);
});

export { analytics };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth service functions
export const firebaseAuthService = {
  // Sign up with email and password
  signUpWithEmail: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Sign in with email and password
  signInWithEmail: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        success: true,
        user: result.user,
        credential: GoogleAuthProvider.credentialFromResult(result)
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }
      
      await updateProfile(user, updates);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: getFirebaseErrorMessage(error.code)
      };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get user token
  getUserToken: async (forceRefresh = false) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }
};

// Helper function to convert Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
    'auth/popup-blocked': 'Popup was blocked by the browser. Please allow popups for this site.'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

export default app;
