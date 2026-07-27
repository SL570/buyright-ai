// ── Product detection per retailer ────────────────────────────────────────

function detectProduct() {
  const url = window.location.href;

  if (/amazon\.(com|co\.uk|ca|de|fr|es|it|co\.jp)/.test(url)) {
    const name = document.querySelector("#productTitle")?.textContent?.trim()
      || document.querySelector(".product-title-word-break")?.textContent?.trim();
    const price =
      document.querySelector(".a-price .a-offscreen")?.textContent?.trim()
      || document.querySelector("#priceblock_ourprice")?.textContent?.trim()
      || document.querySelector("#priceblock_dealprice")?.textContent?.trim()
      || document.querySelector(".apexPriceToPay .a-offscreen")?.textContent?.trim();
    return name ? { name, price, retailer: "Amazon", url } : null;
  }

  if (url.includes("bestbuy.com")) {
    const name =
      document.querySelector(".sku-title h1")?.textContent?.trim()
      || document.querySelector('[class*="heading-5"]')?.textContent?.trim()
      || document.querySelector("h1")?.textContent?.trim();
    const price =
      document.querySelector(".priceView-customer-price span:first-child")?.textContent?.trim()
      || document.querySelector('[data-testid="customer-price"] span')?.textContent?.trim();
    return name ? { name, price, retailer: "Best Buy", url } : null;
  }

  if (url.includes("walmart.com")) {
    const name =
      document.querySelector('[itemprop="name"]')?.textContent?.trim()
      || document.querySelector('[class*="prod-ProductTitle"]')?.textContent?.trim()
      || document.querySelector("h1")?.textContent?.trim();
    const priceEl = document.querySelector('[itemprop="price"]');
    const price = priceEl
      ? `$${priceEl.getAttribute("content")}`
      : document.querySelector('[class*="price-characteristic"]')?.textContent?.trim();
    return name ? { name, price, retailer: "Walmart", url } : null;
  }

  if (url.includes("target.com")) {
    const name =
      document.querySelector('[data-test="product-title"]')?.textContent?.trim()
      || document.querySelector("h1")?.textContent?.trim();
    const price =
      document.querySelector('[data-test="product-price"]')?.textContent?.trim()
      || document.querySelector('[class*="CurrentPriceFinalPrice"]')?.textContent?.trim();
    return name ? { name, price, retailer: "Target", url } : null;
  }

  if (url.includes("costco.com")) {
    const name =
      document.querySelector(".product-title h1")?.textContent?.trim()
      || document.querySelector("h1")?.textContent?.trim();
    const price =
      document.querySelector(".your-price .value")?.textContent?.trim()
      || document.querySelector('[automation-id="purchasePanel"] .price")?.textContent?.trim();
    return name ? { name, price, retailer: "Costco", url } : null;
  }

  if (url.includes("newegg.com")) {
    const name =
      document.querySelector(".product-title")?.textContent?.trim()
      || document.querySelector("h1.product-title")?.textContent?.trim();
    const price =
      document.querySelector(".price-current strong")?.textContent?.trim();
    return name ? { name, price: price ? `$${price}` : null, retailer: "Newegg", url } : null;
  }

  return null;
}

// ── Widget HTML (injected into shadow DOM) ────────────────────────────────

const WIDGET_CSS = `
  :host {
    all: initial;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #0B0F19;
    border: 1px solid rgba(0,245,212,0.3);
    border-radius: 99px;
    padding: 9px 16px 9px 12px;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    transition: border-color 0.2s;
    user-select: none;
  }
  .pill:hover { border-color: rgba(0,245,212,0.6); }
  .pill-icon { font-size: 16px; }
  .pill-text { color: #F1F5F9; font-size: 13px; font-weight: 600; }
  .pill-badge {
    background: rgba(0,245,212,0.12);
    color: #00F5D4;
    font-size: 10px;
    font-weight: 800;
    border-radius: 99px;
    padding: 2px 8px;
  }
  .pill-spinner {
    width: 12px; height: 12px;
    border: 2px solid rgba(0,245,212,0.2);
    border-top-color: #00F5D4;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .panel {
    background: #0B0F19;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    width: 320px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    overflow: hidden;
    display: none;
  }
  .panel.open { display: block; margin-bottom: 10px; }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .panel-brand { color: #F1F5F9; font-size: 14px; font-weight: 800; }
  .panel-brand span { color: #00F5D4; }
  .panel-controls { display: flex; gap: 8px; }
  .panel-btn {
    background: none;
    border: none;
    color: #475569;
    cursor: pointer;
    font-size: 16px;
    padding: 2px 6px;
    border-radius: 6px;
    line-height: 1;
  }
  .panel-btn:hover { color: #94A3B8; background: rgba(255,255,255,0.05); }

  .panel-body { padding: 16px; }

  .product-name {
    color: #F1F5F9;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .verdict-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .verdict-badge {
    padding: 5px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.3px;
  }
  .verdict-BUY    { background: rgba(0,245,212,0.12); color: #00F5D4; border: 1px solid rgba(0,245,212,0.25); }
  .verdict-WAIT   { background: rgba(251,191,36,0.1);  color: #FBBF24; border: 1px solid rgba(251,191,36,0.25); }
  .verdict-NEGOTIATE { background: rgba(129,140,248,0.1); color: #818CF8; border: 1px solid rgba(129,140,248,0.25); }
  .verdict-ANALYZE { background: rgba(255,255,255,0.05); color: #94A3B8; border: 1px solid rgba(255,255,255,0.1); }

  .verdict-conf { color: #475569; font-size: 12px; }

  .reason-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 11px 13px;
    color: #94A3B8;
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 14px;
  }

  .price-row {
    display: flex;
    gap: 14px;
    margin-bottom: 14px;
  }
  .price-item { display: flex; flex-direction: column; gap: 2px; }
  .price-store { color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .price-val { color: #E2E8F0; font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }

  .panel-actions { display: flex; gap: 8px; }
  .btn-primary {
    flex: 1;
    background: #00F5D4;
    color: #0B0F19;
    border: none;
    border-radius: 9px;
    padding: 10px 0;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-secondary {
    background: rgba(255,255,255,0.05);
    color: #94A3B8;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 9px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .loading-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 0;
    color: #475569;
    font-size: 13px;
  }
  .loading-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(0,245,212,0.15);
    border-top-color: #00F5D4;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .error-box {
    padding: 14px 0;
    text-align: center;
  }
  .error-title { color: #F1F5F9; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .error-sub { color: #475569; font-size: 13px; line-height: 1.6; margin-bottom: 14px; }
  .btn-connect {
    display: inline-block;
    background: #00F5D4;
    color: #0B0F19;
    border: none;
    border-radius: 9px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
  }

  .panel-footer {
    border-top: 1px solid rgba(255,255,255,0.05);
    padding: 10px 16px;
    color: #1E293B;
    font-size: 11px;
    text-align: center;
  }
`;

// ── Widget controller ─────────────────────────────────────────────────────

class BuyRightWidget {
  constructor(product) {
    this.product = product;
    this.verdict = null;
    this.panelOpen = false;
    this.state = "idle"; // idle | loading | done | error

    this.host = document.createElement("div");
    this.shadow = this.host.attachShadow({ mode: "open" });
    document.body.appendChild(this.host);

    const style = document.createElement("style");
    style.textContent = WIDGET_CSS;
    this.shadow.appendChild(style);

    this.container = document.createElement("div");
    this.shadow.appendChild(this.container);

    this.render();

    // Auto-analyze after short delay
    setTimeout(() => this.analyze(), 1500);
  }

  render() {
    const truncName = this.product.name.length > 32
      ? this.product.name.slice(0, 32) + "…"
      : this.product.name;

    this.container.innerHTML = `
      <div class="panel ${this.panelOpen ? "open" : ""}" id="br-panel">
        <div class="panel-header">
          <span class="panel-brand">BuyRight <span>AI</span></span>
          <div class="panel-controls">
            <button class="panel-btn" id="br-refresh" title="Re-analyze">↺</button>
            <button class="panel-btn" id="br-close" title="Close">×</button>
          </div>
        </div>
        <div class="panel-body" id="br-body">
          ${this.renderBody()}
        </div>
        <div class="panel-footer">AI-generated · Always verify before buying</div>
      </div>

      <div class="pill" id="br-pill">
        <span class="pill-icon">🛒</span>
        <span class="pill-text">BuyRight AI</span>
        ${this.renderPillBadge()}
      </div>
    `;

    this.shadow.getElementById("br-pill").onclick = () => this.togglePanel();
    this.shadow.getElementById("br-close").onclick = () => this.closePanel();
    this.shadow.getElementById("br-refresh").onclick = () => this.analyze();

    const openBtn = this.shadow.getElementById("br-open-full");
    if (openBtn) {
      openBtn.onclick = () => {
        const q = encodeURIComponent(`Analyze: ${this.product.name}${this.product.price ? ` at ${this.product.price}` : ""} on ${this.product.retailer}`);
        window.open(`https://buyright-ai-ten.vercel.app/procurement?q=${q}`, "_blank");
      };
    }

    const connectBtn = this.shadow.getElementById("br-connect");
    if (connectBtn) {
      connectBtn.onclick = () => window.open("https://buyright-ai-ten.vercel.app/sign-in", "_blank");
    }
  }

  renderPillBadge() {
    if (this.state === "loading") return `<div class="pill-spinner"></div>`;
    if (this.state === "done" && this.verdict) {
      const labels = { BUY: "BUY NOW", WAIT: "WAIT", NEGOTIATE: "NEGOTIATE", ANALYZE: "…" };
      return `<span class="pill-badge">${labels[this.verdict.action] || "…"}</span>`;
    }
    return `<span class="pill-badge">Analyze</span>`;
  }

  renderBody() {
    if (this.state === "loading") {
      const msgs = [
        "Checking price history…",
        "Comparing 80+ retailers…",
        "Analyzing timing…",
        "Checking for hidden catches…",
      ];
      const msg = msgs[Math.floor(Date.now() / 1800) % msgs.length];
      return `
        <div class="loading-row">
          <div class="loading-spinner"></div>
          <span>${msg}</span>
        </div>
      `;
    }

    if (this.state === "error_not_connected") {
      return `
        <div class="error-box">
          <div class="error-title">Connect BuyRight AI</div>
          <div class="error-sub">Sign in to get instant buy / wait / negotiate verdicts on any product.</div>
          <button class="btn-connect" id="br-connect">Sign in →</button>
        </div>
      `;
    }

    if (this.state === "error_subscription") {
      return `
        <div class="error-box">
          <div class="error-title">Pro feature</div>
          <div class="error-sub">Upgrade to BuyRight AI Pro to unlock the extension.</div>
          <a class="btn-connect" href="https://buyright-ai-ten.vercel.app/pricing" target="_blank">View pricing →</a>
        </div>
      `;
    }

    if (this.state === "error") {
      return `
        <div class="error-box">
          <div class="error-title">Something went wrong</div>
          <div class="error-sub">Couldn't analyze this product. Check your connection and try again.</div>
          <button class="btn-connect" id="br-refresh-err" onclick="this.getRootNode().host.widget.analyze()">Try again →</button>
        </div>
      `;
    }

    if (this.state === "done" && this.verdict) {
      const v = this.verdict;
      const labels = { BUY: "✓ BUY NOW", WAIT: "⏳ WAIT", NEGOTIATE: "🤝 NEGOTIATE", ANALYZE: "— ANALYZING" };
      const confText = v.confidence ? `${v.confidence}% confidence` : "";

      return `
        <div class="product-name">${v.product}</div>
        <div class="verdict-row">
          <span class="verdict-badge verdict-${v.action}">${labels[v.action]}</span>
          ${confText ? `<span class="verdict-conf">${confText}</span>` : ""}
        </div>
        ${v.reason ? `<div class="reason-box">${v.reason}</div>` : ""}
        ${v.price ? `
          <div class="price-row">
            <div class="price-item">
              <span class="price-store">${v.retailer}</span>
              <span class="price-val">${v.price}</span>
            </div>
          </div>
        ` : ""}
        <div class="panel-actions">
          <button class="btn-primary" id="br-open-full">Full analysis →</button>
          <button class="btn-secondary" id="br-refresh">↺</button>
        </div>
      `;
    }

    return `<div class="loading-row"><span style="color:#334155">Ready to analyze</span></div>`;
  }

  togglePanel() {
    this.panelOpen = !this.panelOpen;
    this.render();
  }

  closePanel() {
    this.panelOpen = false;
    this.render();
  }

  analyze() {
    this.state = "loading";
    this.panelOpen = true;
    this.render();
    chrome.runtime.sendMessage({ type: "ANALYZE", product: this.product });
  }

  onStream(text) {
    // Update loading message while streaming
    this.render();
  }

  onDone(verdict) {
    this.verdict = verdict;
    this.state = "done";
    this.render();
  }

  onError(code) {
    if (code === "NOT_CONNECTED")          this.state = "error_not_connected";
    else if (code === "SUBSCRIPTION_REQUIRED") this.state = "error_subscription";
    else                                   this.state = "error";
    this.render();
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────

let widget = null;

function boot() {
  const product = detectProduct();
  if (!product || !product.name) return;

  widget = new BuyRightWidget(product);
  // Expose for error-state retry button
  widget.host.widget = widget;
}

// Wait for dynamic pages to settle
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 800));
} else {
  setTimeout(boot, 800);
}

// Listen for messages from background + popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "VERDICT_STREAM") { widget?.onStream(msg.text); return; }
  if (msg.type === "VERDICT_DONE")   { widget?.onDone(msg.verdict); return; }
  if (msg.type === "VERDICT_ERROR")  { widget?.onError(msg.error); return; }

  if (msg.type === "GET_PRODUCT") {
    sendResponse({ product: detectProduct() });
    return true;
  }

  if (msg.type === "OPEN_AND_ANALYZE") {
    if (widget) {
      widget.analyze();
    } else {
      boot(); // create widget if not yet created
      setTimeout(() => widget?.analyze(), 900);
    }
    return;
  }
});
