"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getWishlist, addWishlistItem, deleteWishlistItem, logout } from "../../lib/api";

interface PricePoint { price: number; checked_at: string; }
interface WishlistItem {
  id: number; name: string; url: string; price: number;
  target_price: number | null;
  ai_verdict: string | null; ai_reasoning: string | null; ai_checked_at: string | null;
  last_checked: string | null; created_at: string;
  history?: PricePoint[];
}

const VERDICT_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  buy:       { label: "Buy Now",   color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  wait:      { label: "Wait",      color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  negotiate: { label: "Negotiate", color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  research:  { label: "Research",  color: "#00F5D4", bg: "rgba(0,245,212,0.10)" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems]         = useState<WishlistItem[]>([]);
  const [name, setName]           = useState("");
  const [url, setUrl]             = useState("");
  const [price, setPrice]         = useState("");
  const [target, setTarget]       = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    getWishlist().then(setItems).catch(() => router.push("/login")).finally(() => setFetching(false));
  }, [router]);

  async function loadHistory(itemId: number) {
    if (expanded === itemId) { setExpanded(null); return; }
    try {
      const token = localStorage.getItem("token");
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res   = await fetch(`${BASE_URL}/wishlist/${itemId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const history: PricePoint[] = await res.json();
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, history } : i));
      setExpanded(itemId);
    } catch {}
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const item = await addWishlistItem(name, url, parseFloat(price), target ? parseFloat(target) : undefined);
      setItems(prev => [...prev, item]);
      setName(""); setUrl(""); setPrice(""); setTarget("");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteWishlistItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err: any) { setError(err.message); }
  }

  if (fetching) return <main style={S.page}><p style={{ color: "#94A3B8", fontFamily: "system-ui" }}>Loading...</p></main>;

  return (
    <main style={S.page}>
      <div style={S.container}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></h1>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/group-deals" style={S.navLink}>Group Deals</Link>
            <button onClick={() => { logout(); router.push("/login"); }} style={S.ghostBtn}>Sign out</button>
          </div>
        </div>

        {/* Add item */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Track a new item</h2>
          <p style={S.cardSub}>Supported: Amazon · Walmart · Best Buy · Target</p>
          <form onSubmit={handleAdd} style={S.form}>
            <div style={S.row}>
              <input type="text"   placeholder="Product name"   value={name}   onChange={e => setName(e.target.value)}   required style={{ ...S.input, flex: 1 }} />
              <input type="number" placeholder="Current price"  value={price}  onChange={e => setPrice(e.target.value)}  required min="0.01" max="10000" step="0.01" style={{ ...S.input, width: 140 }} />
              <input type="number" placeholder="Alert me under" value={target} onChange={e => setTarget(e.target.value)}         min="0.01" max="10000" step="0.01" style={{ ...S.input, width: 140 }} />
            </div>
            <input type="url" placeholder="Product URL (amazon.com, walmart.com, bestbuy.com, target.com)" value={url} onChange={e => setUrl(e.target.value)} required style={S.input} />
            {error && <p style={S.error}>{error}</p>}
            <button type="submit" disabled={loading} style={S.addBtn}>
              {loading ? "Adding..." : "+ Add to watchlist"}
            </button>
          </form>
        </div>

        {/* Wishlist */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Your watchlist</h2>
          {items.length === 0 ? (
            <p style={S.empty}>No items yet. Add something above to start tracking.</p>
          ) : (
            <div style={S.list}>
              {items.map(item => {
                const v = item.ai_verdict ? VERDICT_STYLE[item.ai_verdict] : null;
                return (
                  <div key={item.id} style={S.item}>
                    <div style={S.itemTop}>
                      <div style={S.itemLeft}>
                        <span style={S.itemName}>{item.name}</span>
                        {v && (
                          <span style={{ ...S.badge, color: v.color, background: v.bg }}>
                            {v.label}
                          </span>
                        )}
                        {!item.ai_verdict && (
                          <span style={{ ...S.badge, color: "#94A3B8", background: "rgba(255,255,255,0.05)" }}>
                            Analyzing...
                          </span>
                        )}
                      </div>
                      <div style={S.itemRight}>
                        <span style={S.price}>${item.price.toFixed(2)}</span>
                        {item.target_price && (
                          <span style={S.targetPrice}>Target: ${item.target_price.toFixed(2)}</span>
                        )}
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={S.viewLink}>View →</a>
                        <button onClick={() => loadHistory(item.id)} style={S.chartBtn}>
                          {expanded === item.id ? "Hide chart" : "Price chart"}
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={S.deleteBtn}>Remove</button>
                      </div>
                    </div>

                    {/* AI reasoning */}
                    {item.ai_reasoning && (
                      <p style={S.reasoning}>{item.ai_reasoning}</p>
                    )}

                    {/* Price chart */}
                    {expanded === item.id && item.history && item.history.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <p style={{ ...S.cardSub, marginBottom: 8 }}>Price history</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={item.history.map(h => ({
                            price: h.price,
                            date: new Date(h.checked_at).toLocaleDateString(),
                          }))}>
                            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                            <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={v => `$${v}`} />
                            <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Price"]} contentStyle={{ background: "#0F1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                            <Line type="monotone" dataKey="price" stroke="#00F5D4" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", background: "#0B0F19", padding: "0 16px 40px", fontFamily: "system-ui" },
  container:  { maxWidth: 760, margin: "0 auto", paddingTop: 32 },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title:      { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  navLink:    { color: "#94A3B8", fontSize: 13, textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  ghostBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  card:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 28px", marginBottom: 16 },
  cardTitle:  { color: "#F1F5F9", fontSize: 16, fontWeight: 600, margin: "0 0 4px" },
  cardSub:    { color: "#94A3B8", fontSize: 12, margin: "0 0 16px" },
  form:       { display: "flex", flexDirection: "column", gap: 10 },
  row:        { display: "flex", gap: 10 },
  input:      { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  error:      { color: "#F87171", fontSize: 13, margin: 0 },
  addBtn:     { background: "#00F5D4", color: "#0B0F19", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" },
  empty:      { color: "#94A3B8", fontSize: 14, margin: 0 },
  list:       { display: "flex", flexDirection: "column", gap: 12 },
  item:       { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" },
  itemTop:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  itemLeft:   { display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" },
  itemRight:  { display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" },
  itemName:   { color: "#F1F5F9", fontSize: 14, fontWeight: 600 },
  badge:      { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.5px" },
  price:      { color: "#00F5D4", fontWeight: 700, fontFamily: "monospace", fontSize: 15 },
  targetPrice:{ color: "#94A3B8", fontSize: 11 },
  viewLink:   { color: "#818CF8", fontSize: 12, textDecoration: "none" },
  chartBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 },
  deleteBtn:  { background: "transparent", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11 },
  reasoning:  { color: "#94A3B8", fontSize: 12, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" },
};
