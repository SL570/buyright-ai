"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function PricingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [token, setToken]           = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [checking, setChecking]     = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(async d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          const res = await fetch(`${BASE}/billing/status`, {
            headers: { Authorization: `Bearer ${d.token}` },
          });
          const data = await res.json();
          setSubscribed(data.subscribed);
        })
        .finally(() => setChecking(false));
    }
  }, [status, router]);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/billing/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      window.location.href = data.url;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || checking) {
    return <main style={S.page}><p style={{ color: "#94A3B8" }}>Loading...</p></main>;
  }

  return (
    <main style={S.page}>
      <div style={S.header}>
        <Link href="/procurement" style={S.brand}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></Link>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </div>

      <div style={S.hero}>
        <div style={S.pill}>Simple pricing</div>
        <h1 style={S.h1}>One plan. Full access.</h1>
        <p style={S.sub}>Everything you need to stop overpaying — procurement, fulfillment, and collective bargaining.</p>
      </div>

      <div style={S.cards}>
        {/* Free */}
        <div style={S.card}>
          <p style={S.planName}>Free</p>
          <p style={S.planPrice}>$0<span style={S.per}>/month</span></p>
          <ul style={S.features}>
            <li style={S.feature}>✓ AI Advisor (ask anything)</li>
            <li style={S.featureDim}>✗ Consumer Procurement</li>
            <li style={S.featureDim}>✗ Fulfillment & Returns</li>
            <li style={S.featureDim}>✗ Collective Bargaining AI</li>
          </ul>
          <div style={{ ...S.planBtn, background: "rgba(255,255,255,0.05)", color: "#94A3B8", cursor: "default" }}>
            Current plan
          </div>
        </div>

        {/* Pro */}
        <div style={{ ...S.card, border: "1px solid rgba(0,245,212,0.4)", position: "relative" }}>
          <div style={S.badge}>Most popular</div>
          <p style={S.planName}>Pro</p>
          <p style={S.planPrice}>$9<span style={S.per}>/month</span></p>
          <ul style={S.features}>
            <li style={S.feature}>✓ AI Advisor</li>
            <li style={S.feature}>✓ Consumer Procurement</li>
            <li style={S.feature}>✓ Fulfillment & Returns</li>
            <li style={S.feature}>✓ Collective Bargaining AI</li>
            <li style={S.feature}>✓ Cancel anytime</li>
          </ul>
          {subscribed ? (
            <div style={{ ...S.planBtn, background: "rgba(0,245,212,0.1)", color: "#00F5D4", cursor: "default" }}>
              ✓ You're subscribed
            </div>
          ) : (
            <button onClick={handleSubscribe} disabled={loading} style={S.planBtn}>
              {loading ? "Redirecting..." : "Subscribe now →"}
            </button>
          )}
        </div>
      </div>

      <p style={S.footer}>Powered by Stripe · Secure payment · Cancel anytime</p>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui", display: "flex", flexDirection: "column", alignItems: "center" },
  header:     { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  brand:      { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  ghostBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  hero:       { textAlign: "center", padding: "60px 24px 40px", maxWidth: 560 },
  pill:       { display: "inline-block", background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" },
  h1:         { color: "#F1F5F9", fontSize: 36, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px" },
  sub:        { color: "#94A3B8", fontSize: 15, lineHeight: 1.6, margin: 0 },
  cards:      { display: "flex", gap: 20, padding: "0 24px 60px", flexWrap: "wrap", justifyContent: "center" },
  card:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px", width: 280, display: "flex", flexDirection: "column", gap: 20 },
  badge:      { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#00F5D4", color: "#0B0F19", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap" },
  planName:   { color: "#94A3B8", fontSize: 13, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.8px" },
  planPrice:  { color: "#F1F5F9", fontSize: 42, fontWeight: 800, margin: 0 },
  per:        { fontSize: 16, fontWeight: 400, color: "#94A3B8" },
  features:   { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  feature:    { color: "#E2E8F0", fontSize: 14 },
  featureDim: { color: "#475569", fontSize: 14 },
  planBtn:    { background: "#00F5D4", color: "#0B0F19", border: "none", borderRadius: 10, padding: "13px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", textAlign: "center" },
  footer:     { color: "#475569", fontSize: 12, paddingBottom: 40 },
};
