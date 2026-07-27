"use client";
import { useEffect, useRef } from "react";

const W = 900, H = 500, CX = 450, CY = 250;

interface NodeDef {
  id:        string;
  label:     string;
  ring:      0 | 1 | 2 | 3;
  baseAngle: number;
  size:      number;
}

const NODES: NodeDef[] = [
  { id: "center",    label: "BuyRight AI",    ring: 0, baseAngle: 0,     size: 16 },
  // Ring 1 — 3 nodes, 120° apart
  { id: "price",     label: "Price Tracking", ring: 1, baseAngle: 0,     size: 10 },
  { id: "deals",     label: "Group Deals",    ring: 1, baseAngle: 2.094, size: 9  },
  { id: "elec",      label: "Electronics",    ring: 1, baseAngle: 4.189, size: 9  },
  // Ring 2 — 9 nodes, 40° apart
  { id: "laptops",   label: "Laptops",        ring: 2, baseAngle: 0,     size: 8  },
  { id: "phones",    label: "Smartphones",    ring: 2, baseAngle: 0.698, size: 7  },
  { id: "gaming",    label: "Gaming",         ring: 2, baseAngle: 1.396, size: 7  },
  { id: "tvs",       label: "TVs & Displays", ring: 2, baseAngle: 2.094, size: 6  },
  { id: "audio",     label: "Audio",          ring: 2, baseAngle: 2.793, size: 6  },
  { id: "smarthome", label: "Smart Home",     ring: 2, baseAngle: 3.491, size: 6  },
  { id: "apps",      label: "Appliances",     ring: 2, baseAngle: 4.189, size: 6  },
  { id: "fashion",   label: "Fashion",        ring: 2, baseAngle: 4.887, size: 5  },
  { id: "sports",    label: "Sports",         ring: 2, baseAngle: 5.585, size: 5  },
  // Ring 3 — 5 nodes, 72° apart
  { id: "amazon",    label: "Amazon",         ring: 3, baseAngle: 0.3,   size: 4  },
  { id: "bestbuy",   label: "Best Buy",       ring: 3, baseAngle: 1.557, size: 4  },
  { id: "walmart",   label: "Walmart",        ring: 3, baseAngle: 2.813, size: 4  },
  { id: "target",    label: "Target",         ring: 3, baseAngle: 4.070, size: 3  },
  { id: "costco",    label: "Costco",         ring: 3, baseAngle: 5.327, size: 3  },
];

const RING_R   = [0, 78, 148, 210] as const;
const RING_SPD = [0, 0.00040, 0.00025, 0.00015] as const;

const EDGES: Array<{ source: string; target: string }> = [
  { source: "center",    target: "price"     },
  { source: "center",    target: "deals"     },
  { source: "center",    target: "elec"      },
  { source: "price",     target: "laptops"   },
  { source: "price",     target: "phones"    },
  { source: "price",     target: "amazon"    },
  { source: "price",     target: "bestbuy"   },
  { source: "deals",     target: "amazon"    },
  { source: "deals",     target: "walmart"   },
  { source: "elec",      target: "laptops"   },
  { source: "elec",      target: "gaming"    },
  { source: "elec",      target: "tvs"       },
  { source: "elec",      target: "phones"    },
  { source: "gaming",    target: "tvs"       },
  { source: "laptops",   target: "bestbuy"   },
  { source: "smarthome", target: "apps"      },
];

const LEGEND = [
  { label: "Price Tracking", count: 89 }, { label: "Group Deals",  count: 32 },
  { label: "Electronics",    count: 24 }, { label: "Laptops",      count: 22 },
  { label: "Gaming",         count: 21 }, { label: "Smartphones",  count: 19 },
  { label: "TVs & Displays", count: 18 }, { label: "Audio",        count: 16 },
  { label: "Smart Home",     count: 14 }, { label: "Appliances",   count: 12 },
  { label: "Sports",         count: 9  }, { label: "Fashion",      count: 8  },
];

