import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configurations
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure local cache persistence for secure offline support
const cacheConfig = persistentLocalCache({
  tabManager: persistentMultipleTabManager()
});

// Using single force long polling to solve connection problems within preview environment iframes safely
const db = initializeFirestore(app, {
  localCache: cacheConfig,
  experimentalForceLongPolling: true
});

const auth = getAuth(app);

export { db, auth };

export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE'
}

export function handleFirestoreError(error: any, operation: OperationType = OperationType.READ) {
  console.error(`Firebase operation error during [${operation}]:`, error);
  return {
    success: false,
    error: error.message || 'An error occurred while communicating with the database.'
  };
}

export const isFirebaseAvailable = () => {
  return !!db && !!auth;
};