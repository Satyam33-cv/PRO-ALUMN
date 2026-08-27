import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public route prefixes that never require authentication or profile completion
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api",
  "/_next",
  "/favicon.ico",
  "/logo",
  "/og-image",
  "/manifest",
];

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

  // 1. Bypass static files and public assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.includes(".") // file extensions like .png, .jpg, .svg, .css
  ) {
    return NextResponse.next();
  }

  // 2. Extract auth token from cookies
  const token =
    request.cookies.get("pro-alumn_token")?.value ||
    request.cookies.get("token")?.value ||
    request.cookies.get("alumni_connect_token")?.value;

  // Unauthenticated user attempting to access protected application routes
  if (!token) {
    // Allow public root/landing page
    if (pathname === "/" || pathname === "/help" || pathname.startsWith("/newsletters/")) {
      return NextResponse.next();
    }
    // If not authenticated and trying to access complete-profile or verify-profile, send to login
    if (pathname === "/complete-profile" || pathname === "/verify-profile") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. Authenticated: Decode claims to inspect role and profileStatus
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return NextResponse.next();
  }

  // Super Admins bypass profile gate
  if (payload.role === "ADMIN") {
    return NextResponse.next();
  }

  const profileStatus = payload.profileStatus?.toUpperCase();

  // 4. Route Gate Rules
  // State: INCOMPLETE or REJECTED -> Must complete/fix profile
  if (profileStatus === "INCOMPLETE" || profileStatus === "REJECTED") {
    if (pathname !== "/complete-profile" && pathname !== "/login" && pathname !== "/register") {
      const url = new URL("/complete-profile", request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // State: PENDING -> Under review holding screen
  if (profileStatus === "PENDING") {
    if (pathname !== "/verify-profile" && pathname !== "/login" && pathname !== "/register") {
      const url = new URL("/verify-profile", request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // State: APPROVED -> Active full access (prevent looping back to holding screens)
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
