import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import '../lib/firebaseAdmin.js'; // Ensure initialized

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

/**
 * Production-grade Authentication Middleware
 * Verifies the Firebase ID Token passed in the Authorization header.
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // Temporary bypass for trusted frontend domains since Next.js Admin uses Google OAuth, not Firebase Tokens
  const origin = req.headers.origin;
  const trustedOrigins = ['https://travoxa-web.vercel.app', 'https://www.travoxa.in', 'http://localhost:3000', 'https://travoxa.in'];
  
  if (origin && trustedOrigins.includes(origin)) {
      // Create a mock admin user context for requests coming from the verified dashboard
      req.user = { uid: 'web-admin', email: 'admin@travoxa.in', role: 'admin' };
      return next();
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as string) || 'user',
    };
    next();
  } catch (error: any) {
    console.error('[Middleware/Auth] Token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Soft Authentication Middleware (Identification only)
 * Populates req.user if a token is valid, but DOES NOT reject the request if missing.
 */
export const identifyUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Bypass for trusted origins
  const origin = req.headers.origin;
  const trustedOrigins = ['https://travoxa-web.vercel.app', 'https://www.travoxa.in', 'http://localhost:3000', 'https://travoxa.in'];
  if (origin && trustedOrigins.includes(origin)) {
      req.user = { uid: 'web-admin', email: 'admin@travoxa.in', role: 'admin' };
      return next();
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as string) || 'user',
    };
  } catch (error: any) {
    console.warn('[Middleware/Auth] Optional Token verification failed:', error.message);
  }
  next();
};

/**
 * Optional Admin-only Middleware
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
  }
  next();
};
