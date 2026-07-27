"use client";

import { useEffect, useRef } from "react";

interface SimNode {
  id: string;
  label: string;
  color: string;
  size: number;
  count: number | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
}

interface Edge {
  source: string;
  target: string;
}

const NODE_DATA: Omit<SimNode, "x" | "y" | "vx" | "vy">[] = [
  { id: "center",    label: "BuyRight AI",      color: "#00F5D4", size: 28, count: null,  fixed: true  },
  { id: "elec",      label: "Electronics",       color: "#3B82F6", size: 18, count: 24,   fixed: false },
  { id: "tvs",       label: "TVs & Displays",    color: "#8B5CF6", size: 16, count: 18,   fixed: false },
  { id: "laptops",   label: "Laptops",           color: "#10B981", size: 18, count: 22,   fixed: false },
  { id: "phones",    label: "Smartphones",       color: "#EC4899", size: 16, count: 19,   fixed: false },
  { id: "audio",     label: "Audio",             color: "#F59E0B", size: 15, count: 16,   fixed: false },
  { id: "gaming",    label: "Gaming",            color: "#EF4444", size: 17, count: 21,   fixed: false },
  { id: "smarthome", label: "Smart Home",        color: "#06B6D4", size: 14, count: 14,   fixed: false },
  { id: "apps",      label: "Appliances",        color: "#F97316", size: 14, count: 12,   fixed: false },
  { id: "fashion",   label: "Fashion",           color: "#D946EF", size: 12, count: 8,    fixed: false },
  { id: "sports",    label: "Sports & Outdoors", color: "#84CC16", size: 13, count: 9,    fixed: false },
  { id: "deals",     label: "Group Deals",       color: "#6366F1", size: 16, count: 32,   fixed: false },
  { id: "price",     label: "Price Tracking",    color: "#14B8A6", size: 15, count: 89,   fixed: false },
  { id: "amazon",    label: "Amazon",            color: "#FF9900", size: 12, count: null,  fixed: false },
  { id: "bestbuy",   label: "Best Buy",          color: "#0073E6", size: 12, count: null,  fixed: false },
  { id: "walmart",   label: "Walmart",           color: "#FFC220", size: 11, count: null,  fixed: false },
  { id: "target",    label: "Target",            color: "#CC0000", size: 11, count: null,  fixed: false },
  { id: "costco",    label: "Costco",            color: "#E31837", size: 10, count: null,  fixed: false },
];

const EDGES: Edge[] = [
  { source: "center", target: "elec"      },
  { source: "center", target: "tvs"       },
  { source: "center", target: "laptops"   },
  { source: "center", target: "phones"    },
  { source: "center", target: "audio"     },
  { source: "center", target: "gaming"    },
  { source: "center", target: "smarthome" },
  { source: "center", target: "apps"      },
  { source: "center", target: "fashion"   },
  { source: "center", target: "sports"    },
  { source: "center", target: "deals"     },
  { source: "center", target: "price"     },
  { source: "center", target: "amazon"    },
  { source: "center", target: "bestbuy"   },
  { source: "center", target: "walmart"   },
  { source: "center", target: "target"    },
  { source: "center", target: "costco"    },
  { source: "elec",   target: "laptops"   },
  { source: "elec",   target: "phones"    },
  { source: "elec",   target: "audio"     },
  { source: "gaming", target: "tvs"       },
  { source: "gaming", target: "elec"      },
  { source: "smarthome", target: "apps"   },
  { source: "price",  target: "amazon"    },
  { source: "price",  target: "bestbuy"   },
  { source: "deals",  target: "amazon"    },
  { source: "deals",  target: "walmart"   },
  { source: "laptops", target: "bestbuy"  },
  { source: "tvs",    target: "costco"    },
];

const LEGEND = [
  { label: "Electronics",    color: "#3B82F6", count: 24  },
  { label: "Laptops",        color: "#10B981", count: 22  },
  { label: "Gaming",         color: "#EF4444", count: 21  },
  { label: "Smartphones",    color: "#EC4899", count: 19  },
  { label: "TVs & Displays", color: "#8B5CF6", count: 18  },
  { label: "Audio",          color: "#F59E0B", count: 16  },
  { label: "Smart Home",     color: "#06B6D4", count: 14  },
  { label: "Appliances",     color: "#F97316", count: 12  },
  { label: "Sports",         color: "#84CC16", count: 9   },
  { label: "Fashion",        color: "#D946EF", count: 8   },
  { label: "Group Deals",    color: "#6366F1", count: 32  },
  { label: "Price Tracking", color: "#14B8A6", count: 89  },
];

const W = 900;
const H = 480;
const CX = W / 2;
const CY = H / 2;

