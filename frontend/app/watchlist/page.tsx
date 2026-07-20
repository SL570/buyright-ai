"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://buyright-ai.onrender.com";
const ACCENT = "#4D9EFF";

interface WatchlistItem {
  id: number;
  name: string;
  price: number;
  store: string | null;
  category: string | null;
  score: number | null;
  source: string;
  purchased: boolean;
  purchased_at: string | null;
  regret_rating: number | null;
  target_price: number | null;
  last_checked: string | null;
  created_at: string;
}

type Filter = "all" | "watching" | "purchased";

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [ratingItem, setRatingItem] = useState<number | null>(null);

  const token = (session as any)?.accessToken as string | undefined;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated" && token) fetchItems();
  }, [status, token]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function markPurchased(id: number) {
    await fetch(`${BASE}/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purchased: true }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, purchased: true } : i));
    setRatingItem(id);
  }

  async function submitRating(id: number, rating: number) {
    await fetch(`${BASE}/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ regret_rating: rating }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, regret_rating: rating } : i));
    setRatingItem(null);
  }

  async function deleteItem(id: number) {
    await fetch(`${BASE}/wishlist/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = items.filter(i => {
    if (filter === "watching") return !i.purchased;
    if (filter === "purchased") return i.purchased;
    return true;
  });

  const aiItems = items.filter(i => i.source === "ai" && !i.purchased).length;
  const purchased = items.filter(i => i.purchased).length;
  const avgRating = items.filter(i => i.regret_rating).reduce((s, i) => s + (i.regret_rating ?? 0), 0) /
    (items.filter(i => i.regret_rating).length || 1);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#E2E8F0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/procurement")} style={{ background: "none", border: "none", color: "#3D5571", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF" }}>My Watchlist</span>
        </div>
        <button onClick={() => router.push("/procurement")} style={{ background: ACCENT, color: "#0B0F19", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + New Research
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>

        {/* Stats row */}
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Watching", value: aiItems, color: ACCENT },
              { label: "Purchased", value: purchased, color: "#00CF72" },
              { label: "Avg Satisfaction", value: purchased > 0 ? `${avgRating.toFixed(1)}/5` : "—", color: "#F5A83A" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#3D5571", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {items.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {(["all", "watching", "purchased"] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? `${ACCENT}18` : "none",
                border: filter === f ? `0.5px solid ${ACCENT}40` : "0.5px solid rgba(255,255,255,0.07)",
                color: filter === f ? ACCENT : "#3D5571",
                borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
              }}>
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#3D5571", fontSize: 14 }}>Loading your watchlist…</div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🛒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EFF3FF", marginBottom: 8 }}>Your watchlist is empty</div>
            <div style={{ fontSize: 13, color: "#3D5571", marginBottom: 24 }}>
              Get a product recommendation and click "Save to Watchlist" to track it here.
            </div>
            <button onClick={() => router.push("/procurement")} style={{ background: ACCENT, color: "#0B0F19", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Find Something to Buy
            </button>
          </div>
        )}

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              background: item.purchased ? "rgba(0,207,114,0.04)" : "rgba(255,255,255,0.025)",
              border: item.purchased ? "0.5px solid rgba(0,207,114,0.18)" : "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    {item.source === "ai" && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, background: `${ACCENT}12`, borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>AI PICK</span>
                    )}
                    {item.purchased && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#00CF72", background: "rgba(0,207,114,0.12)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.08em" }}>PURCHASED</span>
                    )}
                    {item.category && (
                      <span style={{ fontSize: 9, color: "#3D5571", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.category}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#EFF3FF", marginBottom: 2 }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#EFF3FF", fontFamily: "monospace" }}>${item.price.toFixed(0)}</span>
                    {item.store && <span style={{ fontSize: 11, color: "#3D5571" }}>{item.store}</span>}
                    {item.score != null && (
                      <span style={{ fontSize: 11, color: ACCENT }}>{item.score}/100</span>
                    )}
                  </div>
                  {item.target_price && (
                    <div style={{ fontSize: 11, color: "#F5A83A", marginTop: 3 }}>
                      Alert at ${item.target_price.toFixed(0)}
                    </div>
                  )}
                </div>

                {/* Right side actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  {item.regret_rating && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: 12, color: s <= item.regret_rating! ? "#F5A83A" : "#2D4060" }}>★</span>
                      ))}
                    </div>
                  )}
                  <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", color: "#2D4060", fontSize: 16, cursor: "pointer", padding: "2px 4px" }}>×</button>
                </div>
              </div>

              {/* Bottom actions */}
              {!item.purchased && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                  <button onClick={() => markPurchased(item.id)} style={{
                    background: "rgba(0,207,114,0.08)", border: "0.5px solid rgba(0,207,114,0.2)",
                    color: "#00CF72", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    ✓ I Bought This
                  </button>
                  <button onClick={() => router.push("/procurement")} style={{
                    background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)",
                    color: "#7B98B8", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Research more →
                  </button>
                </div>
              )}

              {/* Rating modal inline */}
              {ratingItem === item.id && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 12, color: "#8BA3C4", marginBottom: 8 }}>How do you feel about this purchase?</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {[
                      { v: 5, label: "Love it" },
                      { v: 4, label: "Good" },
                      { v: 3, label: "OK" },
                      { v: 2, label: "Meh" },
                      { v: 1, label: "Regret" },
                    ].map(({ v, label }) => (
                      <button key={v} onClick={() => submitRating(item.id, v)} style={{
                        background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
                        color: "#8BA3C4", borderRadius: 6, padding: "5px 10px", fontSize: 11,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {label}
                      </button>
                    ))}
                    <button onClick={() => setRatingItem(null)} style={{ background: "none", border: "none", color: "#2D4060", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>skip</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
