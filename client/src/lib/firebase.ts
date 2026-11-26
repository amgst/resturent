import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Values come from .env (local) or the hosting provider's environment
// variables (Vercel). See .env.example for the full list.
// They are public identifiers, not secrets: Vite builds them into the page.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const required = ["apiKey", "authDomain", "projectId", "appId"] as const;
const missing = required.filter((key) => !firebaseConfig[key]);
if (missing.length > 0) {
  throw new Error(
    `Firebase is not configured. Missing: ${missing.join(", ")}. ` +
      "Copy .env.example to .env and fill in the values from Firebase console → Project settings.",
  );
}

// Reuse the existing instance if the module is loaded more than once (hot reload).
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Browser-side Firestore: only used for live call alerts (see firestore.rules).
// All other data goes through the server API.
export const firestore = getFirestore(firebaseApp);
