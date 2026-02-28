import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "accepted";
  const db = await connectDB();
  const conns = await db
    .collection("connections")
    .find({
      $or: [{ userId1: session.user.id }, { userId2: session.user.id }],
      status,
    })
    .toArray();
  const friendIds = conns.map((c) =>
    c.userId1 === session.user.id ? c.userId2 : c.userId1
  );
  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }
  const users = await db
    .collection("users")
    .find({ _id: { $in: friendIds.map((id) => new ObjectId(id)) } })
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
