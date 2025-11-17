import { Request, Response, NextFunction } from 'express';
import { admin } from '../firebaseAdmin';
import type { auth } from 'firebase-admin';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: auth.DecodedIdToken;
      uid?: string;
    }
  }
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Expects header format: "Bearer <token>"
 */
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header. Expected format: "Bearer <token>"'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request object
    req.user = decodedToken;
    req.uid = decodedToken.uid;

    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);

    if (error instanceof Error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        details: error.message
      });
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }
  }
};

/**
 * Optional auth middleware - continues even if no token provided
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];

      if (token) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        req.uid = decodedToken.uid;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    console.warn('Optional auth failed, continuing without authentication:', error);
    next();
  }
};
