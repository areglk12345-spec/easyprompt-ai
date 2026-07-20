import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCyfY9FX-6vbcQNlZRoNelzW5hAgysuOH8",
  authDomain: "project-42ede.firebaseapp.com",
  projectId: "project-42ede",
  storageBucket: "project-42ede.firebasestorage.app",
  messagingSenderId: "62280786484",
  appId: "1:62280786484:web:1884b30c1f573c8770a061",
  measurementId: "G-GDM2B0VESP"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
