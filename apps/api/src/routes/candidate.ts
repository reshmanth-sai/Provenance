import { Router, Request, Response } from "express";
import { prisma } from "@provenance/db";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// Protect all candidate routes
router.use(authenticateToken, requireRole("candidate"));

// GET /candidate/profile
router.get("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ error: "Candidate profile not found. Please create your profile." });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Failed to fetch candidate profile" });
  }
});

// PUT /candidate/profile (upsert)
router.put("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { publicUsername, name, headline, bio, avatarUrl } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    if (!publicUsername || typeof publicUsername !== "string" || !/^[a-zA-Z0-9_-]{3,30}$/.test(publicUsername)) {
      res.status(400).json({
        error: "Public username must be 3-30 characters long and contain only letters, numbers, underscores, or hyphens",
      });
      return;
    }

    if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
      try {
        const parsed = new URL(avatarUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          res.status(400).json({ error: "Avatar URL must use http or https protocol" });
          return;
        }
      } catch {
        res.status(400).json({ error: "Invalid Avatar URL format" });
        return;
      }
    }

    // Check if publicUsername is taken by another candidate
    const existing = await prisma.candidateProfile.findUnique({
      where: { publicUsername: publicUsername.toLowerCase().trim() },
    });

    if (existing && existing.userId !== userId) {
      res.status(409).json({ error: "This public username is already taken" });
      return;
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        publicUsername: publicUsername.toLowerCase().trim(),
        name: name.trim(),
        headline: headline ? headline.trim() : null,
        bio: bio ? bio.trim() : null,
        avatarUrl: avatarUrl ? avatarUrl.trim() : null,
      },
      create: {
        userId,
        publicUsername: publicUsername.toLowerCase().trim(),
        name: name.trim(),
        headline: headline ? headline.trim() : null,
        bio: bio ? bio.trim() : null,
        avatarUrl: avatarUrl ? avatarUrl.trim() : null,
      },
    });

    res.status(200).json({ profile });
  } catch (error) {
    console.error("Upsert profile error:", error);
    res.status(500).json({ error: "Failed to save candidate profile" });
  }
});

export default router;
