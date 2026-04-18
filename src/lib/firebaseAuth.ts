'use client';

import { getAuth, Auth } from "firebase/auth";
import { getApps, getApp, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let authInstance: Auth | null = null;

export const getFirebaseAuth = (): Auth | null => {
  
  
  if (typeof window === 'undefined') {
    console.error("❌ ERROR: getFirebaseAuth() called on server-side - window is undefined");
    return null;
  }
  
  if (!authInstance) {
   
    // Initialize app if not already initialized
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    
  }
  
  return authInstance;
};

// Export for backwards compatibility
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null;