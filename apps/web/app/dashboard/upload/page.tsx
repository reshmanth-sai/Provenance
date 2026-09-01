"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  Send,
} from "lucide-react";

interface SignalItem {
  id: string;
  signalType: string;
  signalValue: {
    fact?: string;
    disclaimer?: string;
    details?: any;
    [key: string]: any;
  };
  severity: "low_concern" | "review_recommended" | "inconclusive" | string;
}

interface UploadResponse {
  message?: string;
  document: {
    id: string;
    storageKey: string;
    originalMimeType: string;
    rawFileHash: string;
    phash: string | null;
  };
  analyses: SignalItem[];
  overallSeverity?: string;
  credential: {
    id: string;
    status: string;
    credentialTitle: string;
    credentialType: string;
  };
}

export default function CandidateUploadPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [claimedIssuerName, setClaimedIssuerName] = useState("");
  const [credentialType, setCredentialType] = useState("degree");
  const [credentialTitle, setCredentialTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a document file to analyze");
      return;
    }
    if (!claimedIssuerName.trim() || !credentialTitle.trim()) {
      setError("Claimed issuer name and credential title are required");
      return;
    }

    setError(null);
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("claimedIssuerName", claimedIssuerName.trim());
    formData.append("credentialType", credentialType);
    formData.append("credentialTitle", credentialTitle.trim());
    if (issueDate) formData.append("issueDate", issueDate);
    if (certificateNumber) formData.append("certificateNumber", certificateNumber.trim());

    try {
      const res = await apiFetch("/documents/self-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to analyze document");
      } else {
        setUploadResult(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!uploadResult) return;
    setRequestingVerification(true);
    try {
      const res = await apiFetch(`/documents/${uploadResult.document.id}/request-verification`, {
        method: "POST",
      });
      if (res.ok) {
        setVerificationRequested(true);
      }
    } catch (err) {
      console.error("Error requesting verification:", err);
    } finally {
      setRequestingVerification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Determine overall severity
  const signals = uploadResult ? (uploadResult.analyses || []) : [];
  const hasReviewRecommended = signals.some((s) => s.severity === "review_recommended");
  const hasInconclusive = signals.some((s) => s.severity === "inconclusive");

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-extrabold text-primary">Upload Document for Deterministic Analysis</h1>
        <p className="text-xs text-gray-500">
          Upload your diploma or certificate. Our deterministic engine extracts structural signals before requesting institutional attestation.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form */}
      {!uploadResult ? (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
          {/* Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Document File (PDF, PNG, JPG) *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-accent/50 transition-colors bg-surface flex flex-col items-center justify-center gap-2 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-gray-400" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-700">
                  {file ? file.name : "Click or drag document to upload"}
                </p>
                <p className="text-[11px] text-gray-400">PDF, PNG, or JPEG up to 10MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Claimed Issuing Institution *</label>
              <input
                type="text"
                required
                value={claimedIssuerName}
                onChange={(e) => setClaimedIssuerName(e.target.value)}
                placeholder="e.g. Acme University"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Credential Type *</label>
              <select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="degree">Degree / Diploma</option>
                <option value="certificate">Certificate</option>
                <option value="transcript">Transcript</option>
                <option value="license">Professional License</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Credential Title *</label>
            <input
              type="text"
              required
              value={credentialTitle}
              onChange={(e) => setCredentialTitle(e.target.value)}
              placeholder="e.g. Bachelor of Science in Computer Science"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Conferral / Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Certificate / Document ID</label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g. ACM-2023-9988"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Submit for Deterministic Analysis</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Analysis Results View */
        <div className="space-y-6">
          {/* Severity Banner */}
          {hasReviewRecommended ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold">Review Recommended</h4>
                <p className="text-xs text-amber-700">
                  Deterministic analysis detected signals that may warrant human reviewer attention. Review the extracted facts below.
                </p>
              </div>
            </div>
          ) : hasInconclusive ? (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl flex items-center gap-3 text-blue-900 shadow-sm">
              <HelpCircle className="w-6 h-6 text-blue-600 shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold">Analysis Inconclusive</h4>
                <p className="text-xs text-blue-700">
                  Document scanned with low OCR confidence or image-only structure. Institutional verification is recommended.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold">Deterministic Analysis Complete — Low Concern</h4>
                <p className="text-xs text-emerald-700">
                  All automated structural checks passed with no anomalies detected.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Signals Breakdown */}
          <div className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <span>Deterministic Signal Inspection</span>
              </h2>
              <p className="text-xs text-gray-500">
                Signals represent factual properties extracted from the document bytes, not subjective verdicts.
              </p>
            </div>

            <div className="space-y-4">
              {signals.map((sig) => {
                const isWarning = sig.severity === "review_recommended";
                const isInconclusive = sig.severity === "inconclusive";

                return (
                  <div
                    key={sig.id}
                    className={`p-4 rounded-xl border space-y-2 ${
                      isWarning
                        ? "bg-amber-50/50 border-amber-200"
                        : isInconclusive
                        ? "bg-blue-50/50 border-blue-200"
                        : "bg-surface border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase text-gray-700">
                        {sig.signalType.replace(/_/g, " ")}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isWarning
                          ? "bg-amber-100 text-amber-800"
                          : isInconclusive
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {sig.severity.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Fact */}
                    <div className="text-xs space-y-0.5">
                      <span className="font-semibold text-gray-900">Extracted Fact: </span>
                      <span className="text-gray-700">{sig.signalValue.fact || JSON.stringify(sig.signalValue)}</span>
                    </div>

                    {/* Disclaimer */}
                    {sig.signalValue.disclaimer && (
                      <div className="text-[11px] text-gray-500 italic flex items-start gap-1 pt-1 border-t border-gray-100">
                        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>{sig.signalValue.disclaimer}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-0.5 text-center sm:text-left">
              <h4 className="text-sm font-bold text-primary">Request Formal Institutional Attestation</h4>
              <p className="text-xs text-gray-500">
                Send this verified signal package to {claimedIssuerName} to record an immutable entry on their hash chain.
              </p>
            </div>

            {verificationRequested ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Requested</span>
              </span>
            ) : (
              <button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
              >
                {requestingVerification ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Request Verification</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Return to Candidate Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
