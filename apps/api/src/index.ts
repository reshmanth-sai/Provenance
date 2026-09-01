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

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Basic rate limiting on auth endpoints (100 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
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
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failure",
    });
  }
});

import { checkRasterizerAvailability } from "./services/pdf-rasterizer.js";

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
