# BuyRight AI — Chrome Extension

AI shopping verdicts directly on product pages. Detects Amazon, Best Buy, Walmart, Target, Costco, and Newegg product pages and shows a floating panel with a **BUY / WAIT / NEGOTIATE** verdict.

## Load in Chrome (Developer Mode)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this `extension/` folder

## Connect your account

1. Click the BuyRight AI extension icon
2. Click **"Get your token from BuyRight AI"** — opens the token page
3. Copy the token shown
4. Paste it in the extension and click **Save**

## How it works

- Detects product pages automatically on supported retailers
- After 1.5s, sends the product name + price to the BuyRight AI backend
- Shows a floating widget with verdict, confidence %, and one-line reason
- Click **"Full analysis →"** to open the complete recommendation in the app

## Supported retailers

- Amazon (amazon.com)
- Best Buy (bestbuy.com)
- Walmart (walmart.com)
- Target (target.com)
- Costco (costco.com)
- Newegg (newegg.com)

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension config (MV3) |
| `background.js` | Service worker — API calls, token storage |
| `content.js` | Product detection + floating widget |
| `popup.html/js` | Extension popup UI |
