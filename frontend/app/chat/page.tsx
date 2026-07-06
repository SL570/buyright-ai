"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const STARTERS = [
  "Is $1,299 a good price for a MacBook Air M3?",
  "When do TVs usually go on sale?",
  "How do I negotiate a discount on a laptop?",
  "Should I wait for Black Friday to buy a PS5?",
];

export default function ChatPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(d => { if (d.token) setToken(d.token); else router.push("/sign-in"); })
        .catch(() => router.push("/sign-in"));
    }
  }, [status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const next: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message || "Could not reach AI service. Try again."}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !token) {
    return <main style={S.page}><p style={{ color: "#94A3B8" }}>Loading...</p></main>;
  }

  return (
    <main style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={S.backLink}>← Watchlist</Link>
          <span style={S.divider}>|</span>
          <Link href="/group-deals" style={S.backLink}>Group Deals</Link>
        </div>
        <span style={S.brand}>BuyRight <span style={{ color: "#818CF8" }}>AI</span></span>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </div>

      {/* Chat area */}
      <div style={S.chatWrap}>
        <div style={S.chatInner}>

          {messages.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.avatarLarge}>🤖</div>
              <h2 style={S.emptyTitle}>AI Shopping Advisor</h2>
              <p style={S.emptySub}>Ask me anything about a product, price timing, or negotiation strategy.</p>
              <div style={S.starters}>
                {STARTERS.map(s => (
                  <button key={s} onClick={() => send(s)} style={S.starterBtn}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...S.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <div style={S.avatar}>🤖</div>}
              <div style={m.role === "user" ? S.userBubble : S.aiBubble}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
              <div style={S.avatar}>🤖</div>
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

      {/* Input */}
      <div style={S.inputArea}>
        <div style={S.inputRow}>
          <input
            style={S.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about any product, price, or deal..."
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn}>
            Send
          </button>
        </div>
        <p style={S.hint}>Powered by Claude · Press Enter to send</p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { height: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column", fontFamily: "system-ui", overflow: "hidden" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 },
  brand:      { color: "#F1F5F9", fontSize: 16, fontWeight: 700 },
  backLink:   { color: "#94A3B8", fontSize: 13, textDecoration: "none" },
  divider:    { color: "#334155", fontSize: 13 },
  ghostBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  chatWrap:   { flex: 1, overflowY: "auto", padding: "24px 16px 0" },
  chatInner:  { maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  avatarLarge:{ fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  emptySub:   { color: "#94A3B8", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 400, lineHeight: 1.6 },
  starters:   { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  starterBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 99, padding: "8px 16px", fontSize: 12, cursor: "pointer" },
  msgRow:     { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar:     { width: 30, height: 30, borderRadius: "50%", background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  userBubble: { background: "#1E293B", color: "#F1F5F9", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, maxWidth: "75%", whiteSpace: "pre-wrap" },
  aiBubble:   { background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.15)", color: "#E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, maxWidth: "75%", whiteSpace: "pre-wrap" },
  typing:     { display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" },
  dot:        { width: 7, height: 7, borderRadius: "50%", background: "#818CF8", display: "inline-block", animation: "blink 1.2s infinite" },
  inputArea:  { flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" },
  inputRow:   { maxWidth: 700, margin: "0 auto", display: "flex", gap: 10 },
  input:      { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  sendBtn:    { background: "#818CF8", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  hint:       { color: "#334155", fontSize: 11, textAlign: "center", margin: "6px 0 0" },
};
