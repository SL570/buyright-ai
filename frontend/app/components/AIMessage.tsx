"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Strip all pictographic emoji from AI-generated text at render time
const stripEmoji = (s: string) =>
  s.replace(/\p{Emoji_Presentation}[️‍]?\s*/gu, "").trim();

export interface Product {
  name: string;
  price: string;
  badge: string;
  badgeType: "success" | "warning" | "neutral" | "danger";
  recommended: boolean;
  score?: number;
  scoreLabel?: string;
  store: string;
  url?: string;
  pros: string[];
  cons: string[];
  rejection_reason?: string;
}

interface DecisionSummaryData {
  buy: string;
  price: string;
  targetPrice?: string;
  buyNowIf?: string;
  skipIf?: string;
  buyBefore?: string;
  wait: boolean;
  lifespan?: string;
  verdict?: string;
  reason?: string;
  regretRisk?: string;
  priceStatus?: string;
  regretFactors?: { pro: string[]; con: string[] };
}

interface WhyPickedData {
  analyzed: number;
  eliminated: number;
  finalists: number;
  category: string;
  checked: string[];
}

interface BundleItem {
  name: string;
  price: number;
  category: string;
  store: string;
}

interface BundleData {
  budget?: number;
  items: BundleItem[];
}

type VerdictType = "success" | "warning" | "danger" | "info";

const VERDICT_SUCCESS = ["BUY NOW", "PRICE MATCH", "RETURN ELIGIBLE", "ESCALATE", "CLAIM VALID"];
const VERDICT_WARNING = ["NEGOTIATE", "WAIT", "PARTIAL"];
const VERDICT_DANGER  = ["NOT ELIGIBLE", "DENIED", "NO MATCH"];

const V_STYLE: Record<VerdictType, { bg: string; color: string; border: string; icon: string }> = {
  success: { bg: "rgba(0,207,114,0.12)",  color: "#00CF72", border: "rgba(0,207,114,0.3)",  icon: "✓" },
  warning: { bg: "rgba(245,168,58,0.12)", color: "#F5A83A", border: "rgba(245,168,58,0.3)", icon: "⚡" },
  danger:  { bg: "rgba(240,101,101,0.12)",color: "#F06565", border: "rgba(240,101,101,0.3)",icon: "✗" },
  info:    { bg: "rgba(77,158,255,0.10)", color: "#4D9EFF", border: "rgba(77,158,255,0.3)", icon: "ℹ" },
};

const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  success: { bg: "rgba(0,207,114,0.12)",  color: "#00CF72" },
  warning: { bg: "rgba(245,168,58,0.12)", color: "#F5A83A" },
  danger:  { bg: "rgba(240,101,101,0.12)",color: "#F06565" },
  neutral: { bg: "rgba(255,255,255,0.06)",color: "#7B8FAF" },
};


