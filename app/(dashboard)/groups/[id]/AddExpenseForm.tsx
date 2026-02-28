"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string };

export function AddExpenseForm({
  groupId,
  members,
  currentUserId,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payerId, setPayerId] = useState(currentUserId);
  const [participantIds, setParticipantIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleParticipant = (id: string) => {
    setParticipantIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };
  const selectAll = () => setParticipantIds(new Set(members.map((m) => m.id)));
  const deselectAll = () => setParticipantIds(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (participantIds.size === 0) {
      setError("Select at least one participant");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          note: note.trim(),
          payerId,
          participantIds: Array.from(participantIds),
          splitType: "equal",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add expense");
        return;
      }
      setAmount("");
      setNote("");
      window.dispatchEvent(new CustomEvent("expense-added"));
      router.refresh();
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:min-w-[320px]"
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Paid by
          </label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Split between
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="rounded px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Select all
              </button>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="rounded px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Deselect all
              </button>
            </div>
          </div>
          <ul className="grid max-h-[280px] grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto rounded-lg border border-zinc-200 py-1 dark:border-zinc-700">
            {members.map((m) => (
              <li
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleParticipant(m.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleParticipant(m.id)}
                className={`flex cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                  participantIds.has(m.id)
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                    participantIds.has(m.id)
                      ? "border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500"
                      : "border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {participantIds.has(m.id) && (
                    <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className="truncate text-xs font-medium">{m.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
            placeholder="e.g. Dinner at cafe"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Adding..." : "Add expense"}
        </button>
      </div>
    </form>
  );
}
