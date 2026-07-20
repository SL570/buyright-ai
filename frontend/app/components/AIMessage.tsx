"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Product {
  name: string;
  price: string;
  badge: string;
  badgeType: "success" | "warning" | "neutral" | "danger";
  recommended: boolean;
  score?: number;
  scoreLabel?: string;
  store: string;
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

function storeSearchUrl(store: string, name: string): string {
  const q = encodeURIComponent(name);
  const s = store.toLowerCase();
  if (s.includes("best buy")) return `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`;
  if (s.includes("costco"))   return `https://www.costco.com/CatalogSearch?keyword=${q}`;
  if (s.includes("walmart"))  return `https://www.walmart.com/search?q=${q}`;
  if (s.includes("target"))   return `https://www.target.com/s?searchTerm=${q}`;
  if (s.includes("apple"))    return `https://www.apple.com/shop/product/search?q=${q}`;
  return `https://www.amazon.com/s?k=${q}`;
}

function parseContent(raw: string) {
  let body = raw;
  let products: Product[] | null = null;
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
    body = body.replace(/PRODUCT_GRID:[\s\S]*/, "").trim();
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

  return { products, verdict, body, decisionSummary, whyPicked, bundleData };
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

interface Props {
  content: string;
  onFollowUp?: (q: string) => void;
  followups?: string[];
  accent?: string;
  journeyStages?: JourneyStage[];
}

function CollapsibleSection({ header, children, accent }: { header: string; children: React.ReactNode; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", marginTop: 2 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "9px 0", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#7B98B8" }}>{header}</span>
        <span style={{ fontSize: 10, color: open ? accent : "#3D5571", flexShrink: 0, marginLeft: 8 }}>
          {open ? "▲ Less" : "▼ More"}
        </span>
      </button>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
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
          🛒 Complete Setup
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
                {item.category}
              </span>
              <span style={{ fontSize: 12, color: "#8BA3C4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#EFF3FF", fontFamily: "monospace" }}>${item.price}</span>
              <a
                href={storeSearchUrl(item.store, item.name)}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: accent, textDecoration: "none" }}
              >
                {item.store} →
              </a>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "0.5px solid rgba(255,255,255,0.07)", paddingTop: 10,
      }}>
        <div>
          <span style={{ fontSize: 11, color: "#3D5571" }}>Total </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace" }}>${total}</span>
          {data.budget && data.budget > 0 && (
            <span style={{ fontSize: 11, color: "#3D5571" }}> of ${data.budget} budget</span>
          )}
        </div>
        <button
          onClick={() => data.items.forEach(item => window.open(storeSearchUrl(item.store, item.name), "_blank"))}
          style={{
            background: accent, color: "#0B0F19", border: "none",
            borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Buy Everything →
        </button>
      </div>
    </div>
  );
}

