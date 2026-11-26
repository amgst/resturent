import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import { queryClient } from "./queryClient";

/**
 * Adds the signed-in user's Firebase ID token to every request for /api/...
 * Covers both apiRequest() and the plain fetch() calls used across the pages.
 */
function installAuthFetch() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : null;
    const isApiCall =
      url !== null && (url.startsWith("/api") || url.startsWith(`${window.location.origin}/api`));

    if (isApiCall) {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (user) {
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
        return originalFetch(input, { ...init, headers });
      }
    }
    return originalFetch(input, init);
  };
}

installAuthFetch();

interface AuthState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // Don't leave the previous user's data in the cache.
    queryClient.clear();
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
