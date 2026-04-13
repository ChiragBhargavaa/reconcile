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
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Pending requests
          </h2>
          <ul className="space-y-2">
            {pending.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-lg border-2 border-zinc-900 bg-[#f6d64a] px-4 py-3 shadow-[4px_4px_0_#111]"
              >
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-zinc-900 bg-white text-sm font-bold text-zinc-900">
                    {(u.name || u.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-900">
                      {u.name || u.username || "Unknown"}
                    </span>
                    {u.username && (
                      <span className="ml-2 text-sm font-medium text-zinc-600">
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
                    className="inline-flex items-center gap-1.5 rounded-md border-2 border-zinc-900 bg-[#6ee7b7] px-3 py-1.5 text-sm font-bold text-zinc-900 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <UserCheck size={14} />
                    {acceptingIds.has(u.id) ? "Accepting..." : "Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectRequest(u.id)}
                    disabled={rejectingIds.has(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border-2 border-zinc-900 bg-white px-3 py-1.5 text-sm font-bold text-zinc-700 transition hover:-translate-y-0.5 disabled:opacity-60"
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
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Your friends
          </h2>
        {friends.length === 0 ? (
          <div className="rounded-lg border-4 border-dashed border-zinc-900 bg-[#f8f4e8] p-8 text-center shadow-[6px_6px_0_#111]">
            <Users className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-600">
              No friends yet. Search for users below or share your invite link!
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {friends.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-lg border-2 border-zinc-900 bg-white px-4 py-3 shadow-[4px_4px_0_#111]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-zinc-900 bg-[#bd9bf9] text-sm font-bold text-zinc-900">
                  {(u.name || u.username || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-zinc-900">
                    {u.name || u.username || "Unknown"}
                  </span>
                  {u.username && (
                    <span className="ml-2 text-sm font-medium text-zinc-600">
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
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Invite link
        </h2>
        <p className="mb-2 text-sm text-zinc-600">
          Share your link so others can add you as a friend
        </p>
        <button
          type="button"
          onClick={createInvite}
          disabled={loadingInvite}
          className="inline-flex items-center gap-2 rounded-md border-2 border-zinc-900 bg-[#8de8ff] px-4 py-2 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] hover:-translate-y-0.5"
        >
          <Link2 size={18} /> {loadingInvite ? "Generating..." : "Create invite link"}
        </button>
        {inviteUrl && (
          <p className="mt-2 text-sm text-green-600">
            Link copied to clipboard: {inviteUrl}
          </p>
        )}
      </section>

      {/* Search Users */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Search users
        </h2>
        <p className="mb-2 text-sm text-zinc-600">
          Find users and send them a friend request
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by username, email, or phone"
            className="min-w-[200px] flex-1 rounded-md border-2 border-zinc-900 bg-white px-4 py-2 text-zinc-900 focus:outline-none"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "username" | "email" | "phone")}
            className="rounded-md border-2 border-zinc-900 bg-white px-4 py-2 text-zinc-900 focus:outline-none"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <button
            type="button"
            onClick={doSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 rounded-md border-2 border-zinc-900 bg-[#ffb4d2] px-4 py-2 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5"
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
                  className="flex items-center justify-between rounded-lg border-2 border-zinc-900 bg-white px-4 py-3 shadow-[4px_4px_0_#111]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-zinc-900 bg-[#bd9bf9] text-sm font-bold text-zinc-900">
                      {(u.name || u.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900">
                        {u.name || u.username || u.id}
                      </span>
                      {u.username && (
                        <span className="ml-2 text-sm font-medium text-zinc-600">
                          @{u.username}
                        </span>
                      )}
                    </div>
                  </div>
                  {isFriend ? (
                    <span className="text-sm font-semibold text-green-600">
                      Already friends
                    </span>
                  ) : isRequested ? (
                    <span className="text-sm font-medium text-zinc-600">
                      Request sent
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(u.id)}
                      disabled={isRequesting}
                      className="inline-flex items-center gap-1.5 rounded-md border-2 border-zinc-900 bg-[#6ee7b7] px-3 py-1.5 text-sm font-bold text-zinc-900 transition hover:-translate-y-0.5 disabled:opacity-60"
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
          <p className="mt-3 text-sm text-zinc-600">
            No users found. Try a different search term.
          </p>
        )}
      </section>
    </div>
  );
}
