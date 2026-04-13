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
    <div className="flex min-h-0 flex-1 flex-col lg:h-full">
      <div className="mb-3 flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("expenses")}
          className={`flex-1 rounded-md border-2 border-zinc-900 px-4 py-2 text-sm font-bold transition sm:flex-none ${
            tab === "expenses"
              ? "bg-[#6ee7b7] text-zinc-900 shadow-[4px_4px_0_#111]"
              : "bg-white text-zinc-700 hover:-translate-y-0.5"
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setTab("settlements")}
          className={`flex-1 rounded-md border-2 border-zinc-900 px-4 py-2 text-sm font-bold transition sm:flex-none ${
            tab === "settlements"
              ? "bg-[#ffb4d2] text-zinc-900 shadow-[4px_4px_0_#111]"
              : "bg-white text-zinc-700 hover:-translate-y-0.5"
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
