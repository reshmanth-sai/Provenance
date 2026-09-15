import { Router, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { prisma } from "@provenance/db";
import { verifyChain } from "../services/hash-chain.js";
import { generateQrPng, generateQrSvg } from "../services/qr-generator.js";

const router = Router();

// Rate limiter for verification endpoints (30 requests per minute per IP)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many verification requests from this IP, please try again after a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public profile endpoints (60 requests per minute per IP)
const profileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many profile requests from this IP, please try again after a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /u/:username
 * Public candidate profile showing verified, revoked, and unconfirmed credentials.
 * Excludes rejected credentials and leaks zero internal IDs or emails.
 */
router.get("/u/:username", profileLimiter, async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { publicUsername: username },
    });

    if (!profile) {
      res.status(404).json({ error: "Candidate profile not found" });
      return;
    }

    const credentials = await prisma.credential.findMany({
      where: { candidateId: profile.userId },
      include: { issuer: true },
      orderBy: { createdAt: "desc" },
    });

    const verifiedList = [];
    const revokedList = [];
    const unconfirmedList = [];

    for (const cred of credentials) {
      if (cred.status === "verified") {
        verifiedList.push({
          id: cred.id,
          type: cred.credentialType,
          title: cred.credentialTitle,
          institution: cred.issuer ? cred.issuer.name : (cred.claimedIssuerName || null),
          issueDate: cred.issueDate ? cred.issueDate.toISOString() : null,
          certificateNumber: cred.certificateNumber,
          status: "verified",
        });
      } else if (cred.status === "revoked") {
        revokedList.push({
          id: cred.id,
          type: cred.credentialType,
          title: cred.credentialTitle,
          institution: cred.issuer ? cred.issuer.name : (cred.claimedIssuerName || null),
          issueDate: cred.issueDate ? cred.issueDate.toISOString() : null,
          certificateNumber: cred.certificateNumber,
          status: "revoked",
        });
      } else if (cred.status === "unverified" || cred.status === "pending") {
        unconfirmedList.push({
          id: cred.id,
          type: cred.credentialType,
          title: cred.credentialTitle,
          claimedInstitution: cred.issuer ? cred.issuer.name : (cred.claimedIssuerName || null),
          issueDate: cred.issueDate ? cred.issueDate.toISOString() : null,
          status: cred.status === "pending" ? "verification_requested" : "unverified",
        });
      }
      // status: 'rejected' is explicitly excluded
    }

    res.status(200).json({
      candidate: {
        publicUsername: profile.publicUsername,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      },
      credentials: {
        verified: verifiedList,
        revoked: revokedList,
        unconfirmed: unconfirmedList,
      },
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ error: "Failed to retrieve public profile" });
  }
});

/**
 * GET /verify/:credentialId
 * Public verification endpoint with honest cryptographic hash-chain breakdown.
 * Rate-limited to 30 req/min/IP.
 */
router.get("/verify/:credentialId", verifyLimiter, async (req: Request, res: Response): Promise<void> => {
  const { credentialId } = req.params;

  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: { issuer: true },
    });

    if (!credential) {
      res.status(404).json({ error: "Credential not found" });
      return;
    }

    const baseResponse = {
      credential: {
        type: credential.credentialType,
        title: credential.credentialTitle,
        institution: credential.issuer ? credential.issuer.name : null,
        year: credential.issueDate ? new Date(credential.issueDate).getFullYear() : null,
      },
    };

    // Non-chain states (unverified, pending, rejected)
    if (credential.status === "unverified" || credential.status === "pending" || credential.status === "rejected") {
      res.status(200).json({
        ...baseResponse,
        verification: {
          status: credential.status,
          issuerVerified: false,
        },
        integrity: null,
      });
      return;
    }

    // Verified or Revoked states (have chain entries)
    if (!credential.issuerId) {
      res.status(200).json({
        ...baseResponse,
        verification: {
          status: credential.status,
          issuerVerified: false,
        },
        integrity: null,
      });
      return;
    }

    // 1. Audit the full issuer chain
    const auditResult = await verifyChain(credential.issuerId);

    // 2. Fetch all events for this issuer in chronological sequence to determine 1-based positions
    const allIssuerEvents = await prisma.credentialEvent.findMany({
      where: { issuerId: credential.issuerId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    // 3. Filter down to this credential's own events
    const credentialEvents = [];
    for (let i = 0; i < allIssuerEvents.length; i++) {
      const evt = allIssuerEvents[i];
      if (evt.credentialId === credential.id) {
        const audit = auditResult.events.find((e) => e.id === evt.id);
        credentialEvents.push({
          eventType: evt.eventType,
          position: i + 1,
          result: audit ? audit.result : "modified",
        });
      }
    }

    const thisCredentialChainValid =
      auditResult.chainValid &&
      credentialEvents.length > 0 &&
      credentialEvents.every((e) => e.result === "valid");

    res.status(200).json({
      ...baseResponse,
      verification: {
        status: credential.status,
        issuerVerified: credential.status === "verified",
        revoked: credential.status === "revoked",
      },
      integrity: {
        algorithm: "SHA-256",
        chainValid: thisCredentialChainValid,
        events: credentialEvents,
      },
    });
  } catch (error) {
    console.error("Error verifying credential:", error);
    res.status(500).json({ error: "Failed to verify credential" });
  }
});

/**
 * GET /verify/:credentialId/qr
 * Returns a QR code (PNG or SVG) encoding the public verification URL.
 */
router.get("/verify/:credentialId/qr", async (req: Request, res: Response): Promise<void> => {
  const { credentialId } = req.params;
  const { format } = req.query;

  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      res.status(404).json({ error: "Credential not found" });
      return;
    }

    const frontendHost =
      process.env.FRONTEND_URL ||
      process.env.PUBLIC_BASE_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:3000";

    if (format === "svg") {
      const svg = await generateQrSvg(credentialId, frontendHost);
      res.setHeader("Content-Type", "image/svg+xml");
      res.status(200).send(svg);
    } else {
      const pngBuffer = await generateQrPng(credentialId, frontendHost);
      res.setHeader("Content-Type", "image/png");
      res.status(200).send(pngBuffer);
    }
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

export default router;
