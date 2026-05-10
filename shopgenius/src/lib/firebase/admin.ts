// Firebase Admin SDK — server-side only
// Gracefully handles missing credentials (build time / preview deploys)

import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function getAdminApp() {
  if (
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getApps, initializeApp, cert } = require("firebase-admin/app");
    if (getApps().length > 0) return getApps()[0];

    return initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } catch (err) {
    console.warn("Firebase Admin init failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function getAuth(): Auth | null {
  if (!_adminAuth) {
    const app = getAdminApp();
    if (!app) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth: _getAuth } = require("firebase-admin/auth");
    _adminAuth = _getAuth(app) as Auth;
  }
  return _adminAuth;
}

function getDb(): Firestore | null {
  if (!_adminDb) {
    const app = getAdminApp();
    if (!app) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getFirestore } = require("firebase-admin/firestore");
    _adminDb = getFirestore(app) as Firestore;
  }
  return _adminDb;
}

/** Firebase Admin Auth proxy — throws if not configured */
export const adminAuth = {
  verifyIdToken: async (token: string) => {
    const auth = getAuth();
    if (!auth) throw new Error("Firebase Admin not configured. Set FIREBASE_ADMIN_PRIVATE_KEY.");
    return auth.verifyIdToken(token);
  },
};

/** Firebase Admin Firestore proxy — throws if not configured */
export const adminDb = {
  collection: (path: string) => {
    const db = getDb();
    if (!db) throw new Error("Firebase Admin not configured. Set FIREBASE_ADMIN_PRIVATE_KEY.");
    return db.collection(path);
  },
};
