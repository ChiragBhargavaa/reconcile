import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const db = await connectDB();
  const conns = await db
    .collection("connections")
    .find({
      $or: [{ userId1: userId }, { userId2: userId }],
      status: "pending",
      requestedBy: { $ne: userId },
    })
    .toArray();
  const requesterIds = conns.map((c) =>
    c.userId1 === userId ? c.userId2 : c.userId1
  );
  if (requesterIds.length === 0) return NextResponse.json([]);
  const users = await db
    .collection("users")
    .find({ _id: { $in: requesterIds.map((id) => new ObjectId(id)) } })
    .toArray();
  return NextResponse.json(
    users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      image: u.image,
    }))
  );
}
