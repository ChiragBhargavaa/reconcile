"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateAddSubtractExpression,
  formatEvaluatedAmount,
  looksLikeAddSubExpression,
} from "@/lib/utils/amountExpression";

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

  useEffect(() => {
    if (!looksLikeAddSubExpression(amount)) return;
    const t = setTimeout(() => {
      setAmount((prev) => {
        if (!looksLikeAddSubExpression(prev)) return prev;
        const n = evaluateAddSubtractExpression(prev);
        if (n === null) return prev;
        return formatEvaluatedAmount(n);
      });
    }, 700);
    return () => clearTimeout(t);
  }, [amount]);

  const parseAmount = (raw: string) =>
    evaluateAddSubtractExpression(raw.trim()) ?? parseFloat(raw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseAmount(amount);
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
      window.dispatchEvent(new CustomEvent("settlement-added"));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (members.length === 0) return null;

  return (
    <div className="mt-4 border-t-2 border-zinc-900 pt-4">
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="rounded-md border-2 border-zinc-900 bg-[#ffb4d2] px-4 py-2 text-sm font-bold text-zinc-900 shadow-[4px_4px_0_#111] transition hover:-translate-y-0.5"
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
            className="w-full rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none"
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
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹), e.g. 100+50"
            className="w-full rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none"
            required
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded-md border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md border-2 border-zinc-900 bg-[#6ee7b7] px-3 py-1.5 text-sm font-bold text-zinc-900 shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Recording..." : "Record"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShow(false);
                setError("");
              }}
              className="rounded-md border-2 border-zinc-900 bg-white px-3 py-1.5 text-sm font-bold text-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
