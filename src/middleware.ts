import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isValidPassword } from "./lib/isValidPassword";

export default clerkMiddleware(async (auth, req) => {
  // Custom auth logic for /admin routes
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    const authenticated = await isAuthenticated(req);
    if (!authenticated) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": "Basic" },
      });
    }
  }

  // Otherwise, proceed as normal
  return NextResponse.next();
});

async function isAuthenticated(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader) return false;

  const [username, password] = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString()
    .split(":");

  return (
    username === process.env.ADMIN_USERNAME &&
    (await isValidPassword(password, process.env.HASHED_ADMIN_PASSWORD!))
  );
}

// Apply middleware to Clerk protected and admin routes
export const config = {
  matcher: [
    "/admin/:path*",
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',

  ],
};
