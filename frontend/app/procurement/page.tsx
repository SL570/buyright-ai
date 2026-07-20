"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import LoadingScreen from "../components/LoadingScreen";
import { AIMessage, JourneyStage } from "../components/AIMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BASE    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const ACCENT  = "#00F5D4";

const STARTERS = [
  "I need a gaming laptop under $1,200 for college by August",
  "Find me the best 65-inch TV under $800 this week",
  "I need noise-cancelling headphones under $300, mainly for flights",
  "Get me a standing desk and monitor setup for under $600",
];

const LOADING_MSGS: Record<string, string[]> = {
  tv:        ["Comparing panel types...", "Checking HDR and refresh rates...", "Looking for open box deals...", "Finding the best timing to buy...", "Almost done..."],
  laptop:    ["Running CPU benchmarks...", "Testing battery life claims...", "Checking student discounts...", "Comparing build quality...", "Almost done..."],
  headphone: ["Testing ANC performance...", "Checking flight compatibility...", "Comparing comfort for long trips...", "Finding the best value...", "Almost done..."],
  phone:     ["Comparing camera systems...", "Checking carrier deals...", "Looking at trade-in values...", "Testing battery claims...", "Almost done..."],
  desk:      ["Measuring ergonomic specs...", "Checking weight capacity...", "Comparing monitor arms...", "Finding the best bundle...", "Almost done..."],
  camera:    ["Comparing sensor performance...", "Checking lens compatibility...", "Looking at refurbished options...", "Reviewing firmware support...", "Almost done..."],
  default:   ["Comparing products across major retailers...", "Filtering out weak specs and bad reviews...", "Checking today's live prices...", "Weighing your budget and priorities...", "Finding hidden catches...", "Almost done..."],
};

function getMsgs(text: string): string[] {
  const t = text.toLowerCase();
  if (/\b(tv|television|oled|qled|4k|8k)\b/.test(t)) return LOADING_MSGS.tv;
  if (/\b(laptop|macbook|notebook|chromebook)\b/.test(t)) return LOADING_MSGS.laptop;
  if (/\b(headphone|earbud|airpod|speaker|anc|noise.cancel)\b/.test(t)) return LOADING_MSGS.headphone;
  if (/\b(phone|iphone|android|pixel|galaxy)\b/.test(t)) return LOADING_MSGS.phone;
  if (/\b(desk|monitor|keyboard|mouse|standing|office)\b/.test(t)) return LOADING_MSGS.desk;
  if (/\b(camera|lens|photography|mirrorless|dslr)\b/.test(t)) return LOADING_MSGS.camera;
  return LOADING_MSGS.default;
}

const JOURNEY_INIT: JourneyStage[] = [
  { label: "Product Found", done: false },
  { label: "Decision Made", done: false },
  { label: "Best Deal", done: false },
  { label: "Setup", done: false },
  { label: "Ownership", done: false },
];

