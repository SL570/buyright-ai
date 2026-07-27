"use client";
import { useEffect, useRef } from "react";

const W = 900, H = 500;

interface NNode { id: string; label: string; x: number; y: number; r: number; }
interface NEdge { s: string; t: string; }
interface Pulse  { ei: number; t: number; speed: number; }

// Organic scatter — category cluster (left), core (center), retailer cluster (right)
const NODES: NNode[] = [
  { id: "center",    label: "BuyRight AI",    x: 450, y: 250, r: 13 },
  // Core signals (center-left)
  { id: "price",     label: "Price Tracking", x: 345, y: 168, r: 9  },
  { id: "deals",     label: "Group Deals",    x: 358, y: 334, r: 8  },
  // Category cluster (left)
  { id: "elec",      label: "Electronics",    x: 256, y: 152, r: 8  },
  { id: "laptops",   label: "Laptops",        x: 194, y: 82,  r: 7  },
  { id: "phones",    label: "Smartphones",    x: 146, y: 210, r: 7  },
  { id: "gaming",    label: "Gaming",         x: 190, y: 318, r: 7  },
  { id: "tvs",       label: "TVs & Displays", x: 280, y: 390, r: 6  },
  { id: "audio",     label: "Audio",          x: 108, y: 316, r: 6  },
  { id: "smarthome", label: "Smart Home",     x: 90,  y: 196, r: 6  },
  { id: "apps",      label: "Appliances",     x: 156, y: 426, r: 6  },
  { id: "fashion",   label: "Fashion",        x: 290, y: 448, r: 5  },
  { id: "sports",    label: "Sports",         x: 386, y: 428, r: 5  },
  // Retailer cluster (right)
  { id: "amazon",    label: "Amazon",         x: 554, y: 152, r: 6  },
  { id: "bestbuy",   label: "Best Buy",       x: 648, y: 200, r: 6  },
  { id: "walmart",   label: "Walmart",        x: 614, y: 316, r: 5  },
  { id: "target",    label: "Target",         x: 540, y: 382, r: 5  },
  { id: "costco",    label: "Costco",         x: 710, y: 278, r: 5  },
];

