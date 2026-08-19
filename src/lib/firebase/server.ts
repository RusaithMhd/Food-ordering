import type { Auth } from 'firebase-admin/auth';

let adminAuthInstance: Auth | null = null;

function getAdminAuthInstance(): Auth {
  if (!adminAuthInstance) {
    // Validate required env vars before attempting initialization
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new Error(
        `Firebase Admin: missing environment variables. ` +
        `projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKeyRaw}. ` +
        `Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your deployment environment.`
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require('firebase-admin/auth');

    if (!getApps().length) {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n').replace(/"/g, '');
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
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
