import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Env vars (presence only, not values)
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length ?? 0,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set)",
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || "(not on vercel)",
  };

  // 2. Check cookies (names only)
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    checks.cookies = allCookies.map((c) => ({
      name: c.name,
      valueLength: c.value.length,
    }));
  } catch (e) {
    checks.cookies = { error: String(e) };
  }

  // 3. MongoDB connection test (no auth import)
  try {
    const { connectDB } = await import("@/lib/db");
    const db = await connectDB();
    const userCount = await db.collection("users").countDocuments();
    checks.mongodb = { connected: true, userCount };
  } catch (e) {
    checks.mongodb = { connected: false, error: String(e) };
  }

  // 4. Try loading auth module (catches if AUTH_SECRET is bad)
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    checks.auth = session
      ? {
          works: true,
          hasId: !!session.user?.id,
          hasEmail: !!session.user?.email,
          hasUsername: !!session.user?.username,
          userId: session.user?.id ?? null,
          email: session.user?.email ?? null,
        }
      : { works: true, session: null };
  } catch (e) {
    checks.auth = { works: false, error: String(e) };
  }

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}