function getChips(messages: Message[]): string[] {
  // Use WHY_PICKED category from AI response for accurate detection
  const lastAI = messages.filter(m => m.role === "assistant").pop()?.content ?? "";
  const wpMatch = lastAI.match(/WHY_PICKED:\s*\{[^}]*?"category"\s*:\s*"([^"]+)"/);
  const cat = wpMatch?.[1]?.toLowerCase() ?? "";

  // Fall back to first user message for category detection (not full conversation —
  // AI responses mention "screen", "4K", "display" for laptops which breaks TV detection)
  const firstUser = messages.find(m => m.role === "user")?.content.toLowerCase() ?? "";
  const lastUser  = messages.filter(m => m.role === "user").pop()?.content.toLowerCase() ?? "";

  if (/pay less|cheaper|discount|save|deal|open.?box|price|coupon/.test(lastUser)) {
    return ["💳 Best Cashback Card?", "📦 Open Box — Worth It?", "📉 Should I Wait for a Sale?"];
  }
  if (cat.includes("tv") || cat.includes("television") || /\b(tv|television|oled|qled)\b/.test(firstUser)) {
    return ["🔊 Best Soundbar?", "📺 Wall Mount Setup?", "🛋 Ideal Viewing Distance?", "📉 Track Price"];
  }
  if (cat.includes("laptop") || cat.includes("notebook") || /\b(laptop|notebook|macbook|chromebook)\b/.test(firstUser)) {
    return ["🎒 Best Backpack?", "🔌 USB-C Charger?", "🖱 Gaming Mouse?", "💾 SSD Upgrade?"];
  }
  if (cat.includes("phone") || /\b(phone|iphone|android|pixel|galaxy)\b/.test(firstUser)) {
    return ["📱 Best Case?", "🔋 Fast Charger?", "♻ Trade-In Value?", "📶 Best Carrier Deal?"];
  }
  if (cat.includes("headphone") || cat.includes("earbud") || /\b(headphone|earbud|airpod|anc|noise.cancel)\b/.test(firstUser)) {
    return ["✈ Flight Kit?", "📉 Track Price", "🛡 Warranty Worth It?", "📦 Open Box Deals?"];
  }
  if (cat.includes("desk") || cat.includes("monitor") || /\b(desk|monitor|standing|office)\b/.test(firstUser)) {
    return ["🖥 Best Monitor?", "💪 Monitor Arm?", "🎛 Cable Management?", "🪑 Best Chair?"];
  }
  if (cat.includes("camera") || /\b(camera|lens|mirrorless|dslr)\b/.test(firstUser)) {
    return ["🔭 Which Lens First?", "🎒 Best Camera Bag?", "📦 New vs Refurbished?", "🛡 Warranty Worth It?"];
  }
  return ["📦 Open Box Deals?", "📉 Should I Wait?", "💳 Best Cashback Card?"];
}

function getFollowups(messages: Message[], idx: number): string[] {
  if (idx !== messages.length - 1) return [];
  const msg = messages[idx];
  if (msg.role !== "assistant") return [];
  const naMatch = msg.content.match(/NEXT_ACTIONS:\s*(\[[\s\S]*?\])/);
  if (naMatch) {
    try {
      const actions = JSON.parse(naMatch[1]);
      if (Array.isArray(actions) && actions.length > 0) return actions as string[];
    } catch { /* fallthrough */ }
  }
  return getChips(messages.slice(0, idx + 1));
}

