import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { computeGroupBalances } from "@/lib/utils/balance";
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
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const userIds = group.memberIds || [];
  const users =
    userIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: userIds.map((id: string) => new ObjectId(id)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const settings = group.settings ?? { duplicatePaymentCheck: true };
  return NextResponse.json({
    id: group._id.toString(),
    name: group.name,
    createdBy: group.createdBy,
    memberIds: group.memberIds || [],
    members: (group.memberIds || []).map((id: string) => ({
      id,
      name: userMap[id]?.name,
      username: userMap[id]?.username,
      image: userMap[id]?.image,
    })),
    settings,
    createdAt: group.createdAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const body = await request.json();
  const db = await connectDB();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (body.settings && typeof body.settings === "object") {
    const s = body.settings as Record<string, unknown>;
    if (typeof s.duplicatePaymentCheck === "boolean") {
      update["settings.duplicatePaymentCheck"] = s.duplicatePaymentCheck;
    }
  }
  if (Array.isArray(body.memberIds)) {
    const memberIds = (body.memberIds as string[]).filter((id: unknown) => typeof id === "string");
    if (!memberIds.includes(session.user.id)) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    const currentGroup = await db.collection("groups").findOne({ _id: new ObjectId(id) });
    const currentMemberIds = (currentGroup?.memberIds || []) as string[];
    const removedIds = currentMemberIds.filter((mid) => !memberIds.includes(mid));

    if (removedIds.length > 0) {
      const balances = await computeGroupBalances(id);
      for (const removedId of removedIds) {
        const row = balances.get(removedId);
        if (!row) continue;
        for (const [, amount] of row.entries()) {
          if (amount > 0) {
            const user = await db.collection("users").findOne({ _id: new ObjectId(removedId) });
            const name = user?.name || user?.username || "This member";
            return NextResponse.json(
              { error: `${name} still has unsettled debts in this group. Please settle all balances before removing them.` },
              { status: 400 }
            );
          }
        }
      }
    }

    const newlyAdded = memberIds.filter((mid) => !currentMemberIds.includes(mid));
    if (newlyAdded.length > 0) {
      const friendConns = await db
        .collection("connections")
        .find({
          status: "accepted",
          $or: newlyAdded.map((uid) => {
            const [u1, u2] =
              session.user.id < uid
                ? [session.user.id, uid]
                : [uid, session.user.id];
            return { userId1: u1, userId2: u2 };
          }),
        })
        .toArray();
      const friendSet = new Set(
        friendConns.map((c) =>
          c.userId1 === session.user.id ? c.userId2 : c.userId1
        )
      );
      const nonFriends = newlyAdded.filter((id) => !friendSet.has(id));
      if (nonFriends.length > 0) {
        return NextResponse.json(
          { error: "You can only add friends to a group" },
          { status: 403 }
        );
      }
    }

    update.memberIds = Array.from(new Set(memberIds));
  }
  const result = await db.collection("groups").findOneAndUpdate(
    { _id: new ObjectId(id), memberIds: session.user.id },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!result) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json({ id: result._id.toString(), ...result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  const db = await connectDB();
  const result = await db.collection("groups").deleteOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
