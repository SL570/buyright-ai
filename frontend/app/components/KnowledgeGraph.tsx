"use client";
import { useEffect, useRef } from "react";

const W = 900, H = 560, CX = 450, CY = 280;
const MAIN_R = 148; // center → main node radius
const SUB_R  = 68;  // main node → sub-item radius

interface Branch {
  label:    string;
  angleDeg: number;
  items:    string[];
}

// Business content — what a decision-maker needs to see in one glance
const BRANCHES: Branch[] = [
  {
    label:    "Price Intelligence",
    angleDeg: 0,
    items:    ["80+ retailers tracked", "Live price history", "Sale timing prediction"],
  },
  {
    label:    "AI Advisor",
    angleDeg: 72,
    items:    ["Buy · Wait · Negotiate", "Natural language", "Instant verdict"],
  },
  {
    label:    "Post-Purchase",
    angleDeg: 144,
    items:    ["Price drop auto-filing", "Return automation", "Delivery tracking"],
  },
  {
    label:    "Group Deals",
    angleDeg: 216,
    items:    ["Collective buying power", "Wholesale pricing", "Auto-negotiation"],
  },
  {
    label:    "Procurement",
    angleDeg: 288,
    items:    ["Research to purchase", "Budget-matched picks", "Full audit trail"],
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

    // Pre-compute all positions once
    const branches = BRANCHES.map(b => {
      const rad = (b.angleDeg * Math.PI) / 180;
      const mx  = CX + MAIN_R * Math.cos(rad);
      const my  = CY + MAIN_R * Math.sin(rad);
      const items = b.items.map((text, i) => {
        const sa = rad + ((i - 1) * 32 * Math.PI) / 180; // ±32° fan
        return { text, x: mx + SUB_R * Math.cos(sa), y: my + SUB_R * Math.sin(sa), sa };
      });
      return { ...b, rad, mx, my, items };
    });

    // Rounded rect helper
    function pill(x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    let prog = 0;
    const FRAMES = 96; // ~1.6 s draw-in at 60 fps

    function draw(p: number) {
      ctx.clearRect(0, 0, W, H);

      // ── Background ──────────────────────────────────────────────────────
      ctx.fillStyle = "#07090F";
      ctx.fillRect(0, 0, W, H);

      // Subtle ambient glow around center
      const aura = ctx.createRadialGradient(CX, CY, 0, CX, CY, 160);
      aura.addColorStop(0, "rgba(0, 245, 212, 0.032)");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      // ── Staged reveal timings ────────────────────────────────────────────
      const tCenter   = ease(clamp01((p - 0.00) / 0.18)); // 0.00 → 0.18
      const tMainConn = ease(clamp01((p - 0.12) / 0.36)); // 0.12 → 0.48
      const tMainPill = ease(clamp01((p - 0.32) / 0.26)); // 0.32 → 0.58
      const tSubConn  = ease(clamp01((p - 0.50) / 0.26)); // 0.50 → 0.76
      const tSubText  = ease(clamp01((p - 0.64) / 0.36)); // 0.64 → 1.00

      // ── Center → main node connections (bezier, grow with lineDash) ──────
      for (const b of branches) {
        const cp1x = CX + 54 * Math.cos(b.rad);
        const cp1y = CY + 54 * Math.sin(b.rad);
        const cp2x = b.mx - 44 * Math.cos(b.rad);
        const cp2y = b.my - 44 * Math.sin(b.rad);
        const len  = Math.hypot(b.mx - CX, b.my - CY) * 1.06;

        ctx.save();
        ctx.setLineDash([len * tMainConn, len + 2]);
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.mx, b.my);
        ctx.strokeStyle = "rgba(0, 245, 212, 0.28)";
        ctx.lineWidth   = 1.0;
        ctx.stroke();
        ctx.restore();
      }

      // ── Main node → sub-item connections ────────────────────────────────
      ctx.save();
      for (const b of branches) {
        for (const si of b.items) {
          const len = Math.hypot(si.x - b.mx, si.y - b.my);
          ctx.setLineDash([len * tSubConn, len + 2]);
          ctx.beginPath();
          ctx.moveTo(b.mx, b.my);
          ctx.lineTo(si.x, si.y);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
          ctx.lineWidth   = 0.55;
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── Center node pill ─────────────────────────────────────────────────
      ctx.globalAlpha = tCenter;
      ctx.shadowColor = "rgba(0, 245, 212, 0.55)";
      ctx.shadowBlur  = 24;
      pill(CX - 64, CY - 21, 128, 42, 21);
      ctx.fillStyle = "#00F5D4";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle    = "#060A0E";
      ctx.font         = "bold 13px system-ui,-apple-system,sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BuyRight AI", CX, CY);
      ctx.globalAlpha  = 1;

      // ── Main branch pills ────────────────────────────────────────────────
      ctx.globalAlpha = tMainPill;
      for (const b of branches) {
        const pw = 152, ph = 33, pr = 16;

        ctx.shadowColor = "rgba(0, 245, 212, 0.14)";
        ctx.shadowBlur  = 12;
        pill(b.mx - pw / 2, b.my - ph / 2, pw, ph, pr);
        ctx.fillStyle   = "rgba(0, 245, 212, 0.06)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 245, 212, 0.26)";
        ctx.lineWidth   = 0.8;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        ctx.fillStyle    = "rgba(0, 245, 212, 0.88)";
        ctx.font         = "11.5px system-ui,-apple-system,sans-serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.label, b.mx, b.my);
      }
      ctx.globalAlpha = 1;

      // ── Sub-item dots + labels ───────────────────────────────────────────
      ctx.globalAlpha = tSubText;
      for (const b of branches) {
        for (const si of b.items) {
          // Dot
          ctx.beginPath();
          ctx.arc(si.x, si.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 245, 212, 0.30)";
          ctx.fill();

          // Label outward from dot
          const lx = si.x + Math.cos(si.sa) * 11;
          const ly = si.y + Math.sin(si.sa) * 11;
          ctx.font         = "10px system-ui,-apple-system,sans-serif";
          ctx.textAlign    = Math.cos(si.sa) >= 0 ? "left" : "right";
          ctx.textBaseline = "middle";
          ctx.fillStyle    = "rgba(148, 175, 215, 0.70)";
          ctx.fillText(si.text, lx, ly);
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
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.05)",
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

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function ease(t: number)    { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; } // ease in-out quad
