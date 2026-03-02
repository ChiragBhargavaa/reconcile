import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Check env vars are present (not their values)
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set - auto-detect)",
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "(not set - using default)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || "(not set)",
  };

  // 2. Check MongoDB connection
  try {
    const db = await connectDB();
    const userCount = await db.collection("users").countDocuments();
    checks.mongodb = { connected: true, userCount };
  } catch (e) {
    checks.mongodb = { connected: false, error: String(e) };
  }

  // 3. Check auth/session
  try {
    const session = await auth();
    checks.session = session
      ? {
          exists: true,
          hasId: !!session.user?.id,
          hasEmail: !!session.user?.email,
          hasUsername: !!session.user?.username,
          userId: session.user?.id,
          email: session.user?.email,
          username: session.user?.username,
        }
      : { exists: false };
  } catch (e) {
    checks.session = { exists: false, error: String(e) };
  }

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}
