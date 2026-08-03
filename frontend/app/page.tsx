"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const ACCENT = "#0A84FF";

const FAQS = [
  { q: "Is BuyRight AI free?", a: "Yes — the AI Advisor is completely free with no credit card required. The Pro plan ($9/month) unlocks Consumer Procurement, automated negotiation, post-purchase fulfillment, and group deals." },
  { q: "How accurate are the buy / wait verdicts?", a: "Our verdicts are based on real-time price data across 80+ retailers, historical price trends, and upcoming sale cycle analysis. We cite confidence levels so you always know how strong the signal is." },
  { q: "Does BuyRight AI actually make purchases for me?", a: "On the Pro plan, yes. You describe what you need, approve the recommendation, and BuyRight AI executes the purchase, applies available coupons, and monitors for post-purchase price drops." },
  { q: "How is this different from Honey or CamelCamelCamel?", a: "Honey finds coupon codes at checkout. CamelCamelCamel shows Amazon price history. BuyRight AI does both of those things AND advises you on timing, negotiates with retailers, handles returns, and coordinates group buys — before, during, and after the purchase." },
  { q: "What retailers do you cover?", a: "Amazon, Best Buy, Walmart, Target, Costco, B&H, Newegg, Lenovo, Apple, and 70+ more. We pull live prices, not cached data." },
  { q: "Can I cancel Pro anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your account settings and you keep Pro access until the end of your billing period." },
];

const IC = (path: string, vb = "0 0 24 24") => (
  <div style={{
    width: 52, height: 52, borderRadius: 16,
    background: "linear-gradient(140deg, rgba(10,132,255,0.18) 0%, rgba(10,132,255,0.05) 100%)",
    border: "1px solid rgba(10,132,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 24px rgba(10,132,255,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
    flexShrink: 0,
  }}>
    <svg width="24" height="24" viewBox={vb} fill="none" stroke="#0A84FF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {path.split("|").map((d, i) => <path key={i} d={d} />)}
    </svg>
  </div>
);

