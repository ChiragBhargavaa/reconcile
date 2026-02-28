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
  const settlements = await db
    .collection("settlements")
    .find({ groupId: id })
    .sort({ createdAt: -1 })
    .toArray();
  const userIds = new Set<string>();
  settlements.forEach((s) => {
    userIds.add(s.payerId as string);
    userIds.add(s.receiverId as string);
  });
  const users =
    userIds.size > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: Array.from(userIds).map((i) => new ObjectId(i)) } })
          .toArray()
      : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
  const result = settlements.map((s) => ({
    id: s._id.toString(),
    groupId: s.groupId,
    payerId: s.payerId,
    receiverId: s.receiverId,
    payer: userMap[s.payerId as string]
      ? { name: userMap[s.payerId as string].name, username: userMap[s.payerId as string].username }
      : null,
    receiver: userMap[s.receiverId as string]
      ? {
          name: userMap[s.receiverId as string].name,
          username: userMap[s.receiverId as string].username,
        }
      : null,
    amount: s.amount,
    note: s.note,
    createdAt: s.createdAt,
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
  const receiverId = body.receiverId;

  if (isNaN(amount) || amount <= 0 || !receiverId) {
    return NextResponse.json({ error: "Valid amount and receiver are required" }, { status: 400 });
  }

  const db = await connectDB();
  const group = await db.collection("groups").findOne({
    _id: new ObjectId(id),
    memberIds: session.user.id,
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const memberIds = (group.memberIds || []) as string[];
  if (!memberIds.includes(receiverId) || receiverId === session.user.id) {
    return NextResponse.json({ error: "Invalid receiver" }, { status: 400 });
  }

  const doc = {
    groupId: id,
    payerId: session.user.id,
    receiverId,
    amount,
    note,
    createdAt: new Date(),
  };
  const { insertedId } = await db.collection("settlements").insertOne(doc);
  return NextResponse.json({ id: insertedId.toString(), ...doc });
}
