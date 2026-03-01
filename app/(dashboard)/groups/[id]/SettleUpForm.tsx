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
    <div className="mt-4 border-t border-white/15 pt-4">
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Settle up
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-sm font-semibold text-zinc-900">
            I paid
          </p>
          <select
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-2 text-sm text-zinc-900 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
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
            className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
            required
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-3 py-1.5 text-sm text-white transition hover:bg-black disabled:opacity-60"
            >
              {loading ? "Recording..." : "Record"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShow(false);
                setError("");
              }}
              className="rounded-lg bg-white/15 ring-1 ring-white/20 px-3 py-1.5 text-sm text-zinc-700 hover:bg-white/25"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
