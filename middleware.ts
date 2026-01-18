// middleware.ts (place in root directory)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const path = request.nextUrl.pathname;

  // Define protected routes
  const isProviderRoute = path.startsWith("/provider");
  const isClientRoute = path.startsWith("/client");
  const isProtectedRoute =
    isProviderRoute || isClientRoute || path.startsWith("/dashboard");

  // Public routes that should not redirect even if logged in
  const isPublicRoute =
    path === "/" || path.startsWith("/about") || path.startsWith("/contact");

  // Auth routes
  const isLoginRoute = path === "/login";
  const isProviderSignupRoute = path === "/join-provider";
  const isClientSignupRoute = path === "/join-client" || path === "/signup";

  // ====================
  // PROTECTED ROUTES - Require authentication
  // ====================
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/login", request.url);

    // Add account type parameter based on route
    if (isProviderRoute) {
      loginUrl.searchParams.set("type", "provider");
      loginUrl.searchParams.set("session", "expired");
    } else if (isClientRoute) {
      loginUrl.searchParams.set("type", "client");
      loginUrl.searchParams.set("session", "expired");
    }

    // Add redirect parameter to return after login
    loginUrl.searchParams.set("redirect", path);

    console.log(
      `🔒 Protected route access denied. Redirecting to: ${loginUrl.toString()}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  // ====================
  // LOGGED IN USERS - Redirect away from auth pages
  // ====================
  if (accessToken) {
    // Try to determine user type from cookies or token
    // You might have stored this during login
    const userType = request.cookies.get("userType")?.value;

    // Redirect logged-in users away from login page
    if (isLoginRoute) {
      // If we know the user type, redirect to appropriate dashboard
      if (userType === "provider" || userType === "service_provider") {
        console.log("✅ Logged in provider redirected to provider dashboard");
        return NextResponse.redirect(
          new URL("/provider/dashboard", request.url),
        );
      } else if (userType === "client") {
        console.log("✅ Logged in client redirected to client dashboard");
        return NextResponse.redirect(new URL("/client/dashboard", request.url));
      }

      // Default fallback - redirect to provider dashboard
      console.log(
        "✅ Logged in user (unknown type) redirected to provider dashboard",
      );
      return NextResponse.redirect(new URL("/provider/dashboard", request.url));
    }

    // Redirect logged-in users away from signup pages
    if (isProviderSignupRoute) {
      console.log(
        "✅ Logged in user tried to access provider signup, redirected to provider dashboard",
      );
      return NextResponse.redirect(new URL("/provider/dashboard", request.url));
    }

    if (isClientSignupRoute) {
      console.log(
        "✅ Logged in user tried to access client signup, redirected to client dashboard",
      );
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
  }

  // ====================
  // ALLOW ACCESS
  // ====================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
