"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { User, CheckCircle2, AlertCircle, ExternalLink, Save } from "lucide-react";

export default function CandidateProfileEditor() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [publicUsername, setPublicUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      apiFetch("/candidate/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profile) {
            setName(data.profile.name || "");
            setPublicUsername(data.profile.publicUsername || "");
            setHeadline(data.profile.headline || "");
            setBio(data.profile.bio || "");
            setAvatarUrl(data.profile.avatarUrl || "");
          }
        })
        .catch((err) => console.error("Error loading profile:", err))
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await apiFetch("/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          publicUsername: publicUsername.trim(),
          headline: headline.trim() || undefined,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Failed to save profile" });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Network error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Candidate Profile</h1>
          <p className="text-xs text-gray-500">Manage your public information and verification handle</p>
        </div>

        {publicUsername && (
          <Link
            href={`/u/${publicUsername}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-light text-accent text-xs font-semibold rounded-lg hover:bg-accent/20 transition-colors"
          >
            <span>View Public Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Rivera"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Public Username Handle *</label>
          <div className="flex items-center">
            <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs text-gray-500 font-mono">
              /u/
            </span>
            <input
              type="text"
              required
              value={publicUsername}
              onChange={(e) => setPublicUsername(e.target.value)}
              placeholder="alex_rivera"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-r-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <p className="text-[11px] text-gray-400">Unique handle for recruiters to access your verified credentials.</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Professional Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Infrastructure Engineer"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Bio / Summary</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A brief overview of your background and academic focus..."
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Avatar Image URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
