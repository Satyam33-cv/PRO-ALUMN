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

// Helper to decode JWT payload without Node crypto dependencies in Edge Runtime
function decodeJwtPayload(token: string): { id?: string; role?: string; profileStatus?: string; isVerified?: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
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

  // ── 4. Token exists but can't be decoded → invalid/malformed ──
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.id) {
    // Clear the bad cookie and redirect to login
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("pro-alumn_token");
    response.cookies.delete("token");
    response.cookies.delete("alumni_connect_token");
    return response;
  }

  // ── 5. Admins bypass profile gates ──
  if (payload.role === "ADMIN") {
    return NextResponse.next();
  }

  const profileStatus = payload.profileStatus?.toUpperCase();

  // ── 6. Profile status gates ──
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
