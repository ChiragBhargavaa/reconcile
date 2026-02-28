"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus, UserPlus, Search, Settings } from "lucide-react";

type Member = { id: string; name: string };
type SearchUser = { id: string; name?: string; username?: string };

export function GroupSettings({
  groupId,
  members,
  currentUserId,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone">("username");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const memberIds = new Set(members.map((m) => m.id));

  const deleteGroup = async () => {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete group");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    setRemovingId(memberId);
    setError("");
    const newMemberIds = members.filter((m) => m.id !== memberId).map((m) => m.id);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: newMemberIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove member");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setRemovingId(null);
    }
  };

  const doSearch = async () => {
    if (!search.trim() || search.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/users?q=${encodeURIComponent(search.trim())}&type=${searchType}`
      );
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId: string) => {
    setAddingId(userId);
    setError("");
    const newMemberIds = [...members.map((m) => m.id), userId];
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: newMemberIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add member");
        return;
      }
      setSearchResults((r) => r.filter((u) => u.id !== userId));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setAddingId(null);
    }
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
      >
        <Settings size={14} /> Group settings
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Group settings</h3>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setConfirmDelete(false);
            setError("");
          }}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Close
        </button>
      </div>

      {/* Members */}
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Members</p>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
              <span className="text-sm text-zinc-900 dark:text-zinc-100">
                {m.name} {m.id === currentUserId && <span className="text-xs text-zinc-400">(you)</span>}
              </span>
              {m.id !== currentUserId && members.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  disabled={removingId === m.id}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                >
                  <UserMinus size={12} />
                  {removingId === m.id ? "Removing..." : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Add member */}
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Add member</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())}
            placeholder="Search users..."
            className="flex-1 min-w-[120px] rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "username" | "email" | "phone")}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <button
            type="button"
            onClick={doSearch}
            disabled={searching}
            className="inline-flex items-center gap-1 rounded bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Search size={12} /> {searching ? "..." : "Search"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 space-y-1 rounded border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
            {searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded px-2 py-1 text-sm">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {u.name || u.username || u.id}
                </span>
                {memberIds.has(u.id) ? (
                  <span className="text-xs text-zinc-400">Already in group</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addMember(u.id)}
                    disabled={addingId === u.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <UserPlus size={12} /> {addingId === u.id ? "Adding..." : "Add"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete group */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 size={14} /> Delete group
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400">
              Are you sure? This will permanently delete the group and all its expenses.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deleteGroup}
                disabled={deleting}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
