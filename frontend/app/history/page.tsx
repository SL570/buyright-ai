"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BASE   = process.env.NEXT_PUBLIC_API_URL ?? "https://buyright-ai.onrender.com";
const ACCENT = "#00F5D4";

interface Session {
  id: number;
  title: string | null;
  product: string | null;
  category: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function categoryEmoji(cat: string | null): string {
  const c = (cat ?? "").toLowerCase();
  if (c.includes("tv") || c.includes("television")) return "📺";
  if (c.includes("laptop") || c.includes("notebook")) return "💻";
  if (c.includes("headphone") || c.includes("earbud")) return "🎧";
  if (c.includes("phone")) return "📱";
  if (c.includes("desk") || c.includes("monitor")) return "🖥";
  if (c.includes("camera")) return "📷";
  return "🛒";
}

function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "0.5px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(255,255,255,0.06)", flexShrink: 0, animation: "shimmer 1.4s ease-in-out infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 13, width: "55%", borderRadius: 6, background: "rgba(255,255,255,0.07)", animation: "shimmer 1.4s ease-in-out infinite", animationDelay: `${delay + 100}ms` }} />
        <div style={{ height: 10, width: "30%", borderRadius: 6, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.4s ease-in-out infinite", animationDelay: `${delay + 200}ms` }} />
      </div>
      <div style={{ width: 72, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.05)", flexShrink: 0, animation: "shimmer 1.4s ease-in-out infinite", animationDelay: `${delay + 150}ms` }} />
    </div>
  );
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  const token = (session as any)?.accessToken as string | undefined;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated" && token && !fetchedRef.current) {
      fetchedRef.current = true;
      load(token);
    }
  }, [status, token]);

  async function load(t: string) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE}/history`, {
        headers: { Authorization: `Bearer ${t}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id: number) {
    setDeleting(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`${BASE}/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setDeleting(null);
    }
    setDeleting(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#E2E8F0", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/procurement")} style={{ background: "none", border: "none", color: "#3D5571", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF" }}>Research History</span>
        </div>
        <button
          onClick={() => router.push("/procurement")}
          style={{ background: ACCENT, color: "#0B0F19", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          + New Research
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>

        {/* Memory banner */}
        {!loading && sessions.length >= 3 && (
          <div style={{
            background: `${ACCENT}08`, border: `0.5px solid ${ACCENT}25`,
            borderRadius: 12, padding: "14px 16px", marginBottom: 24,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🧠</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#EFF3FF", marginBottom: 3 }}>
                BuyRight remembers your research
              </div>
              <div style={{ fontSize: 12, color: "#4A6080", lineHeight: 1.6 }}>
                You've researched {sessions.length} products. Resume any conversation and the AI picks up exactly where you left off — no re-explaining needed.
              </div>
            </div>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonRow delay={0} />
            <SkeletonRow delay={80} />
            <SkeletonRow delay={160} />
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF", marginBottom: 8 }}>No research yet</div>
            <div style={{ fontSize: 13, color: "#3D5571", marginBottom: 24 }}>
              Every product you research is saved here so you can pick up exactly where you left off.
            </div>
            <button
              onClick={() => router.push("/procurement")}
              style={{ background: ACCENT, color: "#0B0F19", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Start Researching
            </button>
          </div>
        )}

        {/* Session list */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map(s => (
              <div
                key={s.id}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", transition: "border-color 0.15s",
                  opacity: deleting === s.id ? 0.4 : 1,
                }}
                onClick={() => router.push(`/procurement?session=${s.id}`)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
              >
                {/* Emoji */}
                <div style={{ fontSize: 28, flexShrink: 0, width: 44, textAlign: "center" }}>
                  {categoryEmoji(s.category)}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#EFF3FF", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.product ?? s.title ?? "Research session"}
                  </div>
                  <div style={{ fontSize: 11, color: "#3D5571" }}>
                    {s.message_count} messages · {timeAgo(s.updated_at)}
                    {s.category && <span style={{ marginLeft: 8, textTransform: "capitalize" }}>{s.category}</span>}
                  </div>
                </div>

                {/* Resume button */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: ACCENT,
                    background: `${ACCENT}12`, border: `0.5px solid ${ACCENT}30`,
                    borderRadius: 6, padding: "4px 10px",
                  }}>
                    Resume →
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                    disabled={deleting === s.id}
                    style={{ background: "none", border: "none", color: "#2D4060", fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
