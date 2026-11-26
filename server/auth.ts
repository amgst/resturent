import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase Auth ID tokens are JWTs signed by Google. We verify them against
// Google's public keys, so no service-account secret is needed on the server.
// Uses the same project ID as the web app, so one .env value covers both.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export interface AuthUser {
  uid: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Endpoints the public customer menu needs; everything else under /api needs a login.
const PUBLIC_ENDPOINTS: Array<[method: string, path: RegExp]> = [
  ["GET", /^\/api\/locations\/?$/],
  ["GET", /^\/api\/menu-categories\/?$/],
  ["GET", /^\/api\/menu-items(\/[^/]+)?\/?$/],
  ["POST", /^\/api\/orders\/?$/],
  // Branding only (name, logo, colour, tagline, tax, currency) for the customer menu and login screen.
  ["GET", /^\/api\/settings\/?$/],
];

function isPublic(req: Request): boolean {
  return PUBLIC_ENDPOINTS.some(([method, path]) => req.method === method && path.test(req.path));
}

export async function verifyFirebaseToken(token: string): Promise<AuthUser> {
  if (!PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID is not set");
  }
  const { payload } = await jwtVerify(token, googleKeys, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
    algorithms: ["RS256"],
  });
  if (!payload.sub) {
    throw new Error("Token has no user id");
  }
  return { uid: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined };
}

/** Requires a valid Firebase login for every /api request except the public ones. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api") || isPublic(req)) {
    return next();
  }

  if (!PROJECT_ID) {
    // Fail closed: never let requests through when auth isn't configured.
    console.error("Auth is not configured: set VITE_FIREBASE_PROJECT_ID (or FIREBASE_PROJECT_ID).");
    return res.status(500).json({ error: "Server sign-in is not configured" });
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Please sign in" });
  }

  try {
    req.user = await verifyFirebaseToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired, please sign in again" });
  }
}
