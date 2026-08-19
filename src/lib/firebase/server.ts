import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle newlines in private key securely (Vercel adds literal \n or quotes)
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = (() => {
  try {
    return getAuth();
  } catch (error) {
    console.error('Failed to get Firebase Auth instance', error);
    return null as any;
  }
})();
