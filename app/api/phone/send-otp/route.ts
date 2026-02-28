import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const DEV_MODE = process.env.DEV_MODE === "true";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (phone.length < 10) {
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
  }
  const fullPhone = phone.startsWith("+") ? phone : `+${phone}`;

  if (DEV_MODE) {
    const db = await connectDB();
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { phone: fullPhone, updatedAt: new Date() } }
    );
    return NextResponse.json({ success: true, skipVerification: true });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return NextResponse.json({ error: "SMS not configured" }, { status: 503 });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const db = await connectDB();
  await db.collection("phoneverifications").insertOne({
    userId: session.user.id,
    phone: fullPhone,
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    verified: false,
    createdAt: new Date(),
  });
  try {
    const twilio = await import("twilio");
    const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your Reconcile verification code is: ${code}. Valid for 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: fullPhone,
    });
  } catch (err) {
    console.error("Twilio error:", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
