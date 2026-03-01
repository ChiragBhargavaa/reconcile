"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

type Member = { id: string; name: string };

type LastExpense = {
  amount: number;
  note: string;
  payer?: { name?: string } | null;
  createdAt: string;
};

export function AddExpenseForm({
  groupId,
  members,
  currentUserId,
  duplicatePaymentCheck = true,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  duplicatePaymentCheck?: boolean;
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
  const [duplicateWarning, setDuplicateWarning] = useState<LastExpense | null>(null);

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

  const submitExpense = useCallback(async (amt: number) => {
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
      setDuplicateWarning(null);
      window.dispatchEvent(new CustomEvent("expense-added"));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [groupId, note, payerId, participantIds, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDuplicateWarning(null);
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

    if (duplicatePaymentCheck) {
      try {
        const res = await fetch(`/api/groups/${groupId}/expenses?limit=1`);
        if (res.ok) {
          const expenses = await res.json();
          if (expenses.length > 0 && expenses[0].amount === amt) {
            setDuplicateWarning(expenses[0]);
            setLoading(false);
            return;
          }
        }
      } catch {
        // proceed even if check fails
      }
    }

    await submitExpense(amt);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-[clamp(14px,2.5vh,24px)] lg:min-w-[320px]"
      >
        <div className="space-y-[clamp(10px,1.8vh,18px)]">
          <div>
            <label className="block text-[clamp(12px,2vh,16px)] font-medium text-zinc-900">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-[clamp(2px,0.4vh,4px)] w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-[clamp(5px,0.8vh,12px)] text-[clamp(12px,2vh,16px)] text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-[clamp(12px,2vh,16px)] font-medium text-zinc-900">
              Paid by
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="mt-[clamp(2px,0.4vh,4px)] w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-[clamp(5px,0.8vh,12px)] text-[clamp(12px,2vh,16px)] text-zinc-900 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-[clamp(2px,0.4vh,4px)] flex items-center justify-between">
              <label className="block text-[clamp(12px,2vh,16px)] font-medium text-zinc-900">
                Split between
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded px-2 py-0.5 text-[clamp(10px,1.6vh,14px)] font-medium text-zinc-600 hover:bg-white/20"
                >
                  Select all
                </button>
                <span className="text-zinc-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="rounded px-2 py-0.5 text-[clamp(10px,1.6vh,14px)] font-medium text-zinc-600 hover:bg-white/20"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <ul className="grid max-h-[clamp(80px,18vh,200px)] grid-cols-2 gap-x-3 gap-y-0 overflow-y-auto rounded-xl ring-1 ring-white/20 py-0.5">
              {members.map((m) => (
                <li
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleParticipant(m.id)}
                  onKeyDown={(e) => e.key === "Enter" && toggleParticipant(m.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2.5 py-[clamp(3px,0.5vh,6px)] transition-colors hover:bg-white/20 ${
                    participantIds.has(m.id)
                      ? "bg-green-400/30 text-green-600"
                      : "text-zinc-600"
                  }`}
                >
                  <span
                    className={`flex h-[clamp(12px,1.8vh,16px)] w-[clamp(12px,1.8vh,16px)] shrink-0 items-center justify-center rounded border ${
                      participantIds.has(m.id)
                        ? "border-green-500 bg-green-500"
                        : "border-zinc-400"
                    }`}
                  >
                    {participantIds.has(m.id) && (
                      <svg className="h-[clamp(7px,1vh,10px)] w-[clamp(7px,1vh,10px)] text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate text-[clamp(11px,1.8vh,15px)] font-medium">{m.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-[clamp(12px,2vh,16px)] font-medium text-zinc-900">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-[clamp(2px,0.4vh,4px)] w-full rounded-xl bg-white/15 backdrop-blur-xl px-3 py-[clamp(5px,0.8vh,12px)] text-[clamp(12px,2vh,16px)] text-zinc-900 placeholder-zinc-500 ring-1 ring-white/20 focus:ring-2 focus:ring-white/40 focus:outline-none"
              placeholder="e.g. Dinner at cafe"
            />
          </div>
          {error && <p className="text-[clamp(11px,1.8vh,15px)] text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-[clamp(5px,0.8vh,12px)] text-[clamp(12px,2vh,16px)] font-medium text-white transition hover:bg-black disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add expense"}
          </button>
        </div>
      </form>

      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white ring-1 ring-zinc-200 shadow-[0_4px_20px_rgba(0,0,0,0.1)] p-5">
            <div className="mb-3 flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-semibold">Possible duplicate payment</h3>
            </div>
            <p className="mb-3 text-sm text-zinc-600">
              The amount you entered matches the last expense in this group. This might be an accidental duplicate.
            </p>
            <div className="mb-4 rounded-xl bg-white/15 ring-1 ring-white/20 p-3">
              <p className="text-sm font-semibold text-zinc-900">Last transaction</p>
              <p className="mt-1 text-sm font-semibold text-zinc-800">
                ₹{duplicateWarning.amount.toFixed(2)}
              </p>
              {duplicateWarning.note && (
                <p className="mt-0.5 text-xs text-zinc-600">
                  {duplicateWarning.note}
                </p>
              )}
              <p className="mt-0.5 text-xs text-zinc-600">
                Paid by {duplicateWarning.payer?.name || "Unknown"} &middot;{" "}
                {new Date(duplicateWarning.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  submitExpense(parseFloat(amount));
                }}
                  className="flex-1 rounded-lg bg-black py-2 text-sm font-medium text-white transition hover:bg-black"
              >
                Add anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  setLoading(false);
                }}
                  className="flex-1 rounded-lg bg-white/15 ring-1 ring-white/20 py-2 text-sm font-medium text-zinc-700 hover:bg-white/25"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
