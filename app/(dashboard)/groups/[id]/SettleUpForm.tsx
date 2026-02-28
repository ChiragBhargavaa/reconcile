"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string };

export function SettleUpForm({
  groupId,
  members,
}: {
  groupId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!receiverId) {
      setError("Select who you paid");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          receiverId,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record settlement");
        return;
      }
      setAmount("");
      setNote("");
      setReceiverId("");
      setShow(false);
      window.dispatchEvent(new CustomEvent("expense-added"));
      router.refresh();
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (members.length === 0) return null;

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Settle up
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            I paid
          </p>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          >
            <option value="">Select person</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Recording..." : "Record"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShow(false);
                setError("");
              }}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
