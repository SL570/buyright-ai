"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

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
    current_price: "",
    store: "",
    image: "",
    discount_pct: 15,
    target_members: 10,
  });
  const [createStep, setCreateStep] = useState<"search" | "configure">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ title: string; price: number; store: string; image: string; rating?: number }[]>([]);
  const [searching, setSearching] = useState(false);
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

  function openCreate() {
    setShowCreate(true);
    setCreateStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setCreateError("");
    setForm({ product_name: "", current_price: "", store: "", image: "", discount_pct: 15, target_members: 10 });
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `${BASE}/group-deals/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) setSearchResults(await res.json());
    } catch {
      // fall through to manual entry
    } finally {
      setSearching(false);
    }
  }

  function selectProduct(p: { title: string; price: number; store: string; image: string }) {
    setForm(f => ({ ...f, product_name: p.title, current_price: String(p.price), store: p.store, image: p.image }));
    setCreateStep("configure");
    setCreateError("");
  }

  function enterManually() {
    setForm(f => ({ ...f, product_name: searchQuery.trim(), current_price: "", store: "", image: "" }));
    setCreateStep("configure");
    setCreateError("");
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    const currentP = parseFloat(form.current_price);

    if (!form.product_name.trim()) { setCreateError("Enter a product name"); return; }
    if (isNaN(currentP) || currentP <= 0) { setCreateError("Enter a valid price"); return; }

    const targetP = parseFloat((currentP * (1 - form.discount_pct / 100)).toFixed(2));

    setCreating(true);
    try {
      const res = await fetch(`${BASE}/group-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product_name: form.product_name.trim(),
          current_price: currentP,
          target_price: targetP,
          target_members: form.target_members,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail || "Error");
      }
      if (!res.body) throw new Error("No response received");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break outer;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages([...next, { role: "assistant", content: fullText }]);
            }
          } catch (parseErr) {
            if (!(parseErr instanceof SyntaxError)) throw parseErr;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  if (status === "unauthenticated") { router.push("/sign-in"); return null; }

  const formingDeals = deals.filter(d => d.status === "forming");
  const activeDeals = deals.filter(d => d.status === "active");

  return (
    <main style={S.page}>
      <nav style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/dashboard" style={S.brand}>BuyRight <span style={{ color: "#0A84FF" }}>AI</span></Link>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/dashboard"   style={S.navLink}>Home</Link>
            <Link href="/procurement" style={S.navLink}>AI Advisor</Link>
            <Link href="/group-deals" style={{ ...S.navLink, color: "#0A84FF", fontWeight: 700 }}>Group Deals</Link>
            <Link href="/history"     style={S.navLink}>History</Link>
            <Link href="/pricing"     style={S.navLink}>Pricing</Link>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </nav>

      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Collective Bargaining</h1>
          <p style={S.pageSub}>
            Pool buying power with other shoppers. Once your group hits the target size, we generate a bulk discount negotiation script to send to the retailer — something no consumer can do alone.
          </p>
        </div>
        <button onClick={openCreate} style={S.createBtn}>+ Start a Deal</button>
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
              <h3 style={{ color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No active deals yet</h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6, maxWidth: 400 }}>
                Start the first group deal. When enough people join, we automatically generate a bulk discount negotiation script.
              </p>
              <button onClick={openCreate} style={S.createBtn}>+ Start the first deal</button>
            </div>
          ) : (
            <div style={S.dealSections}>
              {formingDeals.length === 0 && activeDeals.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#4A6080", fontSize: 14 }}>
                  No active deals right now. Be the first to start one.
                  <br /><button onClick={openCreate} style={{ marginTop: 16, ...S.createBtn }}>+ Start a deal</button>
                </div>
              )}
              {formingDeals.length > 0 && (
                <div>
                  <p style={S.sectionLabel}>Forming — needs more members</p>
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
                  <p style={S.sectionLabel}>Active — target reached, scripts ready</p>
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
                  {m.role === "assistant" && <div style={S.avatar}>AI</div>}
                  <div style={m.role === "user" ? S.userBubble : S.aiBubble}>{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
                  <div style={S.avatar}>AI</div>
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
                ♪
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
            <p style={S.hint}>Press the mic button to speak · Sees your live deal board</p>
          </div>
        </>
      )}

      {showCreate && (
        <div style={S.overlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...S.modal, maxWidth: createStep === "search" && searchResults.length > 0 ? 620 : 480 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {createStep === "configure" && (
                  <button onClick={() => setCreateStep("search")} style={{ background: "none", border: "none", color: "#64748B", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}>←</button>
                )}
                <h2 style={{ color: "#F1F5F9", fontSize: 17, fontWeight: 700, margin: 0 }}>
                  {createStep === "search" ? "What do you want to buy?" : "Set your deal terms"}
                </h2>
              </div>
              <button onClick={() => setShowCreate(false)} style={S.closeBtn}>✕</button>
            </div>

            {/* ── Step 1: Product search ── */}
            {createStep === "search" && (
              <div>
                <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <input
                    autoFocus
                    style={{ ...S.formInput, flex: 1, fontSize: 15 }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                  />
                  <button type="submit" disabled={searching || !searchQuery.trim()} style={{ ...S.submitBtn, padding: "11px 18px", whiteSpace: "nowrap" }}>
                    {searching ? "…" : "Search"}
                  </button>
                </form>

                {/* Searching spinner */}
                {searching && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13, padding: "8px 0 16px" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(129,140,248,0.2)", borderTopColor: "#818CF8", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    Searching Google Shopping…
                  </div>
                )}

                {/* Search results grid */}
                {!searching && searchResults.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    <p style={{ color: "#475569", fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Select a product to auto-fill price
                    </p>
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => selectProduct(r)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(129,140,248,0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(129,140,248,0.06)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                      >
                        {r.image ? (
                          <img src={r.image} alt="" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 8, background: "#1E293B", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(129,140,248,0.08)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛍️</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                          <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{r.store}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ color: "#0A84FF", fontSize: 16, fontWeight: 800, margin: "0 0 2px" }}>${r.price.toFixed(0)}</p>
                          {r.rating && <p style={{ color: "#FBBF24", fontSize: 11, margin: 0 }}>★ {r.rating}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results / manual entry fallback */}
                {!searching && (searchResults.length > 0 || searchQuery.trim()) && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                    <button
                      onClick={enterManually}
                      disabled={!searchQuery.trim()}
                      style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 16px", color: "#64748B", fontSize: 13, cursor: "pointer" }}
                    >
                      {searchResults.length === 0 ? "Enter price manually instead →" : "Don't see yours? Enter manually →"}
                    </button>
                  </div>
                )}

                {!searching && searchResults.length === 0 && !searchQuery.trim() && (
                  <p style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                    Search for any product to see real prices from Amazon, Walmart, Best Buy, and more.
                  </p>
                )}
              </div>
            )}

            {/* ── Step 2: Deal configuration ── */}
            {createStep === "configure" && (
              <form onSubmit={handleCreateDeal} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Selected product preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                  {form.image ? (
                    <img src={form.image} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: "#1E293B", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(129,140,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🛍️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.product_name || "Product"}</p>
                    {form.store && <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{form.store}</p>}
                  </div>
                  {form.current_price && (
                    <p style={{ color: "#0A84FF", fontSize: 17, fontWeight: 800, margin: 0, flexShrink: 0 }}>${parseFloat(form.current_price).toFixed(0)}</p>
                  )}
                </div>

                {/* Price (shown only for manual entry) */}
                {!form.current_price && (
                  <div>
                    <label style={S.label}>Current price ($)</label>
                    <input
                      autoFocus
                      type="number"
                      style={S.formInput}
                      value={form.current_price}
                      onChange={e => setForm(f => ({ ...f, current_price: e.target.value }))}
                      placeholder="What's the current price?"
                      min="1" max="10000" step="1"
                    />
                  </div>
                )}

                {/* Discount goal */}
                <div>
                  <label style={S.label}>Discount goal</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[10, 15, 20, 25].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, discount_pct: pct }))}
                        style={{
                          flex: 1, padding: "10px 4px", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer",
                          background: form.discount_pct === pct ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.04)",
                          border: form.discount_pct === pct ? "1px solid rgba(129,140,248,0.5)" : "1px solid rgba(255,255,255,0.08)",
                          color: form.discount_pct === pct ? "#818CF8" : "#64748B",
                          transition: "all 0.15s",
                        }}
                      >
                        {pct}% off
                      </button>
                    ))}
                  </div>
                  {form.current_price && !isNaN(parseFloat(form.current_price)) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "10px 14px", background: "rgba(10,132,255,0.05)", border: "1px solid rgba(10,132,255,0.15)", borderRadius: 9 }}>
                      <span style={{ color: "#64748B", fontSize: 13 }}>Group target price</span>
                      <span>
                        <span style={{ color: "#0A84FF", fontSize: 17, fontWeight: 800 }}>${(parseFloat(form.current_price) * (1 - form.discount_pct / 100)).toFixed(0)}</span>
                        <span style={{ color: "#475569", fontSize: 12 }}> (save ${(parseFloat(form.current_price) * form.discount_pct / 100).toFixed(0)})</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Group size stepper */}
                <div>
                  <label style={S.label}>Buyers needed to unlock deal</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, target_members: Math.max(2, f.target_members - 1) }))}
                      style={{ width: 42, height: 46, borderRadius: "9px 0 0 9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94A3B8", fontSize: 22, cursor: "pointer" }}>−</button>
                    <div style={{ flex: 1, height: 46, border: "1px solid rgba(255,255,255,0.1)", borderLeft: "none", borderRight: "none", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F1F5F9", fontSize: 16, fontWeight: 700 }}>
                      {form.target_members} buyers
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, target_members: Math.min(100, f.target_members + 1) }))}
                      style={{ width: 42, height: 46, borderRadius: "0 9px 9px 0", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94A3B8", fontSize: 22, cursor: "pointer" }}>+</button>
                  </div>
                  <p style={{ color: "#334155", fontSize: 11, margin: "6px 0 0" }}>
                    We generate a bulk negotiation script automatically once the group forms
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
                    {creating ? "Creating…" : "Start Group Deal →"}
                  </button>
                </div>
              </form>
            )}

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
          background: isActive ? "rgba(10,132,255,0.1)" : "rgba(251,191,36,0.1)",
          color: isActive ? "#0A84FF" : "#FBBF24",
          border: `1px solid ${isActive ? "rgba(10,132,255,0.2)" : "rgba(251,191,36,0.2)"}`,
        }}>
          {isActive ? "✓ Active" : "● Forming"}
        </span>
        <span style={{ color: "#475569", fontSize: 12 }}>{discountPct}% off target</span>
      </div>

      <h3 style={D.productName}>{deal.product_name}</h3>
      <p style={D.prices}>
        <span style={{ color: "#0A84FF", fontWeight: 700 }}>${deal.target_price.toFixed(0)}</span>
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
                ? "linear-gradient(90deg,#0A84FF,#00D4B8)"
                : "linear-gradient(90deg,#818CF8,#A78BFA)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isActive && deal.negotiation_script ? (
          <button
            onClick={() => setExpandedScript(scriptOpen ? null : deal.id)}
            style={{ ...D.actionBtn, background: "rgba(10,132,255,0.08)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)", flex: 1 }}
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
        {deal.product_url && <a
          href={deal.product_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...D.actionBtn, background: "rgba(255,255,255,0.04)", color: "#64748B", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", flexShrink: 0 }}
          title="View product"
        >
          ↗
        </a>}
      </div>

      {scriptOpen && deal.negotiation_script && (
        <div style={D.scriptBox}>
          <p style={{ color: "#0A84FF", fontSize: 11, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Bulk Discount Negotiation Script
          </p>
          <p style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
            {deal.negotiation_script}
          </p>
          <button
            onClick={() => deal.negotiation_script && navigator.clipboard?.writeText(deal.negotiation_script)}
            style={{ marginTop: 14, background: "rgba(10,132,255,0.08)", border: "1px solid rgba(10,132,255,0.2)", color: "#0A84FF", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer" }}
          >
            Copy script
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:         { minHeight: "100vh", background: "#0C1525", display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  brand:        { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  navLink:      { color: "#94A3B8", fontSize: 14, textDecoration: "none" },
  ghostBtn:     { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
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
  scriptBox:     { marginTop: 16, background: "rgba(10,132,255,0.04)", border: "1px solid rgba(10,132,255,0.12)", borderRadius: 12, padding: "16px" },
};
