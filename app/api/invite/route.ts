import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  const code = createId().slice(0, 8);
  await db.collection("friendlinks").insertOne({
    userId: session.user.id,
    code,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return NextResponse.json({ code, url: `${baseUrl}/invite/${code}` });
}
