import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await request.json();
  const targetUserId = body.userId;
  if (!targetUserId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }
  const db = await connectDB();
  const target = await db.collection("users").findOne({ _id: new ObjectId(targetUserId) });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId1 = userId < targetUserId ? userId : targetUserId;
  const userId2 = userId < targetUserId ? targetUserId : userId;

  const existing = await db.collection("connections").findOne({ userId1, userId2 });
  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }
    if (existing.status === "pending" && existing.requestedBy === userId) {
      return NextResponse.json({ error: "Request already sent" }, { status: 409 });
    }
  }

  await db.collection("connections").updateOne(
    { userId1, userId2 },
    { $set: { userId1, userId2, status: "pending", requestedBy: userId, updatedAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}
