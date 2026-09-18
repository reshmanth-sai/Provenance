import { Request } from "express";
import { prisma } from "@provenance/db";

export type SecuritySeverity = "info" | "warning" | "security_alert";

export interface SecurityEventOptions {
  req?: Request;
  action: string;
  severity?: SecuritySeverity;
  targetType?: string;
  targetId?: string | null;
  actorId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
}

export function extractClientIp(req?: Request): string {
  if (!req) return "unknown";
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Persists security incidents and governance events to AuditLog.
 * Emits server console warnings and dispatches optional webhooks when critical alerts occur.
 */
export async function recordSecurityEvent(options: SecurityEventOptions): Promise<void> {
  const {
    req,
    action,
    severity = "info",
    targetType = "security",
    targetId = null,
    actorId = null,
    metadata = {},
  } = options;

  const ip = options.ipAddress || extractClientIp(req);
  const resolvedActorId = actorId || (req as any)?.user?.id || null;

  const enrichedMetadata: Record<string, any> = {
    ...metadata,
    path: req?.originalUrl || req?.url || undefined,
    method: req?.method || undefined,
    userAgent: req?.headers["user-agent"] || undefined,
  };

  try {
    await prisma.auditLog.create({
      data: {
        actorId: resolvedActorId,
        action,
        severity,
        targetType,
        targetId,
        ipAddress: ip,
        metadata: enrichedMetadata,
      },
    });

    if (severity === "security_alert") {
      console.warn(
        `🚨 [SECURITY_ALERT] ${action} from IP=${ip} Path=${req?.originalUrl || "N/A"}:`,
        JSON.stringify(enrichedMetadata)
      );
    } else if (severity === "warning") {
      console.warn(
        `⚠️  [SECURITY_WARNING] ${action} from IP=${ip}:`,
        JSON.stringify(enrichedMetadata)
      );
    }

    // Asynchronous webhook dispatch if configured
    const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL;
    if (webhookUrl && (severity === "security_alert" || severity === "warning")) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert: "Provenance Security Incident",
          action,
          severity,
          ip,
          targetType,
          timestamp: new Date().toISOString(),
          metadata: enrichedMetadata,
        }),
      }).catch((err) => {
        console.error("Failed to dispatch security alert webhook:", err);
      });
    }
  } catch (error) {
    console.error("Failed to record security audit log:", error);
  }
}
