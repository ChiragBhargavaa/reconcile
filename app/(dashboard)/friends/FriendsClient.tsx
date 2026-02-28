"use client";

import { useState } from "react";
import { Link2, Search, Phone } from "lucide-react";

type User = { id: string; name?: string | null; username?: string | null; image?: string | null };

export function FriendsClient({
  initialFriends,
}: {
  initialFriends: User[];
  initialPending?: User[];
}) {
  const [friends, setFriends] = useState(initialFriends);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone">("username");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"none" | "sent" | "verified">("none");
  const [loadingPhone, setLoadingPhone] = useState(false);

  const doSearch = async () => {
    if (!search.trim() || search.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/users?q=${encodeURIComponent(search.trim())}&type=${searchType}`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const createInvite = async () => {
    setLoadingInvite(true);
    try {
      const res = await fetch("/api/invite", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        setInviteUrl(data.url);
        await navigator.clipboard.writeText(data.url);
      }
    } catch {
      // ignore
    } finally {
      setLoadingInvite(false);
    }
  };

  const sendOtp = async () => {
    const p = phone.replace(/\D/g, "");
    if (p.length < 10) return;
    setLoadingPhone(true);
    try {
      const res = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p }),
      });
      const data = await res.json();
      if (res.ok) setPhoneStep(data.skipVerification ? "verified" : "sent");
    } catch {
      // ignore
    } finally {
      setLoadingPhone(false);
    }
  };

  const verifyOtp = async () => {
    const p = phone.replace(/\D/g, "");
    if (!otp || p.length < 10) return;
    setLoadingPhone(true);
    try {
      const res = await fetch("/api/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, code: otp }),
      });
      if (res.ok) {
        setPhoneStep("verified");
        setOtp("");
      }
    } catch {
      // ignore
    } finally {
      setLoadingPhone(false);
    }
  };

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Invite link
        </h2>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Share your link so others can add you as a friend
        </p>
        <button
          type="button"
          onClick={createInvite}
          disabled={loadingInvite}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Link2 size={18} /> {loadingInvite ? "Generating..." : "Create invite link"}
        </button>
        {inviteUrl && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Link copied to clipboard: {inviteUrl}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Verify phone (findable by others)
        </h2>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your phone number so friends can find you by searching
        </p>
        {phoneStep === "verified" ? (
          <p className="text-sm text-green-600 dark:text-green-400">Phone verified!</p>
        ) : phoneStep === "sent" ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loadingPhone}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loadingPhone ? "Verifying..." : "Verify"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={loadingPhone}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Phone size={18} /> {loadingPhone ? "Sending..." : "Send code"}
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Search users
        </h2>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Find users by username, email, or phone. Add them directly when creating a group.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by username, email, or phone"
            className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "username" | "email" | "phone")}
            className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <button
            type="button"
            onClick={doSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Search size={18} /> {searching ? "Searching..." : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {u.name || u.username || u.id}
                </span>
                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                  (add when creating a group)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
