import { initializeApp, getApps, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase (Admin SDK) — used for the Firestore database.
 *
 * Credentials (a Firebase service account), either:
 *  - FIREBASE_SERVICE_ACCOUNT: the whole service-account JSON as one value (Vercel), or
 *  - GOOGLE_APPLICATION_CREDENTIALS: path to the downloaded JSON file (local).
 *
 * Get it from Firebase console → Project settings → Service accounts →
 * Generate new private key. It is a SECRET: never commit it.
 */
export function hasFirebaseCredentials(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    let account: Record<string, string>;
    try {
      account = JSON.parse(json);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole service-account file contents.");
    }
    // Some hosts store the key with literal "\n" sequences.
    if (account.private_key) {
      account.private_key = account.private_key.replace(/\\n/g, "\n");
    }
    return initializeApp({ credential: cert(account as any), projectId: account.project_id });
  }

  return initializeApp({ credential: applicationDefault() });
}

let firestore: Firestore | null = null;

export function getDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
    // Treat `undefined` fields as "not set" instead of throwing.
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}
