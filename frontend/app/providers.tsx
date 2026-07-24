"use client";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://buyright-ai.onrender.com";

function BackendWarmup() {
  useEffect(() => {
    // Fire-and-forget ping so the Render server wakes before the user needs data
    fetch(`${BASE}/`, { method: "GET" }).catch(() => {});
  }, []);
  return null;
}

function PostHogInit() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        <BackendWarmup />
        <PostHogInit />
        {children}
      </PostHogProvider>
    </SessionProvider>
  );
}
