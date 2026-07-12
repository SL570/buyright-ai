"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function SuccessContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const sessionId = searchParams.get("session_id");
    if (!sessionId) { setError("No session found."); return; }

    fetch("/api/token")
      .then(r => r.json())
      .then(async d => {
        if (!d.token) { router.push("/sign-in"); return; }
        const res = await fetch(`${BASE}/billing/activate?session_id=${sessionId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${d.token}` },
        });
        if (res.ok) {
          setActivated(true);
        } else {
          const data = await res.json();
          setError(data.detail || "Activation failed.");
        }
      })
      .catch(() => setError("Could not activate subscription."));
  }, [status, searchParams, router]);

  if (status === "loading" || (!activated && !error)) {
    return <p style={{ color: "#94A3B8" }}>Activating your subscription...</p>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
        <h1 style={{ color: "#F1F5F9", fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Something went wrong</h1>
        <p style={{ color: "#94A3B8", fontSize: 15, margin: "0 0 24px" }}>{error}</p>
        <Link href="/pricing" style={S.btn}>Back to pricing</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", maxWidth: 420 }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>You're subscribed!</h1>
      <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.6, margin: "0 0 32px" }}>
        Welcome to BuyRight AI Pro. You now have full access to Procurement, Fulfillment, and Collective Bargaining.
      </p>
      <Link href="/procurement" style={S.btn}>Start procuring →</Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main style={S.page}>
      <Suspense fallback={<p style={{ color: "#94A3B8" }}>Loading...</p>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24 },
  btn:  { background: "#00F5D4", color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 800, fontSize: 15, display: "inline-block" },
};
