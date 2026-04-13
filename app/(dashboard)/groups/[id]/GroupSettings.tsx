"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus, UserPlus, Search, Settings, ShieldCheck } from "lucide-react";

type Member = { id: string; name: string };
type SearchUser = { id: string; name?: string; username?: string };

export function GroupSettings({
  groupId,
  members,
  currentUserId,
  adminMemberIds,
  isGroupAdmin,
  duplicatePaymentCheck: initialDuplicateCheck = true,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  adminMemberIds: string[];
  isGroupAdmin: boolean;
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
  const [friends, setFriends] = useState<SearchUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const memberIds = new Set(members.map((m) => m.id));

  useEffect(() => {
    if (show && friends.length === 0) {
      setLoadingFriends(true);
      fetch("/api/friends")
        .then((r) => r.json())
        .then((data) => setFriends(Array.isArray(data) ? data : []))
        .catch(() => setFriends([]))
        .finally(() => setLoadingFriends(false));
    }
  }, [show, friends.length]);

  const query = search.trim().toLowerCase();
  const filteredFriends = friends.filter(
    (f) =>
      !memberIds.has(f.id) &&
      (f.name?.toLowerCase().includes(query) ||
        f.username?.toLowerCase().includes(query) ||
        !query)
  );

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
    <div className="mt-4 space-y-4 rounded-lg border-4 border-zinc-900 bg-[#f8f4e8] p-4 shadow-[8px_8px_0_#111]">
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
            <li key={m.id} className="flex flex-col gap-1 rounded-lg px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-zinc-900">
                {m.name}{" "}
                {m.id === currentUserId && <span className="text-xs text-zinc-400">(you)</span>}{" "}
                {adminMemberIds.includes(m.id) && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-zinc-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
                    <ShieldCheck size={10} aria-hidden /> Admin
                  </span>
                )}
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
      <div className="border-t-2 border-zinc-900 pt-4">
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
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-md border-2 border-zinc-900 transition-colors focus:outline-none disabled:opacity-50 ${
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
        <p className="mb-2 text-xs text-zinc-600">Only friends can be added to this group.</p>
        <div className="flex items-center gap-2">
          <Search size={14} className="text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="min-w-[120px] flex-1 rounded-md border-2 border-zinc-900 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:outline-none"
          />
        </div>
        {loadingFriends ? (
          <p className="mt-2 text-xs text-zinc-500">Loading friends...</p>
        ) : filteredFriends.length > 0 ? (
          <ul className="mt-2 space-y-1 rounded-md border-2 border-zinc-900 bg-white p-2">
            {filteredFriends.map((u) => (
              <li key={u.id} className="flex flex-col gap-1 rounded px-2 py-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-zinc-900">
                  {u.name || u.username || u.id}
                </span>
                <button
                  type="button"
                  onClick={() => addMember(u.id)}
                  disabled={addingId === u.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
                >
                  <UserPlus size={12} /> {addingId === u.id ? "Adding..." : "Add"}
                </button>
              </li>
            ))}
          </ul>
        ) : friends.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-600">
            No friends yet. Add friends first to include them in a group.
          </p>
        ) : filteredFriends.length === 0 && !query ? (
          <p className="mt-2 text-xs text-zinc-600">
            All friends are already in this group.
          </p>
        ) : query ? (
          <p className="mt-2 text-xs text-zinc-600">
            No friends match &ldquo;{search.trim()}&rdquo;.
          </p>
        ) : null}
      </div>

      {/* Delete group — only the group admin (creator) */}
      {isGroupAdmin && (
        <div className="border-t-2 border-zinc-900 pt-4">
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
                  className="rounded-md border-2 border-zinc-900 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