const FEATURES = [
  { icon: IC("M3 18v-6M7 18V9M11 18v-4M15 18V6M19 18v-9"),                                                                                 title: "Price History & Trends",       desc: "See the full price history across retailers. Know if today's price is a real deal or just marketing." },
  { icon: IC("M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20|M12 6v6l4 2"),                                                                       title: "Timing Intelligence",          desc: "We know when sales cycles hit. Back-to-school, Prime Day, Black Friday — we tell you whether to buy now or wait for the drop." },
  { icon: IC("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),                                                            title: "Retailer Negotiation",         desc: "AI drafts and sends negotiation emails citing competitor prices, timing leverage, and loyalty status. Discounts humans rarely get." },
  { icon: IC("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0|M12 9v4|M12 17h.01"),             title: "Hidden Catches Flagged",       desc: "Poor build quality, misleading specs, review manipulation, bundled junk warranties — we read between the lines so you don't have to." },
  { icon: IC("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10|M9 12l2 2 4-4"),                                                                 title: "Post-Purchase Protection",     desc: "Price dropped after you bought? We file the price adjustment claim for you. Track deliveries, dispute delays, initiate returns." },
  { icon: IC("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M23 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75"), title: "Group & Collective Deals",     desc: "Pool buying power with others to hit wholesale minimums. Get prices that no individual consumer can access alone." },
];

const STEPS = [
  { n: "1", title: "Tell it what you need",          desc: "Type naturally. Budget, timeline, use case. No forms, no filters." },
  { n: "2", title: "AI researches everything",       desc: "Cross-references live prices, specs, reviews, timing, and alternatives in seconds." },
  { n: "3", title: "Get one confident answer",       desc: "Buy, wait, or negotiate — with the reasoning, the best retailer, and what to do next." },
];

export default function LandingPage() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(22px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes brFloat {
        0%, 100% { transform: translateY(0px);   }
        50%       { transform: translateY(-12px); }
      }
      @keyframes brShimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      .br-anim-1 { opacity:0; animation: fadeInUp 0.65s cubic-bezier(0.25,0.46,0.45,0.94) 0.05s both; }
      .br-anim-2 { opacity:0; animation: fadeInUp 0.65s cubic-bezier(0.25,0.46,0.45,0.94) 0.18s both; }
      .br-anim-3 { opacity:0; animation: fadeInUp 0.65s cubic-bezier(0.25,0.46,0.45,0.94) 0.30s both; }
      .br-anim-4 { opacity:0; animation: fadeInUp 0.65s cubic-bezier(0.25,0.46,0.45,0.94) 0.42s both; }
      .br-anim-5 { opacity:0; animation: fadeInUp 0.65s cubic-bezier(0.25,0.46,0.45,0.94) 0.54s both; }
      .br-float  { animation: brFloat 5s ease-in-out infinite; }
      .br-shimmer {
        background: linear-gradient(90deg, #0A84FF 0%, #60C8FF 45%, #0A84FF 90%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: brShimmer 4s linear infinite;
      }
      .br-btn {
        transition: transform 0.18s cubic-bezier(0.25,0.46,0.45,0.94),
                    box-shadow 0.22s ease !important;
      }
      .br-btn:hover  { transform: scale(1.04); box-shadow: 0 8px 36px rgba(10,132,255,0.32); }
      .br-btn:active { transform: scale(0.97); }
      .br-card {
        transition: transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94),
                    border-color 0.22s ease,
                    box-shadow 0.22s ease !important;
      }
      .br-card:hover {
        transform: translateY(-5px);
        border-color: rgba(10,132,255,0.22) !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.28);
      }
      .br-nav-link {
        transition: color 0.15s ease;
      }
      .br-nav-link:hover { color: #F1F5F9 !important; }
      .br-glass {
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
      }
      .br-glass-soft {
        backdrop-filter: blur(16px) saturate(160%);
        -webkit-backdrop-filter: blur(16px) saturate(160%);
      }
    `}</style>
    <main style={S.page}>

      {/* ── Nav ── */}
      <nav style={S.nav}>
        <span style={S.brand}>BuyRight <span style={{ color: ACCENT }}>AI</span></span>
        <div style={S.navCenter}>
          <Link href="/about"   style={S.navLink} className="br-nav-link">Product</Link>
          <Link href="/pricing" style={S.navLink} className="br-nav-link">Pricing</Link>
          <Link href="/about"   style={S.navLink} className="br-nav-link">About</Link>
        </div>
        <div style={S.navRight}>
          {isAuthed ? (
            <Link href="/dashboard" style={S.ctaBtn}>Go to Dashboard →</Link>
          ) : (
            <>
              <Link href="/sign-in" style={S.navLink}>Sign in</Link>
              <Link href="/sign-in" style={S.ctaBtn}>Get started free →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={S.hero}>
        <div style={S.heroLeft}>
          <h1 style={S.h1} className="br-anim-1">
            Buy smarter.<br />
            <span className="br-shimmer">Not harder.</span>
          </h1>
          <p style={S.heroSub} className="br-anim-2">
            Describe what you want to buy. Get a data-backed buy&nbsp;/&nbsp;wait&nbsp;/&nbsp;negotiate verdict — live prices, hidden catches, and the right moment to act.
          </p>
          <div style={S.heroCtas} className="br-anim-3">
            <Link href="/sign-in" style={S.primaryBtn} className="br-btn">Start for free →</Link>
            <Link href="/about"   style={S.secondaryBtn} className="br-btn">See how it works</Link>
          </div>
          <p style={S.heroFine} className="br-anim-4">Free forever · No credit card · Live in 30 seconds</p>
        </div>

        {/* Live demo card */}
        <div style={S.heroRight} className="br-float">
          <div style={S.demoCard} className="br-glass">
            <div style={S.demoHeader}>
              <div style={S.demoAvatarWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <span style={S.demoTitle}>BuyRight AI</span>
              <span style={S.demoLive}>● Live</span>
            </div>

            <div style={S.demoQuery}>"Should I buy Sony WH-1000XM5 now or wait? Budget $300."</div>

            <div style={S.verdictRow}>
              <span style={S.verdictBadge}>✓ BUY NOW</span>
              <span style={S.verdictConf}>94% confidence</span>
            </div>

            <div style={S.demoProductName}>Sony WH-1000XM5</div>

            <div style={S.priceRow}>
              <div style={S.priceItem}><span style={S.priceStore}>Best Buy</span><span style={S.priceVal}>$279</span></div>
              <div style={S.priceItem}><span style={S.priceStore}>Amazon</span><span style={S.priceVal}>$282</span></div>
              <div style={S.priceItem}><span style={S.priceStore}>Walmart</span><span style={S.priceVal}>$289</span></div>
            </div>

            <div style={S.demoDivider} />

            <div style={S.demoPoints}>
              {["Industry-leading ANC — genuinely blocks everything", "30-hr battery + fast charge (3 min → 3 hrs)", "Multipoint: connects to phone and laptop simultaneously"].map(p => (
                <div key={p} style={S.demoPoint}><span style={{ color: ACCENT, marginRight: 8, flexShrink: 0 }}>✓</span>{p}</div>
              ))}
              {["Bulkier than competitors — not ideal for tight backpacks"].map(p => (
                <div key={p} style={S.demoPointWarn}><span style={{ color: "#FBBF24", marginRight: 8, flexShrink: 0 }}>⚠</span>{p}</div>
              ))}
            </div>

            <div style={S.demoReason}>
              This is near its historical low. Black Friday typically brings it to $249 — but that&apos;s 4 months away and stock risk is real. At $279 you&apos;re only $30 from the floor. Buy now.
            </div>

            <div style={S.demoBtns}>
              <button style={S.demoBtnPrimary} className="br-btn">Find Best Price →</button>
              <button style={S.demoBtnSecondary}>Ask follow-up</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div style={S.trustBar}>
        <span style={S.trustItem}>Live prices across 80+ retailers</span>
        <span style={S.trustItem}>5,000+ recommendations generated</span>
        <span style={S.trustItem}>$420 avg savings per user</span>
      </div>

      {/* ── How it works ── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <p style={S.eyebrow}>How it works</p>
          <h2 style={S.h2}>From question to answer in seconds.</h2>
          <div style={S.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={S.stepN}>{step.n}</div>
                <p style={S.stepTitle}>{step.title}</p>
                <p style={S.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...S.section, background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={S.sectionInner}>
          <p style={S.eyebrow}>What it covers</p>
          <h2 style={S.h2}>Every stage of the buying journey.</h2>
          <div style={S.featureGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={S.featureCard} className="br-card br-glass-soft">
                <span style={S.featureIcon}>{f.icon}</span>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiator ── */}
      <section style={S.section}>
        <div style={{ ...S.sectionInner, maxWidth: 720 }}>
          <p style={S.eyebrow}>Why BuyRight AI is different</p>
          <h2 style={S.h2}>The tools retailers already have — now yours.</h2>
          <div style={S.diffList}>
            {[
              ["Honey",            "finds coupon codes at checkout",                         "BuyRight tells you when to buy, negotiates the price, and files for refunds after"],
              ["CamelCamelCamel",  "tracks Amazon price history",                            "BuyRight covers 80+ retailers, advises on timing, and automates the entire purchase"],
              ["Reddit threads",   "give you crowd-sourced opinions 2 weeks after you need them", "BuyRight gives you a data-backed verdict in 30 seconds, specific to your budget"],
              ["Google Shopping",  "shows you today's prices",                               "BuyRight shows today's prices AND tells you if they're good, what's coming, and where to push back"],
            ].map(([vs, vsDesc, ourDesc]) => (
              <div key={vs} style={S.diffRow}>
                <div style={S.diffVs}>
                  <span style={S.diffLabel}>{vs}</span>
                  <span style={S.diffVsDesc}>{vsDesc}</span>
                </div>
                <div style={S.diffArrow}>→</div>
                <div style={S.diffOurs}>{ourDesc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ ...S.section, background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={S.sectionInner}>
          <p style={S.eyebrow}>Pricing</p>
          <h2 style={S.h2}>Start free. Upgrade when it pays for itself.</h2>
          <div style={S.pricingGrid}>
            {/* Free */}
            <div style={S.pricingCard} className="br-glass">
              <p style={S.planName}>Free</p>
              <p style={S.planPrice}>$0<span style={S.planPer}>/month</span></p>
              <p style={S.planDesc}>Everything you need to research smarter.</p>
              <ul style={S.planFeatures}>
                {["AI shopping advisor — 5 free queries", "Buy / wait / negotiate verdicts", "Live price comparison (80+ retailers)", "Conversation history", "Mobile friendly"].map(f => (
                  <li key={f} style={S.planFeature}><span style={{ color: ACCENT }}>✓</span> {f}</li>
                ))}
                {["Consumer Procurement agent", "Automated negotiation", "Post-purchase fulfillment", "Group & collective deals"].map(f => (
                  <li key={f} style={{ ...S.planFeature, color: "#334155" }}><span style={{ color: "#334155" }}>✗</span> {f}</li>
                ))}
              </ul>
              <Link href="/sign-in" style={S.planBtnFree}>Get started free</Link>
            </div>

            {/* Pro */}
            <div style={{ ...S.pricingCard, border: "1px solid rgba(10,132,255,0.38)", position: "relative", boxShadow: "0 0 50px rgba(10,132,255,0.12), inset 0 1px 0 rgba(10,132,255,0.15)" }} className="br-glass">
              <div style={S.popularBadge}>Most popular</div>
              <p style={S.planName}>Pro</p>
              <p style={S.planPrice}>$9<span style={S.planPer}>/month</span></p>
              <p style={S.planDesc}>The full buying command center.</p>
              <ul style={S.planFeatures}>
                {["Everything in Free", "Consumer Procurement agent", "Automated retailer negotiation", "Post-purchase price adjustment filing", "Return & dispute assistance", "Group & collective deals", "Cancel anytime"].map(f => (
                  <li key={f} style={S.planFeature}><span style={{ color: ACCENT }}>✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/sign-in" style={S.planBtnPro} className="br-btn">Subscribe now →</Link>
              <p style={{ color: "#334155", fontSize: 11, textAlign: "center", margin: "12px 0 0" }}>Secured by Stripe · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={S.section}>
        <div style={{ ...S.sectionInner, maxWidth: 720 }}>
          <p style={S.eyebrow}>FAQ</p>
          <h2 style={S.h2}>Common questions.</h2>
          <div style={S.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} style={S.faqItem}>
                <button
                  style={S.faqQ}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: "#475569", fontSize: 18, flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p style={S.faqA}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ ...S.section, borderTop: "1px solid rgba(10,132,255,0.08)" }}>
        <div style={{ ...S.sectionInner, textAlign: "center", maxWidth: 600, paddingBottom: 96 }}>
          <h2 style={{ ...S.h2, fontSize: 36 }}>Ready to buy right?</h2>
          <p style={{ color: "#94A3B8", fontSize: 16, margin: "0 0 36px", lineHeight: 1.7 }}>
            Get your first buy&nbsp;/&nbsp;wait verdict in under 30 seconds. No credit card, no setup, no BS.
          </p>
          <Link href="/sign-in" style={{ ...S.primaryBtn, fontSize: 16, padding: "16px 36px" }} className="br-btn">
            Start for free →
          </Link>
          <p style={{ color: "#334155", fontSize: 13, marginTop: 20 }}>Free forever · Pro at $9/month</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={S.footer}>
        <div style={S.footerTop}>
          <div style={S.footerBrand}>
            <span style={{ color: "#F1F5F9", fontSize: 16, fontWeight: 800 }}>BuyRight <span style={{ color: ACCENT }}>AI</span></span>
            <p style={{ color: "#334155", fontSize: 13, maxWidth: 240, lineHeight: 1.6, margin: "8px 0 0" }}>
              Consumer-side shopping intelligence. We work for buyers, not retailers.
            </p>
          </div>
          <div style={S.footerCols}>
            <div style={S.footerCol}>
              <p style={S.footerColHead}>Product</p>
              <Link href="/about"   style={S.footerLink}>How it works</Link>
              <Link href="/pricing" style={S.footerLink}>Pricing</Link>
              <Link href="/sign-in" style={S.footerLink}>Sign in</Link>
            </div>
            <div style={S.footerCol}>
              <p style={S.footerColHead}>Company</p>
              <Link href="/about"   style={S.footerLink}>About</Link>
              <Link href="/terms"   style={S.footerLink}>Terms</Link>
              <Link href="/privacy" style={S.footerLink}>Privacy</Link>
            </div>
            <div style={S.footerCol}>
              <p style={S.footerColHead}>Contact</p>
              <a href="mailto:support@buyrightai.com" style={S.footerLink}>support@buyrightai.com</a>
            </div>
          </div>
        </div>
        <div style={S.footerBottom}>
          <span style={{ color: "#334155" }}>© 2025 BuyRight AI. All rights reserved.</span>
          <span style={{ color: "#334155" }}>AI-generated recommendations. Always verify before buying.</span>
        </div>
      </footer>
    </main>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:           { minHeight: "100vh", background: "radial-gradient(ellipse 80% 45% at 50% -10%, rgba(10,132,255,0.09) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 105%, rgba(10,132,255,0.05) 0%, transparent 50%), #0C1525", fontFamily: "system-ui,-apple-system,sans-serif", display: "flex", flexDirection: "column", color: "#F1F5F9" },

  /* Nav */
  nav:            { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 48px", height: 64, borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(8,12,20,0.65)", backdropFilter: "blur(32px) saturate(180%)", zIndex: 100 },
  brand:          { color: "#F1F5F9", fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", flexShrink: 0 },
  navCenter:      { display: "flex", gap: 32 },
  navLink:        { color: "#64748B", fontSize: 14, textDecoration: "none" },
  navRight:       { display: "flex", gap: 16, alignItems: "center" },
  ctaBtn:         { background: ACCENT, color: "#0C1525", borderRadius: 9, padding: "8px 18px", fontSize: 14, fontWeight: 700, textDecoration: "none" },

  /* Hero */
  hero:           { display: "flex", alignItems: "center", gap: 64, padding: "80px 48px 96px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" as const },
  heroLeft:       { flex: "1 1 480px", maxWidth: 560 },
  pill:           { display: "inline-block", background: "rgba(10,132,255,0.07)", color: ACCENT, border: "1px solid rgba(10,132,255,0.18)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600, letterSpacing: "0.4px", marginBottom: 24, textTransform: "uppercase" as const },
  h1:             { fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1.5px" },
  heroSub:        { color: "#94A3B8", fontSize: 17, lineHeight: 1.75, margin: "0 0 36px" },
  heroCtas:       { display: "flex", gap: 14, flexWrap: "wrap" as const },
  primaryBtn:     { background: ACCENT, color: "#0C1525", borderRadius: 11, padding: "14px 28px", fontWeight: 800, fontSize: 15, textDecoration: "none", display: "inline-block" },
  secondaryBtn:   { background: "rgba(255,255,255,0.04)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 11, padding: "14px 28px", fontWeight: 600, fontSize: 15, textDecoration: "none", display: "inline-block" },
  heroFine:       { color: "#334155", fontSize: 13, marginTop: 16 },
  heroRight:      { flex: "0 0 400px" },

  /* Demo card */
  demoCard:       { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 20, padding: "20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 0 60px rgba(10,132,255,0.08), inset 0 1px 0 rgba(255,255,255,0.07)" },
  demoHeader:     { display: "flex", alignItems: "center", gap: 10 },
  demoAvatarWrap: { width: 32, height: 32, borderRadius: "50%", background: "rgba(10,132,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  demoTitle:      { color: "#94A3B8", fontSize: 13, fontWeight: 600 },
  demoLive:       { color: ACCENT, fontSize: 11, marginLeft: "auto", fontWeight: 600 },
  demoQuery:      { background: "#111C30", borderRadius: 10, padding: "10px 14px", color: "#94A3B8", fontSize: 13, lineHeight: 1.5, fontStyle: "italic" },
  verdictRow:     { display: "flex", alignItems: "center", gap: 10 },
  verdictBadge:   { background: "rgba(10,132,255,0.12)", color: ACCENT, border: "1px solid rgba(10,132,255,0.25)", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800 },
  verdictConf:    { color: "#475569", fontSize: 12 },
  demoProductName:{ color: "#F1F5F9", fontSize: 16, fontWeight: 700 },
  priceRow:       { display: "flex", gap: 12 },
  priceItem:      { display: "flex", flexDirection: "column", gap: 2 },
  priceStore:     { color: "#475569", fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  priceVal:       { color: "#F1F5F9", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  demoDivider:    { height: 1, background: "rgba(255,255,255,0.05)" },
  demoPoints:     { display: "flex", flexDirection: "column", gap: 6 },
  demoPoint:      { display: "flex", alignItems: "flex-start", color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 },
  demoPointWarn:  { display: "flex", alignItems: "flex-start", color: "#94A3B8", fontSize: 13, lineHeight: 1.5 },
  demoReason:     { background: "rgba(10,132,255,0.04)", border: "1px solid rgba(10,132,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#94A3B8", fontSize: 12, lineHeight: 1.65 },
  demoBtns:       { display: "flex", gap: 8 },
  demoBtnPrimary: { flex: 1, background: ACCENT, color: "#0C1525", border: "none", borderRadius: 9, padding: "11px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  demoBtnSecondary:{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "11px 0", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },

  /* Trust bar */
  trustBar:       { display: "flex", alignItems: "center", justifyContent: "center", gap: 40, padding: "16px 48px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", flexWrap: "wrap" as const },
  trustItem:      { color: "#94A3B8", fontSize: 13 },
  trustDot:       { color: "#475569" },

  /* Sections */
  section:        { width: "100%" },
  sectionInner:   { maxWidth: 1100, margin: "0 auto", padding: "72px 48px", boxSizing: "border-box" as const },
  eyebrow:        { color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.5px", margin: "0 0 12px" },
  h2:             { color: "#F1F5F9", fontSize: 34, fontWeight: 800, margin: "0 0 44px", letterSpacing: "-0.6px" },

  /* How it works */
  stepsGrid:      { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 48 },
  stepN:          { color: ACCENT, fontSize: 36, fontWeight: 800, lineHeight: 1 },
  stepTitle:      { color: "#F1F5F9", fontSize: 16, fontWeight: 700, margin: 0 },
  stepDesc:       { color: "#64748B", fontSize: 14, lineHeight: 1.7, margin: 0 },
  stepArrow:      { color: "#1E2D40", fontSize: 24, padding: "8px 24px", flexShrink: 0 },

  /* Features */
  featureGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 20 },
  featureCard:    { background: "rgba(255,255,255,0.04)", border: "1px solid transparent", borderRadius: 20, padding: "32px 28px" },
  featureIcon:    { marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "flex-start" },
  featureTitle:   { color: "#F1F5F9", fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  featureDesc:    { color: "#64748B", fontSize: 14, lineHeight: 1.65, margin: 0 },

  /* Differentiator */
  diffList:       { display: "flex", flexDirection: "column", gap: 0 },
  diffRow:        { display: "flex", alignItems: "flex-start", gap: 20, padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  diffVs:         { flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 4 },
  diffLabel:      { color: "#94A3B8", fontSize: 14, fontWeight: 700 },
  diffVsDesc:     { color: "#334155", fontSize: 13, lineHeight: 1.5 },
  diffArrow:      { color: "#1E2D40", fontSize: 18, paddingTop: 2, flexShrink: 0 },
  diffOurs:       { color: "#64748B", fontSize: 14, lineHeight: 1.6, flex: 1 },

  /* Pricing */
  pricingGrid:    { display: "flex", gap: 24, flexWrap: "wrap" as const, justifyContent: "center" },
  pricingCard:    { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, padding: "36px 32px", flex: "1 1 280px", maxWidth: 340, display: "flex", flexDirection: "column", gap: 0 },
  popularBadge:   { position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: ACCENT, color: "#0C1525", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" as const },
  planName:       { color: "#94A3B8", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.8px", margin: "0 0 12px" },
  planPrice:      { color: "#F1F5F9", fontSize: 48, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1px" },
  planPer:        { fontSize: 16, fontWeight: 400, color: "#475569" },
  planDesc:       { color: "#475569", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 },
  planFeatures:   { listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  planFeature:    { color: "#94A3B8", fontSize: 14, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.4 },
  planBtnPro:     { background: ACCENT, color: "#0C1525", borderRadius: 11, padding: "14px 0", fontWeight: 800, fontSize: 15, textDecoration: "none", textAlign: "center" as const, display: "block" },
  planBtnFree:    { background: "rgba(255,255,255,0.06)", color: "#94A3B8", borderRadius: 11, padding: "14px 0", fontWeight: 700, fontSize: 15, textDecoration: "none", textAlign: "center" as const, display: "block", border: "1px solid rgba(255,255,255,0.09)" },

  /* FAQ */
  faqList:        { display: "flex", flexDirection: "column" },
  faqItem:        { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  faqQ:           { width: "100%", background: "none", border: "none", padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, color: "#E2E8F0", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit" },
  faqA:           { color: "#64748B", fontSize: 14, lineHeight: 1.75, paddingBottom: 20, margin: 0 },

  /* Footer */
  footer:         { borderTop: "1px solid rgba(255,255,255,0.05)", padding: "64px 48px 32px" },
  footerTop:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 48, flexWrap: "wrap" as const, marginBottom: 48 },
  footerBrand:    { flex: "0 0 260px" },
  footerCols:     { display: "flex", gap: 48, flexWrap: "wrap" as const },
  footerCol:      { display: "flex", flexDirection: "column", gap: 10 },
  footerColHead:  { color: "#475569", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 },
  footerLink:     { color: "#334155", fontSize: 14, textDecoration: "none" },
  footerBottom:   { display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.04)" },
};