export default function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef  = useRef<SimNode[]>([]);
  const tfRef     = useRef({ x: 0, y: 0, scale: 1 });
  const hoverRef  = useRef<string | null>(null);
  const dragRef   = useRef<{ nodeId: string | null; pan: { x: number; y: number } | null }>({ nodeId: null, pan: null });
  const animRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // Init nodes spread in a circle
    const satellites = NODE_DATA.filter(n => !n.fixed);
    const step = (2 * Math.PI) / satellites.length;
    let si = 0;
    nodesRef.current = NODE_DATA.map(n => {
      if (n.fixed) return { ...n, x: CX, y: CY, vx: 0, vy: 0 };
      const angle = si++ * step;
      const r = 140 + Math.random() * 40;
      return { ...n, x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle), vx: 0, vy: 0 };
    });

    // ── Force simulation ────────────────────────────────────────────────
    function simulate() {
      const nodes = nodesRef.current;
      const REPULSION = 2800;
      const SPRING_K  = 0.04;
      const REST_LEN  = 170;
      const GRAVITY   = 0.008;
      const DAMP      = 0.88;
      const MAX_V     = 6;

      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].fixed) continue;
        // Gravity toward canvas center
        nodes[i].vx += (CX - nodes[i].x) * GRAVITY;
        nodes[i].vy += (CY - nodes[i].y) * GRAVITY;
        // Repulsion
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d2 = dx * dx + dy * dy || 1;
          const d  = Math.sqrt(d2);
          const f  = REPULSION / d2;
          nodes[i].vx += (dx / d) * f;
          nodes[i].vy += (dy / d) * f;
        }
      }

      // Spring forces
      for (const e of EDGES) {
        const s = nodes.find(n => n.id === e.source);
        const t = nodes.find(n => n.id === e.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const f  = (d - REST_LEN) * SPRING_K;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        if (!s.fixed) { s.vx += fx; s.vy += fy; }
        if (!t.fixed) { t.vx -= fx; t.vy -= fy; }
      }

      // Integrate
      for (const n of nodes) {
        if (n.fixed) continue;
        n.vx *= DAMP;
        n.vy *= DAMP;
        n.vx = Math.max(-MAX_V, Math.min(MAX_V, n.vx));
        n.vy = Math.max(-MAX_V, Math.min(MAX_V, n.vy));
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    // ── Draw ────────────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const { x: tx, y: ty, scale } = tfRef.current;
      const nodes = nodesRef.current;
      const hov   = hoverRef.current;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Edges
      for (const e of EDGES) {
        const s = nodes.find(n => n.id === e.source)!;
        const t = nodes.find(n => n.id === e.target)!;
        const hi = hov && (e.source === hov || e.target === hov);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = hi ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)";
        ctx.lineWidth   = hi ? 1.5 : 0.7;
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        const isHov = n.id === hov;
        const isConn = hov ? EDGES.some(
          e => (e.source === hov && e.target === n.id) ||
               (e.target === hov && e.source === n.id)
        ) : false;
        const dim = !!hov && !isHov && !isConn && !n.fixed;
        const r   = isHov ? n.size * 1.25 : n.size;

        ctx.globalAlpha = dim ? 0.2 : 1;

        // Glow
        if (isHov || n.fixed) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur  = n.fixed ? 18 : 24;
        } else {
          ctx.shadowBlur = 0;
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Center text
        if (n.fixed) {
          ctx.globalAlpha = 1;
          ctx.fillStyle   = "#0B0F19";
          ctx.font        = "bold 10px system-ui,sans-serif";
          ctx.textAlign   = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("BR AI", n.x, n.y);
        }

        // Label
        if (!n.fixed) {
          ctx.globalAlpha  = dim ? 0.2 : 1;
          ctx.font         = `${isHov ? 13 : 11}px system-ui,sans-serif`;
          ctx.textAlign    = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle    = isHov ? "#F1F5F9" : "#94A3B8";
          ctx.fillText(n.label, n.x + r + 7, n.y);
        }

        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function loop() {
      simulate();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    // ── Mouse helpers ───────────────────────────────────────────────────
    function toWorld(mx: number, my: number) {
      const { x: tx, y: ty, scale } = tfRef.current;
      return { wx: (mx - tx) / scale, wy: (my - ty) / scale };
    }

    function hitNode(mx: number, my: number) {
      const { wx, wy } = toWorld(mx, my);
      for (const n of nodesRef.current) {
        const dx = wx - n.x, dy = wy - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= n.size + 6) return n.id;
      }
      return null;
    }

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top)  * (H / rect.height);

      if (dragRef.current.nodeId) {
        const { wx, wy } = toWorld(mx, my);
        const n = nodesRef.current.find(n => n.id === dragRef.current.nodeId);
        if (n && !n.fixed) { n.x = wx; n.y = wy; n.vx = 0; n.vy = 0; }
      } else if (dragRef.current.pan) {
        const dx = mx - dragRef.current.pan.x;
        const dy = my - dragRef.current.pan.y;
        tfRef.current.x += dx * (rect.width / W);
        tfRef.current.y += dy * (rect.height / H);
        dragRef.current.pan = { x: mx, y: my };
      } else {
        hoverRef.current = hitNode(mx, my);
        canvas.style.cursor = hoverRef.current ? "pointer" : "grab";
      }
    }

    function onDown(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top)  * (H / rect.height);
      const nid = hitNode(mx, my);
      if (nid) {
        dragRef.current.nodeId = nid;
        canvas.style.cursor = "grabbing";
      } else {
        dragRef.current.pan = { x: mx, y: my };
        canvas.style.cursor = "grabbing";
      }
    }

    function onUp() {
      dragRef.current.nodeId = null;
      dragRef.current.pan    = null;
      canvas.style.cursor = "grab";
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect  = canvas.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const { x: tx, y: ty, scale } = tfRef.current;
      const ns = Math.max(0.4, Math.min(2.5, scale * delta));
      tfRef.current.x = mx - (mx - tx) * (ns / scale);
      tfRef.current.y = my - (my - ty) * (ns / scale);
      tfRef.current.scale = ns;
    }

    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("mouseleave", () => { hoverRef.current = null; onUp(); });
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mousedown",  onDown);
      canvas.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("wheel",      onWheel);
    };
  }, []);

  return (
    <div>
      <div style={{ position: "relative", background: "#080C14", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", display: "block", cursor: "grab" }}
        />
        <p style={{ position: "absolute", bottom: 14, right: 16, color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>
          Drag nodes · Scroll to zoom · Hover to explore
        </p>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 28, padding: "20px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
        <p style={{ color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 16px" }}>
          Knowledge by category
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px" }}>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
              <span style={{ color: "#94A3B8", fontSize: 13 }}>{l.label}</span>
              <span style={{ color: "#475569", fontSize: 13 }}>{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
