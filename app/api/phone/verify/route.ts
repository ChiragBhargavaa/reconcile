import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const DEV_MODE = process.env.DEV_MODE === "true";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }
  const fullPhone = phone.startsWith("+") ? phone : `+${phone}`;
  const db = await connectDB();

  if (DEV_MODE) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { phone: fullPhone, updatedAt: new Date() } }
    );
    return NextResponse.json({ success: true });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }
  const verification = await db.collection("phoneverifications").findOne({
    userId: session.user.id,
    phone: fullPhone,
    code,
    expiresAt: { $gt: new Date() },
  });
  if (!verification) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { phone: fullPhone, updatedAt: new Date() } }
  );
  await db.collection("phoneverifications").updateOne(
    { _id: verification._id },
    { $set: { verified: true } }
  );
  return NextResponse.json({ success: true });
}
