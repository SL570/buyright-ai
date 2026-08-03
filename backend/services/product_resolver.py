"""
Product Resolver — converts a product name into verified direct product page URLs.

Rules:
- NEVER return a homepage, search page, category page, or brand listing
- ONLY return URLs that point to a specific product detail page (PDP)
- Canonicalize Amazon → /dp/ASIN, Walmart → /ip/ID
- Cache results for 1 hour
"""

import re
import time
import httpx
import os
from urllib.parse import urlparse

SERPER_KEY = os.getenv("SERPER_API_KEY", "")

_CACHE: dict = {}
_CACHE_TTL = 3600  # 1 hour


# ── URL canonicalization ──────────────────────────────────────────────────────

def _canonicalize(url: str) -> str:
    """Return the cleanest direct product page URL, or original if unrecognized."""
    u = url.lower()

    if "amazon.com" in u:
        m = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url, re.IGNORECASE)
        if m:
            return f"https://www.amazon.com/dp/{m.group(1)}"

    if "walmart.com" in u:
        m = re.search(r'/ip/(?:[^/?#]*/)?(\d{6,})', url)
        if m:
            return f"https://www.walmart.com/ip/{m.group(1)}"

    if "bestbuy.com" in u and ("/site/" in u or "/p/" in u):
        return url.split("?")[0]

    if "target.com" in u and "/p/" in u:
        return url.split("?")[0]

    if "sephora.com" in u and "/product/" in u:
        return url.split("?")[0]

    # Generic: strip query params if path looks like a product page
    path = urlparse(url).path.lower()
    if any(p in path for p in ["/product/", "/item/", "/dp/", "/ip/", "/p/", "/pdp/"]):
        return url.split("?")[0]

    return url


# ── Strict PDP validation ─────────────────────────────────────────────────────

_REJECT_PATTERNS = [
    "/s?k=", "/search?", "/searchpage.jsp", "/catalogsearch",
    "?q=", "?keyword=", "?searchTerm=", "/search?q=",
    "/category/", "/brand/", "/collection/", "/browse/", "/find/",
    "search.", "/shop/", "/wishlist", "/cart",
]

def _is_pdp(url: str) -> bool:
    """
    Return True only when the URL is a verified Product Detail Page.
    Rejects homepages, search results, category pages, and brand listings.
    """
    u = url.lower()
    parsed = urlparse(url)

    # Reject bare homepages
    if not parsed.path or parsed.path.strip("/") == "":
        return False

    # Reject known search / listing patterns
    if any(p in u for p in _REJECT_PATTERNS):
        return False

    # Amazon: must have ASIN in path
    if "amazon.com" in u:
        return bool(re.search(r'/dp/[A-Z0-9]{10}', url, re.IGNORECASE))

    # Walmart: must have numeric item ID
    if "walmart.com" in u:
        return bool(re.search(r'/ip/(?:[^/?#]*/)?(\d{6,})', url))

    # Best Buy: must have SKU or product path
    if "bestbuy.com" in u:
        return bool(re.search(r'\.skuId=\d+', url) or re.search(r'/p/\d+', url) or "/site/" in u)

    # Target: must have /A-\d+ product ID
    if "target.com" in u:
        return bool(re.search(r'/A-\d+', url)) and "/s?" not in u

    # Sephora: /product/ with P-prefixed ID
    if "sephora.com" in u:
        return "/product/" in u and bool(re.search(r'P\d+', url))

    # Ulta: /ulta/\d+ pattern
    if "ulta.com" in u:
        return bool(re.search(r'/ulta/\d+', url))

    # Nordstrom: product path without search
    if "nordstrom.com" in u:
        return "/search" not in u and bool(re.search(r'/s/[\w-]+/\w+', url))

    # Macy's: /shop/product/ path
    if "macys.com" in u:
        return "/shop/product/" in u or bool(re.search(r'ID=\d+', url))

    # Generic positive signals
    path = parsed.path.lower()
    product_indicators = ["/product/", "/item/", "/pdp/", "/dp/", "/ip/"]
    return any(p in path for p in product_indicators)


# ── Resolver ──────────────────────────────────────────────────────────────────

def resolve(product_name: str) -> list:
    """
    Query Serper Shopping for the exact product name.
    Return ONLY verified PDP URLs, deduplicated by retailer.
    Caches results for 1 hour.

    Returns: [{store, price, url, title}] — all URLs are guaranteed PDPs.
    """
    if not SERPER_KEY:
        return []

    cache_key = product_name.strip().lower()
    if cache_key in _CACHE:
        ts, results = _CACHE[cache_key]
        if time.time() - ts < _CACHE_TTL:
            return results

    try:
        resp = httpx.post(
            "https://google.serper.dev/shopping",
            headers={"X-API-KEY": SERPER_KEY, "Content-Type": "application/json"},
            json={"q": product_name, "num": 10, "gl": "us"},
            timeout=5.0,
        )
        if resp.status_code != 200:
            return []

        items = resp.json().get("shopping", [])
        seen_stores: set = set()
        results = []

        for item in items:
            store = item.get("source", "")
            price = item.get("price", "")
            link  = item.get("link", "")
            title = item.get("title", "")

            if not store or not price or not link:
                continue
            if "google.com" in link:
                continue

            clean = _canonicalize(link)

            # STRICT: only include verified product detail pages
            if not _is_pdp(clean):
                continue

            if store in seen_stores:
                continue
            seen_stores.add(store)

            results.append({"store": store, "price": price, "url": clean, "title": title})

        _CACHE[cache_key] = (time.time(), results)
        return results

    except Exception as e:
        print(f"[RESOLVER] {e}")
        return []