export default function ProcurementPage() {
  const router = useRouter();
  const { status } = useSession();

  const [token, setToken]           = useState("");
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS.default[0]);
  const activeMsgsRef = useRef(LOADING_MSGS.default);
  const [listening, setListening]   = useState(false);
  const [journey, setJourney]       = useState<JourneyStage[]>(JOURNEY_INIT);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const recogRef                    = useRef<any>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  useEffect(() => {
    if (!loading) { setLoadingMsg(activeMsgsRef.current[0]); return; }
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % activeMsgsRef.current.length; setLoadingMsg(activeMsgsRef.current[i]); }, 1800);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/sign-in"); return; }
    if (status === "authenticated") {
      fetch("/api/token")
        .then(r => r.json())
        .then(async d => {
          if (!d.token) { router.push("/sign-in"); return; }
          setToken(d.token);
          // 8-second timeout — if backend is cold-starting, default to subscribed=true
          // (the backend enforces subscription with 403 anyway, so this is safe)
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 8000);
            const res = await fetch(`${BASE_URL}/billing/status`, {
              headers: { Authorization: `Bearer ${d.token}` },
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            const data = await res.json();
            setSubscribed(data.subscribed ?? true);
          } catch {
            setSubscribed(true);
          }
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
    activeMsgsRef.current = getMsgs(userText);
    setLoadingMsg(activeMsgsRef.current[0]);
    const next: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/procurement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        const detail = err.detail;
        throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg || "Request failed" : "Request failed");
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
      // Update journey stages based on what was asked and what came back
      setJourney(prev => {
        const next = prev.map(s => ({ ...s }));
        const low = userText.toLowerCase();
        if (fullText.includes("END_PRODUCT_GRID")) {
          next[0].done = true;
          next[1].done = true;
        }
        if (/open.?box|cashback|price.?drop|discount|student|coupon|cheaper|save|negotiate/.test(low)) {
          next[2].done = true;
        }
        if (/soundbar|mount|cable|accessories|setup|keyboard|mouse|bag|case|lens|monitor|ergon/.test(low)) {
          next[3].done = true;
        }
        if (/warranty|after|return|refund|post.?purchase|broke|defect/.test(low)) {
          next[4].done = true;
        }
        return next;
      });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || !token || subscribed === null) return <LoadingScreen />;

  if (!subscribed) {
    return (
      <main style={S.page}>
        <div style={S.header}>
          <span style={S.brand}>BuyRight <span style={{ color: ACCENT }}>AI</span></span>
          <button onClick={() => signOut({ callbackUrl: "/sign-in" })} style={S.ghostBtn}>Sign out</button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <h2 style={{ color: "#F1F5F9", fontSize: 22, fontWeight: 700, margin: 0 }}>Pro feature</h2>
          <p style={{ color: "#94A3B8", fontSize: 14, maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
            Consumer Procurement is available on the Pro plan. Upgrade to get full AI-powered purchasing, fulfillment, and collective bargaining.
          </p>
          <Link href="/pricing" style={{ background: ACCENT, color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "13px 28px", fontWeight: 800, fontSize: 15, marginTop: 8 }}>
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
        <span style={S.brand}>BuyRight <span style={{ color: ACCENT }}>AI</span></span>
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
              {m.role === "user" ? (
                <div style={S.userBubble}>{m.content}</div>
              ) : (
                <div style={S.aiBubble}>
                  <AIMessage
                    content={m.content}
                    onFollowUp={send}
                    followups={getFollowups(messages, i)}
                    accent={ACCENT}
                    journeyStages={i === messages.length - 1 ? journey : undefined}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ ...S.msgRow, justifyContent: "flex-start" }}>
              <div style={S.avatar}>🛒</div>
              <div style={{ ...S.aiBubble, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: "#00F5D4", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ animation: "spin 1.2s linear infinite", display: "inline-block" }}>⟳</span>
                  {loadingMsg}
                </div>
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
            placeholder={listening ? "Listening..." : "What do you need to buy? Include budget and timeline..."}
            disabled={loading}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn}>Send</button>
        </div>
        <p style={S.hint}>Press 🎤 to speak · Powered by Claude</p>
      </div>

      <style>{`
        @keyframes blink { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
  avatar:     { width: 30, height: 30, borderRadius: "50%", background: "rgba(0,245,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 2 },
  userBubble: { background: "#1E293B", color: "#F1F5F9", borderRadius: "16px 16px 4px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, maxWidth: "80%", whiteSpace: "pre-wrap" },
  aiBubble:   { background: "rgba(0,245,212,0.05)", border: "1px solid rgba(0,245,212,0.15)", color: "#E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "14px 16px", fontSize: 14, maxWidth: "85%" },
  typing:     { display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" },
  dot:        { width: 7, height: 7, borderRadius: "50%", background: "#00F5D4", display: "inline-block", animation: "blink 1.2s infinite" },
  inputArea:  { flexShrink: 0, padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" },
  inputRow:   { maxWidth: 760, margin: "0 auto", display: "flex", gap: 10 },
  input:      { flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#F1F5F9", fontSize: 14, outline: "none" },
  micBtn:     { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0 14px", fontSize: 18, cursor: "pointer", flexShrink: 0 },
  sendBtn:    { background: "#00F5D4", color: "#0B0F19", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  hint:       { color: "#334155", fontSize: 11, textAlign: "center", margin: "6px 0 0" },
};
