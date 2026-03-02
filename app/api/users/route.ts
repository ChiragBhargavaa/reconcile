import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") || "username"; // username | email | phone
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }
  const db = await connectDB();
  const trim = q.trim().toLowerCase();
  type UserDoc = { _id: unknown; email?: string; name?: string; username?: string; image?: string };
  let users: UserDoc[] = [];
  if (type === "username") {
    users = (await db
      .collection("users")
      .find({
        username: { $regex: `^${trim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, $options: "i" },
        _id: { $ne: new ObjectId(userId) },
      })
      .limit(10)
      .toArray()) as UserDoc[];
  } else if (type === "email") {
    users = (await db
      .collection("users")
      .find({
        email: { $regex: trim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
        _id: { $ne: new ObjectId(userId) },
      })
      .limit(10)
      .toArray()) as UserDoc[];
  } else if (type === "phone") {
    const cleanPhone = trim.replace(/\D/g, "");
    if (cleanPhone.length >= 6) {
      users = (await db
        .collection("users")
        .find({
          phone: { $regex: cleanPhone, $ne: null },
          _id: { $ne: new ObjectId(userId) },
        })
        .limit(10)
        .toArray()) as UserDoc[];
    }
  }
  return NextResponse.json(
    users.map((u) => ({
      id: String(u._id),
      name: u.name,
      username: u.username,
      email: u.email,
      image: (u as { image?: string }).image,
    }))
  );
}
