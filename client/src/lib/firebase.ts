import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase web config for project "resturent-nine".
// These values are public identifiers (not secrets) and are meant to ship in
// browser code. Access is protected by Firebase Security Rules and, for the
// API key, by key restrictions in Google Cloud Console.
const firebaseConfig = {
  apiKey: "AIzaSyAa0LCFOT_n8ThcxTtZKUVdQgtdq98l7EA",
  authDomain: "resturent-nine.firebaseapp.com",
  projectId: "resturent-nine",
  storageBucket: "resturent-nine.firebasestorage.app",
  messagingSenderId: "984696328217",
  appId: "1:984696328217:web:be47a6baba7387ea71da88",
};

// Reuse the existing instance if the module is loaded more than once (hot reload).
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
