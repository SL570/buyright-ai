"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  return (
    <main style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <span style={S.brand}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></span>
        <Link href="/sign-in" style={S.signInBtn}>Sign in</Link>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.pill}>AI-Powered Shopping Intelligence</div>
          <h1 style={S.h1}>
            Stop overpaying.<br />
            <span style={{ color: "#00F5D4" }}>Buy right, every time.</span>
          </h1>
          <p style={S.sub}>
            Collective bargaining, AI-powered procurement, and post-purchase fulfillment —
            the shopping intelligence layer between you and every retailer.
          </p>
          <div style={S.ctaRow}>
            <Link href="/sign-in" style={S.ctaBtn}>Get started free →</Link>
            <span style={{ color: "#475569", fontSize: 13 }}>No credit card needed</span>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section style={S.features}>
        <div style={S.featureGrid}>
          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(129,140,248,0.1)", color: "#818CF8" }}>🤝</div>
            <h3 style={S.cardTitle}>Collective Bargaining</h3>
            <p style={S.cardText}>
              Pool buying power with other shoppers. When your group hits the target size, we generate a bulk discount negotiation script to send to the retailer.
            </p>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(0,245,212,0.1)", color: "#00F5D4" }}>🛒</div>
            <h3 style={S.cardTitle}>Consumer Procurement</h3>
            <p style={S.cardText}>
              Tell us what you need. We research options, compare prices across every retailer, negotiate, and handle the entire purchase process for you.
            </p>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(248,113,113,0.1)", color: "#F87171" }}>📦</div>
            <h3 style={S.cardTitle}>Fulfillment</h3>
            <p style={S.cardText}>
              Already bought something? We monitor price drops for refunds, handle returns, track late orders, and generate price match claims automatically.
            </p>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(251,191,36,0.1)", color: "#FBBF24" }}>💬</div>
            <h3 style={S.cardTitle}>AI Advisor</h3>
            <p style={S.cardText}>
              Ask our AI anything — deal timing, negotiation scripts, product comparisons. Real answers, not search results.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={S.bottomCta}>
        <h2 style={{ color: "#F1F5F9", fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
          Ready to shop smarter?
        </h2>
        <p style={{ color: "#94A3B8", fontSize: 15, margin: "0 0 24px" }}>
          Join BuyRight AI and never overpay again.
        </p>
        <Link href="/sign-in" style={S.ctaBtn}>Sign in with GitHub →</Link>
      </section>

      <footer style={S.footer}>
        <span>© 2025 BuyRight AI</span>
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui", display: "flex", flexDirection: "column" },
  nav:        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  brand:      { color: "#F1F5F9", fontSize: 20, fontWeight: 700 },
  signInBtn:  { color: "#94A3B8", fontSize: 14, textDecoration: "none", padding: "8px 16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  hero:       { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px" },
  heroInner:  { maxWidth: 640, textAlign: "center" },
  pill:       { display: "inline-block", background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 24, textTransform: "uppercase" },
  h1:         { color: "#F1F5F9", fontSize: 48, fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-1px" },
  sub:        { color: "#94A3B8", fontSize: 17, lineHeight: 1.7, margin: "0 0 36px" },
  ctaRow:     { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" },
  ctaBtn:     { background: "#00F5D4", color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 800, fontSize: 15 },
  features:   { padding: "60px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  featureGrid:{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 },
  card:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 22px" },
  icon:       { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 },
  cardTitle:  { color: "#F1F5F9", fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  cardText:   { color: "#94A3B8", fontSize: 13, lineHeight: 1.65, margin: 0 },
  bottomCta:  { padding: "80px 24px", textAlign: "center" },
  footer:     { borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 40px", color: "#475569", fontSize: 12, textAlign: "center" },
};
