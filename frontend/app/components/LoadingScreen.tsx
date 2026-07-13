"use client";

import { useEffect, useRef } from "react";

export default function LoadingScreen({ message = "Connecting to AI engine..." }: { message?: string }) {
  const bgRef   = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bgCanvas   = bgRef.current!;
    const ringCanvas = ringRef.current!;
    const bgCtx = bgCanvas.getContext("2d")!;
    const rc    = ringCanvas.getContext("2d")!;
    let W = 0, H = 0, t = 0, raf: number;

    // particles
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    function resetP(p: typeof particles[0]) {
      p.x = Math.random() * W; p.y = Math.random() * H;
      p.r = Math.random() * 1.4 + 0.3;
      p.vx = (Math.random() - 0.5) * 0.5; p.vy = (Math.random() - 0.5) * 0.5;
      p.alpha = Math.random() * 0.45 + 0.08;
    }
    function resize() {
      W = bgCanvas.width  = window.innerWidth;
      H = bgCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 100; i++) {
      const p = { x: 0, y: 0, r: 0, vx: 0, vy: 0, alpha: 0 };
      resetP(p); particles.push(p);
    }

    const CX = 60, CY = 60, R = 46;
    const orbitDots = [
      { phase: 0,             r: R,       size: 3.5, speed: 3.2 },
      { phase: Math.PI * 0.7, r: R * 0.72, size: 2.5, speed: 4.5 },
      { phase: Math.PI * 1.4, r: R * 0.5,  size: 2,   speed: 6.0 },
      { phase: Math.PI * 0.3, r: R * 0.85, size: 1.8, speed: 2.4 },
    ];

    function drawRing(t: number) {
      rc.clearRect(0, 0, 120, 120);
      const grd = rc.createRadialGradient(CX, CY, R - 2, CX, CY, R + 8);
      grd.addColorStop(0, "rgba(0,245,212,0.18)"); grd.addColorStop(1, "rgba(0,245,212,0)");
      rc.beginPath(); rc.arc(CX, CY, R + 4, 0, Math.PI * 2); rc.fillStyle = grd; rc.fill();
      rc.beginPath(); rc.arc(CX, CY, R, 0, Math.PI * 2); rc.strokeStyle = "rgba(0,245,212,0.1)"; rc.lineWidth = 1; rc.stroke();
      rc.beginPath(); rc.arc(CX, CY, R * 0.72, 0, Math.PI * 2); rc.strokeStyle = "rgba(0,245,212,0.06)"; rc.lineWidth = 1; rc.stroke();
      const sweep = t * 4.5;
      for (let i = 0; i < 50; i++) {
        const a = sweep - (i / 50) * Math.PI * 0.65;
        rc.beginPath(); rc.moveTo(CX, CY); rc.arc(CX, CY, R, a, a + 0.05); rc.closePath();
        rc.fillStyle = `rgba(0,245,212,${(1 - i / 50) * 0.22})`; rc.fill();
      }
      rc.beginPath(); rc.moveTo(CX, CY);
      rc.lineTo(CX + Math.cos(sweep) * R, CY + Math.sin(sweep) * R);
      rc.strokeStyle = "rgba(0,245,212,0.85)"; rc.lineWidth = 1.5; rc.stroke();
      const cg = rc.createRadialGradient(CX, CY, 0, CX, CY, 10);
      cg.addColorStop(0, "rgba(0,245,212,1)"); cg.addColorStop(1, "rgba(0,245,212,0)");
      rc.beginPath(); rc.arc(CX, CY, 10, 0, Math.PI * 2); rc.fillStyle = cg; rc.fill();
      rc.beginPath(); rc.arc(CX, CY, 3, 0, Math.PI * 2); rc.fillStyle = "#00F5D4"; rc.fill();
      orbitDots.forEach(d => {
        const a = t * d.speed + d.phase;
        const x = CX + Math.cos(a) * d.r, y = CY + Math.sin(a) * d.r;
        const dg = rc.createRadialGradient(x, y, 0, x, y, d.size * 2.5);
        dg.addColorStop(0, "rgba(0,245,212,0.6)"); dg.addColorStop(1, "rgba(0,245,212,0)");
        rc.beginPath(); rc.arc(x, y, d.size * 2.5, 0, Math.PI * 2); rc.fillStyle = dg; rc.fill();
        rc.beginPath(); rc.arc(x, y, d.size, 0, Math.PI * 2); rc.fillStyle = "#00F5D4"; rc.fill();
      });
    }

    function loop() {
      t += 0.022;
      bgCtx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) resetP(p);
        bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(0,245,212,${p.alpha})`; bgCtx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 75) {
            bgCtx.beginPath(); bgCtx.moveTo(particles[i].x, particles[i].y);
            bgCtx.lineTo(particles[j].x, particles[j].y);
            bgCtx.strokeStyle = `rgba(0,245,212,${0.07 * (1 - dist / 75)})`; bgCtx.lineWidth = 0.5; bgCtx.stroke();
          }
        }
      }
      drawRing(t);
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <main style={{ height: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", overflow: "hidden", position: "relative" }}>
      <canvas ref={bgRef} style={{ position: "absolute", inset: 0, opacity: 0.7 }} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ position: "relative", width: 120, height: 120 }}>
          <canvas ref={ringRef} width={120} height={120} style={{ position: "absolute", inset: 0 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.5px" }}>
            BuyRight <span style={{ color: "#00F5D4" }}>AI</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 300, color: "#475569", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            Shop smarter. Pay less.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00F5D4", animation: "pulse-dot 0.7s ease-in-out infinite" }} />
          <div style={{ fontSize: 12, color: "#334155", letterSpacing: "0.3px" }}>{message}</div>
        </div>
      </div>
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.2;transform:scale(0.5)} }`}</style>
    </main>
  );
}
