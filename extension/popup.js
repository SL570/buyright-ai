const APP_URL = "https://buyright-ai-ten.vercel.app";

// ── Helpers ────────────────────────────────────────────────────────────────

function show(id) { document.getElementById(id)?.classList.add("show"); }
function hide(id) { document.getElementById(id)?.classList.remove("show"); }

function showAlert(msg, type = "success") {
  const el = document.getElementById("alert");
  el.textContent = msg;
  el.className = `alert show ${type}`;
  setTimeout(() => el.classList.remove("show"), 3000);
}

function retailerEmoji(retailer) {
  const r = (retailer || "").toLowerCase();
  if (r.includes("amazon"))       return "📦";
  if (r.includes("best buy"))     return "🔵";
  if (r.includes("walmart"))      return "🟡";
  if (r.includes("target"))       return "🎯";
  if (r.includes("costco"))       return "🏬";
  if (r.includes("newegg"))       return "🖥";
  if (r.includes("sephora"))      return "🌸";
  if (r.includes("ulta"))         return "💄";
  if (r.includes("nordstrom"))    return "🛍";
  if (r.includes("macy"))         return "⭐";
  if (r.includes("fragrance"))    return "🌹";
  if (r.includes("jomashop"))     return "⌚";
  return "🛒";
}

function detectRetailerFromUrl(url) {
  if (url.includes("amazon"))       return "Amazon";
  if (url.includes("bestbuy"))      return "Best Buy";
  if (url.includes("walmart"))      return "Walmart";
  if (url.includes("target"))       return "Target";
  if (url.includes("costco"))       return "Costco";
  if (url.includes("newegg"))       return "Newegg";
  if (url.includes("sephora"))      return "Sephora";
  if (url.includes("ulta"))         return "Ulta";
  if (url.includes("nordstrom"))    return "Nordstrom";
  if (url.includes("macys"))        return "Macy's";
  if (url.includes("fragrancenet")) return "FragranceNet";
  if (url.includes("jomashop"))     return "Jomashop";
  return "Retailer";
}

// ── Token management ───────────────────────────────────────────────────────

function getToken() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "GET_TOKEN" }, r => resolve(r?.token || null));
  });
}

function saveToken(token) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "SAVE_TOKEN", token }, r => resolve(r?.ok));
  });
}

function clearToken() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "CLEAR_TOKEN" }, r => resolve(r?.ok));
  });
}

// ── Check current tab for product page ────────────────────────────────────

async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;

  const productPatterns = [
    /amazon\.(com|co\.uk|ca)\/dp\//,
    /amazon\.(com|co\.uk|ca)\/gp\/product\//,
    /bestbuy\.com\/site\//,
    /walmart\.com\/ip\//,
    /target\.com\/p\//,
    /costco\.com\/.*product/,
    /newegg\.com\/p\//,
    /sephora\.com\/product\//,
    /ulta\.com\/p\//,
    /nordstrom\.com\/s\//,
    /macys\.com\/shop\/product\//,
    /fragrancenet\.com\/(perfume|cologne)\//,
    /jomashop\.com\/.*\/product\//,
  ];

  const isProduct = productPatterns.some(p => p.test(tab.url));
  if (!isProduct) return null;

  // Try to get product info from content script
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "GET_PRODUCT" });
    return result?.product || { name: tab.title?.split(" - ")?.[0]?.slice(0, 60), retailer: detectRetailerFromUrl(tab.url), url: tab.url };
  } catch {
    // Content script might not be ready yet
    return { name: tab.title?.split(" - ")?.[0]?.slice(0, 60), retailer: detectRetailer(tab.url), url: tab.url };
  }
}


// ── UI render ──────────────────────────────────────────────────────────────

async function render() {
  const token = await getToken();

  if (token) {
    // Connected state
    show("connected-card");
    hide("connect-card");
    document.getElementById("status-dot").classList.add("connected");
  } else {
    // Not connected
    hide("connected-card");
    show("connect-card");
    document.getElementById("status-dot").classList.remove("connected");
  }

  // Check if we're on a product page
  const product = await checkCurrentTab();
  if (product?.name) {
    show("page-pill");
    document.getElementById("page-name").textContent = product.name;
    document.getElementById("page-retailer").textContent = product.retailer || "";
    document.getElementById("page-emoji").textContent = retailerEmoji(product.retailer);
  } else {
    hide("page-pill");
  }
}

// ── Events ────────────────────────────────────────────────────────────────

document.getElementById("btn-save").addEventListener("click", async () => {
  const input = document.getElementById("token-input");
  const token = input.value.trim();
  if (!token) { showAlert("Please paste your token first.", "error"); return; }

  const ok = await saveToken(token);
  if (ok) {
    input.value = "";
    showAlert("✓ Account connected!");
    render();
  } else {
    showAlert("Failed to save token.", "error");
  }
});

document.getElementById("btn-disconnect").addEventListener("click", async () => {
  await clearToken();
  showAlert("Disconnected.");
  render();
});

document.getElementById("btn-get-token").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/extension-connect` });
});

document.getElementById("btn-analyze").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  // Tell content script to open the widget panel and analyze
  chrome.tabs.sendMessage(tab.id, { type: "OPEN_AND_ANALYZE" });
  window.close();
});

// ── Token input — save on Enter ────────────────────────────────────────────

document.getElementById("token-input").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("btn-save").click();
});

// ── Boot ──────────────────────────────────────────────────────────────────

render();
