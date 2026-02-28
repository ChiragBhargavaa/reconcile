"use client";

import { useState, useCallback } from "react";
import { Link2, Search, UserCheck, UserX, UserPlus, Users } from "lucide-react";

type User = { id: string; name?: string | null; username?: string | null; image?: string | null };

export function FriendsClient({
  initialFriends,
  initialPending = [],
}: {
  initialFriends: User[];
  initialPending?: User[];
}) {
  const [friends, setFriends] = useState(initialFriends);
  const [pending, setPending] = useState(initialPending);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone">("username");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

  const friendIds = new Set(friends.map((f) => f.id));

  const doSearch = async () => {
    if (!search.trim() || search.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
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

  const sendRequest = useCallback(async (userId: string) => {
    setRequestingIds((s) => new Set(s).add(userId));
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setRequestedIds((s) => new Set(s).add(userId));
      }
    } catch {
      // network error
    } finally {
      setRequestingIds((s) => {
        const n = new Set(s);
        n.delete(userId);
        return n;
      });
    }
  }, []);

  const acceptRequest = useCallback(async (userId: string) => {
    setAcceptingIds((s) => new Set(s).add(userId));
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const accepted = pending.find((u) => u.id === userId);
        setPending((p) => p.filter((u) => u.id !== userId));
        if (accepted) setFriends((f) => [...f, accepted]);
      }
    } catch {
      // network error
    } finally {
      setAcceptingIds((s) => {
        const n = new Set(s);
        n.delete(userId);
        return n;
      });
    }
  }, [pending]);

  const rejectRequest = useCallback(async (userId: string) => {
    setRejectingIds((s) => new Set(s).add(userId));
    try {
      const res = await fetch("/api/friends/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setPending((p) => p.filter((u) => u.id !== userId));
      }
    } catch {
      // network error
    } finally {
      setRejectingIds((s) => {
        const n = new Set(s);
        n.delete(userId);
        return n;
      });
    }
  }, []);

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

  return (
    <div className="mt-8 space-y-10">
      {/* Pending Friend Requests */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Pending requests
          </h2>
          <ul className="space-y-2">
            {pending.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-sm font-semibold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                    {(u.name || u.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u.name || u.username || "Unknown"}
                    </span>
                    {u.username && (
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                        @{u.username}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => acceptRequest(u.id)}
                    disabled={acceptingIds.has(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    <UserCheck size={14} />
                    {acceptingIds.has(u.id) ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectRequest(u.id)}
                    disabled={rejectingIds.has(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <UserX size={14} />
                    {rejectingIds.has(u.id) ? "Declining..." : "Decline"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Your Friends */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Your friends
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <Users className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No friends yet. Search for users below or share your invite link!
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {friends.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {(u.name || u.username || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {u.name || u.username || "Unknown"}
                  </span>
                  {u.username && (
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      @{u.username}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invite Link */}
      <section>
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
      </section>

      {/* Search Users */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Search users
        </h2>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Find users and send them a friend request
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
            {results.map((u) => {
              const isFriend = friendIds.has(u.id);
              const isRequested = requestedIds.has(u.id);
              const isRequesting = requestingIds.has(u.id);
              return (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                      {(u.name || u.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {u.name || u.username || u.id}
                      </span>
                      {u.username && (
                        <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                          @{u.username}
                        </span>
                      )}
                    </div>
                  </div>
                  {isFriend ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Already friends
                    </span>
                  ) : isRequested ? (
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Request sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(u.id)}
                      disabled={isRequesting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      <UserPlus size={14} />
                      {isRequesting ? "Sending..." : "Add friend"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hasSearched && !searching && results.length === 0 && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No users found. Try a different search term.
          </p>
        )}
      </section>
    </div>
  );
}
