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
  let verdict: { text: string; type: VerdictType } | null = null;

  // Extract PRODUCT_GRID block
  const pgRe = /PRODUCT_GRID:\n([\s\S]*?)\nEND_PRODUCT_GRID\n?/;
  const pgMatch = body.match(pgRe);
  if (pgMatch) {
    try {
      products = JSON.parse(pgMatch[1]);
      body = body.replace(pgMatch[0], "").trim();
    } catch { /* fallthrough */ }
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

  return { products, verdict, body };
}

interface Props {
  content: string;
  onFollowUp?: (q: string) => void;
  followups?: string[];
  accent?: string;
}

export function AIMessage({ content, onFollowUp, followups = [], accent = "#4D9EFF" }: Props) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const { products, verdict, body } = parseContent(content);

  function copy() {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

      {/* Product card grid */}
      {products && products.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(products.length, 3)}, 1fr)`,
          gap: 10, marginBottom: 14,
        }}>
          {products.map((p, i) => {
            const bs = BADGE_STYLE[p.badgeType] || BADGE_STYLE.neutral;
            const isSel = selected === i;
            return (
              <div
                key={i}
                onClick={() => setSelected(isSel ? null : i)}
                style={{
                  background: isSel ? "rgba(77,158,255,0.07)" : "rgba(255,255,255,0.03)",
                  border: p.recommended
                    ? "1.5px solid rgba(0,207,114,0.45)"
                    : isSel ? `1.5px solid ${accent}` : "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, padding: 14, cursor: "pointer",
                  display: "flex", flexDirection: "column", gap: 8,
                  transition: "border-color .15s",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: bs.bg, color: bs.color, alignSelf: "flex-start" }}>
                  {p.badge}
                </span>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#EFF3FF" }}>{p.name}</div>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#EFF3FF" }}>{p.price}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  {p.pros.map((t, j) => (
                    <div key={j} style={{ fontSize: 11, color: "#8BA3C4", display: "flex", gap: 5, alignItems: "flex-start" }}>
                      <span style={{ color: "#00CF72", flexShrink: 0, lineHeight: 1.6 }}>✓</span>{t}
                    </div>
                  ))}
                  {p.cons.map((t, j) => (
                    <div key={j} style={{ fontSize: 11, color: "#8BA3C4", display: "flex", gap: 5, alignItems: "flex-start" }}>
                      <span style={{ color: "#F5A83A", flexShrink: 0, lineHeight: 1.6 }}>⚠</span>{t}
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.07)", fontSize: 11, color: "#3D5571" }}>
                  {p.store}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Copy button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={copy}
          style={{ background: "none", border: "0.5px solid rgba(255,255,255,0.1)", color: "#3D5571", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>

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
