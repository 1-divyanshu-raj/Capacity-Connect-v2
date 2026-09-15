import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserProfile, UserRole } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'capacity_connect_production_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function generateToken(user: UserProfile): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function createLoginChallengeToken(payload: {
  stage: 'step1_completed' | 'step2_completed';
  userId: string;
  email: string;
  role: UserRole;
  selectedRole: UserRole;
}): string {
  return jwt.sign(
    {
      type: 'login_challenge',
      stage: payload.stage,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      selectedRole: payload.selectedRole
    },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

export function verifyLoginChallengeToken(token: string): {
  type: string;
  stage: 'step1_completed' | 'step2_completed';
  userId: string;
  email: string;
  role: UserRole;
  selectedRole: UserRole;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.type === 'login_challenge') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function createRegistrationOtpToken(contact: string): string {
  return jwt.sign(
    {
      type: 'registration_otp_verified',
      contact: contact.trim().toLowerCase()
    },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

export function verifyRegistrationOtpToken(token: string): { contact: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.type === 'registration_otp_verified' && decoded.contact) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please log in again.' });
  }

  const user = db.getUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Account not found.' });
  }

  if (user.status === 'suspended' || user.status === 'rejected') {
    return res.status(403).json({ error: `Your account is ${user.status}. Access denied.` });
  }

  req.user = db.sanitizeUser(user);
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Unauthorized: This resource requires one of [${allowedRoles.join(', ')}] permissions.` 
      });
    }

    if (req.user.role === 'admin' && req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Administrator account requires approval from an active administrator.' 
      });
    }

    next();
  };
}
