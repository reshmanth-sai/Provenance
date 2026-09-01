import { Router, Request, Response } from "express";
import multer from "multer";
import { prisma } from "@provenance/db";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validateAndStoreFile } from "../services/file-storage.js";
import { runDocumentAnalysisPipeline } from "../services/analysis-pipeline.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Protect all document routes
router.use(authenticateToken, requireRole("candidate"));

// POST /documents/self-upload
router.post(
  "/self-upload",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = req.user!.id;

      // Ensure candidate has a profile
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: candidateId },
      });

      if (!profile) {
        res.status(400).json({
          error: "Candidate profile required before uploading credentials. Please create a profile first.",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "A document file is required" });
        return;
      }

      const {
        claimedIssuerName,
        credentialType,
        credentialTitle,
        issueDate,
        certificateNumber,
      } = req.body;

      if (!claimedIssuerName || !credentialType || !credentialTitle) {
        res.status(400).json({
          error: "claimedIssuerName, credentialType, and credentialTitle are required fields",
        });
        return;
      }

      // Stage 1: File Validation (magic bytes check)
      // IF THIS CHECK FAILS, REJECT WITH 400 AND CREATE ZERO DATABASE ROWS.
      let validatedFile;
      try {
        validatedFile = await validateAndStoreFile(req.file.buffer, req.file.originalname);
      } catch (validationErr: any) {
        res.status(400).json({ error: validationErr.message || "Invalid file content" });
        return;
      }

      // Stage 2 & 3: Match claimed issuer against approved issuers
      const matchedIssuer = await prisma.issuer.findFirst({
        where: {
          OR: [
            { name: { equals: claimedIssuerName.trim(), mode: "insensitive" } },
            { domain: { equals: claimedIssuerName.trim(), mode: "insensitive" } },
          ],
          status: "approved",
        },
      });

      const issuerId = matchedIssuer ? matchedIssuer.id : null;
      const parsedIssueDate = issueDate ? new Date(issueDate) : null;

      // Create Document and Credential rows in database
      const document = await prisma.document.create({
        data: {
          candidateId,
          storageKey: validatedFile.storageKey,
          originalMimeType: validatedFile.mimeType,
          rawFileHash: validatedFile.rawFileHash,
        },
      });

      const credential = await prisma.credential.create({
        data: {
          candidateId,
          issuerId,
          documentId: document.id,
          source: "self_submitted",
          status: "unverified",
          credentialType: credentialType.trim(),
          credentialTitle: credentialTitle.trim(),
          issueDate: parsedIssueDate,
          certificateNumber: certificateNumber ? certificateNumber.trim() : null,
        },
      });

      // Run 7-stage deterministic analysis pipeline
      const pipelineResult = await runDocumentAnalysisPipeline({
        file: validatedFile,
        fileBuffer: req.file.buffer,
        candidateName: profile.name,
        candidateId,
        documentId: document.id,
        claimedIssuerName: claimedIssuerName.trim(),
        credentialType: credentialType.trim(),
        credentialTitle: credentialTitle.trim(),
        issueDate: parsedIssueDate,
        certificateNumber: certificateNumber ? certificateNumber.trim() : null,
        issuerId,
      });

      // Update Document with pipeline analysis outputs
      const updatedDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
          metadata: pipelineResult.metadata,
          canonicalContentHash: pipelineResult.canonicalContentHash,
          phash: pipelineResult.phash,
          ocrText: pipelineResult.ocrText,
          ocrConfidence: pipelineResult.ocrConfidence,
        },
      });

      // Persist DocumentAnalysis rows (one per flag raised)
      if (pipelineResult.analyses.length > 0) {
        await prisma.documentAnalysis.createMany({
          data: pipelineResult.analyses.map((sig) => ({
            documentId: document.id,
            signalType: sig.signalType,
            signalValue: sig.signalValue,
            severity: sig.severity,
          })),
        });
      }

      const createdAnalyses = await prisma.documentAnalysis.findMany({
        where: { documentId: document.id },
      });

      res.status(201).json({
        document: updatedDocument,
        credential,
        analyses: createdAnalyses,
        overallSeverity: pipelineResult.overallSeverity,
      });
    } catch (error) {
      console.error("Self-upload pipeline error:", error);
      res.status(500).json({ error: "Failed to process and analyze document" });
    }
  }
);

// GET /documents
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const candidateId = req.user!.id;
    const documents = await prisma.document.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: "desc" },
    });

    const docIds = documents.map((d) => d.id);
    const credentials = await prisma.credential.findMany({
      where: { documentId: { in: docIds } },
    });
    const analyses = await prisma.documentAnalysis.findMany({
      where: { documentId: { in: docIds } },
    });

    const result = documents.map((doc) => ({
      ...doc,
      credential: credentials.find((c) => c.documentId === doc.id) || null,
      analyses: analyses.filter((a) => a.documentId === doc.id),
    }));

    res.status(200).json({ documents: result });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /documents/:id (strictly scoped to owning candidate)
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const candidateId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, candidateId },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const credential = await prisma.credential.findFirst({
      where: { documentId: id },
    });

    const analyses = await prisma.documentAnalysis.findMany({
      where: { documentId: id },
    });

    res.status(200).json({
      document,
      credential,
      analyses,
    });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// POST /documents/:id/request-verification
router.post("/:id/request-verification", async (req: Request, res: Response): Promise<void> => {
  try {
    const candidateId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, candidateId },
    });

    if (!document) {
      res.status(404).json({ error: "Document not found or access denied" });
      return;
    }

    const credential = await prisma.credential.findFirst({
      where: { documentId: id },
    });

    if (!credential) {
      res.status(404).json({ error: "Associated credential not found" });
      return;
    }

    // Reject duplicate verification requests
    if (credential.status === "pending" || credential.status === "verified") {
      res.status(400).json({
        error: `Verification request already ${credential.status}. Duplicate requests are not permitted.`,
      });
      return;
    }

    // Case 1: Issuer is registered and approved
    if (credential.issuerId) {
      const issuer = await prisma.issuer.findUnique({
        where: { id: credential.issuerId },
      });

      if (issuer && issuer.status === "approved") {
        const verificationRequest = await prisma.verificationRequest.create({
          data: {
            credentialId: credential.id,
            candidateId,
            issuerId: credential.issuerId,
            status: "pending",
          },
        });

        const updatedCredential = await prisma.credential.update({
          where: { id: credential.id },
          data: { status: "pending" },
        });

        res.status(200).json({
          message: "Verification request submitted to issuer",
          verificationRequest,
          credential: updatedCredential,
        });
        return;
      }
    }

    // Case 2: Issuer is NOT registered on platform
    // Create an InstitutionInvite and CRITICALLY LEAVE Credential.status as 'unverified'
    const institutionName =
      req.body.claimedIssuerName ||
      (document.canonicalContentHash ? "Claimed Issuing Institution" : "Unregistered Issuer");

    const invite = await prisma.institutionInvite.create({
      data: {
        invitedBy: candidateId,
        institutionName,
        status: "sent",
      },
    });

    // Ensure status is explicitly preserved as 'unverified'
    const currentCredential = await prisma.credential.findUnique({
      where: { id: credential.id },
    });

    res.status(200).json({
      message:
        "The claimed issuer is not currently registered on Provenance. An institution invite has been created.",
      institutionInvite: invite,
      credential: currentCredential,
    });
  } catch (error) {
    console.error("Request verification error:", error);
    res.status(500).json({ error: "Failed to request verification" });
  }
});

export default router;
