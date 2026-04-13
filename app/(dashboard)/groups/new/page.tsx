"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

type User = { id: string; name?: string; username?: string };

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [selected, setSelected] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = friends.filter(
    (f) =>
      !selected.has(f.id) &&
      (f.name?.toLowerCase().includes(query) ||
        f.username?.toLowerCase().includes(query) ||
        !query)
  );

  const addMember = (u: User) => {
    setSelected((m) => new Map(m).set(u.id, u));
  };
  const removeMember = (id: string) => {
    setSelected((m) => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, memberIds: Array.from(selected.keys()) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create group");
        return;
      }
      router.push(`/groups/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">Create group</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4 rounded-lg border-4 border-zinc-900 bg-[#f8f4e8] p-5 shadow-[8px_8px_0_#111]">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-900">
            Group name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Trip to Goa"
            className="mt-1 w-full rounded-md border-2 border-zinc-900 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-900">
            Add members (optional)
          </label>
          <p className="mt-1 text-xs text-zinc-600">
            Only friends can be added to a group.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Search size={16} className="text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends..."
              className="min-w-[140px] flex-1 rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none"
            />
          </div>
          {loadingFriends ? (
            <p className="mt-2 text-sm text-zinc-500">Loading friends...</p>
          ) : filtered.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border-2 border-zinc-900 bg-white p-2">
              {filtered.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-white/20">
                  <span className="text-sm text-zinc-900">
                    {u.name || u.username || u.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => addMember(u)}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          ) : friends.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600">
              No friends yet. Add friends first to include them in a group.
            </p>
          ) : selected.size === friends.length ? (
            <p className="mt-2 text-sm text-zinc-600">
              All friends have been added.
            </p>
          ) : query ? (
            <p className="mt-2 text-sm text-zinc-600">
              No friends match &ldquo;{search.trim()}&rdquo;.
            </p>
          ) : null}
          {selected.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(selected.values()).map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 rounded-md border-2 border-zinc-900 bg-[#bd9bf9] px-3 py-1 text-sm font-semibold text-zinc-900"
                >
                  {u.name || u.username}
                  <button
                    type="button"
                    onClick={() => removeMember(u.id)}
                    className="ml-1 rounded-sm border border-zinc-900 px-1 text-zinc-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border-2 border-zinc-900 bg-[#6ee7b7] px-4 py-2 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create group"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border-2 border-zinc-900 bg-white px-4 py-2 text-sm font-bold text-zinc-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
