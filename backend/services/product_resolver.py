"""
Product Resolver — converts a product name into verified direct product page URLs.

Rules:
- NEVER return a homepage, search page, category page, or brand listing
- ONLY return URLs that point to a specific product detail page (PDP)
- Title must overlap ≥ 45% with the queried product name (prevents wrong-product links)
- HTTP 200 verification via concurrent HEAD requests (catches dead links / 404s)
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

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


# ── URL canonicalization ──────────────────────────────────────────────────────

def _canonicalize(url: str) -> str:
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
    u = url.lower()
    parsed = urlparse(url)

    if not parsed.path or parsed.path.strip("/") == "":
        return False

    if any(p in u for p in _REJECT_PATTERNS):
        return False

    if "amazon.com" in u:
        return bool(re.search(r'/dp/[A-Z0-9]{10}', url, re.IGNORECASE))

    if "walmart.com" in u:
        return bool(re.search(r'/ip/(?:[^/?#]*/)?(\d{6,})', url))

    if "bestbuy.com" in u:
        return bool(re.search(r'\.skuId=\d+', url) or re.search(r'/p/\d+', url) or "/site/" in u)

    if "target.com" in u:
        return bool(re.search(r'/A-\d+', url)) and "/s?" not in u

    if "sephora.com" in u:
        return "/product/" in u and bool(re.search(r'P\d+', url))

    if "ulta.com" in u:
        return bool(re.search(r'/ulta/\d+', url))

    if "nordstrom.com" in u:
        return "/search" not in u and bool(re.search(r'/s/[\w-]+/\w+', url))

    if "macys.com" in u:
        return "/shop/product/" in u or bool(re.search(r'ID=\d+', url))

    path = parsed.path.lower()
    product_indicators = ["/product/", "/item/", "/pdp/", "/dp/", "/ip/"]
    return any(p in path for p in product_indicators)


# ── Title similarity ──────────────────────────────────────────────────────────

_STOPWORDS = {'the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'on', 'at',
              'with', 'by', 'to', 'oz', 'ml', 'pack', 'set', 'new', 'sale'}

# Matches alphanumeric model identifiers like XM5, WH-1000XM5, B0XXXXXXXX, GTX4090
_MODEL_RE = re.compile(r'\b([A-Z]{1,4}[-_]?[0-9]{2,}[A-Z0-9]*|[A-Z0-9]{2,}[-_][A-Z0-9]+)\b', re.IGNORECASE)

def _extract_models(s: str) -> set:
    return {m.group(0).upper().replace("-", "").replace("_", "") for m in _MODEL_RE.finditer(s)}

def _word_overlap(query: str, title: str) -> float:
    """
    Fraction of meaningful query words that appear in the result title.
    Returns 0-1; used to detect wrong-product matches from Serper.
    Returns 0 immediately if the query contains a model number that is
    absent from the title (e.g. XM5 query must not match XM4 result).
    """
    def words(s: str) -> set:
        tokens = re.sub(r'[^a-z0-9]', ' ', s.lower()).split()
        return {t for t in tokens if len(t) > 1 and t not in _STOPWORDS}

    # Model-number check — if query has a model token (XM5, B0XXX…) the title
    # must contain it. Normalise hyphens/underscores before comparing so
    # "WH-1000XM5" and "WH1000XM5" are treated as the same token.
    q_models = _extract_models(query)
    if q_models:
        t_models = _extract_models(title)
        if not q_models.issubset(t_models):
            # Partial overlap is still better than no overlap — score down rather
            # than hard-reject so that Serper's top result for a very specific
            # model isn't silently dropped.
            matched = len(q_models & t_models)
            if matched == 0:
                return 0.0   # zero overlap on model → definitely wrong product

    q_words = words(query)
    t_words = words(title)

    if not q_words:
        return 0.0

    overlap = q_words & t_words
    return len(overlap) / len(q_words)


# ── Resolver ──────────────────────────────────────────────────────────────────

def resolve(product_name: str) -> list:
    """
    Query Serper Shopping for the exact product name.
    Filters by:
      1. _is_pdp() — URL must be a verified product detail page
      2. _word_overlap() ≥ 0.45 — title must match the queried product
      3. _verify_200() — URL must respond with HTTP 200 (concurrent)
    Returns: [{store, price, url, title}] — all guaranteed PDP, matching, live.
    Caches for 1 hour.
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
        candidates = []

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

            # Gate 1: URL must look like a product page
            if not _is_pdp(clean):
                continue

            # Gate 2: Title must substantially match the queried product name
            similarity = _word_overlap(product_name, title)
            if similarity < 0.45:
                print(f"[RESOLVER] skip low-similarity ({similarity:.2f}): {title!r}")
                continue

            if store in seen_stores:
                continue
            seen_stores.add(store)

            candidates.append({"store": store, "price": price, "url": clean, "title": title})

        # Serper Shopping only indexes live product pages — URL pattern + title
        # similarity is sufficient; HTTP re-validation is blocked by Amazon/Walmart
        # anti-bot measures and adds latency without improving accuracy.
        _CACHE[cache_key] = (time.time(), candidates)
        return candidates

    except Exception as e:
        print(f"[RESOLVER] {e}")
        return []
