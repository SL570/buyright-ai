"use client";

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <main style={{
      height: "100vh", background: "#0B0F19", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", fontFamily: "system-ui", gap: 24,
    }}>
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid rgba(0,245,212,0.1)",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#00F5D4",
          animation: "spin 0.8s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "rgba(0,245,212,0.4)",
          animation: "spin 1.2s linear infinite reverse",
        }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#00F5D4", fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: "0.5px" }}>
          BuyRight <span style={{ color: "#F1F5F9" }}>AI</span>
        </p>
        <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>{message}</p>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
