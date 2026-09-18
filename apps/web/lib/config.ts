/**
 * Centralized API and environment configuration for the web application.
 */

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