export default function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef(0);
  const hoverRef  = useRef<string | null>(null);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    interface Star { x: number; y: number; r: number; a: number; phase: number; }
    const stars: Star[] = Array.from({ length: 220 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 0.85 + 0.1,
      a:     Math.random() * 0.18 + 0.04,
      phase: Math.random() * Math.PI * 2,
    }));

    function nodePos(n: NodeDef, f: number) {
      if (n.ring === 0) return { x: CX, y: CY };
      const a = n.baseAngle + f * RING_SPD[n.ring];
      return { x: CX + RING_R[n.ring] * Math.cos(a), y: CY + RING_R[n.ring] * Math.sin(a) };
    }

    function hitTest(clientX: number, clientY: number): string | null {
      const rect = canvas.getBoundingClientRect();
      const sx = (clientX - rect.left) * (W / rect.width);
      const sy = (clientY - rect.top)  * (H / rect.height);
      for (const n of NODES) {
        const p = nodePos(n, frameRef.current);
        const d2 = (sx - p.x) ** 2 + (sy - p.y) ** 2;
        if (d2 <= (n.size + 10) ** 2) return n.id;
      }
      return null;
    }

    function draw(frame: number) {
      ctx.clearRect(0, 0, W, H);

      // Deep space background
      ctx.fillStyle = "#06080F";
      ctx.fillRect(0, 0, W, H);

      // Galactic core glow — very faint, blue-white
      const coreGrd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 170);
      coreGrd.addColorStop(0,   "rgba(100, 150, 255, 0.055)");
      coreGrd.addColorStop(0.5, "rgba(100, 150, 255, 0.012)");
      coreGrd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrd;
      ctx.fillRect(0, 0, W, H);

      // Twinkling star field
      for (const s of stars) {
        const twinkle = 0.65 + 0.35 * Math.sin(s.phase + frame * 0.008);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(s.a * twinkle).toFixed(3)})`;
        ctx.fill();
      }

      // Orbit rings — dashed, barely there
      ctx.save();
      ctx.setLineDash([1, 12]);
      ctx.lineWidth    = 0.4;
      ctx.strokeStyle  = "rgba(255,255,255,0.04)";
      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath();
        ctx.arc(CX, CY, RING_R[ring], 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      const hov = hoverRef.current;
      const pos = new Map(NODES.map(n => [n.id, nodePos(n, frame)]));

      // Edges
      for (const e of EDGES) {
        const s = pos.get(e.source)!;
        const t = pos.get(e.target)!;
        const hi = !!hov && (e.source === hov || e.target === hov);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = hi ? "rgba(200,220,255,0.30)" : "rgba(200,220,255,0.048)";
        ctx.lineWidth   = hi ? 0.9 : 0.35;
        ctx.stroke();
      }

      // Center breathing pulse
      const breathe = 1 + Math.sin(frame * 0.016) * 0.10;

      // Nodes + labels
      for (const n of NODES) {
        const { x, y } = pos.get(n.id)!;
        const isCenter = n.ring === 0;
        const isHov    = n.id === hov;
        const isConn   = hov ? EDGES.some(
          e => (e.source === hov && e.target === n.id) ||
               (e.target === hov && e.source === n.id)
        ) : false;
        const dim = !!hov && !isHov && !isConn && !isCenter;
        const r   = (isCenter ? n.size * breathe : n.size) * (isHov ? 1.35 : 1);

        ctx.globalAlpha = dim ? 0.12 : 1;

        // Glow
        if (isCenter) {
          ctx.shadowColor = "#78A9FF";
          ctx.shadowBlur  = 26 * breathe;
        } else if (isHov) {
          ctx.shadowColor = "rgba(255,255,255,0.85)";
          ctx.shadowBlur  = 16;
        } else {
          ctx.shadowColor = "rgba(255,255,255,0.35)";
          ctx.shadowBlur  = isConn && !!hov ? 12 : 4;
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isCenter
          ? "#78A9FF"
          : (isConn && hov ? "#D8E8FF" : "#FFFFFF");
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;

        // Center label
        if (isCenter) {
          ctx.fillStyle    = "#06080F";
          ctx.font         = "bold 7px system-ui,sans-serif";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("BR AI", x, y);
        }

        // Satellite labels — angle outward from center
        if (!isCenter) {
          const angle  = Math.atan2(y - CY, x - CX);
          const lx     = x + Math.cos(angle) * (r + 12);
          const ly     = y + Math.sin(angle) * (r + 12);

          ctx.globalAlpha  = dim ? 0.12 : isHov ? 1 : 0.52;
          ctx.font         = `${isHov ? 11 : 9.5}px system-ui,sans-serif`;
          ctx.textAlign    = Math.cos(angle) < 0 ? "right" : "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle    = isHov ? "#E8F0FF" : "#7A94B8";
          ctx.fillText(n.label, lx, ly);
          ctx.globalAlpha  = 1;
        }
      }
    }

    function loop() {
      frameRef.current++;
      draw(frameRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    function onMove(e: MouseEvent) {
      const id = hitTest(e.clientX, e.clientY);
      hoverRef.current = id;
      canvas.style.cursor = id ? "crosshair" : "default";
    }
    function onLeave() {
      hoverRef.current = null;
      canvas.style.cursor = "default";
    }

    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div>
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        <p style={{
          position: "absolute", bottom: 14, right: 18,
          color: "rgba(255,255,255,0.13)", fontSize: 11,
          margin: 0, letterSpacing: "0.3px",
        }}>
          Hover to explore
        </p>
      </div>

      {/* Legend — IBM Carbon table style, no color noise */}
      <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
        <p style={{
          color: "#304060", fontSize: 10, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "1.4px", margin: "0 0 14px",
        }}>
          Signal categories
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: "9px 48px",
        }}>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#506080", fontSize: 12 }}>{l.label}</span>
              <span style={{ color: "#2E4060", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
