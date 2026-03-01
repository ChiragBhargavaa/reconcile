"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Check, Loader2 } from "lucide-react";

const USERNAME_MAX_LENGTH = 20;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  username: string | null;
  phone: string | null;
};

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data: UserProfile = await res.json();
        setProfile(data);
        setName(data.name || "");
        setUsername(data.username || "");
        setPhone(data.phone?.replace(/^\+91/, "") || "");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

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
    if (trimmed === profile?.username) {
      setAvailability("idle");
      return;
    }
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
    setSaved(false);
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
    setSaved(false);
    setFieldErrors((prev) => ({ ...prev, phone: "" }));
  };

  const hasChanges = () => {
    if (!profile) return false;
    const currentPhone = profile.phone?.replace(/^\+91/, "") || "";
    return (
      name.trim() !== (profile.name || "") ||
      username.trim().toLowerCase() !== (profile.username || "") ||
      phone !== currentPhone
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaved(false);

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

    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (trimmedName !== (profile?.name || "")) payload.name = trimmedName;
      if (trimmedUsername !== (profile?.username || "")) payload.username = trimmedUsername;
      const currentPhone = profile?.phone?.replace(/^\+91/, "") || "";
      if (trimmedPhone !== currentPhone) payload.phone = trimmedPhone;

      if (Object.keys(payload).length === 0) {
        setSaved(true);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to save (${res.status})`);
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: trimmedName,
              username: trimmedUsername,
              phone: trimmedPhone ? `+91${trimmedPhone}` : null,
            }
          : prev
      );
      setSaved(true);

      if (payload.username || payload.name) {
        await update();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 overflow-y-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-800">
          Manage your profile information
        </p>
      </div>

      <div className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
        {/* Profile picture + email (read-only) */}
        <div className="mb-6 flex items-center gap-4 pb-6">
          {profile?.image && (
            <img
              src={profile.image}
              alt=""
              className="h-14 w-14 rounded-full ring-2 ring-white/30 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            />
          )}
          <div>
            <p className="font-semibold text-zinc-900">
              {profile?.name || session?.user?.name || "User"}
            </p>
            <p className="text-sm font-medium text-zinc-800">
              {profile?.email || session?.user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-zinc-900">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
                setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="John Doe"
              maxLength={100}
              className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 shadow-inner ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
              disabled={saving}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-zinc-900">
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
                className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 shadow-inner ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
                autoComplete="username"
                disabled={saving}
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
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-zinc-900">
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
                className="w-full rounded-r-xl bg-white/15 backdrop-blur-xl px-4 py-3 text-zinc-900 placeholder-zinc-500 shadow-inner ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
                disabled={saving}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Friends can find you by this number
            </p>
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-400">{fieldErrors.phone}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check size={16} />
              Changes saved successfully
            </div>
          )}

          <button
            type="submit"
            disabled={saving || availability === "taken" || !hasChanges()}
            className="w-full rounded-lg bg-black text-white px-4 py-3 text-sm font-medium transition hover:bg-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
