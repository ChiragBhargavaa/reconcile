"use client";

import { useState } from "react";
import { GroupExpenses } from "./GroupExpenses";
import { GroupSettlements } from "./GroupSettlements";

type Tab = "expenses" | "settlements";

export function GroupLedgerTabs({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [tab, setTab] = useState<Tab>("expenses");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setTab("expenses")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "expenses"
              ? "bg-black text-white shadow-sm"
              : "bg-white/20 text-zinc-700 ring-1 ring-white/30 backdrop-blur-xl hover:bg-white/30"
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setTab("settlements")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            tab === "settlements"
              ? "bg-black text-white shadow-sm"
              : "bg-white/20 text-zinc-700 ring-1 ring-white/30 backdrop-blur-xl hover:bg-white/30"
          }`}
        >
          Settle ups
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "expenses" ? (
          <GroupExpenses groupId={groupId} groupName={groupName} />
        ) : (
          <GroupSettlements groupId={groupId} />
        )}
      </div>
    </div>
  );
}
