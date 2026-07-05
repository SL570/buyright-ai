import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  // Production uses __Secure- prefix (HTTPS only), dev does not
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const sessionToken = req.cookies.get(cookieName)?.value;

  if (sessionToken) {
    try {
      const key = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "");
      await jwtVerify(sessionToken, key);
      return NextResponse.next();
    } catch {
      // token present but invalid — fall through to redirect
    }
  }

  const signIn = new URL("/sign-in", req.url);
  signIn.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/dashboard/:path*", "/group-deals/:path*"],
};
