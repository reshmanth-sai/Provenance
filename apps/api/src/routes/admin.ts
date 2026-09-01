import { Router, Request, Response } from "express";
import { prisma } from "@provenance/db";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

// Protect all admin endpoints with platform_admin role
router.use(authenticateToken, requireRole("platform_admin"));

/**
 * GET /admin/institutions
 * Lists all institutions regardless of status.
 * Supports optional ?status= query filter (pending, approved, rejected).
 */
router.get("/institutions", async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;

  try {
    const whereClause: { status?: string } = {};
    if (status && typeof status === "string") {
      whereClause.status = status.toLowerCase().trim();
    }

    const institutions = await prisma.issuer.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ institutions });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    res.status(500).json({ error: "Failed to retrieve institutions" });
  }
});

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

/**
 * GET /admin/users
 * Lists all users with fields: id, email, role, createdAt.
 * Strictly excludes passwordHash.
 */
router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to retrieve users" });
  }
});

/**
 * GET /admin/audit-log
 * Returns paginated AuditLog records, newest first.
 * Supports ?limit= (default 50) and ?offset= (default 0).
 */
router.get("/audit-log", async (req: Request, res: Response): Promise<void> => {
  const limit = Math.max(1, Math.min(200, parseInt(String(req.query.limit || "50"), 10) || 50));
  const offset = Math.max(0, parseInt(String(req.query.offset || "0"), 10) || 0);

  try {
    const [total, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    res.status(200).json({
      auditLogs,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to retrieve audit logs" });
  }
});

/**
 * GET /admin/stats
 * Returns platform aggregate metric counts grouped by categories.
 */
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      candidateUsers,
      issuerStaffUsers,
      adminUsers,
      pendingIssuers,
      approvedIssuers,
      rejectedIssuers,
      unverifiedCreds,
      pendingCreds,
      verifiedCreds,
      rejectedCreds,
      revokedCreds,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: "candidate" } }),
      prisma.user.count({ where: { role: "issuer_staff" } }),
      prisma.user.count({ where: { role: "platform_admin" } }),
      prisma.issuer.count({ where: { status: "pending" } }),
      prisma.issuer.count({ where: { status: "approved" } }),
      prisma.issuer.count({ where: { status: "rejected" } }),
      prisma.credential.count({ where: { status: "unverified" } }),
      prisma.credential.count({ where: { status: "pending" } }),
      prisma.credential.count({ where: { status: "verified" } }),
      prisma.credential.count({ where: { status: "rejected" } }),
      prisma.credential.count({ where: { status: "revoked" } }),
    ]);

    res.status(200).json({
      stats: {
        users: {
          candidate: candidateUsers,
          issuer_staff: issuerStaffUsers,
          platform_admin: adminUsers,
          total: candidateUsers + issuerStaffUsers + adminUsers,
        },
        issuers: {
          pending: pendingIssuers,
          approved: approvedIssuers,
          rejected: rejectedIssuers,
          total: pendingIssuers + approvedIssuers + rejectedIssuers,
        },
        credentials: {
          unverified: unverifiedCreds,
          pending: pendingCreds,
          verified: verifiedCreds,
          rejected: rejectedCreds,
          revoked: revokedCreds,
          total: unverifiedCreds + pendingCreds + verifiedCreds + rejectedCreds + revokedCreds,
        },
      },
    });
  } catch (error) {
    console.error("Error calculating platform stats:", error);
    res.status(500).json({ error: "Failed to calculate platform stats" });
  }
});

export default router;
