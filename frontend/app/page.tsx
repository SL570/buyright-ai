"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/procurement");
  }, [status, router]);

  return (
    <main style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <span style={S.brand}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></span>
        <Link href="/sign-in" style={S.signInBtn}>Sign in →</Link>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.pill}>Consumer Buying Intelligence</div>
          <h1 style={S.h1}>
            Stop overpaying.<br />
            <span style={{ color: "#00F5D4" }}>Buy right, every time.</span>
          </h1>
          <p style={S.sub}>
            BuyRight AI arms you with research, negotiation scripts, and collective buying power — the tools that retailers already have, now in your hands.
          </p>
          <div style={S.ctaRow}>
            <Link href="/sign-in" style={S.ctaBtn}>Get started free →</Link>
            <span style={{ color: "#475569", fontSize: 13 }}>No credit card needed</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={S.howItWorks}>
        <div style={S.howInner}>
          <p style={S.sectionTag}>How it works</p>
          <div style={S.steps}>
            <div style={S.step}>
              <div style={S.stepNum}>1</div>
              <div>
                <p style={S.stepTitle}>Describe what you want to buy</p>
                <p style={S.stepText}>Tell the AI what you need — any product, any budget.</p>
              </div>
            </div>
            <div style={S.stepArrow}>→</div>
            <div style={S.step}>
              <div style={S.stepNum}>2</div>
              <div>
                <p style={S.stepTitle}>Get a full research brief</p>
                <p style={S.stepText}>AI compares options, identifies the best retailers, and spots the right time to buy.</p>
              </div>
            </div>
            <div style={S.stepArrow}>→</div>
            <div style={S.step}>
              <div style={S.stepNum}>3</div>
              <div>
                <p style={S.stepTitle}>Execute with a script</p>
                <p style={S.stepText}>Get word-for-word negotiation scripts, price match claims, and dispute language to use directly with retailers.</p>
              </div>
            </div>
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
              Pool buying power with other shoppers. When your group hits the target size, we generate a professional bulk discount script to send to the retailer — something no individual buyer can do alone.
            </p>
            <span style={S.cardTag}>Unique to BuyRight AI</span>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(0,245,212,0.1)", color: "#00F5D4" }}>🛒</div>
            <h3 style={S.cardTitle}>Consumer Procurement</h3>
            <p style={S.cardText}>
              Tell us what you need. We research every option, compare prices across retailers, identify seasonal deal timing, and give you a #1 recommendation with a ready-to-use negotiation strategy.
            </p>
            <span style={S.cardTag}>Pro feature</span>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(248,113,113,0.1)", color: "#F87171" }}>📦</div>
            <h3 style={S.cardTitle}>Post-Purchase Fulfillment</h3>
            <p style={S.cardText}>
              Already bought something? Get word-for-word price match claims, return request scripts, late delivery dispute language, and price drop refund strategies — so you never leave money on the table.
            </p>
            <span style={S.cardTag}>Pro feature</span>
          </div>

          <div style={S.card}>
            <div style={{ ...S.icon, background: "rgba(251,191,36,0.1)", color: "#FBBF24" }}>💬</div>
            <h3 style={S.cardTitle}>AI Shopping Advisor</h3>
            <p style={S.cardText}>
              Ask anything — deal timing, negotiation scripts, product comparisons, retailer policy breakdowns. Real answers, not sponsored search results.
            </p>
            <span style={S.cardTag}>Free</span>
          </div>
        </div>
      </section>

      {/* Differentiator strip */}
      <section style={S.diffStrip}>
        <div style={S.diffInner}>
          <p style={S.diffLabel}>Why BuyRight AI is different</p>
          <div style={S.diffGrid}>
            <div style={S.diffItem}>
              <span style={S.diffIcon}>✕</span>
              <span style={S.diffText}>Honey finds coupons — we teach you to negotiate</span>
            </div>
            <div style={S.diffItem}>
              <span style={S.diffIcon}>✕</span>
              <span style={S.diffText}>Amazon shows prices — we show you when and how to push back</span>
            </div>
            <div style={S.diffItem}>
              <span style={S.diffIcon}>✕</span>
              <span style={S.diffText}>No other tool pools your buying power with other shoppers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={S.bottomCta}>
        <h2 style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
          Ready to shop smarter?
        </h2>
        <p style={{ color: "#64748B", fontSize: 15, margin: "0 0 28px", lineHeight: 1.6 }}>
          Free to sign up. Pro features unlock for $9/month.
        </p>
        <Link href="/sign-in" style={S.ctaBtn}>Get started free →</Link>
      </section>

      <footer style={S.footer}>
        <span>© 2026 BuyRight AI</span>
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:        { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui", display: "flex", flexDirection: "column" },
  nav:         { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  brand:       { color: "#F1F5F9", fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" },
  signInBtn:   { color: "#00F5D4", fontSize: 14, textDecoration: "none", fontWeight: 600 },
  hero:        { display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 60px" },
  heroInner:   { maxWidth: 640, textAlign: "center" },
  pill:        { display: "inline-block", background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 24, textTransform: "uppercase" },
  h1:          { color: "#F1F5F9", fontSize: 50, fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-1px" },
  sub:         { color: "#94A3B8", fontSize: 17, lineHeight: 1.7, margin: "0 0 36px" },
  ctaRow:      { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" },
  ctaBtn:      { background: "#00F5D4", color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 800, fontSize: 15 },
  howItWorks:  { background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 24px" },
  howInner:    { maxWidth: 860, margin: "0 auto" },
  sectionTag:  { color: "#475569", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 32px", textAlign: "center" },
  steps:       { display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap", justifyContent: "center" },
  step:        { display: "flex", gap: 14, alignItems: "flex-start", maxWidth: 220 },
  stepNum:     { width: 30, height: 30, borderRadius: "50%", background: "rgba(0,245,212,0.12)", color: "#00F5D4", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(0,245,212,0.2)" },
  stepTitle:   { color: "#F1F5F9", fontSize: 14, fontWeight: 700, margin: "0 0 4px" },
  stepText:    { color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 },
  stepArrow:   { color: "#334155", fontSize: 20, paddingTop: 4 },
  features:    { padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  featureGrid: { maxWidth: 940, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20 },
  card:        { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 0 },
  icon:        { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14, flexShrink: 0 },
  cardTitle:   { color: "#F1F5F9", fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  cardText:    { color: "#94A3B8", fontSize: 13, lineHeight: 1.65, margin: "0 0 14px", flex: 1 },
  cardTag:     { color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", alignSelf: "flex-start" },
  diffStrip:   { background: "rgba(0,245,212,0.02)", borderTop: "1px solid rgba(0,245,212,0.06)", padding: "40px 24px" },
  diffInner:   { maxWidth: 860, margin: "0 auto" },
  diffLabel:   { color: "#475569", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 20px", textAlign: "center" },
  diffGrid:    { display: "flex", flexDirection: "column", gap: 12, maxWidth: 600, margin: "0 auto" },
  diffItem:    { display: "flex", alignItems: "center", gap: 12 },
  diffIcon:    { color: "#F87171", fontSize: 14, fontWeight: 800, flexShrink: 0 },
  diffText:    { color: "#64748B", fontSize: 14 },
  bottomCta:   { padding: "80px 24px", textAlign: "center" },
  footer:      { borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 40px", color: "#334155", fontSize: 12, textAlign: "center" },
};
