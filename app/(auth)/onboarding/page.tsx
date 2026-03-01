"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || initializedRef.current) return;
    initializedRef.current = true;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setName(data.name || session?.user?.name || "");
          if (data.phone) {
            setPhone(data.phone.replace(/^\+91/, ""));
          }
        } else {
          setName(session?.user?.name || "");
        }
      } catch {
        setName(session?.user?.name || "");
      } finally {
        setFetching(false);
      }
    }
    fetchProfile();
  }, [status, session]);

  if (status === "loading" || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="mt-3 text-sm text-zinc-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.replace("/");
    return null;
  }

  const validateUsername = (value: string): string | null => {
    if (!value) return null;
    if (!USERNAME_REGEX.test(value)) return "Only lowercase letters, numbers, and underscores";
    if (value.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters`;
    if (value.length > USERNAME_MAX_LENGTH) return `Maximum ${USERNAME_MAX_LENGTH} characters`;
    return null;
  };

  const checkAvailability = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim().toLowerCase();
    const formatError = validateUsername(trimmed);
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

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setFieldErrors((prev) => ({ ...prev, username: "" }));
    const trimmed = value.trim().toLowerCase();
    const formatError = validateUsername(trimmed);
    if (formatError) {
      setFieldErrors((prev) => ({ ...prev, username: formatError }));
      setAvailability("idle");
    } else {
      checkAvailability(value);
    }
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setFieldErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.replace(/\D/g, "");

    const errors: Record<string, string> = {};
    if (!trimmedName) errors.name = "Name is required";
    if (!trimmedUsername) errors.username = "Username is required";
    const usernameError = validateUsername(trimmedUsername);
    if (trimmedUsername && usernameError) errors.username = usernameError;
    if (trimmedPhone && trimmedPhone.length !== 10) errors.phone = "Phone number must be exactly 10 digits";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        name: trimmedName,
        username: trimmedUsername,
      };
      if (trimmedPhone) payload.phone = trimmedPhone;

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        setError(data.error || `Failed to save profile (${res.status})`);
        return;
      }
      setSuccess(true);
      await update();
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent">
      <main className="w-full max-w-md space-y-6 rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8">
        <div className="text-center">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="mx-auto mb-4 h-16 w-16 rounded-full ring-2 ring-white/30 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            />
          )}
          <h1 className="text-2xl font-bold text-zinc-900">
            Complete your profile
          </h1>
          <p className="mt-1 text-sm text-zinc-800">
            Review and confirm your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-900">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="John Doe"
              maxLength={100}
              className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
              disabled={loading}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-zinc-900">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. john_doe"
                maxLength={USERNAME_MAX_LENGTH}
                className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
                autoComplete="username"
                disabled={loading}
              />
              {availability === "checking" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  Checking...
                </span>
              )}
              {availability === "available" && !fieldErrors.username && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600">
                  Available
                </span>
              )}
              {availability === "taken" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">
                  Taken
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters, lowercase, numbers, underscores
              </p>
              <span className="text-xs text-zinc-600">
                {username.trim().length}/{USERNAME_MAX_LENGTH}
              </span>
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.username}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-zinc-900">
              Mobile number <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <div className="flex items-stretch">
              <span className="inline-flex items-center rounded-l-xl bg-white/15 px-3 text-sm text-zinc-600 backdrop-blur-xl ring-1 ring-white/20">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="98765 43210"
                maxLength={10}
                className="w-full rounded-r-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                Friends can find you by this number
              </p>
              {phone && (
                <span className="text-xs text-zinc-600">
                  {phone.length}/10
                </span>
              )}
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.phone}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">
              Profile saved! Redirecting...
            </p>
          )}

          <button
            type="submit"
            disabled={loading || availability === "taken"}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Signed in as {session.user.email}
        </p>
      </main>
    </div>
  );
}