export function AIMessage({ content, onFollowUp, followups = [], accent = "#4D9EFF", journeyStages }: Props) {
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

  return (
    <div>
      {/* Decision Meter — score from winner keeps the number consistent with hero card */}
      {decisionSummary && (
        <DecisionMeter
          data={decisionSummary}
          score={(products?.find(p => p.recommended) ?? products?.[0])?.score}
        />
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

      {/* Bundle card — shown for setup/kit requests */}
      {bundleData && bundleData.items.length > 0 && (
        <BundleCard data={bundleData} accent={accent} />
      )}

      {/* Product cards — hero winner + why-not row */}
      {products && products.length > 0 && (() => {
        const winner = products.find(p => p.recommended) ?? products[0];
        const others = products.filter(p => !p.recommended);
        return (
          <div style={{ marginBottom: 14 }}>
            {/* Hero winner */}
            <div style={{
              background: "rgba(0,207,114,0.06)",
              border: "1.5px solid rgba(0,207,114,0.35)",
              borderRadius: 14, padding: "18px 20px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#00CF72", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                    🏆 Buy This
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#EFF3FF", lineHeight: 1.2 }}>{winner.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace", marginTop: 4, letterSpacing: "-0.02em" }}>{winner.price}</div>
                  {winner.scoreLabel && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#3A6050" }}>{winner.scoreLabel}</div>
                  )}
                </div>
                <a
                  href={storeSearchUrl(winner.store, winner.name)}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 700, color: "#0B0F19", background: "#00CF72", borderRadius: 8, padding: "9px 16px", textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Find Lowest Price →
                </a>
              </div>
              {winner.pros.length > 0 && (
                <div style={{ marginBottom: winner.cons.length > 0 ? 10 : 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#00CF72", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Perfect for</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {winner.pros.map((t, j) => (
                      <span key={j} style={{ background: "rgba(0,207,114,0.08)", border: "0.5px solid rgba(0,207,114,0.25)", borderRadius: 99, padding: "4px 11px", fontSize: 12, color: "#5DDBA8" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {winner.cons.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4A6080", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Not ideal for</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {winner.cons.map((t, j) => (
                      <span key={j} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 99, padding: "4px 11px", fontSize: 11, color: "#4A6080" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: "#2D4060", marginTop: 10 }}>{winner.store}</div>
            </div>

            {/* Why We Picked It */}
            {whyPicked && <WhyPickedCard data={whyPicked} accent={accent} winnerName={winner.name} />}

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
                        {reason && <div style={{ fontSize: 11, color: "#3D5571", marginTop: 6, lineHeight: 1.55 }}>{reason}</div>}
                        <a
                          href={storeSearchUrl(p.store, p.name)}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 10, color: "#3D5571", textDecoration: "none", marginTop: 8, display: "inline-block" }}
                        >
                          Compare →
                        </a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Markdown body — detail sections collapsed by default */}
      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#E2E8F0" }}>
        {splitBodyIntoSections(body).map((section, i) =>
          section.collapsible ? (
            <CollapsibleSection key={i} header={section.header} accent={accent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdC as any}>
                {section.content}
              </ReactMarkdown>
            </CollapsibleSection>
          ) : (
            <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={mdC as any}>
              {section.content}
            </ReactMarkdown>
          )
        )}
      </div>

      {/* Decision Summary card */}
      {decisionSummary && (
        <DecisionSummaryCard data={decisionSummary} accent={accent} onFindPrice={
          products ? () => window.open(storeSearchUrl(products.find(p => p.recommended)?.store ?? "amazon", decisionSummary.buy), "_blank") : undefined
        } />
      )}

      {/* Journey progress tracker */}
      {journeyStages && journeyStages.length > 0 && (() => {
        const allDone = journeyStages.every(s => s.done);
        if (allDone) return (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
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

function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20);
  return (
    <span style={{ fontSize: 12, letterSpacing: 1, color: "#F5A83A" }}>
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
    </span>
  );
}

function DecisionMeter({ data, score }: { data: DecisionSummaryData; score?: number }) {
  const raw = score ?? 80;
  const pct = raw / 100;
  const color = data.wait ? "#F5A83A" : "#00CF72";
  const verdict = data.verdict ?? (data.wait ? "WAIT" : "BUY");
  return (
    <div style={{ background: "rgba(0,0,0,0.18)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>Should You Buy?</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <MeterGauge pct={pct} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: "0.04em", lineHeight: 1 }}>{verdict}</div>
            <div style={{ fontSize: 11, color: "#4A6080" }}>BuyRight Score™ {raw}</div>
          </div>
          <div style={{ marginTop: 4 }}>
            <StarRating score={raw} />
          </div>
          {data.reason && (
            <div style={{ fontSize: 12, color: "#7B98B8", marginTop: 8, lineHeight: 1.6, fontStyle: "italic", borderLeft: `2px solid ${color}40`, paddingLeft: 10 }}>
              "{data.reason}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WhyPickedCard({ data, accent, winnerName }: { data: WhyPickedData; accent: string; winnerName?: string }) {
  const noun = data.category || "products";
  const steps = [
    { label: `Started with ${data.analyzed} ${noun}`, color: "#EFF3FF", dimmed: false },
    { label: `Eliminated ${data.eliminated}`, color: "#3D5571", dimmed: true },
    { label: `${data.finalists} finalists`, color: accent, dimmed: false },
    { label: winnerName ?? "Winner", color: "#00CF72", dimmed: false },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.015)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>Why We Picked It</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: step.dimmed ? "rgba(255,255,255,0.12)" : step.color,
                  }} />
                  {i < steps.length - 1 && <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)" }} />}
                </div>
                <span style={{ fontSize: i === steps.length - 1 ? 12 : 11, fontWeight: i === steps.length - 1 ? 700 : 400, color: step.color, paddingTop: i === 0 ? 0 : 4, paddingBottom: i === steps.length - 1 ? 0 : 4 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {data.checked.length > 0 && (
          <div style={{ minWidth: 110 }}>
            <div style={{ fontSize: 10, color: "#3D5571", marginBottom: 6 }}>We checked</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {data.checked.map((c, i) => (
                <span key={i} style={{ background: `${accent}10`, border: `0.5px solid ${accent}28`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: accent }}>{c}</span>
              ))}
            </div>
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
      <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
        Decision Cheat Sheet
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
            <span style={{ fontSize: 12, fontWeight: 600, color: r.color ?? (r.accent ? "#EFF3FF" : "#8BA3C4"), textAlign: "right", maxWidth: "60%" }}>{r.value}</span>
          </div>
        ))}
      </div>
      {onFindPrice && (
        <button
          onClick={onFindPrice}
          style={{ width: "100%", background: `${accent}15`, border: `0.5px solid ${accent}30`, color: accent, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Find Lowest Price →
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
          ✍ Negotiation Script
        </span>
        <button
          onClick={copy}
          style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.1)", color: "#7B8FAF", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.75, color: "#E2E8F0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}
