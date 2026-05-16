import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const REQUIRED_ENV = ["DATABASE_URL", "GOOGLE_CLIENT_ID", "NEXTAUTH_SECRET"] as const;
const PROTECTED_PATHS = ["/dashboard", "/transactions", "/categories", "/trips", "/settings"];

function isSetupNeeded(): boolean {
  return REQUIRED_ENV.some((k) => !process.env[k]);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSetupNeeded()) {
    if (pathname === "/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (pathname === "/setup") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-).*)",
  ],
};
