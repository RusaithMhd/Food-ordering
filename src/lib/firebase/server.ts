import type { Auth } from 'firebase-admin/auth';

let adminAuthInstance: Auth | null = null;

function getAdminAuthInstance(): Auth {
  if (!adminAuthInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase-admin/auth');

    if (!getApps().length) {
      try {
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY
              ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
              : undefined,
          }),
        });
      } catch (error) {
        console.error('Firebase admin initialization error', error);
      }
    }
    adminAuthInstance = getAuth();
  }
  return adminAuthInstance!;
}

export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getAdminAuthInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
