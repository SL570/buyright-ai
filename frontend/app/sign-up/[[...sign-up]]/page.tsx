import { SignUp } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary:         "#00F5D4",
    colorBackground:      "#111827",
    colorText:            "#F1F5F9",
    colorTextSecondary:   "#94A3B8",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText:       "#F1F5F9",
    colorNeutral:         "#94A3B8",
    borderRadius:         "10px",
    fontFamily:           "system-ui, -apple-system, sans-serif",
    fontSize:             "14px",
  },
  elements: {
    card:                         { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 0 60px rgba(0,245,212,0.04)" },
    headerTitle:                  { color: "#F1F5F9", fontWeight: "700" },
    headerSubtitle:               { color: "#94A3B8" },
    socialButtonsBlockButton:     { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#F1F5F9" },
    socialButtonsBlockButtonText: { color: "#F1F5F9" },
    dividerLine:                  { background: "rgba(255,255,255,0.08)" },
    dividerText:                  { color: "#64748B" },
    formFieldLabel:               { color: "#94A3B8" },
    formFieldInput:               { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F1F5F9" },
    formButtonPrimary:            { background: "#00F5D4", color: "#0B0F19", fontWeight: "700" },
    footerActionLink:             { color: "#00F5D4" },
    identityPreviewEditButton:    { color: "#00F5D4" },
    formFieldInputShowPasswordButton: { color: "#94A3B8" },
    otpCodeFieldInput:            { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#F1F5F9" },
  },
};

export default function SignUpPage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0B0F19",
      padding: "24px 16px",
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <h1 style={{ color: "#F1F5F9", fontSize: 26, fontWeight: 700, margin: "0 0 6px", fontFamily: "system-ui" }}>
          BuyRight <span style={{ color: "#00F5D4" }}>AI</span>
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 13, margin: 0, fontFamily: "system-ui" }}>
          Start tracking smarter — it's free
        </p>
      </div>
      <SignUp appearance={appearance} />
    </main>
  );
}
