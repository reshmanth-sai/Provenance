import { Router, Request, Response } from "express";
import { prisma } from "@provenance/db";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// Protect all admin endpoints with platform_admin role
router.use(authenticateToken, requireRole("platform_admin"));

/**
 * GET /admin/institutions/pending
 * Lists all institutions with status: 'pending'
 */
router.get("/institutions/pending", async (_req: Request, res: Response): Promise<void> => {
  try {
    const pendingInstitutions = await prisma.issuer.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ institutions: pendingInstitutions });
  } catch (error) {
    console.error("Error fetching pending institutions:", error);
    res.status(500).json({ error: "Failed to retrieve pending institutions" });
  }
});

/**
 * POST /admin/institutions/:id/approve
 * Approves a pending institution and records an AuditLog entry
 */
router.post("/institutions/:id/approve", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminId = req.user!.id;

  try {
    const existing = await prisma.issuer.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Institution not found" });
      return;
    }

    const [updatedIssuer] = await prisma.$transaction([
      prisma.issuer.update({
        where: { id },
        data: {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "approve_institution",
          targetType: "Issuer",
          targetId: id,
          metadata: {
            institutionName: existing.name,
            domain: existing.domain,
          },
        },
      }),
    ]);

    res.status(200).json({
      message: "Institution approved successfully",
      issuer: updatedIssuer,
    });
  } catch (error) {
    console.error("Error approving institution:", error);
    res.status(500).json({ error: "Failed to approve institution" });
  }
});

/**
 * POST /admin/institutions/:id/reject
 * Rejects an institution and records an AuditLog entry
 */
router.post("/institutions/:id/reject", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminId = req.user!.id;

  try {
    const existing = await prisma.issuer.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Institution not found" });
      return;
    }

    const [updatedIssuer] = await prisma.$transaction([
      prisma.issuer.update({
        where: { id },
        data: {
          status: "rejected",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "reject_institution",
          targetType: "Issuer",
          targetId: id,
          metadata: {
            institutionName: existing.name,
            domain: existing.domain,
          },
        },
      }),
    ]);

    res.status(200).json({
      message: "Institution rejected",
      issuer: updatedIssuer,
    });
  } catch (error) {
    console.error("Error rejecting institution:", error);
    res.status(500).json({ error: "Failed to reject institution" });
  }
});

export default router;
