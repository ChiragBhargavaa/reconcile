import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/api/auth"];
const onboardingPath = "/onboarding";

export async function middleware(request: NextRequest) {
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
