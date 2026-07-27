const BACKEND = "https://buyright-ai.onrender.com";

// ── Token management ───────────────────────────────────────────────────────

async function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(["br_token"], r => resolve(r.br_token || null));
  });
}

async function saveToken(token) {
  return new Promise(resolve => {
    chrome.storage.local.set({ br_token: token }, resolve);
  });
}

// ── Product analysis ───────────────────────────────────────────────────────

async function analyzeProduct(product, tabId) {
  const token = await getToken();

  if (!token) {
    chrome.tabs.sendMessage(tabId, {
      type: "VERDICT_ERROR",
      error: "NOT_CONNECTED",
    });
    return;
  }

  const query = [
    `Quick verdict for: ${product.name}`,
    product.price ? `Current price: ${product.price} at ${product.retailer}` : `Retailer: ${product.retailer}`,
    "Give me: 1) BUY / WAIT / NEGOTIATE verdict, 2) confidence %, 3) one sentence reason, 4) best current price if different.",
    "Be brief and direct.",
  ].join(". ");

  try {
    const res = await fetch(`${BACKEND}/procurement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!res.ok) {
      const code = res.status === 403 ? "SUBSCRIPTION_REQUIRED" : "API_ERROR";
      chrome.tabs.sendMessage(tabId, { type: "VERDICT_ERROR", error: code });
      return;
    }

    if (!res.body) {
      chrome.tabs.sendMessage(tabId, { type: "VERDICT_ERROR", error: "API_ERROR" });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.text) {
            fullText += parsed.text;
            chrome.tabs.sendMessage(tabId, {
              type: "VERDICT_STREAM",
              text: fullText,
            });
          }
        } catch {}
      }
    }

    // Parse the final text into structured verdict
    const verdict = parseVerdict(fullText, product);
    chrome.tabs.sendMessage(tabId, { type: "VERDICT_DONE", verdict });

  } catch (err) {
    chrome.tabs.sendMessage(tabId, { type: "VERDICT_ERROR", error: "NETWORK_ERROR" });
  }
}

// ── Parse AI response into structured verdict ──────────────────────────────

function parseVerdict(text, product) {
  const upper = text.toUpperCase();

  let action = "ANALYZE";
  if (upper.includes("BUY NOW") || (upper.includes("BUY") && !upper.includes("WAIT") && !upper.includes("DON'T BUY"))) {
    action = "BUY";
  } else if (upper.includes("WAIT")) {
    action = "WAIT";
  } else if (upper.includes("NEGOTIATE")) {
    action = "NEGOTIATE";
  }

  const confMatch = text.match(/(\d{1,3})\s*%/);
  const confidence = confMatch ? parseInt(confMatch[1]) : null;

  // Extract first meaningful sentence as reason
  const sentences = text
    .replace(/[\*#`]/g, "")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);

  const reason = sentences.find(s =>
    !s.match(/^\d/) &&
    !s.toLowerCase().includes("verdict") &&
    !s.toLowerCase().includes("confidence")
  ) ?? sentences[0] ?? "";

  // Clean up the full text for display
  const cleanText = text
    .replace(/PRODUCT_GRID[\s\S]*?END_PRODUCT_GRID/g, "")
    .replace(/WHY_PICKED[\s\S]*?(?=\n\n|\n[A-Z]|$)/g, "")
    .replace(/NEXT_ACTIONS[\s\S]*/g, "")
    .replace(/[\*#`]/g, "")
    .trim()
    .slice(0, 400);

  return {
    action,
    confidence,
    reason: reason.slice(0, 140),
    fullText: cleanText,
    product: product.name,
    price: product.price,
    retailer: product.retailer,
  };
}

// ── Message router ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ANALYZE") {
    analyzeProduct(msg.product, sender.tab.id);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "SAVE_TOKEN") {
    saveToken(msg.token).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "GET_TOKEN") {
    getToken().then(t => sendResponse({ token: t }));
    return true;
  }

  if (msg.type === "CLEAR_TOKEN") {
    chrome.storage.local.remove(["br_token"], () => sendResponse({ ok: true }));
    return true;
  }
});
