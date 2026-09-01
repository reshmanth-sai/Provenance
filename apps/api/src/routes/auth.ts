import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma, hashPassword, comparePassword } from "@provenance/db";
import { authenticateToken, requireRole, JwtTokenPayload } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "placeholder_jwt_secret_phase0";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "placeholder_jwt_refresh_secret_phase0";

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

    // Issue 15-minute JWT access token
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

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

// GET /auth/me
router.get("/me", authenticateToken, (req: Request, res: Response): void => {
  res.status(200).json({
    id: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
  });
});

// Diagnostic routes (temporary test endpoints)
router.get(
  "/test-issuer-only",
  authenticateToken,
  requireRole("issuer_staff"),
  (_req: Request, res: Response): void => {
    res.status(200).json({ ok: true });
  }
);

router.get(
  "/test-admin-only",
  authenticateToken,
  requireRole("platform_admin"),
  (_req: Request, res: Response): void => {
    res.status(200).json({ ok: true });
  }
);

export default router;
