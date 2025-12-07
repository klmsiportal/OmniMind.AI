import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../constants';

const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export const useAuth = (onUserChanged: (user: FirebaseUser | null) => void) => {
  // This is a helper, but actual usage will be in a React hook
  return onAuthStateChanged(auth, onUserChanged);
};
