"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus, UserPlus, Search, Settings, ShieldCheck } from "lucide-react";

type Member = { id: string; name: string };
type SearchUser = { id: string; name?: string; username?: string };

export function GroupSettings({
  groupId,
  members,
  currentUserId,
  duplicatePaymentCheck: initialDuplicateCheck = true,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  duplicatePaymentCheck?: boolean;
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [dupCheck, setDupCheck] = useState(initialDuplicateCheck);
  const [togglingDupCheck, setTogglingDupCheck] = useState(false);

  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<"username" | "email" | "phone">("username");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const memberIds = new Set(members.map((m) => m.id));

  const toggleDuplicateCheck = async () => {
    setTogglingDupCheck(true);
    setError("");
    const newValue = !dupCheck;
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { duplicatePaymentCheck: newValue } }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update setting");
        return;
      }
      setDupCheck(newValue);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setTogglingDupCheck(false);
    }
  };

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
        className="inline-flex items-center gap-1.5 text-[clamp(12px,2vh,16px)] font-medium text-zinc-600 transition hover:text-zinc-800"
      >
        <Settings size={14} /> Group settings
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-zinc-900">Group settings</h3>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setConfirmDelete(false);
            setError("");
          }}
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          Close
        </button>
      </div>

      {/* Members */}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-900">Members</p>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
              <span className="text-sm text-zinc-900">
                {m.name} {m.id === currentUserId && <span className="text-xs text-zinc-400">(you)</span>}
              </span>
              {m.id !== currentUserId && members.length > 2 && (
                confirmRemoveId === m.id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-xs text-zinc-600">Sure?</span>
                    <button
                      type="button"
                      onClick={() => { setConfirmRemoveId(null); removeMember(m.id); }}
                      disabled={removingId === m.id}
                      className="text-xs font-medium text-red-400 hover:text-red-500 disabled:opacity-50"
                    >
                      {removingId === m.id ? "Removing..." : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-800"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setError(""); setConfirmRemoveId(m.id); }}
                    disabled={removingId === m.id}
                    className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
                  >
                    <UserMinus size={12} />
                    Remove
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Duplicate payment check */}
      <div className="border-t border-white/15 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-zinc-600" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Check for accidental payments
              </p>
              <p className="text-xs text-zinc-600">
                Warns when a new expense matches the last one
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDuplicateCheck}
            disabled={togglingDupCheck}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              dupCheck
                ? "bg-green-500"
                : "bg-zinc-400"
            }`}
            role="switch"
            aria-checked={dupCheck}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                dupCheck ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Add member */}
      <div>
        <p className="mb-2 text-sm font-semibold text-zinc-900">Add member</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doSearch())}
            placeholder="Search users..."
            className="flex-1 min-w-[120px] rounded-xl bg-white/15 backdrop-blur-xl px-3 py-1.5 text-sm text-zinc-900 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "username" | "email" | "phone")}
            className="rounded-xl bg-white/15 backdrop-blur-xl px-2 py-1.5 text-sm text-zinc-900 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
          >
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
          <button
            type="button"
            onClick={doSearch}
            disabled={searching}
            className="inline-flex items-center gap-1 rounded-lg bg-black px-3 py-1.5 text-xs text-white transition hover:bg-black"
          >
            <Search size={12} /> {searching ? "..." : "Search"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 space-y-1 rounded-xl bg-white/15 backdrop-blur-xl ring-1 ring-white/20 p-2">
            {searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded px-2 py-1 text-sm">
                <span className="text-zinc-900">
                  {u.name || u.username || u.id}
                </span>
                {memberIds.has(u.id) ? (
                  <span className="text-xs text-zinc-400">Already in group</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => addMember(u.id)}
                    disabled={addingId === u.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
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
      <div className="border-t border-white/15 pt-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400 transition hover:text-red-500"
          >
            <Trash2 size={14} /> Delete group
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400">
              Are you sure? This will permanently delete the group and all its expenses.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deleteGroup}
                disabled={deleting}
                className="rounded bg-red-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-white/15 ring-1 ring-white/20 px-3 py-1.5 text-xs text-zinc-700 hover:bg-white/25"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
