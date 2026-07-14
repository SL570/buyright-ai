"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSignIn(provider: string) {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/procurement" });
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0B0F19", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 800, margin: "0 0 6px", fontFamily: "system-ui", letterSpacing: "-0.5px" }}>
          BuyRight <span style={{ color: "#00F5D4" }}>AI</span>
        </h1>
        <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 36px", fontFamily: "system-ui" }}>
          Stop overpaying. Buy right, every time.
        </p>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: "#F1F5F9", fontSize: 15, fontWeight: 600, margin: "0 0 10px", fontFamily: "system-ui" }}>
            Sign in to continue
          </p>

          {/* Google */}
          <button
            onClick={() => handleSignIn("google")}
            disabled={!!loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#ffffff", border: "none", borderRadius: 10, padding: "13px 20px",
              color: "#1a1a1a", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "system-ui", opacity: loading === "google" ? 0.7 : 1, width: "100%",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.1 13.2 17.6 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.7 37.1 46.5 31.2 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.4 28.7c-.6-1.7-.9-3.5-.9-5.2s.3-3.5.9-5.2l-7.8-6C.9 15.1 0 19.4 0 24s.9 8.9 2.6 12.7l7.8-8z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.4 0-11.8-4.3-13.7-10.2l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
            </svg>
            {loading === "google" ? "Redirecting..." : "Continue with Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ color: "#334155", fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* GitHub */}
          <button
            onClick={() => handleSignIn("github")}
            disabled={!!loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "13px 20px", color: "#F1F5F9", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "system-ui",
              opacity: loading === "github" ? 0.7 : 1, width: "100%",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F1F5F9" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            {loading === "github" ? "Redirecting..." : "Continue with GitHub"}
          </button>
        </div>

        <p style={{ color: "#334155", fontSize: 12, marginTop: 20, fontFamily: "system-ui", lineHeight: 1.6 }}>
          New users are automatically registered on first sign-in.<br />
          No credit card required.
        </p>
      </div>
    </main>
  );
}
