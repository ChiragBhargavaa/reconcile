"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

type User = { id: string; name?: string; username?: string };

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone">("username");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const doSearch = () => {
    if (!search.trim() || search.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
    fetch(`/api/users?q=${encodeURIComponent(search.trim())}&type=${searchType}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(Array.isArray(data) ? data : []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  };

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
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create group</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Group name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Trip to Goa"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add members (optional)
          </label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Search by username, email, or phone and add users directly.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())}
              placeholder="Search users..."
              className="flex-1 min-w-[140px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "username" | "email" | "phone")}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="username">Username</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <button
              type="button"
              onClick={doSearch}
              disabled={searching}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Search size={16} /> {searching ? "..." : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {u.name || u.username || u.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => addMember(u)}
                    disabled={selected.has(u.id)}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:text-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    {selected.has(u.id) ? "Added" : "+ Add"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasSearched && !searching && searchResults.length === 0 && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No users found. Try a different search term.
            </p>
          )}
          {selected.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(selected.values()).map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-sm dark:bg-zinc-700"
                >
                  {u.name || u.username}
                  <button
                    type="button"
                    onClick={() => removeMember(u.id)}
                    className="ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Creating..." : "Create group"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
