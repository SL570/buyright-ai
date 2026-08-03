import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — BuyRight AI",
  description: "BuyRight AI Privacy Policy. Learn how we collect, use, and protect your data.",
};

const SECTIONS = [
  { id: "overview", title: "Overview" },
  { id: "what-we-collect", title: "What We Collect" },
  { id: "how-we-use", title: "How We Use Your Data" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "cookies", title: "Cookies & Tracking" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "your-rights", title: "Your Rights" },
  { id: "children", title: "Children's Privacy" },
  { id: "international", title: "International Transfers" },
  { id: "third-parties", title: "Third-Party Providers" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact & DPO" },
];

export default function PrivacyPage() {
  return (
    <main style={S.page}>

      {/* Nav */}
      <nav style={S.nav}>
        <Link href="/" style={S.brand}>
          BuyRight <span style={{ color: "#0A84FF" }}>AI</span>
        </Link>
        <div style={S.navRight}>
          <Link href="/about" style={S.navLink}>About</Link>
          <Link href="/terms" style={S.navLink}>Terms</Link>
          <Link href="/sign-in" style={S.navCta}>Sign in →</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={S.pageHeader}>
        <div style={S.pill}>Legal</div>
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.headerMeta}>Effective date: January 1, 2025 · Last updated: July 2025</p>
      </div>

      {/* Core commitments */}
      <div style={S.commitWrap}>
        <div style={S.commitBox}>
          <p style={S.commitLabel}>Core Privacy Commitments</p>
          <div style={S.commitGrid}>
            {[
              { icon: "🚫", text: "We never sell your personal data to third parties" },
              { icon: "🔒", text: "Shopping queries are not used to train AI models" },
              { icon: "📭", text: "We do not send unsolicited marketing emails" },
              { icon: "🗑", text: "You can request full data deletion at any time" },
            ].map(c => (
              <div key={c.text} style={S.commitItem}>
                <span style={S.commitIcon}>{c.icon}</span>
                <span style={S.commitText}>{c.text}</span>
              </div>
            ))}
          </div>
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

          <section id="overview" style={S.sect}>
            <h2 style={S.h2}>1. Overview</h2>
            <p style={S.p}>BuyRight AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share information when you use our platform at buyrightai.com and related services (collectively, &quot;the Service&quot;).</p>
            <p style={S.p}>By using the Service, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Service.</p>
          </section>

          <section id="what-we-collect" style={S.sect}>
            <h2 style={S.h2}>2. What We Collect</h2>

            <h3 style={S.h3}>Information you provide</h3>
            <ul style={S.list}>
              <li style={S.li}><strong style={S.strong}>Account data:</strong> name, email address, and profile photo provided via OAuth (Google or GitHub)</li>
              <li style={S.li}><strong style={S.strong}>Shopping queries:</strong> products you ask about, price targets, and purchase preferences</li>
              <li style={S.li}><strong style={S.strong}>Feedback:</strong> thumbs up/down ratings and optional written feedback on AI recommendations</li>
              <li style={S.li}><strong style={S.strong}>Payment data:</strong> billing information is collected and stored by Stripe. We receive only a payment token — never your raw card number</li>
            </ul>

            <h3 style={S.h3}>Information collected automatically</h3>
            <ul style={S.list}>
              <li style={S.li}><strong style={S.strong}>Usage data:</strong> pages visited, features used, session duration, and interaction patterns</li>
              <li style={S.li}><strong style={S.strong}>Device data:</strong> browser type, operating system, IP address, and approximate location (country/region)</li>
              <li style={S.li}><strong style={S.strong}>Log data:</strong> server-side request logs including timestamps, endpoints, and response codes</li>
            </ul>

            <h3 style={S.h3}>Information we do not collect</h3>
            <p style={S.p}>We do not collect: Social Security numbers, government IDs, financial account credentials, health data, or any data from users under 18.</p>
          </section>

          <section id="how-we-use" style={S.sect}>
            <h2 style={S.h2}>3. How We Use Your Data</h2>

            <div style={S.table}>
              <div style={S.tableRow}>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Purpose</div>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Legal basis</div>
              </div>
              {[
                ["Provide and operate the Service", "Contract performance"],
                ["Personalize AI recommendations to your shopping history", "Legitimate interest"],
                ["Process Pro subscription payments via Stripe", "Contract performance"],
                ["Send transactional emails (receipts, alerts, account changes)", "Contract performance"],
                ["Improve AI model accuracy using aggregated, anonymized query data", "Legitimate interest"],
                ["Detect and prevent fraud, abuse, and security incidents", "Legitimate interest / legal obligation"],
                ["Comply with legal obligations and law enforcement requests", "Legal obligation"],
              ].map(([purpose, basis]) => (
                <div key={purpose} style={S.tableRow}>
                  <div style={S.tableCell}>{purpose}</div>
                  <div style={{ ...S.tableCell, color: "#0A84FF", fontWeight: 600 }}>{basis}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="data-sharing" style={S.sect}>
            <h2 style={S.h2}>4. Data Sharing</h2>
            <p style={S.p}><strong style={S.strong}>We do not sell your personal data.</strong> We share data only in these circumstances:</p>
            <ul style={S.list}>
              <li style={S.li}><strong style={S.strong}>Service providers:</strong> Stripe (payments), cloud hosting providers, and analytics services — bound by data processing agreements</li>
              <li style={S.li}><strong style={S.strong}>Retailers:</strong> When you authorize BuyRight AI Pro to negotiate or purchase on your behalf, we share only the minimum necessary information (product query, price target) with the relevant retailer</li>
              <li style={S.li}><strong style={S.strong}>Legal requests:</strong> When required by law, subpoena, court order, or to protect the rights and safety of BuyRight AI and its users</li>
              <li style={S.li}><strong style={S.strong}>Business transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred. You will be notified via email and given the opportunity to opt out</li>
            </ul>
          </section>

          <section id="cookies" style={S.sect}>
            <h2 style={S.h2}>5. Cookies &amp; Tracking</h2>
            <p style={S.p}>We use a minimal set of cookies necessary to operate the Service:</p>
            <div style={S.table}>
              <div style={S.tableRow}>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Cookie</div>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Purpose</div>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Duration</div>
              </div>
              {[
                ["next-auth.session-token", "Maintains your signed-in session", "30 days"],
                ["next-auth.csrf-token", "Prevents cross-site request forgery", "Session"],
                ["buyright-pref", "Stores UI preferences (e.g., last selected feature)", "1 year"],
              ].map(([name, purpose, duration]) => (
                <div key={name} style={S.tableRow}>
                  <div style={{ ...S.tableCell, fontFamily: "monospace", fontSize: 13, color: "#0A84FF" }}>{name}</div>
                  <div style={S.tableCell}>{purpose}</div>
                  <div style={{ ...S.tableCell, color: "#94A3B8" }}>{duration}</div>
                </div>
              ))}
            </div>
            <p style={{ ...S.p, marginTop: 16 }}>We do not use advertising cookies, cross-site tracking, or sell cookie data to data brokers. You can disable cookies in your browser settings, though some Service features may not function correctly.</p>
          </section>

          <section id="retention" style={S.sect}>
            <h2 style={S.h2}>6. Data Retention</h2>
            <div style={S.table}>
              <div style={S.tableRow}>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Data type</div>
                <div style={{ ...S.tableCell, ...S.tableCellHead }}>Retention period</div>
              </div>
              {[
                ["Account profile (name, email)", "Until account deletion + 30 days"],
                ["Shopping conversation history", "12 months of inactivity, then deleted"],
                ["Payment records", "7 years (legal/tax obligation)"],
                ["Server access logs", "90 days"],
                ["Feedback and ratings", "Aggregated after 24 months; identifiers removed"],
              ].map(([type, period]) => (
                <div key={type} style={S.tableRow}>
                  <div style={S.tableCell}>{type}</div>
                  <div style={{ ...S.tableCell, color: "#94A3B8" }}>{period}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="security" style={S.sect}>
            <h2 style={S.h2}>7. Security</h2>
            <p style={S.p}>We implement industry-standard security measures including encryption in transit (TLS 1.3), encrypted storage, access controls, and regular security reviews.</p>
            <p style={S.p}>No system is 100% secure. In the event of a data breach affecting your personal information, we will notify affected users within 72 hours of becoming aware, in accordance with applicable law.</p>
            <p style={S.p}>We recommend enabling two-factor authentication on your linked Google or GitHub account for additional protection.</p>
          </section>

          <section id="your-rights" style={S.sect}>
            <h2 style={S.h2}>8. Your Rights</h2>
            <p style={S.p}>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul style={S.list}>
              <li style={S.li}><strong style={S.strong}>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li style={S.li}><strong style={S.strong}>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li style={S.li}><strong style={S.strong}>Deletion:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
              <li style={S.li}><strong style={S.strong}>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li style={S.li}><strong style={S.strong}>Objection:</strong> Object to processing based on legitimate interests</li>
              <li style={S.li}><strong style={S.strong}>Restriction:</strong> Request that we limit the processing of your data</li>
              <li style={S.li}><strong style={S.strong}>Opt out of marketing:</strong> Unsubscribe from any non-transactional communications at any time</li>
            </ul>
            <p style={S.p}>To exercise any of these rights, email us at <a href="mailto:privacy@buyrightai.com" style={S.link}>privacy@buyrightai.com</a>. We will respond within 30 days.</p>
          </section>

          <section id="children" style={S.sect}>
            <h2 style={S.h2}>9. Children&apos;s Privacy</h2>
            <p style={S.p}>The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has created an account, we will promptly delete their data. If you believe a child has used our Service, contact us at privacy@buyrightai.com.</p>
          </section>

          <section id="international" style={S.sect}>
            <h2 style={S.h2}>10. International Data Transfers</h2>
            <p style={S.p}>BuyRight AI is operated from the United States. If you access the Service from outside the US, your data may be transferred to and processed in the US. We rely on Standard Contractual Clauses (SCCs) approved by the European Commission for transfers from the EEA, UK, or Switzerland.</p>
            <p style={S.p}>By using the Service, you consent to the transfer of your information to the US as described in this policy.</p>
          </section>

          <section id="third-parties" style={S.sect}>
            <h2 style={S.h2}>11. Third-Party Providers</h2>
            <p style={S.p}>Key third-party services we use and their privacy policies:</p>
            <ul style={S.list}>
              <li style={S.li}><strong style={S.strong}>Google (OAuth):</strong> <a href="https://policies.google.com/privacy" style={S.link} target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></li>
              <li style={S.li}><strong style={S.strong}>GitHub (OAuth):</strong> <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" style={S.link} target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a></li>
              <li style={S.li}><strong style={S.strong}>Stripe (payments):</strong> <a href="https://stripe.com/privacy" style={S.link} target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></li>
            </ul>
          </section>

          <section id="changes" style={S.sect}>
            <h2 style={S.h2}>12. Changes to This Policy</h2>
            <p style={S.p}>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and/or by posting a prominent notice in the Service at least 14 days before changes take effect.</p>
            <p style={S.p}>The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.</p>
          </section>

          <section id="contact" style={S.sect}>
            <h2 style={S.h2}>13. Contact &amp; Data Protection</h2>
            <p style={S.p}>For privacy-related inquiries, data subject requests, or to report a concern:</p>
            <div style={S.contactBox}>
              <p style={S.contactLine}><strong style={{ color: "#F1F5F9" }}>BuyRight AI — Privacy Team</strong></p>
              <p style={S.contactLine}>Email: <a href="mailto:privacy@buyrightai.com" style={S.link}>privacy@buyrightai.com</a></p>
              <p style={S.contactLine}>General support: <a href="mailto:support@buyrightai.com" style={S.link}>support@buyrightai.com</a></p>
              <p style={{ ...S.contactLine, marginTop: 8, fontSize: 13, color: "#475569" }}>We aim to respond to all privacy requests within 30 days.</p>
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
  page:         { minHeight: "100vh", background: "#0B0F19", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" },
  nav:          { width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", boxSizing: "border-box" },
  brand:        { color: "#F1F5F9", fontSize: 18, fontWeight: 700, textDecoration: "none" },
  navRight:     { display: "flex", gap: 20, alignItems: "center" },
  navLink:      { color: "#94A3B8", fontSize: 14, textDecoration: "none" },
  navCta:       { background: "rgba(10,132,255,0.08)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" },

  pageHeader:   { textAlign: "center", padding: "56px 24px 32px" },
  pill:         { display: "inline-block", background: "rgba(10,132,255,0.08)", color: "#0A84FF", border: "1px solid rgba(10,132,255,0.2)", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" },
  h1:           { color: "#F1F5F9", fontSize: 36, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" },
  headerMeta:   { color: "#475569", fontSize: 13, margin: 0 },

  commitWrap:   { width: "100%", maxWidth: 900, padding: "0 40px 40px", boxSizing: "border-box" },
  commitBox:    { background: "rgba(10,132,255,0.04)", border: "1px solid rgba(10,132,255,0.12)", borderRadius: 16, padding: "24px 28px" },
  commitLabel:  { color: "#0A84FF", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 16px" },
  commitGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  commitItem:   { display: "flex", alignItems: "flex-start", gap: 10 },
  commitIcon:   { fontSize: 16, flexShrink: 0, marginTop: 1 },
  commitText:   { color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 },

  body:         { width: "100%", maxWidth: 1100, display: "flex", gap: 48, padding: "0 40px 80px", boxSizing: "border-box", alignItems: "flex-start" },
  sidebar:      { width: 220, flexShrink: 0, position: "sticky", top: 32, display: "flex", flexDirection: "column", gap: 4 },
  tocLabel:     { color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 12px" },
  tocLink:      { display: "block", color: "#94A3B8", fontSize: 13, textDecoration: "none", padding: "5px 0", borderLeft: "2px solid transparent", paddingLeft: 12, lineHeight: 1.4 },

  content:      { flex: 1, minWidth: 0 },
  sect:         { marginBottom: 52, paddingTop: 8 },
  h2:           { color: "#F1F5F9", fontSize: 20, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.3px" },
  h3:           { color: "#E2E8F0", fontSize: 15, fontWeight: 600, margin: "20px 0 10px" },
  p:            { color: "#94A3B8", fontSize: 15, lineHeight: 1.75, margin: "0 0 16px" },
  list:         { margin: "0 0 16px", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 },
  li:           { color: "#94A3B8", fontSize: 15, lineHeight: 1.6, paddingLeft: 0 },
  strong:       { color: "#E2E8F0", fontWeight: 600 },
  link:         { color: "#0A84FF", textDecoration: "none" },

  table:        { border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  tableRow:     { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  tableCell:    { flex: 1, padding: "11px 16px", color: "#94A3B8", fontSize: 14, lineHeight: 1.5 },
  tableCellHead:{ color: "#475569", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(255,255,255,0.02)" },

  contactBox:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6 },
  contactLine:  { color: "#94A3B8", fontSize: 14, margin: 0 },

  footer:       { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box", flexWrap: "wrap", gap: 12 },
  footerCopy:   { color: "rgba(255,255,255,0.2)", fontSize: 12 },
  footerNav:    { display: "flex", gap: 20 },
  footerLink:   { color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" },
};