// Dense connections — always visible, form the neural web
const EDGES: NEdge[] = [
  { s: "center", t: "price"     }, { s: "center", t: "deals"     },
  { s: "center", t: "elec"      }, { s: "center", t: "laptops"   },
  { s: "center", t: "amazon"    }, { s: "center", t: "bestbuy"   },
  { s: "center", t: "phones"    }, { s: "center", t: "walmart"   },
  { s: "price",  t: "laptops"   }, { s: "price",  t: "phones"    },
  { s: "price",  t: "amazon"    }, { s: "price",  t: "bestbuy"   },
  { s: "price",  t: "elec"      }, { s: "price",  t: "tvs"       },
  { s: "deals",  t: "amazon"    }, { s: "deals",  t: "walmart"   },
  { s: "deals",  t: "target"    }, { s: "deals",  t: "tvs"       },
  { s: "elec",   t: "laptops"   }, { s: "elec",   t: "phones"    },
  { s: "elec",   t: "gaming"    }, { s: "elec",   t: "tvs"       },
  { s: "elec",   t: "audio"     }, { s: "elec",   t: "smarthome" },
  { s: "laptops",t: "bestbuy"   }, { s: "laptops",t: "amazon"    },
  { s: "laptops",t: "gaming"    }, { s: "phones", t: "audio"     },
  { s: "phones", t: "amazon"    }, { s: "phones", t: "target"    },
  { s: "gaming", t: "tvs"       }, { s: "gaming", t: "bestbuy"   },
  { s: "tvs",    t: "costco"    }, { s: "tvs",    t: "target"    },
  { s: "audio",  t: "smarthome" }, { s: "audio",  t: "apps"      },
  { s: "smarthome", t: "apps"   }, { s: "smarthome", t: "walmart" },
  { s: "apps",   t: "walmart"   }, { s: "fashion",t: "sports"    },
  { s: "fashion",t: "target"    }, { s: "sports", t: "amazon"    },
  { s: "bestbuy",t: "costco"    }, { s: "walmart",t: "costco"    },
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
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const nodeMap = new Map(NODES.map(n => [n.id, n]));

    // Pre-compute bezier control points — offset perpendicular to each edge
    // gives axon-like organic curves
    const ctrlPts = EDGES.map((e, i) => {
      const sn = nodeMap.get(e.s)!;
      const tn = nodeMap.get(e.t)!;
      const dx = tn.x - sn.x, dy = tn.y - sn.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = Math.sin(i * 2.619 + 1.2) * 40; // deterministic, varies per edge
      return {
        x: (sn.x + tn.x) / 2 + (-dy / len) * offset,
        y: (sn.y + tn.y) / 2 + ( dx / len) * offset,
      };
    });

    // Point along a quadratic bezier at parameter t
    function bezierAt(ei: number, t: number) {
      const sn = nodeMap.get(EDGES[ei].s)!;
      const tn = nodeMap.get(EDGES[ei].t)!;
      const cp = ctrlPts[ei];
      const mt = 1 - t;
      return {
        x: mt * mt * sn.x + 2 * mt * t * cp.x + t * t * tn.x,
        y: mt * mt * sn.y + 2 * mt * t * cp.y + t * t * tn.y,
      };
    }

    // Action potential pulses
    const pulses: Pulse[] = [];
    let nextPulseAt = 30;

    function draw(frame: number) {
      // Spawn new pulse
      if (frame >= nextPulseAt) {
        pulses.push({
          ei:    Math.floor(Math.random() * EDGES.length),
          t:     0,
          speed: 0.007 + Math.random() * 0.005,
        });
        nextPulseAt = frame + 38 + Math.floor(Math.random() * 55);
      }

      ctx.clearRect(0, 0, W, H);

      // ── Background ──────────────────────────────────────────────────────
      ctx.fillStyle = "#060911";
      ctx.fillRect(0, 0, W, H);

      // Ambient tissue glow — off-center, very faint
      const ambient = ctx.createRadialGradient(W * 0.38, H * 0.44, 0, W * 0.38, H * 0.44, 320);
      ambient.addColorStop(0, "rgba(70, 110, 200, 0.04)");
      ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, W, H);

      // ── Axon / dendrite connections (always drawn) ───────────────────────
      for (let i = 0; i < EDGES.length; i++) {
        const sn = nodeMap.get(EDGES[i].s)!;
        const tn = nodeMap.get(EDGES[i].t)!;
        const cp = ctrlPts[i];
        ctx.beginPath();
        ctx.moveTo(sn.x, sn.y);
        ctx.quadraticCurveTo(cp.x, cp.y, tn.x, tn.y);
        ctx.strokeStyle = "rgba(150, 195, 255, 0.13)";
        ctx.lineWidth   = 0.55;
        ctx.stroke();
      }

      // ── Action potential pulses ─────────────────────────────────────────
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += pulses[i].speed;
        if (pulses[i].t >= 1) { pulses.splice(i, 1); continue; }
        const { x, y } = bezierAt(pulses[i].ei, pulses[i].t);
        ctx.save();
        ctx.shadowColor = "rgba(210, 235, 255, 1)";
        ctx.shadowBlur  = 14;
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "#E4F0FF";
        ctx.fill();
        ctx.restore();
      }

      // ── Soma (cell body) nodes ─────────────────────────────────────────
      for (const n of NODES) {
        const isCenter = n.id === "center";

        // Soma glow
        ctx.save();
        ctx.shadowColor = isCenter ? "rgba(130, 185, 255, 0.9)" : "rgba(200, 220, 255, 0.30)";
        ctx.shadowBlur  = isCenter ? 24 : 7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = isCenter ? "#9EC5FF" : "#FFFFFF";
        ctx.fill();
        ctx.restore();

        // Interior label for center node
        if (isCenter) {
          ctx.fillStyle    = "#06090F";
          ctx.font         = "bold 7px system-ui,sans-serif";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("BR AI", n.x, n.y);
        }

        // Satellite node labels — angled away from canvas center
        if (!isCenter) {
          const ax = Math.atan2(n.y - H / 2, n.x - W / 2);
          const lx = n.x + Math.cos(ax) * (n.r + 10);
          const ly = n.y + Math.sin(ax) * (n.r + 10);
          ctx.font         = "9.5px system-ui, -apple-system, sans-serif";
          ctx.textAlign    = Math.cos(ax) >= 0 ? "left" : "right";
          ctx.textBaseline = "middle";
          ctx.fillStyle    = "rgba(145, 175, 215, 0.52)";
          ctx.fillText(n.label, lx, ly);
        }
      }
    }

    function loop() {
      draw(frameRef.current++);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div>
      <div style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.04)",
      }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Signal category legend — IBM Carbon table style */}
      <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20 }}>
        <p style={{
          color: "#2A3D56",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.4px",
          margin: "0 0 14px",
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
              <span style={{ color: "#3A5270", fontSize: 12 }}>{l.label}</span>
              <span style={{ color: "#2A3D56", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
