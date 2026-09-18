import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma, Issuer } from "@provenance/db";
import { recordSecurityEvent } from "../services/security-logger.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface JwtTokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      issuer?: Issuer;
    }
  }
}

export function getJwtSecrets(): { secret: string; refreshSecret: string } {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Fatal: JWT_SECRET environment variable is unset or shorter than 32 characters. Refusing to boot.");
  }
  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error("Fatal: JWT_REFRESH_SECRET environment variable is unset or shorter than 32 characters. Refusing to boot.");
  }

  return { secret, refreshSecret };
}

export const { secret: JWT_SECRET, refreshSecret: JWT_REFRESH_SECRET } = getJwtSecrets();

/**
 * Global authentication middleware: strictly requires Authorization: Bearer <token> header.
 * Query string token parameter is NOT permitted on standard API endpoints.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "Authentication token required" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (_error) {
    recordSecurityEvent({
      req,
      action: "jwt_verification_failed",
      severity: "warning",
      targetType: "auth_token",
      metadata: { reason: _error instanceof Error ? _error.message : "invalid_token" },
    });
    res.status(401).json({ error: "Invalid or expired access token" });
    return;
  }
}

/**
 * Dedicated authentication middleware scoped exclusively to document streaming routes
 * (e.g. iframe embedded document views) where headers cannot be attached by browser <iframe> tags.
 */
export function authenticateStreamToken(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (typeof req.query.token === "string" && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: "Authentication token required" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (_error) {
    recordSecurityEvent({
      req,
      action: "jwt_verification_failed",
      severity: "warning",
      targetType: "stream_token",
      metadata: { reason: _error instanceof Error ? _error.message : "invalid_token" },
    });
    res.status(401).json({ error: "Invalid or expired access token" });
    return;
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      recordSecurityEvent({
        req,
        action: "privilege_escalation_attempt",
        severity: "security_alert",
        actorId: req.user.id,
        targetType: "rbac",
        metadata: {
          requiredRoles: allowedRoles,
          actualRole: req.user.role,
          userEmail: req.user.email,
        },
      });
      res.status(403).json({ error: "Forbidden: insufficient permissions for this role" });
      return;
    }

    next();
  };
}

/**
 * Authorization gate for issuer actions.
 * Checks that the authenticated issuer staff member belongs to an Issuer whose status is 'approved'.
 */
export async function requireApprovedIssuer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    // Find issuer linked to this user
    const issuerUser = await prisma.issuerUser.findFirst({
      where: { userId: req.user.id },
    });

    if (!issuerUser) {
      res.status(403).json({ error: "Forbidden: no institution profile linked to this user" });
      return;
    }

    const issuer = await prisma.issuer.findUnique({
      where: { id: issuerUser.issuerId },
    });

    if (!issuer) {
      res.status(403).json({ error: "Forbidden: linked institution not found" });
      return;
    }

    if (issuer.status !== "approved") {
      res.status(403).json({
        error: "Forbidden: institution account is pending administrator approval or has been rejected",
        institutionStatus: issuer.status,
      });
      return;
    }

    req.issuer = issuer;
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error during authorization check" });
    return;
  }
}
