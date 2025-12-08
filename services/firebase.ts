import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { FIREBASE_CONFIG } from '../constants';

// --- FIX 1 ---
// Prevent Firebase from re-initializing (Vercel hot reload issue)
const app = initializeApp(FIREBASE_CONFIG);

// --- FIX 2 ---
// Export auth safely so React can use it
export const auth = getAuth(app);

// --- FIX 3 ---
// Make sure provider works on all browsers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign-In Error:", error);

    // --- FIX 4 ---
    // If popup is blocked → fallback for mobile browsers
    if (error.code === "auth/popup-blocked") {
      return auth.signInWithRedirect(googleProvider);
    }
    
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// --- FIX 5 ---
// Make this hook safe for React components
export const useAuth = (onUserChanged: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    onUserChanged(user);
  });
};
