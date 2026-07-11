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
  "I need a gaming laptop under $1,200 for college by August",
  "Find me the best 65-inch TV under $800 this week",
  "I need noise-cancelling headphones under $300, mainly for flights",
  "Get me a standing desk and monitor setup for under $600",
];

export default function ProcurementPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken]           = useState("");
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [listening, setListening]   = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const recogRef                    = useRef<any>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(async d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          const res = await fetch(`${BASE_URL}/billing/status`, { headers: { Authorization: `Bearer ${d.token}` } });
          const data = await res.json();
          setSubscribed(data.subscribed);
        })
        .catch(() => router.push("/sign-in"));
    }
  }, [status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const next: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/procurement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !token || subscribed === null) {
    return <main style={S.page}><p style={{ color: "#94A3B8" }}>Loading...</p></main>;
  }

  if (!subscribed) {
    return (
      <main style={S.page}>
        <div style={S.header}>
          <span style={S.brand}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></span>
          <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <h2 style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 }}>Pro feature</h2>
          <p style={{ color: "#94A3B8", fontSize: 14, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
            Consumer Procurement is available on the Pro plan. Upgrade to get full AI-powered purchasing, fulfillment, and collective bargaining.
          </p>
          <Link href="/pricing" style={{ background: "#00F5D4", color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 800, fontSize: 15, marginTop: 8 }}>
            View pricing →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/group-deals" style={S.navLink}>Group Deals</Link>
          <span style={S.divider}>|</span>
          <Link href="/fulfillment" style={S.navLink}>Fulfillment</Link>
          <span style={S.divider}>|</span>
          <Link href="/chat" style={S.navLink}>AI Advisor</Link>
        </div>
        <span style={S.brand}>BuyRight <span style={{ color: "#00F5D4" }}>AI</span></span>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </div>

      <div style={S.chatWrap}>
        <div style={S.chatInner}>
          {messages.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.avatarLarge}>🛒</div>
              <h2 style={S.emptyTitle}>Consumer Procurement</h2>
              <p style={S.emptySub}>
                Tell me what you need to buy — budget, timeline, requirements. I'll research options, compare prices, and handle the entire purchase process for you.
              </p>
              <div style={S.starters}>
                {STARTERS.map(s => (
                  <button key={s} onClick={() => send(s)} style={S.starterBtn}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ ...S.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && <div style={S.avatar}>🛒</div>}
              <div style={m.role === "user" ? S.userBubble : S.aiBubble}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
              <div style={S.avatar}>🛒</div>
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
          <button onClick={startVoice} style={{ ...S.micBtn, background: listening ? "rgba(0,245,212,0.3)" : "rgba(255,255,255,0.05)" }} title="Voice input">🎤</button>
          <input
            style={S.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? "Listening..." : "What do you need to buy? Include budget and timeline..."}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn}>Send</button>
        </div>
        <p style={S.hint}>Press 🎤 to speak · Powered by Claude</p>
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
  navLink:    { color: "#94A3B8", fontSize: 13, textDecoration: "none" },
  divider:    { color: "#334155", fontSize: 13 },
  ghostBtn:   { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  chatWrap:   { flex: 1, overflowY: "auto", padding: "24px 16px 0" },
  chatInner:  { maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  avatarLarge:{ fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  emptySub:   { color: "#94A3B8", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 460, lineHeight: 1.6 },
  starters:   { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  starterBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 99, padding: "8px 16px", fontSize: 12, cursor: "pointer" },
  msgRow:     { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar:     { width: 30, height: 30, borderRadius: "50%", background: "rgba(0,245,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  userBubble: { background: "#1E293B", color: "#F1F5F9", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, maxWidth: "75%", whiteSpace: "pre-wrap" },
  aiBubble:   { background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.15)", color: "#E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", fontSize: 14, lineHeight: 1.7, maxWidth: "75%", whiteSpace: "pre-wrap" },
  typing:     { display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" },
  dot:        { width: 7, height: 7, borderRadius: "50%", background: "#00F5D4", display: "inline-block", animation: "blink 1.2s infinite" },
  inputArea:  { flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" },
  inputRow:   { maxWidth: 700, margin: "0 auto", display: "flex", gap: 10 },
  input:      { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  micBtn:     { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0 14px", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  sendBtn:    { background: "#00F5D4", color: "#0B0F19", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  hint:       { color: "#334155", fontSize: 11, textAlign: "center", margin: "6px 0 0" },
};
