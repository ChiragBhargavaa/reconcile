import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { computeGroupBalances, formatBalanceSummary } from "@/lib/utils/balance";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { ArrowLeft } from "lucide-react";
import { GroupExpenses } from "./GroupExpenses";
import { AddExpenseForm } from "./AddExpenseForm";
import { SettleUpForm } from "./SettleUpForm";
import { GroupSettings } from "./GroupSettings";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) return null;

  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (!group) {
    return (
      <div>
        <p>Group not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to groups
        </Link>
      </div>
    );
  }

  const memberIds = (group.memberIds || []) as string[];
  const users =
    memberIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: memberIds.map((i) => new ObjectId(i)) } })
          .toArray()
      : [];
  const userMap: Record<string, { name?: string; username?: string }> = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = { name: u.name, username: u.username };
  });

  const duplicatePaymentCheck = group.settings?.duplicatePaymentCheck !== false;

  const balances = await computeGroupBalances(id);
  const summary = formatBalanceSummary(balances, session.user.id, userMap);

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="order-2 shrink-0 lg:order-1 lg:flex lg:w-[340px] lg:flex-shrink-0 lg:items-end">
        <div className="w-full lg:sticky lg:bottom-6 lg:top-24">
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Add expense</h2>
          <AddExpenseForm
            groupId={id}
            members={memberIds.map((m) => ({ id: m, name: userMap[m]?.name || userMap[m]?.username || "Unknown" }))}
            currentUserId={session.user.id}
            duplicatePaymentCheck={duplicatePaymentCheck}
          />
        </div>
      </div>

      <div className="order-1 min-w-0 flex-1 lg:order-2">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{group.name}</h1>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{memberIds.length} members</p>
        <div className="mt-2">
          <GroupSettings
            groupId={id}
            members={memberIds.map((m) => ({ id: m, name: userMap[m]?.name || userMap[m]?.username || "Unknown" }))}
            currentUserId={session.user.id}
            duplicatePaymentCheck={duplicatePaymentCheck}
          />
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="shrink-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:w-56">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Balances</h2>
            {summary.youOwe.length === 0 && summary.youAreOwed.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">All settled up!</p>
            ) : (
              <>
                {summary.youOwe.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">You owe</p>
                    <ul className="mt-1 space-y-0.5">
                      {summary.youOwe.map((b) => (
                        <li key={b.userId} className="flex justify-between text-xs">
                          <span className="truncate text-zinc-900 dark:text-zinc-100">{b.name}</span>
                          <span className="ml-2 shrink-0 font-medium text-red-600 dark:text-red-400">₹{b.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 border-t border-zinc-200 pt-1 text-xs font-semibold text-red-600 dark:border-zinc-700 dark:text-red-400">
                      Total: ₹{summary.youOwe.reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                )}
                {summary.youAreOwed.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">You are owed</p>
                    <ul className="mt-1 space-y-0.5">
                      {summary.youAreOwed.map((b) => (
                        <li key={b.userId} className="flex justify-between text-xs">
                          <span className="truncate text-zinc-900 dark:text-zinc-100">{b.name}</span>
                          <span className="ml-2 shrink-0 font-medium text-green-600 dark:text-green-400">₹{b.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 border-t border-zinc-200 pt-1 text-xs font-semibold text-green-600 dark:border-zinc-700 dark:text-green-400">
                      Total: ₹{summary.youAreOwed.reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                )}
                <SettleUpForm
                  groupId={id}
                  members={memberIds
                    .filter((m) => m !== session.user.id)
                    .map((m) => ({ id: m, name: userMap[m]?.name || userMap[m]?.username || "Unknown" }))}
                />
              </>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <GroupExpenses groupId={id} groupName={group.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
