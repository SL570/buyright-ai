"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ExtensionConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/extension-connect");
    }
  }, [status, router]);

  async function fetchToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("Failed to generate token");
      const data = await res.json();
      setToken(data.token);
    } catch {
      setError("Could not generate token. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070B14" }}>
        <div style={{ width: 28, height: 28, border: "3px solid rgba(10,132,255,0.2)", borderTopColor: "#0A84FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const steps = [
    { n: "1", text: "Click \"Generate Token\" below to create your secure extension key." },
    { n: "2", text: "Copy the token that appears." },
    { n: "3", text: "Open the BuyRight AI extension in Chrome and paste the token when prompted." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070B14", color: "#F1F5F9", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#F1F5F9", fontWeight: 800, fontSize: 16 }}>
          BuyRight <span style={{ color: "#0A84FF" }}>AI</span>
        </Link>
        <Link href="/dashboard" style={{ textDecoration: "none", color: "#475569", fontSize: 13, fontWeight: 500 }}>
          ← Dashboard
        </Link>
      </nav>

      {/* Body */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Icon + heading */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20 }}>
              🔌
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 }}>
              Connect the Extension
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.6 }}>
              Signed in as <span style={{ color: "#94A3B8" }}>{session?.user?.email}</span>
            </p>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.25)", color: "#0A84FF", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {s.n}
                </div>
                <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>

          {/* Token card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 20px 16px" }}>
            {!token ? (
              <button
                onClick={fetchToken}
                disabled={loading}
                style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: loading ? "rgba(10,132,255,0.4)" : "#0A84FF", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s", fontFamily: "inherit" }}
              >
                {loading ? "Generating…" : "Generate Token"}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 8 }}>
                    Your Extension Token
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "11px 12px", fontFamily: "monospace", fontSize: 11, color: "#64748B", wordBreak: "break-all", lineHeight: 1.5, userSelect: "all" }}>
                    {token}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={copy}
                    style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: copied ? "rgba(0,245,212,0.15)" : "#0A84FF", color: copied ? "#00F5D4" : "#fff", border: copied ? "1px solid rgba(0,245,212,0.35)" : "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
                  >
                    {copied ? "Copied!" : "Copy Token"}
                  </button>
                  <button
                    onClick={() => { setToken(null); fetchToken(); }}
                    style={{ padding: "11px 16px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    title="Regenerate"
                  >
                    ↺
                  </button>
                </div>
              </>
            )}
            {error && (
              <p style={{ color: "#F87171", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</p>
            )}
          </div>

          <p style={{ color: "#1E293B", fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            Token valid for 30 days · Regenerate anytime · Never share this token
          </p>
        </div>
      </main>
    </div>
  );
}
