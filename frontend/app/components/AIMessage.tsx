"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Product {
  name: string;
  price: string;
  badge: string;
  badgeType: "success" | "warning" | "neutral" | "danger";
  recommended: boolean;
  store: string;
  pros: string[];
  cons: string[];
  rejection_reason?: string;
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
  // Strip incomplete PRODUCT_GRID during streaming (no END_PRODUCT_GRID yet)
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

  // Strip NEXT_ACTIONS from rendered body (it's used by parent, not displayed)
  body = body.replace(/\nNEXT_ACTIONS:\s*\[[\s\S]*?\](\n|$)/, "\n").trim();
  body = body.replace(/^NEXT_ACTIONS:\s*\[[\s\S]*?\](\n|$)/, "").trim();

  return { products, verdict, body };
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

export function AIMessage({ content, onFollowUp, followups = [], accent = "#4D9EFF", journeyStages }: Props) {
  const { products, verdict, body } = parseContent(content);
  const vs = verdict ? V_STYLE[verdict.type] : null;

  return (
    <div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#00CF72", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
                    🏆 Buy This
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#EFF3FF" }}>{winner.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#EFF3FF", fontFamily: "monospace", marginTop: 2 }}>{winner.price}</div>
                </div>
                <a
                  href={storeSearchUrl(winner.store, winner.name)}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 700, color: "#0B0F19", background: "#00CF72", borderRadius: 8, padding: "9px 16px", textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Find Lowest Price →
                </a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {winner.pros.map((t, j) => (
                  <div key={j} style={{ fontSize: 12, color: "#C8D8F0", display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: "#00CF72", flexShrink: 0, lineHeight: 1.6 }}>✓</span>{t}
                  </div>
                ))}
              </div>
              {winner.cons.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.07)", fontSize: 12, color: "#F5A83A", display: "flex", gap: 6 }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>{winner.cons[0]}
                </div>
              )}
              <div style={{ fontSize: 11, color: "#2D4060", marginTop: 8 }}>{winner.store}</div>
            </div>

            {/* Why not the others */}
            {others.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#3D5571", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
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
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#4A6080", marginTop: 1 }}>{p.price}</div>
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

      {/* Markdown body */}
      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#E2E8F0" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p:          ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
            h1:         ({ children }) => <h1 style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF", margin: "14px 0 6px" }}>{children}</h1>,
            h2:         ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, color: "#EFF3FF", margin: "12px 0 5px" }}>{children}</h2>,
            h3:         ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: "#EFF3FF", margin: "10px 0 4px" }}>{children}</h3>,
            strong:     ({ children }) => <strong style={{ color: "#EFF3FF", fontWeight: 600 }}>{children}</strong>,
            ul:         ({ children }) => <ul style={{ paddingLeft: 18, margin: "6px 0" }}>{children}</ul>,
            ol:         ({ children }) => <ol style={{ paddingLeft: 18, margin: "6px 0" }}>{children}</ol>,
            li:         ({ children }) => <li style={{ margin: "3px 0" }}>{children}</li>,
            hr:         () => <hr style={{ border: "none", borderTop: "0.5px solid rgba(255,255,255,0.08)", margin: "12px 0" }} />,
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12, margin: "8px 0", color: "#8BA3C4" }}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div style={{ overflowX: "auto", margin: "10px 0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th style={{ textAlign: "left", padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7B8FAF" }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td style={{ padding: "8px 10px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", color: "#E2E8F0", verticalAlign: "top" }}>
                {children}
              </td>
            ),
            code({ className, children, ...rest }) {
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
          }}
        >
          {body}
        </ReactMarkdown>
      </div>

      {/* Journey progress tracker */}
      {journeyStages && journeyStages.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#2D4060", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 9 }}>
            Your Buying Journey
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {journeyStages.map((stage, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12 }}>
                <span style={{
                  width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                  background: stage.done ? "rgba(0,207,114,0.13)" : "rgba(255,255,255,0.03)",
                  border: stage.done ? "1px solid rgba(0,207,114,0.4)" : "1px solid rgba(255,255,255,0.09)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, color: stage.done ? "#00CF72" : "transparent",
                }}>
                  {stage.done ? "✓" : ""}
                </span>
                <span style={{ color: stage.done ? "#7B98B8" : "#2D4060" }}>{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
