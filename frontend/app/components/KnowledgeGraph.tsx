"use client";
import { useEffect, useRef } from "react";

const W = 1600, H = 720;
const CX = 775, CY = 360;

// Center pill
const CP = { w: 200, h: 82, r: 22 };
// Branch pill
const NP = { w: 170, h: 38, r: 19 };
// Icon badge radius (sits at the end of each pill)
const IB = 19;
// How far sub-items extend horizontally from the fan origin on node edge
const SUB_REACH = 236;
// Vertical spacing between sub-items
const SUB_STEP = 22;

interface MNode {
  label: string;
  icon:  string;
  x:     number;
  y:     number;
  color: string;
  side:  "left" | "right";
  items: string[];
}

// BuyRight AI Business Model Canvas
// Left nodes: sub-items to the left   Right nodes: sub-items to the right
const NODES: MNode[] = [
  {
    label: "Key Partners", icon: "♥", side: "left",
    x: 500, y: 80, color: "#EF5350",
    items: [
      "OpenAI / Anthropic (Claude)",
      "Serper search & pricing API",
      "Stripe (payment processing)",
      "SendGrid (email service)",
    ],
  },
  {
    label: "Key Activities", icon: "⚙", side: "left",
    x: 500, y: 220, color: "#FF7043",
    items: [
      "Real-time price monitoring",
      "AI verdict generation (buy/wait)",
      "Group deal coordination",
      "Post-purchase auto-monitoring",
    ],
  },
  {
    label: "Customer Segments", icon: "●", side: "left",
    x: 500, y: 360, color: "#AB47BC",
    items: [
      "Budget-conscious consumers",
      "Frequent online shoppers",
      "Group buying coalitions",
      "SMB procurement teams",
    ],
  },
  {
    label: "Key Resources", icon: "▦", side: "left",
    x: 500, y: 500, color: "#26C6DA",
    items: [
      "AI models & pricing algorithms",
      "80+ retailer price database",
      "Chrome browser extension",
      "User & group buying network",
    ],
  },
  {
    label: "Cost Structure", icon: "↑", side: "left",
    x: 500, y: 640, color: "#26A69A",
    items: [
      "AI API & compute costs",
      "Retailer data & access fees",
      "Engineering & infrastructure",
      "Marketing & customer growth",
    ],
  },
  {
    label: "Value Propositions", icon: "◆", side: "right",
    x: 1062, y: 118, color: "#7E57C2",
    items: [
      "Never overpay on any purchase",
      "Know exactly when to buy or wait",
      "Negotiate deals automatically",
      "Wholesale pricing via group buying",
    ],
  },
  {
    label: "Customer Relationships", icon: "⊙", side: "right",
    x: 1062, y: 272, color: "#42A5F5",
    items: [
      "AI chat advisor available 24/7",
      "Personalized price drop alerts",
      "Group deal invitations & updates",
      "Pro concierge for power users",
    ],
  },
  {
    label: "Channels", icon: "✦", side: "right",
    x: 1062, y: 432, color: "#00BCD4",
    items: [
      "Web application (buyright-ai)",
      "Chrome browser extension",
      "Email & push notifications",
      "API for enterprise clients",
    ],
  },
  {
    label: "Revenue Streams", icon: "$", side: "right",
    x: 1062, y: 580, color: "#FFA726",
    items: [
      "Free: unlimited AI queries",
      "Pro: $9 per month subscription",
      "Enterprise: custom licensing",
      "Affiliate & referral revenue",
    ],
  },
];