function parseContent(raw: string) {
  let body = raw;
  let products: Product[] | null = null;
  let loadingProducts = false;
  let verdict: { text: string; type: VerdictType } | null = null;

  // Extract complete PRODUCT_GRID block
  const pgRe = /PRODUCT_GRID:\n([\s\S]*?)\nEND_PRODUCT_GRID\n?/;
  const pgMatch = body.match(pgRe);
  if (pgMatch) {
    try {
      products = JSON.parse(pgMatch[1]);
      body = body.replace(pgMatch[0], "").trim();
    } catch { /* fallthrough */ }
  }
  if (!products) {
    const pgStart = body.indexOf("PRODUCT_GRID:");
    if (pgStart !== -1) {
      // Mid-stream: show text before PRODUCT_GRID, skeleton card where grid will be
      body = body.substring(0, pgStart).trim();
      loadingProducts = true;
    }
  }

  // Extract **Verdict:** line
  const vRe = /^\*\*Verdict:\*\*\s*([A-Z][A-Z ]+)\n?/m;
  const vMatch = body.match(vRe);
  if (vMatch) {
    const v = vMatch[1].trim();
    const type: VerdictType =
      VERDICT_SUCCESS.includes(v) ? "success" :
      VERDICT_WARNING.includes(v) ? "warning" :
      VERDICT_DANGER.includes(v)  ? "danger"  : "info";
    verdict = { text: v, type };
    body = body.replace(vMatch[0], "").trim();
  }

  // Strip NEXT_ACTIONS from rendered body
  body = body.replace(/\nNEXT_ACTIONS:\s*\[[\s\S]*?\](\n|$)/, "\n").trim();
  body = body.replace(/^NEXT_ACTIONS:\s*\[[\s\S]*?\](\n|$)/, "").trim();

  // Extract DECISION_SUMMARY (single-line JSON)
  let decisionSummary: DecisionSummaryData | null = null;
  const dsRe = /DECISION_SUMMARY:\s*(\{[^\n]+\})/;
  const dsMatch = body.match(dsRe);
  if (dsMatch) {
    try {
      decisionSummary = JSON.parse(dsMatch[1]);
      body = body.replace(dsMatch[0], "").trim();
    } catch { /* fallthrough */ }
  }
  body = body.replace(/\nDECISION_SUMMARY:.*/, "").trim();

  // Extract WHY_PICKED (single-line JSON)
  let whyPicked: WhyPickedData | null = null;
  const wpRe = /WHY_PICKED:\s*(\{[^\n]+\})/;
  const wpMatch = body.match(wpRe);
  if (wpMatch) {
    try {
      whyPicked = JSON.parse(wpMatch[1]);
      body = body.replace(wpMatch[0], "").trim();
    } catch { /* fallthrough */ }
  }
  body = body.replace(/\nWHY_PICKED:.*/, "").trim();
  body = body.replace(/^WHY_PICKED:.*\n?/, "").trim();

  // Extract BUNDLE_ITEMS (single-line JSON)
  let bundleData: BundleData | null = null;
  const biRe = /BUNDLE_ITEMS:\s*(\{[^\n]+\})/;
  const biMatch = body.match(biRe);
  if (biMatch) {
    try {
      bundleData = JSON.parse(biMatch[1]);
      body = body.replace(biMatch[0], "").trim();
    } catch { /* fallthrough */ }
  }
  body = body.replace(/\nBUNDLE_ITEMS:.*/, "").trim();
  body = body.replace(/^BUNDLE_ITEMS:.*\n?/, "").trim();

  return { products, loadingProducts, verdict, body, decisionSummary, whyPicked, bundleData };
}

// Split markdown body into plain sections and collapsed detail sections
type Section = { collapsible: boolean; header: string; content: string };

function splitBodyIntoSections(body: string): Section[] {
  const emojis = "🕵|⭐|😬|🔍|❌|🔀|✅";
  // Split before any line that opens a collapsible section header
  const parts = body.split(new RegExp(`(?=\\n\\*\\*(${emojis}))`));
  return parts.reduce<Section[]>((acc, part) => {
    if (!part.trim()) return acc;
    const m = part.match(/^\s*\*\*([^\n*]+)\*\*/);
    if (m && /^(🕵|⭐|😬|🔍|❌|🔀|✅)/.test(m[1])) {
      acc.push({ collapsible: true, header: m[1], content: part.slice(m[0].length).trim() });
    } else {
      acc.push({ collapsible: false, header: "", content: part });
    }
    return acc;
  }, []);
}

export interface JourneyStage {
  label: string;
  done: boolean;
}

export interface PriceLink { store: string; price: string; url: string; title: string; direct?: boolean; confidence?: number; }

interface Props {
  priceLinksLoading?: boolean;
  content: string;
  onFollowUp?: (q: string) => void;
  followups?: string[];
  accent?: string;
  journeyStages?: JourneyStage[];
  priceLinks?: PriceLink[];
}

const SECTION_LABELS: Record<string, string> = {
  "🕵": "Hidden Catches",
  "⭐": "Future Proof",
  "😬": "Common Regrets",
  "🔍": "After Living With It",
  "❌": "Skip This If",
  "🔀": "Compare Alternatives",
  "✅": "Before You Buy",
};

const STRIP_EMOJI = /^(🕵|⭐|😬|🔍|❌|🔀|✅)\s*/u;

function resolveHeader(header: string): string {
  // Strip leading emoji marker then look up clean label
  const stripped = header.replace(STRIP_EMOJI, "").trim();
  for (const [, label] of Object.entries(SECTION_LABELS)) {
    if (stripped.toLowerCase().startsWith(label.toLowerCase().slice(0, 6))) return label;
  }
  return stripped || header.replace(STRIP_EMOJI, "").trim();
}

