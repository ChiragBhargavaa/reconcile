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
    doc.setFontSize(18);
    doc.text(groupName, 14, 20);
    doc.setFontSize(10);
    doc.text(`Expenses export - ${new Date().toLocaleDateString()}`, 14, 28);
    let y = 40;
    const lineHeight = 8;
    const pageHeight = doc.internal.pageSize.height;
    expenses.forEach((e, i) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      const payer = e.payer?.name || e.payer?.username || "Unknown";
      doc.text(`${i + 1}. ₹${e.amount.toFixed(2)} - paid by ${payer}`, 14, y);
      y += lineHeight;
      if (e.note) {
        doc.setFontSize(9);
        doc.text(`   Note: ${e.note}`, 14, y);
        y += lineHeight;
        doc.setFontSize(10);
      }
      const split = e.shares.map((s) => `${s.user?.name || s.user?.username || "?"}: ₹${s.amount.toFixed(2)}`).join(", ");
      doc.text(`   Split: ${split}`, 14, y);
      y += lineHeight;
      doc.text(`   Date: ${new Date(e.createdAt).toLocaleDateString()}`, 14, y);
      y += lineHeight + 4;
    });
    doc.save(`expenses-${groupName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading expenses...</p>;
  if (expenses.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Expenses</h2>
        </div>
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Expenses</h2>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FileDown size={14} /> Export PDF
        </button>
      </div>
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
        <ul className="space-y-3">
      {expenses.map((e) => (
        <li
          key={e.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ₹{e.amount.toFixed(2)}
              </span>
              <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                paid by {e.payer?.name || e.payer?.username || "Unknown"}
              </span>
            </div>
            <span className="text-xs text-zinc-400">
              {new Date(e.createdAt).toLocaleDateString()}
            </span>
          </div>
          {e.note && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{e.note}</p>
          )}
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Split: {e.shares.map((s) => `${s.user?.name || s.user?.username || "?"}: ₹${s.amount.toFixed(2)}`).join(", ")}
          </div>
        </li>
      ))}
        </ul>
      </div>
    </div>
  );
}
