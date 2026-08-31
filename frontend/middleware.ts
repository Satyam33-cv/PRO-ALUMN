import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/auth/callback",
  "/api",
  "/_next",
  "/favicon.ico",
  "/logo",
  "/og-image",
  "/manifest",
];

// Unauthenticated landing pages (no token required, but no app access)
const LANDING_PATHS = ["/", "/help"];

import { verifyJwtEdge } from "@/lib/jwtEdge";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Allow static files, public assets, API routes ──
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.includes(".") // file extensions like .png, .jpg, .svg, .css
  ) {
    return NextResponse.next();
  }

  // ── 2. Extract auth token from cookies ──
  const token =
    request.cookies.get("pro-alumn_token")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("alumni_connect_token")?.value;

  // ── 3. No token: DEFAULT-DENY ──
  if (!token) {
    // Allow public landing pages
    if (LANDING_PATHS.includes(pathname) || pathname.startsWith("/newsletters/")) {
      return NextResponse.next();
    }
    // Everything else → redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 4. Token exists but can't be decoded or signature is invalid ──
  const payload = await verifyJwtEdge(token, JWT_SECRET);
  if (!payload || !payload.id) {
    // Clear the bad cookie and redirect to login
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("pro-alumn_token");
    response.cookies.delete("token");
    response.cookies.delete("alumni_connect_token");
    return response;
  }

  // ── 5. Admin route protection ──
  const userRole = payload.role?.toUpperCase();
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  // Admins bypass remaining profile status gates but should not access user-facing features
  if (userRole === "ADMIN") {
    const adminBlockedPaths = ["/profile", "/stories", "/mentorship"];
    if (adminBlockedPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // ── 6. Creator route protection (jobs/new, events/new) ──
  if (pathname.startsWith("/jobs/new") || pathname.startsWith("/events/new")) {
    if (userRole !== "ALUMNI" && userRole !== "FACULTY" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/jobs", request.url));
    }
  }

  const profileStatus = payload.profileStatus?.toUpperCase();

  // ── 7. Profile status gates ──
  // INCOMPLETE or REJECTED → must complete/fix profile
  if (profileStatus === "INCOMPLETE" || profileStatus === "REJECTED") {
    if (pathname !== "/complete-profile" && pathname !== "/login" && pathname !== "/register") {
      return NextResponse.redirect(new URL("/complete-profile", request.url));
    }
    return NextResponse.next();
  }

  // PENDING → under-review holding screen
  if (profileStatus === "PENDING") {
    if (pathname !== "/verify-profile" && pathname !== "/login" && pathname !== "/register") {
      return NextResponse.redirect(new URL("/verify-profile", request.url));
    }
    return NextResponse.next();
  }

  // APPROVED → full access; prevent looping back to holding screens
  if (profileStatus === "APPROVED") {
    if (pathname === "/complete-profile" || pathname === "/verify-profile") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
