import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma, hashPassword, comparePassword } from "@provenance/db";
import { authenticateToken, requireRole, JwtTokenPayload, JWT_SECRET, JWT_REFRESH_SECRET } from "../middleware/auth.js";

const router = Router();

// POST /auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    // CRITICAL SECURITY REQUIREMENT:
    // Role is strictly hardcoded to 'candidate' on server side.
    // Client-supplied role field is ignored.
    const role = "candidate";
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error during registration" });
  }
});

// POST /auth/register-institution
router.post("/register-institution", async (req: Request, res: Response): Promise<void> => {
  try {
    const { institutionName, domain, email, password } = req.body;

    if (!institutionName || typeof institutionName !== "string" || !institutionName.trim()) {
      res.status(400).json({ error: "Institution name is required" });
      return;
    }

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      res.status(400).json({ error: "Institutional domain is required (e.g. harvard.edu)" });
      return;
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid staff email address is required" });
      return;
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const cleanDomain = domain.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check if domain is already registered
    const existingDomain = await prisma.issuer.findUnique({
      where: { domain: cleanDomain },
    });
    if (existingDomain) {
      res.status(409).json({ error: "An institution with this domain is already registered" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      res.status(409).json({ error: "An account with this staff email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Create Issuer in pending status and Staff user
    const [issuer, user] = await prisma.$transaction(async (tx) => {
      const newIssuer = await tx.issuer.create({
        data: {
          name: institutionName.trim(),
          domain: cleanDomain,
          status: "pending",
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: "issuer_staff",
        },
      });

      const linkId = `${newIssuer.id}-${newUser.id}`.slice(0, 36);
      await tx.issuerUser.create({
        data: {
          id: linkId,
          issuerId: newIssuer.id,
          userId: newUser.id,
          role: "staff",
        },
      });

      return [newIssuer, newUser];
    });

    res.status(201).json({
      message: "Institution application submitted successfully. Awaiting platform administrator verification.",
      issuer: {
        id: issuer.id,
        name: issuer.name,
        domain: issuer.domain,
        status: issuer.status,
      },
      staffUser: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Institution registration error:", error);
    res.status(500).json({ error: "Internal server error during institution registration" });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const payload: JwtTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Issue JWT access token (15m default, configurable via env for testing)
    const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || "15m") as string;
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: accessExpiry as any });

    // Issue 7-day JWT refresh token in httpOnly cookie
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      res.status(401).json({ error: "Refresh token required in cookie" });
      return;
    }

    // Verify refresh token signature
    let decoded: JwtTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtTokenPayload;
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Ensure user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    const payload: JwtTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Issue fresh access token (15m default, configurable via env for testing)
    const accessExpiry = (process.env.JWT_ACCESS_EXPIRY || "15m") as string;
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: accessExpiry as any });

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error during token refresh" });
  }
});

// POST /auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get("/me", authenticateToken, (req: Request, res: Response): void => {
  res.status(200).json({
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
  });
});

export default router;
