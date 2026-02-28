import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await connectDB();
  const email = session.user.email;
  const user = await db.collection("users").findOne(
    { $or: [{ email }, { email: email?.toLowerCase() }] },
    { projection: { _id: 1, email: 1, name: 1, image: 1, username: 1, phone: 1 } }
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
    username: user.username,
    phone: user.phone,
  });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : null;
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({
        error: "Username can only contain letters, numbers, and underscores",
      }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    if (username.length > 20) {
      return NextResponse.json({ error: "Username must be at most 20 characters" }, { status: 400 });
    }
    const db = await connectDB();
    const email = session.user.email;
    const existing = await db.collection("users").findOne({ username });
    if (existing && existing.email?.toLowerCase() !== email?.toLowerCase()) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    const result = await db.collection("users").updateOne(
      { $or: [{ email }, { email: email?.toLowerCase() }] },
      { $set: { username, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found. Please sign out and sign in again." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/users/me error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update username" },
      { status: 500 }
    );
  }
}
