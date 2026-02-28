import { connectDB } from "@/lib/db";
import { ObjectId } from "mongodb";

export type BalanceEntry = {
  userId: string;
  owes: { userId: string; amount: number }[];
  owedBy: { userId: string; amount: number }[];
  netBalance: number; // positive = you owe others, negative = others owe you
};

/**
 * Compute net balances between all members in a group from expenses and settlements.
 * For each pair (A, B): A owes B = (B paid for A) - (A paid for B) + (A settled to B) - (B settled to A)
 */
export async function computeGroupBalances(groupId: string): Promise<Map<string, Map<string, number>>> {
  const db = await connectDB();
  const group = await db.collection("groups").findOne({ _id: new ObjectId(groupId) });
  if (!group) return new Map();
  const memberIds = (group.memberIds || []) as string[];

  const pairBalance = new Map<string, number>(); // key: "debtor_creditor", value: amount debtor owes creditor

  function getPair(debtor: string, creditor: string) {
    return pairBalance.get(`${debtor}_${creditor}`) ?? 0;
  }
  function addPair(debtor: string, creditor: string, delta: number) {
    const key = `${debtor}_${creditor}`;
    const current = pairBalance.get(key) ?? 0;
    pairBalance.set(key, current + delta);
  }

  const expenses = await db.collection("expenses").find({ groupId }).toArray();
  for (const exp of expenses) {
    const payerId = exp.payerId as string;
    const shares = (exp.shares || []) as { userId: string; amount: number }[];
    const total = exp.amount as number;
    for (const s of shares) {
      if (s.userId === payerId) continue;
      const amount = s.amount ?? total / shares.length;
      addPair(s.userId, payerId, amount); // s.userId owes payerId
    }
  }

  const settlements = await db.collection("settlements").find({ groupId }).toArray();
  for (const s of settlements) {
    const payerId = s.payerId as string;
    const receiverId = s.receiverId as string;
    const amount = s.amount as number;
    addPair(payerId, receiverId, -amount); // payer paid receiver, so payer's debt to receiver decreases
  }

  const result = new Map<string, Map<string, number>>();
  for (const a of memberIds) {
    const row = new Map<string, number>();
    for (const b of memberIds) {
      if (a === b) continue;
      const aOwesB = getPair(a, b);
      const bOwesA = getPair(b, a);
      const net = aOwesB - bOwesA; // positive = a owes b, negative = b owes a
      if (net !== 0) row.set(b, net);
    }
    result.set(a, row);
  }
  return result;
}

export function formatBalanceSummary(
  balances: Map<string, Map<string, number>>,
  currentUserId: string,
  userMap: Record<string, { name?: string | null; username?: string | null }>
): { youOwe: { userId: string; name: string; amount: number }[]; youAreOwed: { userId: string; name: string; amount: number }[] } {
  const row = balances.get(currentUserId);
  if (!row) return { youOwe: [], youAreOwed: [] };
  const youOwe: { userId: string; name: string; amount: number }[] = [];
  const youAreOwed: { userId: string; name: string; amount: number }[] = [];
  for (const [userId, amount] of row.entries()) {
    const name = userMap[userId]?.name || userMap[userId]?.username || "Unknown";
    if (amount > 0) youOwe.push({ userId, name, amount });
    else if (amount < 0) youAreOwed.push({ userId, name, amount: -amount });
  }
  return { youOwe, youAreOwed };
}
