"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/procurement"); }, [router]);
  return (
    <main style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#94A3B8", fontFamily: "system-ui" }}>Loading...</p>
    </main>
  );
}
