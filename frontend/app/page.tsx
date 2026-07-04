"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    router.push(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", background: "#0B0F19", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#94A3B8", fontFamily: "system-ui" }}>Loading...</p>
    </main>
  );
}
