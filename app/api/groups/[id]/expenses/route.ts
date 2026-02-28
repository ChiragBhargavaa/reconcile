import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
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
  const expenses = await db
    .collection("expenses")
    .find({ groupId: id })
    .sort({ createdAt: -1 })
    .toArray();
  const userIds = new Set<string>();
  expenses.forEach((e) => {
    userIds.add(e.payerId as string);
    (e.shares || []).forEach((s: { userId: string }) => userIds.add(s.userId));
  });
  const users =
    userIds.size > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: Array.from(userIds).map((i) => new ObjectId(i)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const result = expenses.map((e) => ({
    id: e._id.toString(),
    groupId: e.groupId,
    payerId: e.payerId,
    payer: userMap[e.payerId as string]
      ? {
          id: e.payerId,
          name: userMap[e.payerId as string].name,
          username: userMap[e.payerId as string].username,
        }
      : null,
    amount: e.amount,
    currency: e.currency || "INR",
    note: e.note,
    splitType: e.splitType || "equal",
    shares: (e.shares || []).map((s: { userId: string; amount: number }) => ({
      userId: s.userId,
      user: userMap[s.userId]
        ? { name: userMap[s.userId].name, username: userMap[s.userId].username }
        : null,
      amount: s.amount,
    })),
    createdAt: e.createdAt,
  }));
  return NextResponse.json(result);
}

export async function POST(
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
  const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const splitType = body.splitType === "custom" ? "custom" : "equal";
  let shares: { userId: string; amount: number }[] = [];

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
  }

  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const memberIds = (group.memberIds || []) as string[];
  const participantIds = Array.isArray(body.participantIds)
    ? (body.participantIds as string[]).filter((i: string) => memberIds.includes(i))
    : memberIds;

  if (participantIds.length === 0) {
    return NextResponse.json({ error: "At least one participant required" }, { status: 400 });
  }

  const payerId = body.payerId && memberIds.includes(body.payerId) ? body.payerId : session.user.id;

  if (splitType === "custom") {
    shares = Array.isArray(body.shares)
      ? (body.shares as { userId: string; amount: number }[]).filter(
          (s) => participantIds.includes(s.userId) && typeof s.amount === "number" && s.amount >= 0
        )
      : [];
    const sum = shares.reduce((a, s) => a + s.amount, 0);
    if (Math.abs(sum - amount) > 0.01) {
      return NextResponse.json({ error: "Custom splits must sum to the total amount" }, { status: 400 });
    }
  } else {
    const perPerson = amount / participantIds.length;
    shares = participantIds.map((userId) => ({ userId, amount: Math.round(perPerson * 100) / 100 }));
  }

  const doc = {
    groupId: id,
    payerId,
    amount,
    currency: body.currency || "INR",
    note,
    splitType,
    shares,
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection("expenses").insertOne(doc);
  return NextResponse.json({ id: insertedId.toString(), ...doc });
}
