"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BuyRight AI</h1>
        <p style={styles.sub}>Create your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={styles.input}
            placeholder="Min. 8 characters"
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.foot}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0F19" },
  card:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 400 },
  title: { color: "#00F5D4", fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "system-ui" },
  sub:   { color: "#94A3B8", fontSize: 14, margin: "0 0 28px", fontFamily: "system-ui" },
  form:  { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "#94A3B8", fontSize: 12, fontWeight: 500, fontFamily: "system-ui" },
  input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#F1F5F9", fontSize: 14, fontFamily: "system-ui", outline: "none", marginBottom: 8 },
  error: { color: "#F87171", fontSize: 13, margin: "4px 0", fontFamily: "system-ui" },
  btn:   { marginTop: 8, background: "#00F5D4", color: "#0B0F19", border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "system-ui" },
  foot:  { marginTop: 20, textAlign: "center", fontSize: 13, color: "#94A3B8", fontFamily: "system-ui" },
  link:  { color: "#00F5D4", textDecoration: "none" },
};
