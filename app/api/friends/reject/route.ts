import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await request.json();
  const fromUserId = body.userId;
  if (!fromUserId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }
  const db = await connectDB();
  const userId1 = userId < fromUserId ? userId : fromUserId;
  const userId2 = userId < fromUserId ? fromUserId : userId;
  const result = await db.collection("connections").deleteOne({
    userId1,
    userId2,
    status: "pending",
    requestedBy: fromUserId,
  });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