function CollapsibleSection({ header, children, accent }: { header: string; children: React.ReactNode; accent: string }) {
  const [open, setOpen] = useState(false);
  const label = resolveHeader(header);
  return (
    <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", marginTop: 2 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "11px 0", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? "#A8C0D8" : "#7B98B8" }}>{label.replace(STRIP_EMOJI, "")}</span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{
            flexShrink: 0, marginLeft: 8,
            color: open ? accent : "#3D5571",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s ease",
          }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {/* CSS grid trick: smooth height animation without measuring content */}
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.25s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ paddingBottom: 14 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function BundleCard({ data, accent }: { data: BundleData; accent: string }) {
  const total = data.items.reduce((sum, item) => sum + item.price, 0);
  const remaining = data.budget && data.budget > 0 ? data.budget - total : null;
  return (
    <div style={{
      background: `${accent}08`, border: `1px solid ${accent}25`,
      borderRadius: 12, padding: "14px 16px", marginBottom: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Complete Setup
        </div>
        {remaining !== null && (
          <div style={{ fontSize: 11, fontWeight: 600, color: remaining >= 0 ? "#00CF72" : "#F06565" }}>
            ${Math.abs(remaining)} {remaining >= 0 ? "under budget" : "over budget"}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
        {data.items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: "#3D5571", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                {stripEmoji(item.category)}
              </span>
              <span style={{ fontSize: 12, color: "#8BA3C4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {stripEmoji(item.name)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EFF3FF", fontFamily: "monospace" }}>${item.price}</span>
              <span style={{ fontSize: 10, color: "#3D5571" }}>{item.store}</span>

            </div>
          </div>
        ))}
      </div>
      <div style={{
        borderTop: "0.5px solid rgba(255,255,255,0.07)", paddingTop: 10,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#3D5571" }}>Complete setup: </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace" }}>${total}</span>
          {data.budget && data.budget > 0 && (
            <span style={{ fontSize: 11, color: "#3D5571" }}>of ${data.budget} budget</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#4A6080", lineHeight: 1.5 }}>
          Everything you need arrives in one order. No compatibility headaches.
        </div>
      </div>
    </div>
  );
}

function ConfidenceBox({ data, score }: { data: DecisionSummaryData; score?: number }) {
  const raw = score ?? 80;
  const buy = !data.wait;
  const color = buy ? "#00CF72" : "#F5A83A";
  const regretColor = (r: string) =>
    r === "Very Low" || r === "Low" ? "#00CF72" : r === "High" ? "#F06565" : "#F5A83A";

  const cells: { label: string; value: string; color?: string }[] = [
    { label: "Confidence", value: `${raw}%`, color },
    ...(data.regretRisk ? [{ label: "Regret Risk", value: data.regretRisk.toUpperCase(), color: regretColor(data.regretRisk) }] : []),
    ...(data.buyBefore   ? [{ label: "Best Time",  value: data.buyBefore }] : []),
    ...(data.priceStatus ? [{ label: "Price",       value: data.priceStatus }] : []),
  ];

  return (
    <div style={{
      background: buy ? "rgba(0,207,114,0.05)" : "rgba(245,168,58,0.05)",
      border: `1px solid ${color}28`, borderRadius: 14,
      padding: "16px 20px", marginBottom: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Would I Buy This?
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.01em" }}>
          {buy ? "YES" : "WAIT"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: data.reason ? 14 : 0 }}>
        {cells.map((cell, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: "#3D5571", marginBottom: 2 }}>{cell.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cell.color ?? "#8BA3C4" }}>{cell.value}</div>
          </div>
        ))}
      </div>
      {data.reason && (
        <div style={{
          fontSize: 13, color: "#C4D4E8", lineHeight: 1.7,
          borderTop: `0.5px solid ${color}20`, paddingTop: 12,
        }}>
          {stripEmoji(data.reason)}
        </div>
      )}
    </div>
  );
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, "")) || 999999;
}

// Patterns that indicate a search or category page — reject these as buy links
const _REJECT_URL = [
  "/s?k=", "/search?", "/searchpage.jsp", "/catalogsearch",
  "?q=", "?keyword=", "?searchTerm=", "/search?q=",
  "/category/", "/brand/", "/collection/", "/browse/", "/c/",
];

function isRealPdp(url: string): boolean {
  const u = url.toLowerCase();
  return !_REJECT_URL.some(p => u.includes(p));
}

function matchLinks(name: string, priceLinks: PriceLink[]): PriceLink[] {
  if (!name || !priceLinks?.length) return [];
  const target = norm(name);
  const words = target.split(" ").filter(w => w.length > 2);
  const scored = priceLinks
    .filter(item => item.url && isRealPdp(item.url))
    .map(item => {
      const t = norm(item.title);
      if (t === target) return { item, score: 3 };
      const matched = words.filter(w => t.includes(w)).length;
      const ratio = words.length ? matched / words.length : 0;
      if (ratio >= 0.30) return { item, score: 2 };
      const keyWords = words.slice(0, 2);
      if (keyWords.length >= 2 && keyWords.every(w => t.includes(w))) return { item, score: 1 };
      return null;
    })
    .filter(Boolean) as { item: PriceLink; score: number }[];
  return scored
    .sort((a, b) => b.score - a.score || parsePrice(a.item.price) - parsePrice(b.item.price))
    .map(s => s.item);
}

function cleanStoreName(store: string): string {
  return store
    .replace(/\.(com|net|org|co\.uk|ca|us)$/i, "")
    .replace(/\s*\|.*$/, "")
    .trim();
}

const RETAILER_COLOR: Record<string, string> = {
  amazon: "#FF9900", walmart: "#0071CE", "best buy": "#0046BE",
  target: "#CC0000", costco: "#005DAA", "macy's": "#E21F42", macys: "#E21F42",
  nordstrom: "#8B7355", "nordstrom rack": "#555", sephora: "#333",
  ulta: "#8B2346", "home depot": "#F96302", "lowe's": "#004990",
  newegg: "#E21F2A", "b&h": "#444",
};

function retailerColor(store: string): string {
  const s = store.toLowerCase();
  for (const [key, color] of Object.entries(RETAILER_COLOR)) {
    if (s.includes(key)) return color;
  }
  return "#5577AA";
}

function RetailerGrid({ links, loading, productName }: { links: PriceLink[]; loading?: boolean; productName?: string }) {
  const sorted = [...links].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));

  if (loading && sorted.length === 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 8 }}>
          Available at
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[80, 65, 55].map((w, i) => (
            <div key={i} style={{ height: 42, borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)", animation: "br-shimmer 1.4s infinite" }} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#3D5571", marginTop: 7 }}>Finding verified retailers…</div>
        <style>{`@keyframes br-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      </div>
    );
  }

  if (sorted.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 8 }}>
        Buy now
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((item, i) => {
          const color = retailerColor(item.store);
          const isBest = i === 0;
          const store = cleanStoreName(item.store);
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                textDecoration: "none", padding: "12px 16px", borderRadius: 10,
                background: isBest ? `${color}14` : "rgba(255,255,255,0.03)",
                border: `1px solid ${isBest ? `${color}35` : "rgba(255,255,255,0.07)"}`,
                transition: "background 0.12s, border-color 0.12s, transform 0.1s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isBest ? `${color}22` : "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = isBest ? `${color}55` : "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isBest ? `${color}14` : "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = isBest ? `${color}35` : "rgba(255,255,255,0.07)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Left: price + badge */}
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "monospace", color: "#EFF3FF", letterSpacing: "-0.02em" }}>
                  {item.price}
                </span>
                {isBest && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#00CF72", background: "rgba(0,207,114,0.15)", border: "0.5px solid rgba(0,207,114,0.3)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.06em" }}>
                    BEST PRICE
                  </span>
                )}
              </span>
              {/* Right: CTA */}
              <span style={{ fontSize: 13, fontWeight: 700, color: isBest ? color : "#7B98B8", letterSpacing: "0.01em" }}>
                Buy from {store} →
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Keep BuyButtons as a thin alias so call sites don't need changing
function BuyButtons({ links, fallbackStore, fallbackName, accent, loading }: {
  links: PriceLink[]; fallbackStore: string; fallbackName: string; accent: string; loading?: boolean;
}) {
  return <RetailerGrid links={links} loading={loading} productName={fallbackName} />;
}

export function AIMessage({ content, onFollowUp, followups = [], accent = "#4D9EFF", journeyStages, priceLinks = [], priceLinksLoading = false }: Props) {
  const { products, verdict, body, decisionSummary, whyPicked, bundleData } = parseContent(content);
  const vs = verdict ? V_STYLE[verdict.type] : null;

  // Shared ReactMarkdown component map — reused across plain + collapsible sections
  const mdC = {
    p:          ({ children }: any) => <p style={{ margin: "6px 0" }}>{children}</p>,
    h1:         ({ children }: any) => <h1 style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF", margin: "14px 0 6px" }}>{children}</h1>,
    h2:         ({ children }: any) => <h2 style={{ fontSize: 15, fontWeight: 700, color: "#EFF3FF", margin: "12px 0 5px" }}>{children}</h2>,
    h3:         ({ children }: any) => <h3 style={{ fontSize: 14, fontWeight: 600, color: "#EFF3FF", margin: "10px 0 4px" }}>{children}</h3>,
    strong:     ({ children }: any) => <strong style={{ color: "#EFF3FF", fontWeight: 600 }}>{children}</strong>,
    ul:         ({ children }: any) => <ul style={{ paddingLeft: 18, margin: "6px 0" }}>{children}</ul>,
    ol:         ({ children }: any) => <ol style={{ paddingLeft: 18, margin: "6px 0" }}>{children}</ol>,
    li:         ({ children }: any) => <li style={{ margin: "3px 0" }}>{children}</li>,
    hr:         () => <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />,
    blockquote: ({ children }: any) => (
      <blockquote style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12, margin: "8px 0", color: "#8BA3C4" }}>
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div style={{ overflowX: "auto", margin: "10px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table>
      </div>
    ),
    th: ({ children }: any) => (
      <th style={{ textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7B8FAF" }}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td style={{ padding: "8px 10px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", color: "#E2E8F0", verticalAlign: "top" }}>
        {children}
      </td>
    ),
    code({ className, children, ...rest }: any) {
      const lang = /language-(\w+)/.exec(className || "")?.[1];
      const isBlock = String(children).includes("\n");
      if (isBlock && lang === "script") {
        return <ScriptBox accent={accent}>{String(children).replace(/\n$/, "")}</ScriptBox>;
      }
      if (isBlock) {
        return (
          <pre style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 14px", overflowX: "auto", fontSize: 12, fontFamily: "monospace", margin: "8px 0" }}>
            <code>{children}</code>
          </pre>
        );
      }
      return (
        <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 5px", borderRadius: 4, fontSize: "0.875em", fontFamily: "monospace" }} {...rest}>
          {children}
        </code>
      );
    },
  };

  const winnerScore = (products?.find(p => p.recommended) ?? products?.[0])?.score;

  return (
    <div>
      {/* Confidence box — executive summary: Would I Buy This? */}
      {decisionSummary && (
        <ConfidenceBox data={decisionSummary} score={winnerScore} />
      )}

      {/* Verdict badge */}
      {verdict && vs && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`,
          borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.07em", marginBottom: 10,
        }}>
          {vs.icon} {verdict.text}
        </div>
      )}

      {/* Skeleton card while PRODUCT_GRID is streaming in */}
      {loadingProducts && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 60, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)", animation: "pulse 1.4s ease-in-out infinite" }} />
            <div style={{ width: 120, height: 10, borderRadius: 6, background: "rgba(10,132,255,0.15)", animation: "pulse 1.4s ease-in-out infinite 0.1s" }} />
          </div>
          <div style={{ width: "55%", height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", marginBottom: 10, animation: "pulse 1.4s ease-in-out infinite 0.2s" }} />
          <div style={{ width: "30%", height: 18, borderRadius: 6, background: "rgba(255,255,255,0.05)", marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite 0.3s" }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 80, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: `pulse 1.4s ease-in-out infinite ${0.1*i}s` }} />)}
          </div>
        </div>
      )}

      {/* Product cards — hero winner + why-not row */}
      {products && products.length > 0 && (() => {
        const winner = products.find(p => p.recommended) ?? products[0];
        const others = products.filter(p => !p.recommended);
        return (
          <div style={{ marginBottom: 14 }}>
            {/* Hero winner */}
            {(() => {
              const buyLinks = matchLinks(winner.name, priceLinks);

              const cheapestLink = buyLinks.length ? [...buyLinks].sort((a,b) => parsePrice(a.price)-parsePrice(b.price))[0] : null;
              const displayPrice = cheapestLink ? cheapestLink.price : winner.price;
              const isLive = cheapestLink && cheapestLink.price !== winner.price;
              return (
            <div style={{
              background: "rgba(0,207,114,0.06)",
              border: "1.5px solid rgba(0,207,114,0.35)",
              borderRadius: 14, padding: "18px 20px", marginBottom: 10,
            }}>
              {/* Name + price */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#00CF72", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Top Pick
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#EFF3FF", lineHeight: 1.2 }}>{winner.name}</div>
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace", letterSpacing: "-0.02em" }}>{displayPrice}</span>
                    {isLive && <span style={{ fontSize: 10, fontWeight: 700, color: "#0A84FF", background: "rgba(10,132,255,0.12)", border: "0.5px solid rgba(10,132,255,0.3)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.06em" }}>LIVE</span>}
                    {isLive && <span style={{ fontSize: 11, color: "#4A6080", textDecoration: "line-through" }}>{winner.price}</span>}
                  </div>
                  {winner.scoreLabel && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "#3A6050" }}>{stripEmoji(winner.scoreLabel!)}</div>
                  )}
                </div>
              </div>

              {/* Buy buttons — resolver-verified PDPs only */}
              <BuyButtons
                links={buyLinks}
                fallbackStore={winner.store}
                fallbackName={winner.name}
                accent={accent}
                loading={priceLinksLoading && buyLinks.length === 0}
              />

              {/* Pros / Cons */}
              {winner.pros.length > 0 && (
                <div style={{ marginTop: 14, marginBottom: winner.cons.length > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#00CF72", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Perfect for</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {winner.pros.map((t, j) => (
                      <span key={j} style={{ background: "rgba(0,207,114,0.08)", border: "0.5px solid rgba(0,207,114,0.25)", borderRadius: 99, padding: "4px 11px", fontSize: 12, color: "#5DDBA8" }}>{stripEmoji(t)}</span>
                    ))}
                  </div>
                </div>
              )}
              {winner.cons.length > 0 && (
                <div style={{ marginTop: winner.pros.length ? 0 : 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4A6080", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Not ideal for</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {winner.cons.map((t, j) => (
                      <span key={j} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 99, padding: "4px 11px", fontSize: 11, color: "#4A6080" }}>{stripEmoji(t)}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: "#2D4060", marginTop: 10 }}>{winner.store}</div>
            </div>
              );
            })()}

            {/* Why We Picked It */}
            {whyPicked && <WhyPickedCard data={whyPicked} accent={accent} />}

            {/* Why not the others */}
            {others.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7, marginTop: whyPicked ? 12 : 0 }}>
                  Why not the others?
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {others.map((p, i) => {
                    const reason = p.rejection_reason || p.cons[0] || "";
                    return (
                      <div key={i} style={{
                        flex: 1, background: "rgba(255,255,255,0.02)",
                        border: "0.5px solid rgba(255,255,255,0.07)",
                        borderRadius: 10, padding: "12px 14px",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#4A6080" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#4A6080" }}>{p.price}</div>
                          {p.score != null && <div style={{ fontSize: 10, color: "#2D4060" }}>{p.score}/100</div>}
                        </div>
                        {reason && <div style={{ fontSize: 11, color: "#3D5571", marginTop: 6, lineHeight: 1.55 }}>{stripEmoji(reason)}</div>}
                        {matchLinks(p.name, priceLinks)[0]?.url && (
                          <a
                            href={matchLinks(p.name, priceLinks)[0]!.url}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 10, color: "#3D5571", textDecoration: "none", marginTop: 8, display: "inline-block" }}
                          >
                            Compare →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Complete Setup — shown before content so it's one of the first things seen */}
      {bundleData && bundleData.items.length > 0 && (
        <BundleCard data={bundleData} accent={accent} />
      )}

      {/* Markdown body — detail sections collapsed by default */}
      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#E2E8F0" }}>
        {splitBodyIntoSections(body).map((section, i) =>
          section.collapsible ? (
            <CollapsibleSection key={i} header={section.header} accent={accent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdC as any}>
                {stripEmoji(section.content)}
              </ReactMarkdown>
            </CollapsibleSection>
          ) : (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={mdC as any}>
              {stripEmoji(section.content)}
            </ReactMarkdown>
          )
        )}
      </div>

      {/* Decision Summary card */}
      {decisionSummary && (
        <>
          <DecisionSummaryCard data={decisionSummary} accent={accent} onFindPrice={
            (() => {
              const verifiedUrl = matchLinks(decisionSummary.buy, priceLinks)[0]?.url;
              return verifiedUrl ? () => window.open(verifiedUrl, "_blank") : undefined;
            })()
          } />
          <RegretPanel data={decisionSummary} />
        </>
      )}

      {/* Journey progress tracker */}
      {journeyStages && journeyStages.length > 0 && (() => {
        const allDone = journeyStages.every(s => s.done);
        if (allDone) return (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,207,114,0.12)", border: "1px solid rgba(0,207,114,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00CF72" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#00CF72" }}>Buying Journey Complete</div>
            <div style={{ fontSize: 11, color: "#3A6050", marginTop: 3 }}>You're ready to buy with total confidence.</div>
          </div>
        );
        return (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2D4060", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>
              Buying Journey
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {journeyStages.map((stage, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: stage.done ? "rgba(0,207,114,0.13)" : "rgba(255,255,255,0.03)",
                    border: stage.done ? "1.5px solid rgba(0,207,114,0.45)" : "1px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: stage.done ? 9 : 10, fontWeight: 700,
                    color: stage.done ? "#00CF72" : "#2D4060",
                  }}>
                    {stage.done ? "✓" : idx + 1}
                  </div>
                  <span style={{ fontSize: 12, color: stage.done ? "#7B98B8" : "#2D4060" }}>{stage.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Follow-up chips */}
      {followups.length > 0 && onFollowUp && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {followups.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
              style={{
                fontSize: 12, color: accent,
                border: `0.5px solid ${accent}40`,
                background: `${accent}10`,
                borderRadius: 99, padding: "5px 13px",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MeterGauge({ pct, color }: { pct: number; color: string }) {
  const r = 22, cx = 28, cy = 28;
  const circ = 2 * Math.PI * r;
  const trackLen = circ * 0.75;
  const fillLen = trackLen * Math.min(Math.max(pct, 0), 1);
  return (
    <svg width={56} height={56} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} strokeDasharray={`${trackLen} ${circ}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${fillLen} ${circ}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={13} fontWeight={800} fontFamily="monospace">{Math.round(pct * 100)}</text>
    </svg>
  );
}

function WhyPickedCard({ data, accent }: { data: WhyPickedData; accent: string }) {
  const noun = data.category || "products";
  const pct = data.analyzed > 0 ? Math.round((data.finalists / data.analyzed) * 100) : 10;
  const rankLabel = pct <= 5 ? "Top 5% Pick" : pct <= 12 ? "Top 10% Pick" : "Best Overall Value";
  return (
    <div style={{ background: "rgba(255,255,255,0.015)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase" }}>Why We Picked It</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#00CF72", background: "rgba(0,207,114,0.1)", border: "0.5px solid rgba(0,207,114,0.25)", borderRadius: 99, padding: "2px 10px" }}>{rankLabel}</span>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace", lineHeight: 1 }}>{data.analyzed}</div>
          <div style={{ fontSize: 10, color: "#3D5571", marginTop: 3 }}>{noun} evaluated</div>
        </div>
        <div style={{ width: "0.5px", background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: accent, fontFamily: "monospace", lineHeight: 1 }}>{data.finalists}</div>
          <div style={{ fontSize: 10, color: "#3D5571", marginTop: 3 }}>finalists survived testing</div>
        </div>
      </div>

      {/* Winner based on */}
      {data.checked.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#4A6080", marginBottom: 7 }}>Winner selected based on:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {data.checked.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 7, fontSize: 12, color: "#7B98B8" }}>
                <span style={{ color: "#00CF72", flexShrink: 0, fontSize: 10 }}>✓</span>
                <span>{stripEmoji(c)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust signals */}
      <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#2D4060", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
          Why trust this recommendation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            `Compared ${data.analyzed} ${noun}`,
            "Read thousands of verified owner reviews",
            "Checked price history and deal timing",
            "Recommendations are chosen before we look at retailers or commissions.",
          ].map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 7, fontSize: 11, color: "#4A6080" }}>
              <span style={{ color: "#00CF72", flexShrink: 0, fontSize: 10 }}>✓</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegretPanel({ data }: { data: DecisionSummaryData }) {
  const factors = data.regretFactors;
  if (!factors) return null;
  const risk = data.regretRisk ?? "Low";
  const riskColor = risk === "Very Low" || risk === "Low" ? "#00CF72" : risk === "High" ? "#F06565" : "#F5A83A";
  const riskLabel = risk === "Very Low" ? "Very unlikely" : risk === "Low" ? "Unlikely" : risk === "Medium" ? "Possible" : "Likely";
  return (
    <div style={{
      background: "rgba(0,207,114,0.03)", border: "0.5px solid rgba(0,207,114,0.12)",
      borderRadius: 12, padding: "14px 16px", marginTop: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#C4D4E8" }}>Would I Regret This?</div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: riskColor,
          background: `${riskColor}15`, borderRadius: 99, padding: "2px 10px",
        }}>
          {riskLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {factors.pro.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#5DDBA8" }}>
            <span style={{ flexShrink: 0 }}>✓</span><span>{stripEmoji(f)}</span>
          </div>
        ))}
        {factors.con.length > 0 && (
          <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#F5A83A", marginTop: 2 }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <span>Main risk: {stripEmoji(factors.con[0])}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionSummaryCard({ data, accent, onFindPrice }: { data: DecisionSummaryData; accent: string; onFindPrice?: () => void }) {
  const riskColor = (r: string) =>
    r === "Very Low" || r === "Low" ? "#00CF72" : r === "High" ? "#F06565" : "#F5A83A";

  const rows: { label: string; value: string; color?: string; accent?: boolean }[] = [
    { label: "Price",        value: data.price,                            accent: true },
    ...(data.targetPrice ? [{ label: "Target",       value: data.targetPrice, color: "#00CF72" }] : []),
    ...(data.buyNowIf    ? [{ label: "Buy now if",   value: data.buyNowIf,    color: "#5DDBA8" }] : []),
    ...(data.skipIf      ? [{ label: "Skip if",      value: data.skipIf,      color: "#F5A83A" }] : []),
    ...(data.buyBefore   ? [{ label: "Best timing",  value: data.buyBefore                      }] : []),
    ...(data.lifespan    ? [{ label: "Lifespan",     value: data.lifespan,    color: "#7B98B8" }] : []),
    ...(data.regretRisk  ? [{ label: "Regret risk",  value: data.regretRisk,  color: riskColor(data.regretRisk) }] : []),
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: `0.5px solid ${accent}22`,
      borderRadius: 12, padding: "14px 16px", marginTop: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Decision
        </div>
        {data.wait
          ? <span style={{ fontSize: 10, fontWeight: 700, color: "#F5A83A", background: "rgba(245,168,58,0.12)", borderRadius: 4, padding: "2px 8px" }}>WAIT</span>
          : <span style={{ fontSize: 10, fontWeight: 700, color: "#00CF72", background: "rgba(0,207,114,0.12)", borderRadius: 4, padding: "2px 8px" }}>BUY</span>
        }
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#EFF3FF", marginBottom: 12 }}>{data.buy}</div>
      <div style={{ marginBottom: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "7px 0",
            borderTop: i > 0 ? "0.5px solid rgba(255,255,255,0.05)" : undefined,
          }}>
            <span style={{ fontSize: 11, color: "#3D5571" }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: r.color ?? (r.accent ? "#EFF3FF" : "#8BA3C4"), textAlign: "right", maxWidth: "60%" }}>{stripEmoji(r.value)}</span>
          </div>
        ))}
      </div>
      {onFindPrice && (
        <button
          onClick={onFindPrice}
          style={{ width: "100%", background: `${accent}15`, border: `0.5px solid ${accent}30`, color: accent, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Buy →
        </button>
      )}
    </div>
  );
}

function ScriptBox({ children, accent }: { children: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "0.5px solid rgba(255,255,255,0.09)",
      borderLeft: `2px solid ${accent}`,
      borderRadius: "0 8px 8px 0",
      padding: "12px 14px", margin: "10px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: accent }}>
          Negotiation Script
        </span>
        <button
          onClick={copy}
          style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.1)", color: "#7B8FAF", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: "#E2E8F0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}
