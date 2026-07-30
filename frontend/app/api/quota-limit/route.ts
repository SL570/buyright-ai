import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, reachedAt } = await req.json() as { email: string; reachedAt: string };
    if (!email) return NextResponse.json({ ok: false }, { status: 400 });

    // Log for immediate visibility in server console / Vercel function logs.
    // Replace with DB write or CRM API call (e.g. Mailchimp, Loops, Resend) when ready.
    console.log(
      `[QUOTA LIMIT] ${email} hit free-tier limit at ${reachedAt ?? new Date().toISOString()}`
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
