import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import { prisma } from "@provenance/db";
import authRoutes from "./routes/auth.js";
import candidateRoutes from "./routes/candidate.js";
import documentRoutes from "./routes/documents.js";
import adminRoutes from "./routes/admin.js";
import issuerRoutes from "./routes/issuer.js";
import publicRoutes from "./routes/public.js";
import { recordSecurityEvent } from "./services/security-logger.js";
import { checkRasterizerAvailability } from "./services/pdf-rasterizer.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Trust first proxy (reverse proxy / load balancer like Nginx, Cloudflare, Render, AWS ALB)
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // For disallowed origins, omit Access-Control-Allow-Origin so the browser enforces the block
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Production HTTP Security Headers for Express API
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

// Basic rate limiting on auth endpoints (100 requests per 15 minutes) with security event notification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    recordSecurityEvent({
      req,
      action: "rate_limit_exceeded",
      severity: "warning",
      targetType: "auth_endpoint",
      metadata: { limit: options.max, windowMs: options.windowMs },
    });
    res.status(options.statusCode).json(options.message);
  },
});

app.use("/auth", authLimiter, authRoutes);
app.use("/candidate", candidateRoutes);
app.use("/documents", documentRoutes);
app.use("/admin", adminRoutes);
app.use("/issuer", issuerRoutes);
app.use("/", publicRoutes);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    // Verify database connectivity using Prisma
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (error) {
    console.error("Health check database error:", error);
    res.status(500).json({
      status: "error",
      message: "Service unavailable",
    });
  }
});

// Global error handler: never leak internal stack traces or filesystem paths to unauthenticated callers
app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error("Unhandled application error:", err);
  res.status(err.status || 500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
  const rast = checkRasterizerAvailability();
  if (!rast.available) {
    console.warn("[WARN] No PDF rasterizer found (neither 'pdftoppm' nor 'sips' is in PATH). PDF visual analysis and OCR fallback will fail.");
  } else {
    console.log(`[INFO] PDF rasterization engine active: ${rast.engine}`);
  }
});

export default app;
