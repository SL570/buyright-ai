"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const ACCENT = "#00F5D4";

interface HistorySession {
  id: number;
  title: string | null;
  product: string | null;
  category: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function categoryEmoji(cat: string | null): string {
  const c = (cat ?? "").toLowerCase();
  if (c.includes("tv") || c.includes("television")) return "📺";
  if (c.includes("laptop") || c.includes("notebook")) return "💻";
  if (c.includes("headphone") || c.includes("earbud")) return "🎧";
  if (c.includes("phone")) return "📱";
  if (c.includes("desk") || c.includes("monitor")) return "🖥";
  if (c.includes("camera")) return "📷";
  return "🛒";
}

const QUICK_CHIPS = [
  { label: "💻  Laptop", q: "Best laptop for college under $1,000" },
  { label: "📺  TV",     q: "Best 65-inch TV under $800 right now" },
  { label: "📱  Phone",  q: "iPhone 16 vs Pixel 9 — best camera under $800" },
  { label: "🎧  Audio",  q: "Best noise-cancelling headphones under $300" },
  { label: "🖥  Desk",   q: "Best standing desk and monitor setup under $700" },
  { label: "⌚  Watch",  q: "Best smartwatch under $400 — health tracking focus" },
];

const TRENDING = [
  { icon: "📺", label: "Best TVs This Week",      badge: "🔥 Hot",    q: "Find me the best 65-inch 4K TV under $800 right now" },
  { icon: "💻", label: "Student Laptop Guide",    badge: "🎓 School", q: "Best laptops for college under $1,000 — should I buy now or wait?" },
  { icon: "🎧", label: "Headphones Ranked",       badge: "📈 Rising", q: "Rank the best noise-cancelling headphones under $300 for 2025" },
  { icon: "📱", label: "Best Budget Phones",      badge: "💰 Value",  q: "Best Android phone under $500 in 2025 — what should I buy?" },
  { icon: "🏠", label: "Home Office Setup",       badge: "🏠 WFH",    q: "Build me the best home office for $1,200: desk, chair, monitor" },
  { icon: "⌨️", label: "Keyboard & Mouse Deals", badge: "⚡ Deals",   q: "Best mechanical keyboard and mouse combo for coding under $200" },
];

const COLLECTIONS = [
  { icon: "🎓", label: "College Starter Pack",  desc: "Everything for dorm life",        q: "I'm heading to college in August. What tech should I buy? Budget $2,000 total." },
  { icon: "🎮", label: "Gaming Setup",          desc: "PC, monitor, peripherals, chair",  q: "Build me the best gaming setup under $1,500 — PC, monitor, keyboard, mouse, headset" },
  { icon: "🏠", label: "First Apartment",       desc: "Furniture, appliances, tech",      q: "I'm moving into my first apartment. Help me prioritize what to buy and when. Budget $3,000." },
  { icon: "✈️", label: "Travel Essentials",     desc: "Luggage, electronics, gear",       q: "Best travel tech for frequent fliers — headphones, portable charger, laptop bag under $500" },
  { icon: "💼", label: "Work From Home",        desc: "Desk, chair, monitor, webcam",     q: "Complete WFH setup: standing desk, ergonomic chair, 4K monitor. Budget $1,500." },
  { icon: "📷", label: "Creator Kit",           desc: "Camera, lighting, microphone",     q: "I want to start a YouTube channel. Best camera, mic, and lighting under $800." },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [token,    setToken]    = useState("");
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loadingH, setLoadingH] = useState(true);
  const [query,    setQuery]    = useState("");
  const inputRef   = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated" && !fetchedRef.current) {
      fetchedRef.current = true;
      fetch("/api/token")
        .then(r => r.json())
        .then(d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          fetch(`${BASE}/history`, { headers: { Authorization: `Bearer ${d.token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setSessions(Array.isArray(data) ? data.slice(0, 4) : []))
            .catch(() => {})
            .finally(() => setLoadingH(false));
        })
        .catch(() => router.push("/sign-in"));
    }
  }, [status, router]);

  function ask(q: string) {
    router.push(`/procurement?q=${encodeURIComponent(q)}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) ask(query.trim());
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  // Hard redirect only for unauthenticated — never block the whole page on token loading
  if (status === "unauthenticated") {
    router.push("/sign-in");
    return null;
  }

  return (
    <main style={S.page}>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <Link href="/dashboard" style={S.brand}>
            BuyRight <span style={{ color: ACCENT }}>AI</span>
          </Link>
          <div style={S.navLinks}>
            <Link href="/dashboard"   style={{ ...S.navLink, color: ACCENT, fontWeight: 700 }}>Home</Link>
            <Link href="/procurement" style={S.navLink}>AI Advisor</Link>
            <Link href="/history"     style={S.navLink}>History</Link>
            <Link href="/pricing"     style={S.navLink}>Pricing</Link>
          </div>
        </div>
        <div style={S.navRight}>
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" style={S.userAvatar} referrerPolicy="no-referrer" />
          )}
          <span style={S.userName}>{session?.user?.name ?? ""}</span>
          <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
        </div>
      </nav>

      <div style={S.content}>

        {/* Hero */}
        <section style={S.hero}>
          <p style={S.greetLine}>{greeting()}, {firstName}.</p>
          <h1 style={S.h1}>What are you shopping for today?</h1>

          <form onSubmit={handleSearch} style={S.searchWrap}>
            <div style={S.searchBox}>
              <span style={S.searchIcon}>🔍</span>
              <input
                ref={inputRef}
                style={S.searchInput}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Try "Gaming laptop under $1,200 by August"...'
                autoFocus
              />
              <button type="submit" disabled={!query.trim()} style={{
                ...S.searchBtn,
                opacity: query.trim() ? 1 : 0.4,
                cursor: query.trim() ? "pointer" : "default",
              }}>
                Ask AI →
              </button>
            </div>
          </form>

          <div style={S.chips}>
            {QUICK_CHIPS.map(c => (
              <button key={c.label} onClick={() => ask(c.q)} style={S.chip}>
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Recent Research */}
        {(loadingH || sessions.length > 0) && (
          <section style={S.section}>
            <div style={S.sectionHeader}>
              <h2 style={S.sectionTitle}>Continue Shopping</h2>
              <Link href="/history" style={S.seeAll}>View all →</Link>
            </div>
            <div style={S.recentGrid}>
              {loadingH
                ? [0, 1, 2, 3].map(i => <div key={i} style={S.skeletonCard} />)
                : sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/procurement?session=${s.id}`)}
                      style={S.recentCard}
                    >
                      <div style={S.recentEmoji}>{categoryEmoji(s.category)}</div>
                      <div style={S.recentInfo}>
                        <p style={S.recentProduct}>
                          {s.product ?? s.title ?? "Research session"}
                        </p>
                        <p style={S.recentMeta}>
                          {s.message_count} messages · {timeAgo(s.updated_at)}
                        </p>
                      </div>
                      <span style={S.resumeTag}>Resume →</span>
                    </button>
                  ))
              }
            </div>
          </section>
        )}

        {/* Trending Guides */}
        <section style={S.section}>
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Trending Buying Guides</h2>
          </div>
          <div style={S.trendingGrid}>
            {TRENDING.map(t => (
              <button key={t.label} onClick={() => ask(t.q)} style={S.trendCard}>
                <div style={S.trendTop}>
                  <span style={S.trendIcon}>{t.icon}</span>
                  <span style={S.trendBadge}>{t.badge}</span>
                </div>
                <p style={S.trendLabel}>{t.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Collections */}
        <section style={S.section}>
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Popular Collections</h2>
            <p style={S.sectionSub}>One-click buying journeys for life&apos;s big moments</p>
          </div>
          <div style={S.collGrid}>
            {COLLECTIONS.map(c => (
              <button key={c.label} onClick={() => ask(c.q)} style={S.collCard}>
                <span style={S.collIcon}>{c.icon}</span>
                <div>
                  <p style={S.collLabel}>{c.label}</p>
                  <p style={S.collDesc}>{c.desc}</p>
                </div>
                <span style={S.collArrow}>→</span>
              </button>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={S.cta}>
          <p style={S.ctaText}>Not sure where to start? Just ask.</p>
          <button
            onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={S.ctaBtn}
          >
            Ask BuyRight AI
          </button>
        </section>
      </div>

      <footer style={S.footer}>
        <span style={S.footerCopy}>© 2025 BuyRight AI</span>
        <nav style={S.footerNav}>
          <Link href="/about"   style={S.footerLink}>About</Link>
          <Link href="/terms"   style={S.footerLink}>Terms</Link>
          <Link href="/privacy" style={S.footerLink}>Privacy</Link>
        </nav>
        <span style={S.footerDisclaimer}>AI-generated recommendations. Always verify before buying.</span>
      </footer>

      <style>{`@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:             { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui,-apple-system,sans-serif", display: "flex", flexDirection: "column" },
  nav:              { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  navLeft:          { display: "flex", alignItems: "center", gap: 32 },
  navLinks:         { display: "flex", gap: 24 },
  navLink:          { color: "#94A3B8", fontSize: 14, textDecoration: "none" },
  brand:            { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  navRight:         { display: "flex", alignItems: "center", gap: 12 },
  userAvatar:       { width: 28, height: 28, borderRadius: "50%", objectFit: "cover" as const },
  userName:         { color: "#94A3B8", fontSize: 13 },
  ghostBtn:         { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  content:          { flex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 40px", boxSizing: "border-box" as const },
  hero:             { padding: "64px 0 48px", textAlign: "center" as const },
  greetLine:        { color: "#94A3B8", fontSize: 15, margin: "0 0 8px" },
  h1:               { color: "#F1F5F9", fontSize: 36, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.5px" },
  searchWrap:       { width: "100%", maxWidth: 680, margin: "0 auto 24px" },
  searchBox:        { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "4px 4px 4px 18px", gap: 10 },
  searchIcon:       { fontSize: 16, flexShrink: 0, opacity: 0.5 },
  searchInput:      { flex: 1, background: "none", border: "none", outline: "none", color: "#F1F5F9", fontSize: 16, padding: "10px 0", fontFamily: "inherit" },
  searchBtn:        { background: ACCENT, color: "#0B0F19", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" as const },
  chips:            { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" as const },
  chip:             { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#94A3B8", borderRadius: 99, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  section:          { paddingBottom: 56 },
  sectionHeader:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sectionTitle:     { color: "#F1F5F9", fontSize: 18, fontWeight: 700, margin: 0 },
  sectionSub:       { color: "#475569", fontSize: 13, margin: 0 },
  seeAll:           { color: ACCENT, fontSize: 13, textDecoration: "none", fontWeight: 600 },
  recentGrid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 },
  recentCard:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit" },
  recentEmoji:      { fontSize: 32 },
  recentInfo:       { flex: 1 },
  recentProduct:    { color: "#E2E8F0", fontSize: 14, fontWeight: 600, margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  recentMeta:       { color: "#475569", fontSize: 12, margin: 0 },
  resumeTag:        { color: ACCENT, fontSize: 12, fontWeight: 700 },
  skeletonCard:     { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, height: 130, animation: "shimmer 1.4s ease-in-out infinite" },
  trendingGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 },
  trendCard:        { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit" },
  trendTop:         { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  trendIcon:        { fontSize: 28 },
  trendBadge:       { background: "rgba(255,255,255,0.06)", color: "#94A3B8", fontSize: 10, borderRadius: 99, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap" as const },
  trendLabel:       { color: "#E2E8F0", fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.4 },
  collGrid:         { display: "flex", flexDirection: "column", gap: 10 },
  collCard:         { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit" },
  collIcon:         { fontSize: 28, flexShrink: 0 },
  collLabel:        { color: "#E2E8F0", fontSize: 14, fontWeight: 700, margin: "0 0 3px" },
  collDesc:         { color: "#475569", fontSize: 12, margin: 0 },
  collArrow:        { color: "#475569", fontSize: 18, marginLeft: "auto", flexShrink: 0 },
  cta:              { textAlign: "center" as const, padding: "32px 0 64px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  ctaText:          { color: "#475569", fontSize: 15, margin: 0 },
  ctaBtn:           { background: "rgba(0,245,212,0.08)", color: ACCENT, border: "1px solid rgba(0,245,212,0.2)", borderRadius: 10, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  footer:           { borderTop: "1px solid rgba(255,255,255,0.06)", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 },
  footerCopy:       { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  footerNav:        { display: "flex", gap: 20 },
  footerLink:       { color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" },
  footerDisclaimer: { color: "rgba(255,255,255,0.15)", fontSize: 12 },
};
