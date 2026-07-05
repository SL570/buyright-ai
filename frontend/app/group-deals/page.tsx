"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface GroupDeal {
  id: number; product_name: string; product_url: string;
  current_price: number; target_price: number; target_members: number;
  status: string; negotiation_script: string | null;
  created_by: number; created_at: string;
  member_count: number; is_member: boolean;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function GroupDealsPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken]       = useState("");
  const [deals, setDeals]       = useState<GroupDeal[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [fName,    setFName]    = useState("");
  const [fUrl,     setFUrl]     = useState("");
  const [fCurrent, setFCurrent] = useState("");
  const [fTarget,  setFTarget]  = useState("");
  const [fMembers, setFMembers] = useState("5");
  const [fError,   setFError]   = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(async d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          try { await fetchDeals(d.token); } catch (e: any) { setError(e.message); }
        })
        .catch(e => setError(e.message))
        .finally(() => setFetching(false));
    }
  }, [status, router]);

  async function authHeaders(t: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
  }

  async function fetchDeals(t: string) {
    const headers = await authHeaders(t);
    const res = await fetch(`${BASE}/group-deals`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to load");
    setDeals(data);
  }

  async function handleJoin(id: number) {
    try {
      const headers = await authHeaders(token);
      const res = await fetch(`${BASE}/group-deals/${id}/join`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setDeals(prev => prev.map(d => d.id === id ? data : d));
    } catch (e: any) { setError(e.message); }
  }

  async function handleLeave(id: number) {
    try {
      const headers = await authHeaders(token);
      await fetch(`${BASE}/group-deals/${id}/leave`, { method: "POST", headers });
      setDeals(prev => prev.map(d => d.id === id ? { ...d, is_member: false, member_count: d.member_count - 1 } : d));
    } catch (e: any) { setError(e.message); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFError(""); setFLoading(true);
    try {
      const headers = await authHeaders(token);
      const res = await fetch(`${BASE}/group-deals`, {
        method: "POST", headers,
        body: JSON.stringify({ product_name: fName, product_url: fUrl, current_price: parseFloat(fCurrent), target_price: parseFloat(fTarget), target_members: parseInt(fMembers) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
      setDeals(prev => [data, ...prev]);
      setFName(""); setFUrl(""); setFCurrent(""); setFTarget(""); setFMembers("5");
      setShowForm(false);
    } catch (e: any) { setFError(e.message); }
    finally { setFLoading(false); }
  }

  function copyScript(id: number, script: string) {
    navigator.clipboard.writeText(script);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (status === "loading" || fetching) return <main style={S.page}><p style={{ color: "#94A3B8", fontFamily: "system-ui" }}>Loading...</p></main>;

  return (
    <main style={S.page}>
      <div style={S.container}>

        <div style={S.header}>
          <h1 style={S.title}>BuyRight <span style={{ color: "#818CF8" }}>AI</span></h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/dashboard" style={S.navLink}>My Watchlist</Link>
            <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 6px", fontFamily: "system-ui" }}>Collective Bargaining</h2>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: 0, fontFamily: "system-ui" }}>
            Pool buying power with other shoppers. When your group hits the target size, we generate a bulk discount request you can send to the retailer.
          </p>
        </div>

        {error && <p style={S.error}>{error}</p>}

        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowForm(!showForm)} style={S.createBtn}>
            {showForm ? "Cancel" : "+ Start a group deal"}
          </button>
        </div>

        {showForm && (
          <div style={S.card}>
            <h3 style={{ ...S.cardTitle, marginBottom: 16 }}>New group deal</h3>
            <form onSubmit={handleCreate} style={S.form}>
              <div style={S.row}>
                <input type="text"   placeholder="Product name"  value={fName}    onChange={e => setFName(e.target.value)}    required style={{ ...S.input, flex: 1 }} />
                <input type="number" placeholder="Current price" value={fCurrent} onChange={e => setFCurrent(e.target.value)} required min="0.01" max="10000" step="0.01" style={{ ...S.input, width: 130 }} />
                <input type="number" placeholder="Target price"  value={fTarget}  onChange={e => setFTarget(e.target.value)}  required min="0.01" max="10000" step="0.01" style={{ ...S.input, width: 130 }} />
                <input type="number" placeholder="People needed" value={fMembers} onChange={e => setFMembers(e.target.value)} required min="2"    max="100"         style={{ ...S.input, width: 120 }} />
              </div>
              <input type="url" placeholder="Product URL (amazon.com, walmart.com, bestbuy.com, target.com)" value={fUrl} onChange={e => setFUrl(e.target.value)} required style={S.input} />
              {fError && <p style={S.error}>{fError}</p>}
              <button type="submit" disabled={fLoading} style={S.addBtn}>
                {fLoading ? "Creating..." : "Create group deal"}
              </button>
            </form>
          </div>
        )}

        {deals.length === 0 ? (
          <div style={S.card}>
            <p style={S.empty}>No group deals yet. Start one above and share it with others who want the same product.</p>
          </div>
        ) : (
          <div style={S.list}>
            {deals.map(deal => {
              const pct = Math.round((deal.member_count / deal.target_members) * 100);
              const savings = ((deal.current_price - deal.target_price) / deal.current_price * 100).toFixed(0);
              const isActive = deal.status === "active";
              return (
                <div key={deal.id} style={{ ...S.card, borderColor: isActive ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.08)" }}>
                  <div style={S.dealTop}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={S.dealName}>{deal.product_name}</span>
                        <span style={{ ...S.badge, ...(isActive ? S.badgeActive : S.badgeForming) }}>{isActive ? "Deal Ready" : "Forming"}</span>
                        <span style={{ ...S.badge, background: "rgba(16,185,129,0.12)", color: "#10B981" }}>Save ~{savings}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ color: "#94A3B8", fontSize: 12, fontFamily: "system-ui" }}>
                          Currently <span style={{ color: "#F87171", textDecoration: "line-through", fontFamily: "monospace" }}>${deal.current_price.toFixed(2)}</span>
                          {" → "}
                          <span style={{ color: "#10B981", fontFamily: "monospace", fontWeight: 700 }}>${deal.target_price.toFixed(2)}</span>
                        </span>
                        <a href={deal.product_url} target="_blank" rel="noopener noreferrer" style={S.viewLink}>View product →</a>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600, margin: "0 0 4px", fontFamily: "system-ui" }}>{deal.member_count} / {deal.target_members} joined</p>
                      {!isActive && (deal.is_member
                        ? <button onClick={() => handleLeave(deal.id)} style={S.leaveBtn}>Leave</button>
                        : <button onClick={() => handleJoin(deal.id)} style={S.joinBtn}>Join deal</button>
                      )}
                    </div>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={{ ...S.progressFill, width: `${Math.min(pct, 100)}%`, background: isActive ? "#818CF8" : "#00F5D4" }} />
                  </div>
                  <p style={S.progressLabel}>
                    {isActive ? "Target reached — negotiation script ready below" : `Need ${deal.target_members - deal.member_count} more to unlock the negotiation script`}
                  </p>
                  {isActive && deal.negotiation_script && (
                    <div style={S.scriptBox}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ color: "#818CF8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "system-ui" }}>Negotiation script</span>
                        <button onClick={() => copyScript(deal.id, deal.negotiation_script!)} style={S.copyBtn}>{copied === deal.id ? "Copied!" : "Copy"}</button>
                      </div>
                      <p style={S.scriptText}>{deal.negotiation_script}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:          { minHeight: "100vh", background: "#0B0F19", padding: "0 16px 40px", fontFamily: "system-ui" },
  container:     { maxWidth: 760, margin: "0 auto", paddingTop: 32 },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  title:         { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  navLink:       { color: "#94A3B8", fontSize: 13, textDecoration: "none", padding: "6px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 },
  ghostBtn:      { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  card:          { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", marginBottom: 12 },
  cardTitle:     { color: "#F1F5F9", fontSize: 15, fontWeight: 600, margin: 0 },
  form:          { display: "flex", flexDirection: "column", gap: 10 },
  row:           { display: "flex", gap: 10, flexWrap: "wrap" },
  input:         { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  error:         { color: "#F87171", fontSize: 13, margin: "0 0 8px" },
  addBtn:        { background: "#818CF8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" },
  createBtn:     { background: "rgba(129,140,248,0.12)", color: "#818CF8", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  empty:         { color: "#94A3B8", fontSize: 14, margin: 0 },
  list:          { display: "flex", flexDirection: "column" },
  dealTop:       { display: "flex", gap: 16, marginBottom: 14 },
  dealName:      { color: "#F1F5F9", fontSize: 15, fontWeight: 600 },
  badge:         { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  badgeActive:   { background: "rgba(129,140,248,0.15)", color: "#818CF8" },
  badgeForming:  { background: "rgba(251,191,36,0.12)", color: "#FBBF24" },
  viewLink:      { color: "#818CF8", fontSize: 12, textDecoration: "none" },
  joinBtn:       { background: "#818CF8", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer" },
  leaveBtn:      { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#94A3B8", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer" },
  progressTrack: { height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 6 },
  progressFill:  { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  progressLabel: { color: "#94A3B8", fontSize: 11, margin: 0 },
  scriptBox:     { marginTop: 14, background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 10, padding: "14px 16px" },
  scriptText:    { color: "#D1D5DB", fontSize: 13, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" },
  copyBtn:       { background: "#818CF8", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
};
