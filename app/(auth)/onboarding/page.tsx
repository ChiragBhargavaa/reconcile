"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    router.replace("/signin");
    return null;
  }

  const validateFormat = (value: string): string | null => {
    if (!value) return null;
    if (!USERNAME_REGEX.test(value)) return "Only lowercase letters, numbers, and underscores";
    if (value.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters`;
    if (value.length > USERNAME_MAX_LENGTH) return `Maximum ${USERNAME_MAX_LENGTH} characters`;
    return null;
  };

  const checkAvailability = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim().toLowerCase();
    const formatError = validateFormat(trimmed);
    if (formatError || !trimmed) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users?q=${encodeURIComponent(trimmed)}&type=username`
        );
        const data = await res.json();
        const exactMatch = Array.isArray(data) && data.some(
          (u: { username?: string }) => u.username?.toLowerCase() === trimmed
        );
        setAvailability(exactMatch ? "taken" : "available");
      } catch {
        setAvailability("idle");
      }
    }, 400);
  };

  const handleChange = (value: string) => {
    setUsername(value);
    setError("");
    const trimmed = value.trim().toLowerCase();
    const formatError = validateFormat(trimmed);
    if (formatError) {
      setError(formatError);
      setAvailability("idle");
    } else {
      setError("");
      checkAvailability(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setError("Username is required");
      return;
    }
    const formatError = validateFormat(trimmed);
    if (formatError) {
      setError(formatError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(res.ok ? "Invalid response from server" : `Server error (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error || `Failed to set username (${res.status})`);
        return;
      }
      setSuccess(true);
      await update();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Choose your username
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Friends can find you by this username
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="e.g. john_doe"
                maxLength={USERNAME_MAX_LENGTH}
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
              {availability === "checking" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  Checking...
                </span>
              )}
              {availability === "available" && !error && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 dark:text-green-400">
                  Available
                </span>
              )}
              {availability === "taken" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600 dark:text-red-400">
                  Taken
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters, lowercase, numbers, underscores
              </p>
              <span className="text-xs text-zinc-400">
                {username.trim().length}/{USERNAME_MAX_LENGTH}
              </span>
            </div>
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {success && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Username set! Redirecting...
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || availability === "taken"}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </main>
    </div>
  );
}
