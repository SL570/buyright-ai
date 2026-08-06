import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuyRight AI — Your Free AI Shopping Advisor",
  description: "Get a data-backed Buy / Wait / Negotiate verdict in seconds. Free AI that researches products, compares live prices across 80+ retailers, and finds hidden catches before you buy.",
  keywords: "AI shopping assistant, buy or wait, price comparison, best price finder, product recommendation AI, shopping advisor",
  openGraph: {
    title: "BuyRight AI — Your Free AI Shopping Advisor",
    description: "Describe what you want to buy. Get a buy/wait/negotiate verdict with live prices, hidden catches flagged, and the best moment to act. 100% free.",
    type: "website",
    siteName: "BuyRight AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuyRight AI — Free AI Shopping Advisor",
    description: "Buy smarter. Not harder. Free AI that tells you when to buy, where to buy, and what to avoid.",
  },
  robots: "index, follow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* @ts-ignore — Impact uses non-standard value attr */}
        <meta name="impact-site-verification" value="06fe8312-c6d5-412b-a275-f8900f0d6eec" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