export default function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // Pre-compute sub-item positions
    const subPos = NODES.map(n => {
      const count = n.items.length;
      const span  = (count - 1) * SUB_STEP;
      const fanX  = n.side === "left" ? n.x - NP.w / 2 : n.x + NP.w / 2;
      const textX = n.side === "left" ? fanX - SUB_REACH : fanX + SUB_REACH;
      return n.items.map((text, i) => ({
        text,
        sy: n.y - span / 2 + i * SUB_STEP,
        textX,
        fanX,
      }));
    });

    function rrect(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function shade(hex: string, amt: number) {
      const n = parseInt(hex.slice(1), 16);
      const r = clamp(((n >> 16) & 255) + amt, 0, 255);
      const g = clamp(((n >> 8)  & 255) + amt, 0, 255);
      const b = clamp(( n        & 255) + amt, 0, 255);
      return `rgb(${r},${g},${b})`;
    }

    let prog = 0;
    const FRAMES = 96;

    function draw(p: number) {
      ctx.clearRect(0, 0, W, H);

      // ── White background ────────────────────────────────────────────────
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);

      // Staged reveal timings
      const t0 = ease(clamp01(p / 0.16));                    // center node
      const t1 = ease(clamp01((p - 0.10) / 0.38));           // center → main beziers
      const t2 = ease(clamp01((p - 0.30) / 0.28));           // main node pills
      const t3 = ease(clamp01((p - 0.48) / 0.28));           // fan lines
      const t4 = ease(clamp01((p - 0.62) / 0.38));           // sub-item text

      // ── Center → main node S-curves ─────────────────────────────────────
      for (const n of NODES) {
        const isLeft  = n.side === "left";
        const startX  = isLeft ? CX - CP.w / 2 : CX + CP.w / 2;
        const endX    = isLeft ? n.x + NP.w / 2 : n.x - NP.w / 2;
        const hspan   = Math.abs(endX - startX);

        // Gentle S-curve control points
        const cp1x = isLeft ? startX - hspan * 0.4 : startX + hspan * 0.4;
        const cp1y = CY + (n.y - CY) * 0.12;
        const cp2x = isLeft ? endX   + hspan * 0.2 : endX   - hspan * 0.2;
        const cp2y = n.y - (n.y - CY) * 0.12;

        const approxLen = Math.hypot(endX - startX, n.y - CY) * 1.08;

        ctx.save();
        ctx.setLineDash([approxLen * t1, approxLen + 2]);
        ctx.beginPath();
        ctx.moveTo(startX, CY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, n.y);
        ctx.strokeStyle = n.color;
        ctx.lineWidth   = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      // ── Fan lines: node edge → sub-items ────────────────────────────────
      ctx.save();
      for (let ni = 0; ni < NODES.length; ni++) {
        const n    = NODES[ni];
        const subs = subPos[ni];
        for (const s of subs) {
          const len = Math.hypot(s.textX - s.fanX, s.sy - n.y);
          ctx.setLineDash([len * t3, len + 2]);
          ctx.beginPath();
          ctx.moveTo(s.fanX, n.y);
          // Quadratic bezier for gentle fan curve
          const cpx = (s.fanX + s.textX) / 2;
          const cpy = (n.y + s.sy) / 2;
          ctx.quadraticCurveTo(cpx, cpy, s.textX, s.sy);
          ctx.strokeStyle = n.color;
          ctx.lineWidth   = 0.85;
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── Main node pills ──────────────────────────────────────────────────
      ctx.globalAlpha = t2;
      for (const n of NODES) {
        const isLeft = n.side === "left";
        const px = n.x - NP.w / 2, py = n.y - NP.h / 2;

        // Pill shadow
        ctx.shadowColor   = "rgba(0,0,0,0.18)";
        ctx.shadowBlur    = 9;
        ctx.shadowOffsetY = 3;

        // Pill fill
        rrect(px, py, NP.w, NP.h, NP.r);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Icon badge circle (darker shade, at the far end of pill)
        const badgeX = isLeft ? n.x + NP.w / 2 - IB : n.x - NP.w / 2 + IB;
        ctx.beginPath();
        ctx.arc(badgeX, n.y, IB, 0, Math.PI * 2);
        ctx.fillStyle = shade(n.color, -35);
        ctx.fill();

        // Icon character
        ctx.fillStyle    = "rgba(255,255,255,0.90)";
        ctx.font         = "bold 13px Arial, sans-serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.icon, badgeX, n.y + 1);

        // Node label (white, bold, in non-badge portion of pill)
        const labelCX = isLeft
          ? px + (NP.w - IB * 2) / 2          // left side: centered in left portion
          : px + IB * 2 + (NP.w - IB * 2) / 2; // right side: centered in right portion
        ctx.fillStyle    = "#FFFFFF";
        ctx.font         = "bold 10.5px 'Helvetica Neue', Arial, sans-serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, labelCX, n.y);
      }
      ctx.globalAlpha = 1;

      // ── Center node pill ─────────────────────────────────────────────────
      ctx.globalAlpha  = t0;
      ctx.shadowColor  = "rgba(92,107,192,0.3)";
      ctx.shadowBlur   = 16;
      ctx.shadowOffsetY = 4;
      rrect(CX - CP.w / 2, CY - CP.h / 2, CP.w, CP.h, CP.r);
      ctx.fillStyle = "#5C6BC0";
      ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

      // Center labels
      ctx.fillStyle    = "#FFFFFF";
      ctx.font         = "bold 17px 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BuyRight AI", CX, CY - 12);
      ctx.font      = "13px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.80)";
      ctx.fillText("Business Model", CX, CY + 13);
      ctx.globalAlpha = 1;

      // ── Sub-item text labels ─────────────────────────────────────────────
      ctx.globalAlpha = t4;
      for (let ni = 0; ni < NODES.length; ni++) {
        const n    = NODES[ni];
        const subs = subPos[ni];
        for (const s of subs) {
          ctx.font         = "10px 'Helvetica Neue', Arial, sans-serif";
          ctx.textAlign    = n.side === "left" ? "right" : "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle    = "#424242";
          const tx = n.side === "left" ? s.textX - 7 : s.textX + 7;
          ctx.fillText(s.text, tx, s.sy);
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      prog = Math.min(1, prog + 1 / FRAMES);
      draw(prog);
      if (prog < 1) animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 2px 32px rgba(0,0,0,0.22)",
      background: "#fff",
    }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function clamp01(v: number) { return clamp(v, 0, 1); }
function ease(t: number)    { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
