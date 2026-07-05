import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const token = req.cookies.get(cookieName)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ token });
}
