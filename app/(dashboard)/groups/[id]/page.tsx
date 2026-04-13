import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { computeGroupBalances, formatBalanceSummary } from "@/lib/utils/balance";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { ArrowLeft } from "lucide-react";
import { GroupLedgerTabs } from "./GroupLedgerTabs";
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
        <Link href="/dashboard" className="text-blue-600 hover:underline">
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

  const adminMemberIds: string[] =
    Array.isArray(group.adminIds) && group.adminIds.length > 0
      ? (group.adminIds as string[])
      : group.createdBy
        ? [group.createdBy as string]
        : [];
  const isGroupAdmin = adminMemberIds.includes(session.user.id);

  const balances = await computeGroupBalances(id);
  const summary = formatBalanceSummary(balances, session.user.id, userMap);

  return (
    <div className="flex flex-col gap-6 lg:max-h-[calc(100vh-5.5rem)] lg:flex-row lg:overflow-hidden">
      {/* Left side: Group details + Add expense */}
      <div className="shrink-0 pb-6 lg:w-[340px] lg:overflow-y-auto">
        <Link
          href="/dashboard"
          className="mb-[clamp(4px,0.8vh,10px)] inline-flex items-center gap-2 text-[clamp(12px,1.8vh,16px)] font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-[clamp(22px,4vh,38px)] font-bold tracking-tight text-zinc-900">{group.name}</h1>
        <div className="mt-[clamp(2px,0.5vh,8px)]">
          <GroupSettings
            groupId={id}
            members={memberIds.map((m) => ({ id: m, name: userMap[m]?.name || userMap[m]?.username || "Unknown" }))}
            currentUserId={session.user.id}
            adminMemberIds={adminMemberIds}
            isGroupAdmin={isGroupAdmin}
            duplicatePaymentCheck={duplicatePaymentCheck}
          />
        </div>

        <div className="mt-[clamp(6px,1.2vh,16px)]">
          <h2 className="mb-[clamp(4px,0.8vh,10px)] text-[clamp(14px,2.5vh,22px)] font-bold text-zinc-900">Add expense</h2>
          <AddExpenseForm
            groupId={id}
            members={memberIds.map((m) => ({ id: m, name: userMap[m]?.name || userMap[m]?.username || "Unknown" }))}
            currentUserId={session.user.id}
            duplicatePaymentCheck={duplicatePaymentCheck}
          />
        </div>
      </div>

      {/* Right side: Stats */}
      <div className="min-w-0 flex-1 lg:overflow-hidden">
        <div className="flex flex-col gap-4 lg:h-full">
          <div className="shrink-0 rounded-lg border-4 border-zinc-900 bg-[#f8f4e8] p-3 shadow-[8px_8px_0_#111] sm:p-4">
            <h2 className="mb-2 text-sm font-bold text-zinc-900 sm:mb-3 sm:text-base">Balances</h2>
            <div className="max-h-[30vh] overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible lg:pr-0">
            {summary.youOwe.length === 0 && summary.youAreOwed.length === 0 ? (
              <p className="text-xs text-zinc-600 sm:text-sm">All settled up!</p>
            ) : (
              <>
                {summary.youOwe.length > 0 && (
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs font-semibold text-zinc-900 sm:text-sm">You owe</p>
                    <ul className="mt-1 space-y-0.5">
                      {summary.youOwe.map((b) => (
                        <li key={b.userId} className="flex justify-between text-xs sm:text-sm">
                          <span className="truncate text-zinc-900">{b.name}</span>
                          <span className="ml-2 shrink-0 font-medium text-red-400">₹{b.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 border-t-2 border-zinc-900 pt-1 text-xs font-bold text-red-500 sm:text-sm">
                      Total: ₹{summary.youOwe.reduce((s, b) => s + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                )}
                {summary.youAreOwed.length > 0 && (
                  <div className="mb-2 sm:mb-3">
                    <p className="text-xs font-semibold text-zinc-900 sm:text-sm">You are owed</p>
                    <ul className="mt-1 space-y-0.5">
                      {summary.youAreOwed.map((b) => (
                        <li key={b.userId} className="flex justify-between text-xs sm:text-sm">
                          <span className="truncate text-zinc-900">{b.name}</span>
                          <span className="ml-2 shrink-0 font-medium text-green-600">₹{b.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 border-t-2 border-zinc-900 pt-1 text-xs font-bold text-green-700 sm:text-sm">
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
          </div>
          <div className="min-h-0 flex-1">
            <GroupLedgerTabs groupId={id} groupName={group.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
