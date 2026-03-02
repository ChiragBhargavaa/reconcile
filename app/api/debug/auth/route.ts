import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const checks: Record<string, unknown> = {};

  // 1. Env vars
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length ?? 0,
    AUTH_SECRET_FIRST3: process.env.AUTH_SECRET?.slice(0, 3) ?? "",
    AUTH_SECRET_LAST3: process.env.AUTH_SECRET?.slice(-3) ?? "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set)",
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    MONGODB_URI: !!process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || "(not on vercel)",
  };

  // 2. Cookies
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

  // 3. getToken() — this is what proxy.ts uses
  try {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req: request, secret });
    checks.getToken = token
      ? {
          works: true,
          userId: token.userId ?? null,
          email: token.email ?? null,
          username: token.username ?? null,
        }
      : { works: false, token: null, secret_used_length: secret?.length ?? 0 };
  } catch (e) {
    checks.getToken = { works: false, error: String(e) };
  }

  // 4. auth() from NextAuth
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    checks.auth = session
      ? {
          works: true,
          hasId: !!session.user?.id,
          email: session.user?.email ?? null,
        }
      : { works: true, session: null };
  } catch (e) {
    checks.auth = { works: false, error: String(e) };
  }

  // 5. MongoDB
  try {
    const { connectDB } = await import("@/lib/db");
    const db = await connectDB();
    const userCount = await db.collection("users").countDocuments();
    checks.mongodb = { connected: true, userCount };
  } catch (e) {
    checks.mongodb = { connected: false, error: String(e) };
  }

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}
