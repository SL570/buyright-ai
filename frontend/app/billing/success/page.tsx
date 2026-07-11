"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <h1 style={{ color: "#F1F5F9", fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>You're subscribed!</h1>
        <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.6, margin: "0 0 32px" }}>
          Welcome to BuyRight AI Pro. You now have full access to Procurement, Fulfillment, and Collective Bargaining.
        </p>
        <Link href="/procurement" style={{ background: "#00F5D4", color: "#0B0F19", textDecoration: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 800, fontSize: 15 }}>
          Start procuring →
        </Link>
      </div>
    </main>
  );
}
