import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma, Issuer } from "@provenance/db";

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

const JWT_SECRET = process.env.JWT_SECRET || "placeholder_jwt_secret_phase0";

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication token required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtTokenPayload;
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (_error) {
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
