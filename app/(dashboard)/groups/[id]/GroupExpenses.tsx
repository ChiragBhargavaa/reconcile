"use client";

import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { FileDown } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  note?: string;
  payer?: { name?: string; username?: string } | null;
  shares: { userId: string; amount: number; user?: { name?: string; username?: string } | null }[];
  createdAt: string;
};

export function GroupExpenses({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = () => {
      fetch(`/api/groups/${groupId}/expenses`)
        .then((r) => r.json())
        .then(setExpenses)
        .catch(() => setExpenses([]))
        .finally(() => setLoading(false));
    };
    fetchExpenses();
    const handler = () => fetchExpenses();
    window.addEventListener("expense-added", handler);
    return () => window.removeEventListener("expense-added", handler);
  }, [groupId]);

  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 14;
    const maxWidth = doc.internal.pageSize.width - margin * 2;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 5;

    const addWrappedText = (text: string, x: number, startY: number, fontSize: number): number => {
      doc.setFontSize(fontSize);
      const lines: string[] = doc.splitTextToSize(text, maxWidth - (x - margin));
      let y = startY;
      for (const line of lines) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, x, y);
        y += lineHeight;
      }
      return y;
    };

    doc.setFontSize(18);
    doc.text(groupName, margin, 20);
    doc.setFontSize(8);
    doc.text(`Expenses export - ${new Date().toLocaleDateString()}`, margin, 27);

    let y = 35;
    expenses.forEach((e, i) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }
      const payer = e.payer?.name || e.payer?.username || "Unknown";
      y = addWrappedText(`${i + 1}. Rs.${e.amount.toFixed(2)} - paid by ${payer}`, margin, y, 8);
      if (e.note) {
        y = addWrappedText(`   Note: ${e.note}`, margin, y, 7);
      }
      const split = e.shares.map((s) => `${s.user?.name || s.user?.username || "?"}: Rs.${s.amount.toFixed(2)}`).join(", ");
      y = addWrappedText(`   Split: ${split}`, margin, y, 7);
      y = addWrappedText(`   Date: ${new Date(e.createdAt).toLocaleDateString()}`, margin, y, 7);
      y += 3;
    });
    doc.save(`expenses-${groupName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading expenses...</p>;
  if (expenses.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-800">Expenses</h2>
        </div>
        <p className="rounded-xl border border-dashed border-white/30 bg-white/10 backdrop-blur-xl p-6 text-center text-sm text-zinc-600">
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900">Expenses</h2>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
        >
          <FileDown size={14} /> Export PDF
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl pr-1">
        <ul className="space-y-1.5">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="rounded-xl bg-white/30 backdrop-blur-2xl ring-1 ring-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 truncate">
                  <span className="text-sm font-medium text-zinc-900">
                    ₹{e.amount.toFixed(2)}
                  </span>
                  <span className="ml-1.5 text-xs text-zinc-600">
                    paid by {e.payer?.name || e.payer?.username || "Unknown"}
                  </span>
                  {e.note && (
                    <span className="ml-1.5 text-xs italic text-zinc-500">— {e.note}</span>
                  )}
                </div>
                <span className="ml-2 shrink-0 text-[11px] text-zinc-400">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">
                Split: {e.shares.map((s) => `${s.user?.name || s.user?.username || "?"}: ₹${s.amount.toFixed(2)}`).join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
