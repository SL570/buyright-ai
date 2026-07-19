"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import LoadingScreen from "../components/LoadingScreen";
import { AIMessage } from "../components/AIMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const ACCENT = "#F87171";

const STARTERS = [
  "I bought a Sony TV at Best Buy for $799 last week — check if I can get a price match",
  "My Amazon order hasn't arrived and it's 5 days late — what do I do?",
  "I want to return a laptop I bought 28 days ago from Best Buy",
  "Track my order and alert me if the price drops so I can claim a refund",
];

const FOLLOWUPS = [
  "Write the price match claim email",
  "Draft a return request",
  "Escalate to a manager — write the script",
];

export default function FulfillmentPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken]     = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recogRef  = useRef<any>(null);

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

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported. Try Chrome."); return; }
    const r = new SR();
    recogRef.current = r;
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.onerror  = () => setListening(false);
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
      const res = await fetch(`${BASE}/fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || "Request failed");
      }
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let firstChunk = true;
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
              if (firstChunk) { setLoading(false); firstChunk = false; }
              fullText += parsed.text;
              setMessages([...next, { role: "assistant", content: fullText }]);
            }
          } catch (parseErr: any) {
            if (!(parseErr instanceof SyntaxError)) throw parseErr;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !token) return <LoadingScreen />;

  return (
    <main style={S.page}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/procurement" style={S.navLink}>Procurement</Link>
          <span style={S.divider}>|</span>
          <Link href="/group-deals" style={S.navLink}>Group Deals</Link>
          <span style={S.divider}>|</span>
          <Link href="/chat" style={S.navLink}>AI Advisor</Link>
        </div>
        <span style={S.brand}>BuyRight <span style={{ color: ACCENT }}>AI</span></span>
        <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
      </div>

      <div style={S.chatWrap}>
        <div style={S.chatInner}>
          {messages.length === 0 && (
            <div style={S.emptyState}>
              <div style={S.avatarLarge}>📦</div>
              <h2 style={S.emptyTitle}>Fulfillment & Post-Purchase</h2>
              <p style={S.emptySub}>
                Already bought something? I monitor price drops for refunds, handle returns, track late orders, and generate price match claims — so you never leave money on the table.
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
              {m.role === "assistant" && <div style={S.avatar}>📦</div>}
              {m.role === "user" ? (
                <div style={S.userBubble}>{m.content}</div>
              ) : (
                <div style={S.aiBubble}>
                  <AIMessage
                    content={m.content}
                    onFollowUp={send}
                    followups={i === messages.length - 1 ? FOLLOWUPS : []}
                    accent={ACCENT}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
              <div style={S.avatar}>📦</div>
              <div style={{ ...S.aiBubble, ...S.typing }}>
                <span style={S.dot} /><span style={{ ...S.dot, animationDelay: "0.2s" }} /><span style={{ ...S.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={S.inputArea}>
        <div style={S.inputRow}>
          <button onClick={startVoice} style={{ ...S.micBtn, background: listening ? `${ACCENT}40` : "rgba(255,255,255,0.05)" }} title="Voice input">🎤</button>
          <input
            style={S.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={listening ? "Listening..." : "Describe your order, return, or price match situation..."}
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
  chatInner:  { maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 16 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  avatarLarge:{ fontSize: 48, marginBottom: 8 },
  emptyTitle: { color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 },
  emptySub:   { color: "#94A3B8", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 460, lineHeight: 1.6 },
  starters:   { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 },
  starterBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 99, padding: "8px 16px", fontSize: 12, cursor: "pointer" },
  msgRow:     { display: "flex", gap: 10, alignItems: "flex-start" },
  avatar:     { width: 30, height: 30, borderRadius: "50%", background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 2 },
  userBubble: { background: "#1E293B", color: "#F1F5F9", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, maxWidth: "80%", whiteSpace: "pre-wrap" },
  aiBubble:   { background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", color: "#E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "14px 16px", fontSize: 14, maxWidth: "85%" },
  typing:     { display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" },
  dot:        { width: 7, height: 7, borderRadius: "50%", background: "#F87171", display: "inline-block", animation: "blink 1.2s infinite" },
  inputArea:  { flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" },
  inputRow:   { maxWidth: 760, margin: "0 auto", display: "flex", gap: 10 },
  input:      { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  micBtn:     { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0 14px", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  sendBtn:    { background: "#F87171", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  hint:       { color: "#334155", fontSize: 11, textAlign: "center", margin: "6px 0 0" },
};
