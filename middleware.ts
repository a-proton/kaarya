// middleware.ts (place in root directory)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const path = request.nextUrl.pathname;

  // Define protected routes
  const isProviderRoute = path.startsWith("/provider");
  const isProtectedRoute = isProviderRoute || path.startsWith("/dashboard");

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/login", request.url);

    // Add account type parameter for provider routes
    if (isProviderRoute) {
      loginUrl.searchParams.set("type", "provider");
    }

    // Add redirect parameter to return after login
    loginUrl.searchParams.set("redirect", path);

    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/signup, redirect to dashboard
  if (accessToken && (path === "/login" || path === "/join-provider")) {
    return NextResponse.redirect(new URL("/provider/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/provider/:path*",
    "/dashboard/:path*",
    "/login",
    "/join-provider",
  ],
};
