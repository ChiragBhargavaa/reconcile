import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type RateLimitRecord = {
  count: number;
  start: number;
};

const store = new Map<string, RateLimitRecord>();

const WINDOW = 60 * 1000;
const API_LIMIT = 60;
const AUTH_LIMIT = 10;

function getRateLimit(path: string) {
  if (path.startsWith("/api/auth")) return AUTH_LIMIT;
  return API_LIMIT;
}

function rateLimit(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) return null;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "";

  if (!ua || ua.includes("curl") || ua.includes("python")) {
    return new NextResponse("Blocked", { status: 403 });
  }

  const limit = getRateLimit(pathname);
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now - record.start > WINDOW) {
    store.set(ip, { count: 1, start: now });
    return null;
  }

  record.count++;

  if (record.count > limit) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  if (store.size > 50_000) {
    store.clear();
  }

  return null;
}

const publicPaths = ["/api/auth"];
const onboardingPath = "/onboarding";

export async function proxy(request: NextRequest) {
  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    if (pathname === "/signin") return NextResponse.next();
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }
  if (pathname === "/signin") {
    return NextResponse.redirect(new URL(token.username ? "/dashboard" : onboardingPath, request.url));
  }
  if (!token.username && pathname !== onboardingPath && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL(onboardingPath, request.url));
  }
  if (token.username && pathname === onboardingPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
