"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import LoadingScreen from "../components/LoadingScreen";

interface Deal {
  id: number;
  product_name: string;
  product_url: string;
  current_price: number;
  target_price: number;
  target_members: number;
  status: string;
  negotiation_script: string | null;
  created_by: number;
  created_at: string;
  member_count: number;
  is_member: boolean;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const RETAILERS = ["amazon.com", "walmart.com", "bestbuy.com", "target.com"];
const CHAT_STARTERS = [
  "How does collective bargaining work?",
  "What products are best for group buying?",
  "Write me a bulk discount email to Best Buy",
  "How many people do I need to get 20% off?",
];

export default function GroupDealsPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"deals" | "chat">("deals");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [form, setForm] = useState({
    product_name: "",
    product_url: "",
    current_price: "",
    target_price: "",
    target_members: "10",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  const fetchDeals = useCallback(async (tok: string) => {
    setDealsLoading(true);
    try {
      const res = await fetch(`${BASE}/group-deals`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setDeals(await res.json());
    } finally {
      setDealsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          fetchDeals(d.token);
        })
        .catch(() => router.push("/sign-in"));
    }
  }, [status, router, fetchDeals]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  async function joinDeal(dealId: number) {
    setActionLoading(dealId);
    try {
      const res = await fetch(`${BASE}/group-deals/${dealId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchDeals(token);
      } else {
        const data = await res.json();
        alert(data.detail || "Could not join deal");
      }
    } catch {
      alert("Network error — try again");
    } finally {
      setActionLoading(null);
    }
  }

  async function leaveDeal(dealId: number) {
    setActionLoading(dealId);
    try {
      const res = await fetch(`${BASE}/group-deals/${dealId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchDeals(token);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    const currentP = parseFloat(form.current_price);
    const targetP = parseFloat(form.target_price);
    const targetM = parseInt(form.target_members);

    if (!form.product_name.trim()) { setCreateError("Product name is required"); return; }
    if (!form.product_url.trim()) { setCreateError("Product URL is required"); return; }
    if (isNaN(currentP) || currentP <= 0) { setCreateError("Enter a valid current price"); return; }
    if (isNaN(targetP) || targetP <= 0) { setCreateError("Enter a valid target price"); return; }
    if (targetP >= currentP) { setCreateError("Target price must be lower than current price"); return; }
    if (isNaN(targetM) || targetM < 2) { setCreateError("Need at least 2 members"); return; }

    try {
      const url = new URL(form.product_url);
      const domain = url.hostname.replace("www.", "");
      if (!RETAILERS.includes(domain)) {
        setCreateError(`URL must be from a supported retailer: ${RETAILERS.join(", ")}`);
        return;
      }
    } catch {
      setCreateError("Enter a valid product URL (e.g. https://www.amazon.com/dp/...)");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${BASE}/group-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product_name: form.product_name.trim(),
          product_url: form.product_url.trim(),
          current_price: currentP,
          target_price: targetP,
          target_members: targetM,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ product_name: "", product_url: "", current_price: "", target_price: "", target_members: "10" });
        await fetchDeals(token);
      } else {
        const data = await res.json();
        setCreateError(data.detail || "Failed to create deal");
      }
    } catch {
      setCreateError("Network error — please try again");
    } finally {
      setCreating(false);
    }
  }

  function buildDealContext(): string {
    if (deals.length === 0) return "No active group deals in the system yet.";
    const lines = deals.slice(0, 8).map(d =>
      `• ${d.product_name} — Current: $${d.current_price} | Target: $${d.target_price} | Members: ${d.member_count}/${d.target_members} | Status: ${d.status}`
    );
    return `Live deal board (${deals.length} deal${deals.length !== 1 ? "s" : ""}):\n${lines.join("\n")}`;
  }

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported. Try Chrome."); return; }
    const r = new SR();
    recogRef.current = r;
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onerror = () => setListening(false);
    r.start();
  }

  async function sendChat(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || chatLoading) return;
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setChatLoading(true);
    try {
      const res = await fetch(`${BASE}/group-deals/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, context: buildDealContext() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  if (status === "loading" || !token) return <LoadingScreen />;

  const formingDeals = deals.filter(d => d.status === "forming");
  const activeDeals = deals.filter(d => d.status === "active");

  return (
    <main style={S.page}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/procurement" style={S.navLink}>Procurement</Link>
          <span style={S.divider}>|</span>
          <Link href="/fulfillment" style={S.navLink}>Fulfillment</Link>
          <span style={S.divider}>|</span>
          <Link href="/chat" style={S.navLink}>AI Advisor</Link>
        </div>
        <span style={S.brand}>BuyRight <span style={{ color: "#818CF8" }}>AI</span></span>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </div>

      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>🤝 Collective Bargaining</h1>
          <p style={S.pageSub}>
            Pool buying power with other shoppers. Once your group hits the target size, we generate a bulk discount negotiation script to send to the retailer — something no consumer can do alone.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={S.createBtn}>+ Start a Deal</button>
      </div>

      <div style={S.tabRow}>
        <button onClick={() => setTab("deals")} style={{ ...S.tabBtn, ...(tab === "deals" ? S.tabActive : {}) }}>
          Live Deals {deals.length > 0 && <span style={S.tabBadge}>{deals.length}</span>}
        </button>
        <button onClick={() => setTab("chat")} style={{ ...S.tabBtn, ...(tab === "chat" ? S.tabActive : {}) }}>
          AI Advisor
        </button>
        <button onClick={() => fetchDeals(token)} style={S.refreshBtn} title="Refresh">↺</button>
      </div>

      {tab === "deals" && (
        <div style={S.dealsContent}>
          {dealsLoading ? (
            <div style={S.centered}><div style={S.spinner} /></div>
          ) : deals.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🤝</div>
              <h3 style={{ color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No active deals yet</h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 400 }}>
                Start the first group deal. When enough people join, we automatically generate a bulk discount negotiation script.
              </p>
              <button onClick={() => setShowCreate(true)} style={S.createBtn}>+ Start the first deal</button>
            </div>
          ) : (
            <div style={S.dealSections}>
              {formingDeals.length > 0 && (
                <div>
                  <p style={S.sectionLabel}>🔄 Forming — needs more members</p>
                  <div style={S.dealGrid}>
                    {formingDeals.map(deal => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onJoin={joinDeal}
                        onLeave={leaveDeal}
                        actionLoading={actionLoading === deal.id}
                        expandedScript={expandedScript}
                        setExpandedScript={setExpandedScript}
                      />
                    ))}
                  </div>
                </div>
              )}
              {activeDeals.length > 0 && (
                <div>
                  <p style={S.sectionLabel}>✅ Active — target reached, scripts ready</p>
                  <div style={S.dealGrid}>
                    {activeDeals.map(deal => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onJoin={joinDeal}
                        onLeave={leaveDeal}
                        actionLoading={actionLoading === deal.id}
                        expandedScript={expandedScript}
                        setExpandedScript={setExpandedScript}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <>
          <div style={S.chatWrap}>
            <div style={S.chatInner}>
              {messages.length === 0 && (
                <div style={S.emptyChat}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🤝</div>
                  <h2 style={S.emptyTitle}>Collective Bargaining AI</h2>
                  <p style={S.emptySub}>
                    Ask how group buying works, get pricing strategy tips, or get a word-for-word negotiation script to send to any retailer. I can also see your live deals above.
                  </p>
                  <div style={S.starters}>
                    {CHAT_STARTERS.map(s => (
                      <button key={s} onClick={() => sendChat(s)} style={S.starterBtn}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ ...S.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && <div style={S.avatar}>🤝</div>}
                  <div style={m.role === "user" ? S.userBubble : S.aiBubble}>{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
                  <div style={S.avatar}>🤝</div>
                  <div style={{ ...S.aiBubble, ...S.typing }}>
                    <span style={S.dot} />
                    <span style={{ ...S.dot, animationDelay: "0.2s" }} />
                    <span style={{ ...S.dot, animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <div style={S.inputArea}>
            <div style={S.inputRow}>
              <button
                onClick={startVoice}
                style={{ ...S.micBtn, background: listening ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.05)" }}
                title="Voice input"
              >
                🎤
              </button>
              <input
                style={S.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder={listening ? "Listening..." : "Ask about collective bargaining, pricing strategy, negotiation scripts..."}
                disabled={chatLoading}
              />
              <button onClick={() => sendChat()} disabled={chatLoading || !input.trim()} style={S.sendBtn}>Send</button>
            </div>
            <p style={S.hint}>Press 🎤 to speak · Sees your live deal board</p>
          </div>
        </>
      )}

      {showCreate && (
        <div style={S.overlay} onClick={() => setShowCreate(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700, margin: 0 }}>Start a Group Deal</h2>
              <button onClick={() => setShowCreate(false)} style={S.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleCreateDeal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={S.label}>Product Name</label>
                <input
                  style={S.formInput}
                  value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g. PlayStation 5 Console"
                />
              </div>
              <div>
                <label style={S.label}>
                  Product URL{" "}
                  <span style={{ color: "#475569", fontSize: 11, fontWeight: 400 }}>
                    Amazon, Walmart, Best Buy, or Target only
                  </span>
                </label>
                <input
                  style={S.formInput}
                  value={form.product_url}
                  onChange={e => setForm(f => ({ ...f, product_url: e.target.value }))}
                  placeholder="https://www.amazon.com/dp/..."
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>Current Price ($)</label>
                  <input
                    type="number"
                    style={S.formInput}
                    value={form.current_price}
                    onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
                    placeholder="499"
                    min="0.01"
                    max="10000"
                    step="0.01"
                  />
                </div>
                <div>
                  <label style={S.label}>Target Price ($)</label>
                  <input
                    type="number"
                    style={S.formInput}
                    value={form.target_price}
                    onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                    placeholder="449"
                    min="0.01"
                    max="10000"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label style={S.label}>Members Needed</label>
                <input
                  type="number"
                  style={S.formInput}
                  value={form.target_members}
                  onChange={e => setForm(f => ({ ...f, target_members: e.target.value }))}
                  min="2"
                  max="100"
                />
                <p style={{ color: "#475569", fontSize: 11, margin: "6px 0 0" }}>
                  Committed buyers needed before we generate your bulk discount script (min 2, max 100)
                </p>
              </div>
              {createError && (
                <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", color: "#F87171", fontSize: 13 }}>
                  {createError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" disabled={creating} style={S.submitBtn}>
                  {creating ? "Creating..." : "Create Deal →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

function DealCard({
  deal, onJoin, onLeave, actionLoading, expandedScript, setExpandedScript,
}: {
  deal: Deal;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
  actionLoading: boolean;
  expandedScript: number | null;
  setExpandedScript: (id: number | null) => void;
}) {
  const progress = Math.min((deal.member_count / deal.target_members) * 100, 100);
  const isActive = deal.status === "active";
  const scriptOpen = expandedScript === deal.id;
  const discountPct = deal.current_price > 0
    ? ((deal.current_price - deal.target_price) / deal.current_price * 100).toFixed(0)
    : "0";

  return (
    <div style={D.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{
          ...D.badge,
          background: isActive ? "rgba(0,245,212,0.1)" : "rgba(251,191,36,0.1)",
          color: isActive ? "#00F5D4" : "#FBBF24",
          border: `1px solid ${isActive ? "rgba(0,245,212,0.2)" : "rgba(251,191,36,0.2)"}`,
        }}>
          {isActive ? "✓ Active" : "● Forming"}
        </span>
        <span style={{ color: "#475569", fontSize: 12 }}>{discountPct}% off target</span>
      </div>

      <h3 style={D.productName}>{deal.product_name}</h3>
      <p style={D.prices}>
        <span style={{ color: "#00F5D4", fontWeight: 700 }}>${deal.target_price.toFixed(0)}</span>
        <span style={{ color: "#475569" }}> target from ${deal.current_price.toFixed(0)}</span>
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "#94A3B8", fontSize: 12 }}>
            <strong style={{ color: "#E2E8F0" }}>{deal.member_count}</strong>
            <span style={{ color: "#475569" }}> / {deal.target_members} members</span>
          </span>
          {deal.is_member && (
            <span style={{ color: "#818CF8", fontSize: 11, fontWeight: 600 }}>✓ Joined</span>
          )}
        </div>
        <div style={D.progressTrack}>
          <div
            style={{
              ...D.progressFill,
              width: `${progress}%`,
              background: isActive
                ? "linear-gradient(90deg,#00F5D4,#00D4B8)"
                : "linear-gradient(90deg,#818CF8,#A78BFA)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isActive && deal.negotiation_script ? (
          <button
            onClick={() => setExpandedScript(scriptOpen ? null : deal.id)}
            style={{ ...D.actionBtn, background: "rgba(0,245,212,0.08)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)", flex: 1 }}
          >
            {scriptOpen ? "▲ Hide Script" : "▼ View Script"}
          </button>
        ) : deal.is_member ? (
          <button
            onClick={() => onLeave(deal.id)}
            disabled={actionLoading}
            style={{ ...D.actionBtn, background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}
          >
            {actionLoading ? "..." : "Leave Deal"}
          </button>
        ) : (
          <button
            onClick={() => onJoin(deal.id)}
            disabled={actionLoading}
            style={{ ...D.actionBtn, background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "#fff", border: "none", flex: 1, fontWeight: 700 }}
          >
            {actionLoading ? "Joining..." : "Join Deal →"}
          </button>
        )}
        <a
          href={deal.product_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...D.actionBtn, background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", flexShrink: 0 }}
          title="View product"
        >
          ↗
        </a>
      </div>

      {scriptOpen && deal.negotiation_script && (
        <div style={D.scriptBox}>
          <p style={{ color: "#00F5D4", fontSize: 11, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Bulk Discount Negotiation Script
          </p>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
            {deal.negotiation_script}
          </p>
          <button
            onClick={() => deal.negotiation_script && navigator.clipboard?.writeText(deal.negotiation_script)}
            style={{ marginTop: 14, background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)", color: "#00F5D4", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer" }}
          >
            Copy script
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:         { minHeight: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column", fontFamily: "system-ui" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 },
  brand:        { color: "#F1F5F9", fontSize: 16, fontWeight: 700 },
  navLink:      { color: "#94A3B8", fontSize: 13, textDecoration: "none" },
  divider:      { color: "#334155", fontSize: 13 },
  ghostBtn:     { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  pageHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, padding: "28px 32px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" },
  pageTitle:    { color: "#F1F5F9", fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.3px" },
  pageSub:      { color: "#64748B", fontSize: 13, margin: 0, lineHeight: 1.6, maxWidth: 560 },
  createBtn:    { background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  tabRow:       { display: "flex", alignItems: "center", gap: 4, padding: "12px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tabBtn:       { background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#64748B", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  tabActive:    { background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: "#818CF8" },
  tabBadge:     { background: "#818CF8", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 700 },
  refreshBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#475569", borderRadius: 8, padding: "7px 12px", fontSize: 16, cursor: "pointer", marginLeft: "auto" },
  dealsContent: { flex: 1, overflowY: "auto", padding: "28px 32px" },
  centered:     { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 },
  spinner:      { width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(129,140,248,0.2)", borderTopColor: "#818CF8", animation: "spin 0.8s linear infinite" },
  emptyState:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, textAlign: "center" },
  dealSections: { display: "flex", flexDirection: "column", gap: 32 },
  sectionLabel: { color: "#475569", fontSize: 12, fontWeight: 600, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px" },
  dealGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  chatWrap:     { flex: 1, overflowY: "auto", padding: "24px 16px 0" },
  chatInner:    { maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 },
  emptyChat:    { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12, textAlign: "center" },
  emptyTitle:   { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  emptySub:     { color: "#94A3B8", fontSize: 14, margin: 0, maxWidth: 460, lineHeight: 1.6 },
  starters:     { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  starterBtn:   { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 99, padding: "8px 16px", fontSize: 12, cursor: "pointer" },
  msgRow:       { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar:       { width: 30, height: 30, borderRadius: "50%", background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  userBubble:   { background: "#1E293B", color: "#F1F5F9", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, maxWidth: "75%", whiteSpace: "pre-wrap" },
  aiBubble:     { background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.15)", color: "#E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, maxWidth: "75%", whiteSpace: "pre-wrap" },
  typing:       { display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" },
  dot:          { width: 7, height: 7, borderRadius: "50%", background: "#818CF8", display: "inline-block", animation: "blink 1.2s infinite" },
  inputArea:    { flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" },
  inputRow:     { maxWidth: 700, margin: "0 auto", display: "flex", gap: 10 },
  micBtn:       { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0 14px", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  input:        { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  sendBtn:      { background: "#818CF8", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  hint:         { color: "#334155", fontSize: 11, textAlign: "center", margin: "6px 0 0" },
  overlay:      { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 },
  modal:        { background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  closeBtn:     { background: "rgba(255,255,255,0.06)", border: "none", color: "#94A3B8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 },
  label:        { display: "block", color: "#94A3B8", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" },
  formInput:    { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px 14px", color: "#F1F5F9", fontSize: 14, outline: "none", boxSizing: "border-box" },
  cancelBtn:    { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#64748B", borderRadius: 9, padding: "10px 18px", cursor: "pointer", fontSize: 13 },
  submitBtn:    { background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};

const D: Record<string, React.CSSProperties> = {
  card:          { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 0 },
  badge:         { borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  productName:   { color: "#F1F5F9", fontSize: 16, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 },
  prices:        { color: "#94A3B8", fontSize: 13, margin: "0 0 14px" },
  progressTrack: { height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  actionBtn:     { borderRadius: 9, padding: "9px 14px", fontSize: 13, cursor: "pointer", textAlign: "center" },
  scriptBox:     { marginTop: 16, background: "rgba(0,245,212,0.04)", border: "1px solid rgba(0,245,212,0.12)", borderRadius: 12, padding: "16px" },
};
