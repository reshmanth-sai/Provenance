"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === "candidate") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const res = await register(email, password);
    if (res.success) {
      router.push("/dashboard/profile");
    } else {
      setError(res.error || "Registration failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary">Create Candidate Account</h1>
        <p className="text-xs text-gray-500">Publish your verifiable portfolio with cryptographic attestation</p>
      </div>

      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
        <p className="text-xs text-blue-900">
          Educational institution or certifying body?{" "}
          <Link href="/register/institution" className="font-bold text-accent hover:underline inline-flex items-center gap-1">
            <span>Register Institution →</span>
          </Link>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="regEmail" className="text-xs font-semibold text-gray-700">Email Address</label>
          <input
            id="regEmail"
            name="regEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="regPassword" className="text-xs font-semibold text-gray-700">Password</label>
          <input
            id="regPassword"
            name="regPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
