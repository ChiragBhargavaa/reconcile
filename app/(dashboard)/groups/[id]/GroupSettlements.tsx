"use client";

import { useState, useEffect } from "react";

type Settlement = {
  id: string;
  amount: number;
  note?: string;
  payer?: { name?: string; username?: string } | null;
  receiver?: { name?: string; username?: string } | null;
  createdAt: string;
};

export function GroupSettlements({ groupId }: { groupId: string }) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlements = () => {
      fetch(`/api/groups/${groupId}/settlements`)
        .then((r) => r.json())
        .then((data) => {
          setSettlements(Array.isArray(data) ? data : []);
        })
        .catch(() => setSettlements([]))
        .finally(() => setLoading(false));
    };
    fetchSettlements();
    const handler = () => fetchSettlements();
    window.addEventListener("settlement-added", handler);
    return () => window.removeEventListener("settlement-added", handler);
  }, [groupId]);

  const payerName = (s: Settlement) => s.payer?.name || s.payer?.username || "Unknown";
  const receiverName = (s: Settlement) => s.receiver?.name || s.receiver?.username || "Unknown";

  if (loading) return <p className="text-sm text-zinc-500">Loading settle ups...</p>;
  if (settlements.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-800">Settle ups</h2>
        </div>
        <p className="rounded-xl border border-dashed border-white/30 bg-white/10 backdrop-blur-xl p-6 text-center text-sm text-zinc-600">
          No settle ups recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900">Settle ups</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl pr-1">
        <ul className="space-y-1.5">
          {settlements.map((s) => (
            <li
              key={s.id}
              className="rounded-xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-zinc-900">₹{s.amount.toFixed(2)}</span>
                  <span className="ml-1.5 text-xs text-zinc-600">
                    {payerName(s)} paid {receiverName(s)}
                  </span>
                  {s.note ? (
                    <span className="ml-1.5 text-xs italic text-zinc-500">— {s.note}</span>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
