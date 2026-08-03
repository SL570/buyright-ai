import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — BuyRight AI",
  description: "BuyRight AI Terms of Service. Read before using our platform.",
};

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "description", title: "Description of Service" },
  { id: "eligibility", title: "Eligibility" },
  { id: "accounts", title: "User Accounts" },
  { id: "ai-disclaimer", title: "AI Recommendations Disclaimer" },
  { id: "purchases", title: "Purchases & Payments" },
  { id: "pro-subscription", title: "Pro Subscription" },
  { id: "prohibited", title: "Prohibited Uses" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact" },
];

export default function TermsPage() {
  return (
    <main style={S.page}>

      {/* Nav */}
      <nav style={S.nav}>
        <Link href="/" style={S.brand}>
          BuyRight <span style={{ color: "#0A84FF" }}>AI</span>
        </Link>
        <div style={S.navRight}>
          <Link href="/about" style={S.navLink}>About</Link>
          <Link href="/privacy" style={S.navLink}>Privacy</Link>
          <Link href="/sign-in" style={S.navCta}>Sign in →</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pill}>Legal</div>
        <h1 style={S.h1}>Terms of Service</h1>
        <p style={S.headerMeta}>Effective date: January 1, 2025 · Last updated: July 2025</p>
      </div>

      {/* Plain-English Summary */}
      <div style={S.summaryWrap}>
        <div style={S.summaryBox}>
          <p style={S.summaryLabel}>Plain-English summary</p>
          <p style={S.summaryText}>
            BuyRight AI provides shopping intelligence. Our AI gives recommendations — it doesn&apos;t guarantee outcomes. You&apos;re responsible for your own purchase decisions. Pro is $9/month, billed monthly, cancel anytime. We can suspend accounts that misuse the platform. Questions? Email us.
          </p>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={S.body}>

        {/* Sidebar TOC */}
        <aside style={S.sidebar}>
          <p style={S.tocLabel}>Table of Contents</p>
          <nav>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={S.tocLink}>{s.title}</a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article style={S.content}>

          <section id="acceptance" style={S.sect}>
            <h2 style={S.h2}>1. Acceptance of Terms</h2>
            <p style={S.p}>By accessing or using BuyRight AI (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service. These Terms constitute a legally binding agreement between you and BuyRight AI.</p>
            <p style={S.p}>Your continued use of the Service following any changes to these Terms constitutes acceptance of the revised Terms.</p>
          </section>

          <section id="description" style={S.sect}>
            <h2 style={S.h2}>2. Description of Service</h2>
            <p style={S.p}>BuyRight AI is a consumer shopping intelligence platform powered by artificial intelligence. The Service includes:</p>
            <ul style={S.list}>
              <li style={S.li}>Real-time price tracking and comparison across online retailers</li>
              <li style={S.li}>AI-generated buy, wait, or negotiate recommendations</li>
              <li style={S.li}>Automated negotiation communications with retailers (Pro tier)</li>
              <li style={S.li}>Consumer procurement assistance (Pro tier)</li>
              <li style={S.li}>Post-purchase fulfillment monitoring and return facilitation (Pro tier)</li>
              <li style={S.li}>Group and collective purchasing coordination (Pro tier)</li>
            </ul>
            <p style={S.p}>The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.</p>
          </section>

          <section id="eligibility" style={S.sect}>
            <h2 style={S.h2}>3. Eligibility</h2>
            <p style={S.p}>You must be at least 18 years of age to use the Service. By using BuyRight AI, you represent and warrant that you meet this requirement and that you have the legal capacity to enter into these Terms.</p>
            <p style={S.p}>If you are using the Service on behalf of a business, you represent that you have authority to bind that business to these Terms.</p>
          </section>

          <section id="accounts" style={S.sect}>
            <h2 style={S.h2}>4. User Accounts</h2>
            <p style={S.p}>You may access the Service via OAuth authentication (Google or GitHub). You are responsible for maintaining the security of your linked accounts and for all activity that occurs under your BuyRight AI account.</p>
            <p style={S.p}>You agree to: (a) provide accurate and complete information; (b) maintain the security of your credentials; (c) notify us immediately of any unauthorized account access; and (d) not share your account with others.</p>
            <p style={S.p}>We reserve the right to terminate accounts that violate these Terms or that have been inactive for an extended period.</p>
          </section>

          <section id="ai-disclaimer" style={S.sect}>
            <h2 style={S.h2}>5. AI Recommendations Disclaimer</h2>
            <p style={{ ...S.p, ...S.highlight }}>
              <strong>Important:</strong> BuyRight AI provides recommendations generated by artificial intelligence. These recommendations are informational only and do not constitute financial, legal, or professional advice. AI-generated information may be incomplete, inaccurate, or out of date.
            </p>
            <p style={S.p}>You are solely responsible for verifying any recommendations before making a purchase. BuyRight AI is not liable for purchases made based on AI-generated recommendations, price data, or verdicts.</p>
            <p style={S.p}>Price data is sourced from third-party retailers and may not reflect real-time availability or pricing. Historical pricing trends are informational estimates and do not guarantee future pricing behavior.</p>
          </section>

          <section id="purchases" style={S.sect}>
            <h2 style={S.h2}>6. Purchases &amp; Payments</h2>
            <p style={S.p}>When BuyRight AI Pro facilitates a purchase on your behalf, the underlying transaction is between you and the third-party retailer. BuyRight AI is not a party to those transactions and accepts no liability for retailer conduct, product quality, delivery failures, or return disputes.</p>
            <p style={S.p}>You authorize BuyRight AI to act as your agent when submitting negotiation communications or purchase orders on your behalf. You retain full responsibility for reviewing and approving any significant purchase before completion.</p>
          </section>

          <section id="pro-subscription" style={S.sect}>
            <h2 style={S.h2}>7. Pro Subscription</h2>
            <p style={S.p}>The Pro subscription is billed monthly at $9.00 USD. Payment is processed by Stripe. By subscribing, you authorize recurring monthly charges to your payment method until you cancel.</p>
            <p style={S.p}><strong>Cancellation:</strong> You may cancel your Pro subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial months.</p>
            <p style={S.p}><strong>Refunds:</strong> All subscription fees are non-refundable except where required by applicable law. If you believe you were charged in error, contact us within 30 days at support@buyrightai.com.</p>
            <p style={S.p}>We reserve the right to change pricing with 30 days&apos; advance notice. Continued use of the Service after the price change constitutes acceptance of the new pricing.</p>
          </section>

          <section id="prohibited" style={S.sect}>
            <h2 style={S.h2}>8. Prohibited Uses</h2>
            <p style={S.p}>You may not use BuyRight AI to:</p>
            <ul style={S.list}>
              <li style={S.li}>Violate any applicable law or regulation</li>
              <li style={S.li}>Fraudulently manipulate pricing data or retailer systems</li>
              <li style={S.li}>Scrape, copy, or redistribute our price data or AI outputs at scale</li>
              <li style={S.li}>Circumvent retailer terms of service in ways that violate those terms</li>
              <li style={S.li}>Attempt to reverse-engineer, decompile, or extract our AI models</li>
              <li style={S.li}>Abuse the negotiation feature by making bad-faith or harassing communications</li>
              <li style={S.li}>Use the Service for commercial resale without written permission</li>
              <li style={S.li}>Interfere with or disrupt the Service or its infrastructure</li>
            </ul>
          </section>

          <section id="intellectual-property" style={S.sect}>
            <h2 style={S.h2}>9. Intellectual Property</h2>
            <p style={S.p}>All content, features, and functionality of the Service — including software, text, graphics, logos, and AI models — are owned by BuyRight AI and protected by applicable intellectual property laws.</p>
            <p style={S.p}>You retain ownership of any content you submit to the Service. By submitting content, you grant BuyRight AI a non-exclusive, worldwide, royalty-free license to use that content to provide and improve the Service.</p>
          </section>

          <section id="third-party" style={S.sect}>
            <h2 style={S.h2}>10. Third-Party Services</h2>
            <p style={S.p}>The Service integrates with third-party services including but not limited to: Google (authentication), GitHub (authentication), Stripe (payments), and various retail price data providers. Your use of these third-party services is governed by their respective terms of service and privacy policies.</p>
            <p style={S.p}>BuyRight AI is not responsible for the availability, accuracy, or conduct of third-party services.</p>
          </section>

          <section id="liability" style={S.sect}>
            <h2 style={S.h2}>11. Limitation of Liability</h2>
            <p style={S.p}>To the maximum extent permitted by applicable law, BuyRight AI and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including lost profits, lost data, or lost savings — arising from your use of the Service.</p>
            <p style={S.p}>Our total aggregate liability to you for all claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or $50 USD, whichever is greater.</p>
            <p style={S.p}>Some jurisdictions do not allow certain liability exclusions. In such jurisdictions, our liability is limited to the fullest extent permitted by law.</p>
          </section>

          <section id="indemnification" style={S.sect}>
            <h2 style={S.h2}>12. Indemnification</h2>
            <p style={S.p}>You agree to indemnify, defend, and hold harmless BuyRight AI and its affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any purchase you make based on AI recommendations.</p>
          </section>

          <section id="termination" style={S.sect}>
            <h2 style={S.h2}>13. Termination</h2>
            <p style={S.p}>We may suspend or terminate your access to the Service at any time, with or without notice, if we reasonably believe you have violated these Terms or if required by law.</p>
            <p style={S.p}>Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive termination — including liability limitations, indemnification, and dispute resolution — shall survive.</p>
            <p style={S.p}>You may close your account at any time by contacting us at support@buyrightai.com.</p>
          </section>

          <section id="governing-law" style={S.sect}>
            <h2 style={S.h2}>14. Governing Law</h2>
            <p style={S.p}>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles.</p>
            <p style={S.p}>Any disputes arising from these Terms or the Service shall be resolved through binding arbitration under the American Arbitration Association&apos;s Consumer Arbitration Rules, except that either party may seek injunctive relief in court for intellectual property infringement or unauthorized access claims.</p>
          </section>

          <section id="changes" style={S.sect}>
            <h2 style={S.h2}>15. Changes to Terms</h2>
            <p style={S.p}>We may modify these Terms at any time. When we make material changes, we will notify you by email or by posting a prominent notice in the Service at least 14 days before the changes take effect.</p>
            <p style={S.p}>Your continued use of the Service after the effective date of revised Terms constitutes your acceptance of the changes.</p>
          </section>

          <section id="contact" style={S.sect}>
            <h2 style={S.h2}>16. Contact</h2>
            <p style={S.p}>If you have questions about these Terms, contact us at:</p>
            <div style={S.contactBox}>
              <p style={S.contactLine}><strong style={{ color: "#F1F5F9" }}>BuyRight AI</strong></p>
              <p style={S.contactLine}>Email: <a href="mailto:legal@buyrightai.com" style={S.contactLink}>legal@buyrightai.com</a></p>
              <p style={S.contactLine}>Support: <a href="mailto:support@buyrightai.com" style={S.contactLink}>support@buyrightai.com</a></p>
            </div>
          </section>

        </article>
      </div>

      {/* Footer */}
      <footer style={S.footer}>
        <span style={S.footerCopy}>© 2025 BuyRight AI. All rights reserved.</span>
        <nav style={S.footerNav}>
          <Link href="/about" style={S.footerLink}>About</Link>
          <Link href="/terms" style={S.footerLink}>Terms</Link>
          <Link href="/privacy" style={S.footerLink}>Privacy</Link>
        </nav>
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:         { minHeight: "100vh", background: "#0C1525", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
  nav:          { width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", boxSizing: "border-box" },
  brand:        { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  navRight:     { display: "flex", gap: 20, alignItems: "center" },
  navLink:      { color: "#94A3B8", fontSize: 14, textDecoration: "none" },
  navCta:       { background: "rgba(10,132,255,0.08)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" },

  pageHeader:   { textAlign: "center", padding: "56px 24px 32px" },
  pill:         { display: "inline-block", background: "rgba(10,132,255,0.08)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" },
  h1:           { color: "#F1F5F9", fontSize: 36, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" },
  headerMeta:   { color: "#475569", fontSize: 13, margin: 0 },

  summaryWrap:  { width: "100%", maxWidth: 800, padding: "0 40px 40px", boxSizing: "border-box" },
  summaryBox:   { background: "rgba(10,132,255,0.05)", border: "1px solid rgba(10,132,255,0.15)", borderRadius: 12, padding: "20px 24px" },
  summaryLabel: { color: "#0A84FF", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 8px" },
  summaryText:  { color: "#94A3B8", fontSize: 14, lineHeight: 1.7, margin: 0 },

  body:         { width: "100%", maxWidth: 1100, display: "flex", gap: 48, padding: "0 40px 80px", boxSizing: "border-box", alignItems: "flex-start" },
  sidebar:      { width: 220, flexShrink: 0, position: "sticky", top: 32, display: "flex", flexDirection: "column", gap: 4 },
  tocLabel:     { color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" },
  tocLink:      { display: "block", color: "#94A3B8", fontSize: 13, textDecoration: "none", padding: "5px 0", borderLeft: "2px solid transparent", paddingLeft: 12, lineHeight: 1.4 },

  content:      { flex: 1, minWidth: 0 },
  sect:         { marginBottom: 52, paddingTop: 8 },
  h2:           { color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.3px" },
  p:            { color: "#94A3B8", fontSize: 15, lineHeight: 1.75, margin: "0 0 16px" },
  list:         { margin: "0 0 16px", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  li:           { color: "#94A3B8", fontSize: 15, lineHeight: 1.6, paddingLeft: 20, position: "relative" },
  highlight:    { background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)", borderRadius: 8, padding: "14px 18px", color: "#CBD5E1" },

  contactBox:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6 },
  contactLine:  { color: "#94A3B8", fontSize: 14, margin: 0 },
  contactLink:  { color: "#0A84FF", textDecoration: "none" },

  footer:       { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box", flexWrap: "wrap", gap: 12 },
  footerCopy:   { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  footerNav:    { display: "flex", gap: 20 },
  footerLink:   { color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" },
};
