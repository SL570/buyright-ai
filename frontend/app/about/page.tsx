import Link from "next/link";
import type { Metadata } from "next";
import KnowledgeGraph from "../components/KnowledgeGraph";

export const metadata: Metadata = {
  title: "About — BuyRight AI",
  description: "BuyRight AI is an AI-powered shopping intelligence platform that tells you when to buy, when to wait, and how to get the best price — every time.",
};

export default function AboutPage() {
  return (
    <main style={S.page}>

      {/* Nav */}
      <nav style={S.nav}>
        <Link href="/" style={S.brand}>
          BuyRight <span style={{ color: "#00F5D4" }}>AI</span>
        </Link>
        <Link href="/sign-in" style={S.cta}>Get started free →</Link>
      </nav>

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.pill}>Built for the way people actually shop</div>
        <h1 style={S.h1}>
          The AI that tells you<br />
          <span style={{ color: "#00F5D4" }}>when to buy — and when to wait.</span>
        </h1>
        <p style={S.heroSub}>
          BuyRight AI is a consumer-side shopping intelligence platform. It tracks prices, analyzes market timing, negotiates on your behalf, and executes purchases — so you never overpay again.
        </p>
        <div style={S.heroCtas}>
          <Link href="/sign-in" style={S.primaryBtn}>Start for free</Link>
          <Link href="/pricing" style={S.ghostBtn}>See pricing →</Link>
        </div>
      </section>

      {/* Stats */}
      <div style={S.statsBar}>
        {[
          { num: "3.2M+", label: "Price checks run" },
          { num: "$420", label: "Average savings per user" },
          { num: "94%", label: "Verdict accuracy" },
          { num: "0 sec", label: "Time to first insight" },
        ].map(s => (
          <div key={s.label} style={S.statItem}>
            <span style={S.statNum}>{s.num}</span>
            <span style={S.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Problem */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.pill}>The problem</div>
          <h2 style={S.h2}>Shopping is broken for buyers.</h2>
          <p style={S.sectionSub}>
            Retailers have decades of pricing science working against you. Dynamic pricing, artificial scarcity, dark patterns, and asymmetric information mean the house almost always wins.
          </p>
          <div style={S.problemGrid}>
            {[
              { icon: "📈", title: "Dynamic pricing", desc: "Prices change dozens of times a day. The same product can cost 40% more depending on when — and who — is looking." },
              { icon: "⏱", title: "Artificial urgency", desc: "\"Only 2 left\" and countdown timers are engineered to override your judgment and force an emotional purchase." },
              { icon: "🔀", title: "Comparison overload", desc: "Dozens of SKUs, bundled warranties, hidden fees, and review manipulation make it nearly impossible to compare honestly." },
              { icon: "📉", title: "Price drop regret", desc: "You buy today and the price drops 20% next week. Retailers bank on this. Price protection is buried in fine print." },
            ].map(p => (
              <div key={p.title} style={S.problemCard}>
                <span style={S.problemIcon}>{p.icon}</span>
                <h3 style={S.problemTitle}>{p.title}</h3>
                <p style={S.problemDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...S.section, background: "rgba(0,245,212,0.02)", borderTop: "1px solid rgba(0,245,212,0.06)", borderBottom: "1px solid rgba(0,245,212,0.06)" }}>
        <div style={S.sectionInner}>
          <div style={S.pill}>How it works</div>
          <h2 style={S.h2}>From question to action in seconds.</h2>
          <div style={S.stepsGrid}>
            {[
              { num: "1", title: "Tell it what you want", desc: "Type naturally. \"Should I buy AirPods Pro now or wait?\" or \"Find me the best deal on a standing desk under $400.\"" },
              { num: "2", title: "Get a verified verdict", desc: "BuyRight AI cross-references live prices, historical trends, and upcoming sales events to give you a data-backed buy / wait / negotiate call." },
              { num: "3", title: "Let it execute", desc: "On Pro, BuyRight AI handles the actual purchase — comparing retailers, applying coupons, monitoring for post-purchase price drops, and filing returns automatically." },
            ].map(step => (
              <div key={step.num} style={S.stepCard}>
                <div style={S.stepNum}>{step.num}</div>
                <h3 style={S.stepTitle}>{step.title}</h3>
                <p style={S.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.pill}>What it can do</div>
          <h2 style={S.h2}>Every buying scenario, covered.</h2>
          <div style={S.featGrid}>
            {[
              { icon: "🧠", title: "Price Intelligence", desc: "Real-time price tracking across Amazon, Best Buy, Walmart, Target, and 80+ retailers. Identifies the historical low, upcoming sale probability, and the exact right moment to buy." },
              { icon: "🤝", title: "Automated Negotiation", desc: "BuyRight AI drafts and sends negotiation requests to retailers on your behalf — citing competitor pricing, timing leverage, and loyalty status to unlock discounts humans rarely get." },
              { icon: "📦", title: "Consumer Procurement", desc: "You describe what you need and your budget. BuyRight researches, shortlists, negotiates, and executes — end-to-end, with a full audit trail of every decision." },
              { icon: "💰", title: "Group Deals", desc: "Invite friends or join anonymous buying groups to unlock wholesale pricing that isn't available to individual consumers." },
              { icon: "🔁", title: "Post-Purchase Fulfillment", desc: "Monitors price drops after you buy and automatically files for price adjustments. Tracks deliveries, flags delays, and initiates returns if items don't arrive as described." },
              { icon: "📅", title: "Life Event Planning", desc: "Planning a move, a baby, or a home renovation? BuyRight AI builds a prioritized purchase calendar — mapping what to buy now vs. what to wait on based on your timeline." },
            ].map(f => (
              <div key={f.title} style={S.featCard}>
                <span style={S.featIcon}>{f.icon}</span>
                <h3 style={S.featTitle}>{f.title}</h3>
                <p style={S.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Graph */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.pill}>What we know</div>
          <h2 style={S.h2}>Intelligence across every product category.</h2>
          <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, margin: "0 0 40px", maxWidth: 560 }}>
            From price intelligence to group deals — see how BuyRight AI covers every angle of the buying decision.
          </p>
          <KnowledgeGraph />
        </div>
      </section>

      {/* Mission */}
      <section style={{ ...S.section, background: "rgba(0,245,212,0.03)", borderTop: "1px solid rgba(0,245,212,0.08)", borderBottom: "1px solid rgba(0,245,212,0.08)" }}>
        <div style={{ ...S.sectionInner, maxWidth: 680, textAlign: "center" }}>
          <div style={S.pill}>Our mission</div>
          <h2 style={S.h2}>Information asymmetry in retail ends here.</h2>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.8, margin: "0 0 24px" }}>
            For decades, retailers have had better data about pricing, demand, and consumer behavior than the consumers themselves. BuyRight AI exists to close that gap — permanently. We believe every purchase decision should be backed by the same quality of intelligence that Fortune 500 procurement teams use.
          </p>
          <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.8, margin: 0 }}>
            We don&apos;t take commissions from retailers. We don&apos;t sell your data. Our only incentive is to get you the best possible outcome on every purchase.
          </p>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.pill}>Pricing</div>
          <h2 style={S.h2}>Start free. Upgrade when it pays for itself.</h2>
          <div style={S.pricingCards}>
            <div style={S.pricingCard}>
              <p style={S.planLabel}>Free</p>
              <p style={S.planPrice}>$0<span style={S.planPer}>/month</span></p>
              <ul style={S.planFeats}>
                {["AI price advisor — 5 free queries", "Buy / wait / negotiate verdicts", "Live price comparison across retailers", "Conversation history"].map(f => (
                  <li key={f} style={S.planFeat}><span style={{ color: "#00F5D4", marginRight: 8 }}>✓</span>{f}</li>
                ))}
                {["Consumer Procurement agent", "Automated negotiation", "Post-purchase fulfillment", "Group & collective deals"].map(f => (
                  <li key={f} style={S.planFeatOff}><span style={{ color: "#475569", marginRight: 8 }}>✗</span>{f}</li>
                ))}
              </ul>
              <Link href="/sign-in" style={S.planBtnGhost}>Start free</Link>
            </div>
            <div style={{ ...S.pricingCard, border: "1px solid rgba(0,245,212,0.35)", position: "relative" }}>
              <div style={S.pricingBadge}>Most popular</div>
              <p style={S.planLabel}>Pro</p>
              <p style={S.planPrice}>$9<span style={S.planPer}>/month</span></p>
              <ul style={S.planFeats}>
                {["Everything in Free", "Consumer Procurement agent", "Automated negotiation", "Post-purchase fulfillment", "Group & collective deals", "Cancel anytime"].map(f => (
                  <li key={f} style={S.planFeat}><span style={{ color: "#00F5D4", marginRight: 8 }}>✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/pricing" style={S.planBtnTeal}>Subscribe now →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...S.section, paddingBottom: 80 }}>
        <div style={{ ...S.sectionInner, textAlign: "center", maxWidth: 560 }}>
          <h2 style={{ ...S.h2, marginBottom: 16 }}>Ready to buy right?</h2>
          <p style={{ color: "#94A3B8", fontSize: 15, marginBottom: 32 }}>
            No credit card required. Get your first buy / wait verdict in under 30 seconds.
          </p>
          <Link href="/sign-in" style={S.primaryBtn}>Get started free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <span style={S.footerCopy}>© 2025 BuyRight AI. All rights reserved.</span>
        <nav style={S.footerNav}>
          <Link href="/about" style={S.footerLink}>About</Link>
          <Link href="/pricing" style={S.footerLink}>Pricing</Link>
          <Link href="/terms" style={S.footerLink}>Terms</Link>
          <Link href="/privacy" style={S.footerLink}>Privacy</Link>
        </nav>
        <span style={S.footerDisclaimer}>Results are AI-generated. Always verify before buying.</span>
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:           { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
  nav:            { width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", boxSizing: "border-box" },
  brand:          { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  cta:            { background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" },

  hero:           { textAlign: "center", padding: "72px 24px 48px", maxWidth: 720 },
  pill:           { display: "inline-block", background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.5px" },
  h1:             { color: "#F1F5F9", fontSize: 48, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-1px", lineHeight: 1.15 },
  heroSub:        { color: "#94A3B8", fontSize: 17, lineHeight: 1.7, margin: "0 auto 32px", maxWidth: 560 },
  heroCtas:       { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" },
  primaryBtn:     { background: "#00F5D4", color: "#0B0F19", borderRadius: 10, padding: "13px 28px", fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block" },
  ghostBtn:       { background: "transparent", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "13px 28px", fontWeight: 600, fontSize: 15, textDecoration: "none", display: "inline-block" },

  statsBar:       { display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", width: "100%", justifyContent: "center" },
  statItem:       { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 52px", borderRight: "1px solid rgba(255,255,255,0.06)", gap: 4 },
  statNum:        { color: "#F1F5F9", fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" },
  statLabel:      { color: "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" },

  section:        { width: "100%", display: "flex", justifyContent: "center" },
  sectionInner:   { width: "100%", maxWidth: 1100, padding: "72px 40px", boxSizing: "border-box" },
  h2:             { color: "#F1F5F9", fontSize: 34, fontWeight: 800, margin: "12px 0 16px", letterSpacing: "-0.5px" },
  sectionSub:     { color: "#94A3B8", fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: "0 0 48px" },

  problemGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 48 },
  problemCard:    { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px" },
  problemIcon:    { fontSize: 24, marginBottom: 12, display: "block" },
  problemTitle:   { color: "#F1F5F9", fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  problemDesc:    { color: "#94A3B8", fontSize: 14, lineHeight: 1.6, margin: 0 },

  stepsGrid:      { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, marginTop: 48 },
  stepCard:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "32px 28px" },
  stepNum:        { width: 36, height: 36, background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: "#00F5D4", fontWeight: 800, fontSize: 15, marginBottom: 16 },
  stepTitle:      { color: "#F1F5F9", fontSize: 16, fontWeight: 700, margin: "0 0 10px" },
  stepDesc:       { color: "#94A3B8", fontSize: 14, lineHeight: 1.65, margin: 0 },

  featGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 48 },
  featCard:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px" },
  featIcon:       { fontSize: 28, marginBottom: 14, display: "block" },
  featTitle:      { color: "#F1F5F9", fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  featDesc:       { color: "#94A3B8", fontSize: 14, lineHeight: 1.65, margin: 0 },

  pricingCards:   { display: "flex", gap: 20, marginTop: 48, flexWrap: "wrap", justifyContent: "center" },
  pricingCard:    { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px", width: 300, display: "flex", flexDirection: "column", gap: 20, boxSizing: "border-box" },
  pricingBadge:   { position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#00F5D4", color: "#0B0F19", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" },
  planLabel:      { color: "#94A3B8", fontSize: 12, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.8px" },
  planPrice:      { color: "#F1F5F9", fontSize: 44, fontWeight: 800, margin: 0 },
  planPer:        { fontSize: 16, fontWeight: 400, color: "#94A3B8" },
  planFeats:      { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  planFeat:       { color: "#E2E8F0", fontSize: 14, display: "flex", alignItems: "flex-start" },
  planFeatOff:    { color: "#475569", fontSize: 14, display: "flex", alignItems: "flex-start" },
  planBtnTeal:    { background: "#00F5D4", color: "#0B0F19", borderRadius: 10, padding: "13px 20px", fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center", display: "block" },
  planBtnGhost:   { background: "rgba(255,255,255,0.05)", color: "#94A3B8", borderRadius: 10, padding: "13px 20px", fontWeight: 600, fontSize: 14, textDecoration: "none", textAlign: "center", display: "block" },

  footer:         { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box", flexWrap: "wrap", gap: 12 },
  footerCopy:     { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  footerNav:      { display: "flex", gap: 20 },
  footerLink:     { color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" },
  footerDisclaimer: { color: "rgba(255,255,255,0.15)", fontSize: 12 },
};
