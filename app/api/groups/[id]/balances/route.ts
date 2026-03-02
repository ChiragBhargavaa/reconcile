import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { computeGroupBalances, formatBalanceSummary } from "@/lib/utils/balance";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: userId,
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const balances = await computeGroupBalances(id);
  const userIds = (group.memberIds || []) as string[];
  const users =
    userIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: userIds.map((i) => new ObjectId(i)) } })
          .toArray()
      : [];
  const userMap: Record<string, { name?: string | null; username?: string | null }> = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = { name: u.name, username: u.username };
  });

  const summary = formatBalanceSummary(balances, userId, userMap);
  return NextResponse.json(summary);
}
