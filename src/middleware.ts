import { NextRequest, NextResponse } from "next/server"
import { isValidPassword } from "./lib/isValidPassword"
// import { isValidPassword } from "./lib/isValidPassword" // Utility to validate hashed password

//  Middleware: Guards access to protected admin routes
export async function middleware(req: NextRequest) {
  //  If not authenticated, block the request
  if ((await isAuthenticated(req)) === false) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic" }, //  Prompt browser for credentials
    })
  }
}

// ✅ Auth checker: Verifies user credentials from request
async function isAuthenticated(req: NextRequest) {
  //  Extract authorization header (case-insensitive)
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization")

  //  No auth header → Not authenticated
  if (authHeader == null) return false

  //  Decode Basic Auth: "username:password"
  const [username, password] = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString()
    .split(":")
  // isValidPassword(password,"sdfdfd")
  // return false;
  // console.log(username, password) // 🛠 Debug: Prints received credentials

  //  Validate against environment credentials
  return (
    username === process.env.ADMIN_USERNAME &&
    (await isValidPassword(
      password,
      process.env.HASHED_ADMIN_PASSWORD as string
    ))
  )
}

//  Middleware applies only to /admin routes
export const config = {
  matcher: "/admin/:path*",
}
