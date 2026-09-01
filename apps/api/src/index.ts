import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "@provenance/db";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;
