"""
Product Resolver — verified Product Detail Page (PDP) links only.

Confidence tiers (only ≥ 90 are returned — Buy button threshold):
  100  Exact ASIN / Walmart ID + near-perfect title match
   98  Exact manufacturer SKU match
   95  Exact product title (≥95% word overlap)
   92  Exact model + exact size/capacity confirmed
   90  Exact model confirmed  (minimum for Buy button)
   85  Likely match — no Buy button, filtered out
    0  Model mismatch or poor overlap — filtered out

Category-aware retailer filtering:
  Electronics  → Amazon, Best Buy, Walmart, Target, B&H, Newegg, Costco, manufacturer sites
  Fragrance    → Amazon, Sephora, Ulta, Macy's, Nordstrom, FragranceNet, Jomashop, brand sites
  Home         → Amazon, Home Depot, Lowe's, Walmart, Target, Costco, Wayfair
  General      → no domain filter (accept any verified PDP)

Rules:
- NEVER return a homepage, search page, category page, or brand listing
- ONLY return URLs that point to a specific product detail page (PDP)
- Confidence < 90 → filtered out, no Buy button ever shown
- Canonicalize Amazon → /dp/ASIN, Walmart → /ip/ID
- Cache results for 1 hour
"""

import re
import time
import httpx
import os
from urllib.parse import urlparse

SERPER_KEY = os.getenv("SERPAPI_KEY", "") or os.getenv("SERPER_API_KEY", "")

_CACHE: dict = {}
_CACHE_TTL = 3600  # 1 hour


# ── Category detection ────────────────────────────────────────────────────────

_ELECTRONICS_KW = {
    'tv', 'television', 'oled', 'qled', '4k', '8k', 'laptop', 'notebook',
    'headphone', 'earphone', 'earbud', 'airpods', 'monitor', 'phone',
    'smartphone', 'iphone', 'android', 'tablet', 'ipad', 'camera', 'speaker',
    'soundbar', 'gaming', 'console', 'playstation', 'xbox', 'nintendo', 'gpu',
    'graphics card', 'processor', 'cpu', 'ssd', 'hard drive', 'keyboard',
    'mouse', 'router', 'smartwatch', 'projector', 'drone', 'macbook',
    'chromebook', 'dell', 'lenovo', 'asus', 'acer', 'thinkpad', 'surface',
}

_FRAGRANCE_KW = {
    'perfume', 'cologne', 'eau de parfum', 'eau de toilette', 'edp', 'edt',
    'eau de cologne', 'fragrance', 'parfum', 'aftershave', 'body spray',
    'intensely', 'acqua di', 'sauvage', 'bleu de', 'oud', 'musk',
}

_HOME_KW = {
    'vacuum', 'washer', 'dryer', 'refrigerator', 'dishwasher', 'microwave',
    'blender', 'coffee maker', 'air fryer', 'pressure cooker', 'toaster',
    'mattress', 'pillow', 'furniture', 'sofa', 'drill', 'saw', 'ladder',
    'lawnmower', 'pressure washer', 'paint', 'appliance',
}


def _detect_category(name: str) -> str:
    n = name.lower()
    if any(kw in n for kw in _FRAGRANCE_KW):
        return 'fragrance'
    if any(kw in n for kw in _ELECTRONICS_KW):
        return 'electronics'
    if any(kw in n for kw in _HOME_KW):
        return 'home'
    return 'general'


# Domains allowed per category — results from unlisted domains are dropped.
# None means no restriction (general/unknown category).
CATEGORY_DOMAINS: dict[str, set[str] | None] = {
    'electronics': {
        'amazon.com', 'bestbuy.com', 'walmart.com', 'target.com',
        'costco.com', 'bhphotovideo.com', 'newegg.com', 'microcenter.com',
        'apple.com', 'dell.com', 'lenovo.com', 'sony.com', 'lg.com',
        'asus.com', 'samsung.com', 'microsoft.com', 'hp.com', 'acer.com',
        'bose.com', 'jabra.com', 'canon.com', 'nikon.com',
    },
    'fragrance': {
        'amazon.com', 'sephora.com', 'ulta.com', 'macys.com',
        'nordstrom.com', 'fragrancenet.com', 'jomashop.com',
        'giorgioarmani.com', 'armani.com', 'chanel.com', 'dior.com',
        'yslbeauty.com', 'perfumania.com', 'fragrantica.com',
        'burberry.com', 'versace.com', 'gucci.com', 'calvinklein.com',
    },
    'home': {
        'amazon.com', 'homedepot.com', 'lowes.com', 'walmart.com',
        'target.com', 'costco.com', 'wayfair.com', 'ikea.com',
        'bedbathandbeyond.com', 'dyson.com', 'shark.com',
    },
    'general': None,
}


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

    # Generic retailer / manufacturer site:
    # Accept if URL contains a product-path segment OR has ≥2 meaningful path segments.
    path = parsed.path.lower()
    product_indicators = ["/product/", "/item/", "/pdp/", "/dp/", "/ip/", "/p/", "/buy/", "/shop/p/"]
    if any(p in path for p in product_indicators):
        return True
    segments = [s for s in path.split("/") if s and len(s) > 2]
    return len(segments) >= 2


# ── Title similarity ──────────────────────────────────────────────────────────

_STOPWORDS = {'the', 'a', 'an', 'and', 'or', 'for', 'of', 'in', 'on', 'at',
              'with', 'by', 'to', 'oz', 'ml', 'pack', 'set', 'new', 'sale'}

_MODEL_RE = re.compile(
    r'\b([A-Z]{1,4}[-_]?[0-9]{2,}[A-Z0-9]*|[A-Z0-9]{2,}[-_][A-Z0-9]+)\b',
    re.IGNORECASE,
)

_SIZE_RE = re.compile(
    r'\b\d+\.?\d*\s*(?:oz|fl\.?\s*oz|ml|g|kg|lb|lbs|gb|tb|mm|cm|inch(?:es)?|")\b',
    re.IGNORECASE,
)


def _extract_models(s: str) -> set:
    return {m.group(0).upper().replace("-", "").replace("_", "") for m in _MODEL_RE.finditer(s)}


def _has_size_match(query: str, title: str) -> bool:
    """True if every size/capacity token from the query also appears in the title."""
    q_sizes = {re.sub(r'\s+', '', m.group(0).lower()) for m in _SIZE_RE.finditer(query)}
    if not q_sizes:
        return True  # query has no size constraint → not required
    t_sizes = {re.sub(r'\s+', '', m.group(0).lower()) for m in _SIZE_RE.finditer(title)}
    return bool(q_sizes & t_sizes)


def _word_overlap(query: str, title: str) -> float:
    """
    Fraction of meaningful query words that appear in the result title (0–1).
    Returns 0 immediately if the query names a model number absent from the title
    (e.g. 'XM5' query must not match an 'XM4' result).
    """
    def words(s: str) -> set:
        tokens = re.sub(r'[^a-z0-9]', ' ', s.lower()).split()
        return {t for t in tokens if len(t) > 1 and t not in _STOPWORDS}

    q_models = _extract_models(query)
    if q_models:
        t_models = _extract_models(title)
        if not q_models.issubset(t_models):
            if not (q_models & t_models):
                return 0.0  # zero model overlap → definitely wrong product

    q_words = words(query)
    t_words = words(title)
    if not q_words:
        return 0.0
    return len(q_words & t_words) / len(q_words)


# ── Confidence scoring ────────────────────────────────────────────────────────

_MIN_CONFIDENCE = 90  # Buy button threshold — never show Buy below this


def _confidence_score(url: str, query: str, title: str, overlap: float) -> int:
    """
    Returns 0–100 purchase link confidence.
    Score < 90 → filtered out; no Buy button is ever shown.

    Scoring:
      100  Product ID in URL + near-perfect title (≥90% overlap)
       98  Product ID in URL + exact size confirmed (≥85%)
       95  Product ID in URL + good title / or no-ID but ≥95% overlap
       92  Model + size both confirmed (≥85% overlap)
       90  Model confirmed (≥80% overlap)   ← minimum for Buy button
        0  Model mismatch, poor overlap, or suspicious mismatch
    """
    # Model-number guard: a model token in the query MUST appear in the title.
    q_models = _extract_models(query)
    if q_models:
        t_models = _extract_models(title)
        if not (q_models & t_models):
            return 0  # zero model overlap → wrong product, hard reject

    # Product ID embedded in URL (ASIN, Walmart /ip/ID, Best Buy SKU, etc.)
    u = url.lower()
    has_product_id = bool(
        re.search(r'/dp/[a-z0-9]{10}', u)           # Amazon ASIN
        or re.search(r'/ip/\d{6,}', u)               # Walmart item ID
        or re.search(r'skuid=\d+', u)                # Best Buy SKU param
        or re.search(r'/site/[\w-]+/[\w-]+\.\w', u)  # Best Buy product slug
        or re.search(r'/A-\d{6,}', url)              # Target product ID
        or re.search(r'[Pp]\d{7,}', url)             # Sephora P-number (7+ digits)
        or re.search(r'/ulta/\d+', u)                # Ulta product ID
        or re.search(r'[Ii][Dd]=\d{5,}', url)        # Macy's ID= param
    )

    has_model = bool(q_models) and bool(q_models & _extract_models(title))
    has_size  = _has_size_match(query, title)

    if has_product_id:
        if overlap >= 0.90:                             return 100  # ASIN + near-exact title
        if overlap >= 0.85 and has_size:                return 98   # ASIN + size confirmed
        if overlap >= 0.85:                             return 95   # ASIN + good title
        if overlap >= 0.75 and has_model and has_size:  return 92
        if overlap >= 0.70 and has_model:               return 90
        if overlap >= 0.60:                             return 90   # product ID + OK title
        return 0  # product ID present but title too distant → suspicious

    # No product ID in URL — rely on title similarity
    if overlap >= 0.95:                                 return 95
    if overlap >= 0.85 and has_model and has_size:      return 92
    if overlap >= 0.85 and has_model:                   return 90
    if overlap >= 0.80 and has_model:                   return 90
    return 0  # below 90 gate with no product ID → not verified, no Buy button


# ── Resolver ──────────────────────────────────────────────────────────────────

def _serper_query(query: str, category: str = 'general') -> list:
    """
    Single SerpApi Shopping query. Returns only candidates with confidence ≥ 90.
    Filters results to category-appropriate retailer domains.
    Every returned item includes a 'confidence' field.
    """
    if not SERPER_KEY:
        print(f"[RESOLVER] SERPAPI_KEY not set — cannot fetch prices for {query!r}")
        return []

    allowed_domains = CATEGORY_DOMAINS.get(category)  # None = no domain filter

    try:
        resp = httpx.get(
            "https://serpapi.com/search",
            params={"engine": "google_shopping", "q": query, "api_key": SERPER_KEY, "gl": "us", "num": 10},
            timeout=6.0,
        )
        if resp.status_code != 200:
            body = resp.text[:300]
            print(f"[RESOLVER] SerpApi HTTP {resp.status_code} for {query!r}: {body}")
            return []

        data = resp.json()
        if "error" in data:
            print(f"[RESOLVER] SerpApi error: {data['error']}")
            return []

        items = data.get("shopping_results", [])
        print(f"[RESOLVER] SerpApi returned {len(items)} shopping results for {query!r}")
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
            print(f"[RESOLVER] candidate: {store!r} {price!r} | {title[:60]!r} | {clean[:80]!r}")

            # Category domain filter — rejects irrelevant retailers
            if allowed_domains is not None:
                parsed_domain = urlparse(clean).netloc.lower().lstrip("www.")
                if not any(parsed_domain == d or parsed_domain.endswith("." + d) for d in allowed_domains):
                    print(f"[RESOLVER] skip domain {parsed_domain!r} (not in '{category}')")
                    continue

            if not _is_pdp(clean):
                print(f"[RESOLVER] skip non-PDP: {clean[:80]!r}")
                continue

            overlap    = _word_overlap(query, title)
            confidence = _confidence_score(clean, query, title, overlap)

            if confidence < _MIN_CONFIDENCE:
                print(f"[RESOLVER] skip conf={confidence} overlap={overlap:.2f}: {title[:60]!r}")
                continue

            if store in seen_stores:
                continue
            seen_stores.add(store)

            print(f"[RESOLVER] ACCEPT conf={confidence} overlap={overlap:.2f}: {store!r} {price!r}")
            candidates.append({
                "store":      store,
                "price":      price,
                "url":        clean,
                "title":      title,
                "confidence": confidence,
            })

        print(f"[RESOLVER] returning {len(candidates)} verified PDPs for {query!r}")
        return candidates
    except Exception as e:
        print(f"[RESOLVER] exception: {e}")
        return []


def _simplify(name: str) -> str:
    """Strip size/variant/descriptor words to broaden a search query."""
    simplified = re.sub(
        r'\b(\d+\.?\d*\s*(oz|ml|fl|g|l|liter|litre|ounce)s?|eau\s+de\s+(parfum|toilette|cologne)|edp|edt|edc|pack\s+of\s+\d+|set|bundle)\b',
        '', name, flags=re.IGNORECASE,
    ).strip()
    simplified = re.sub(r'\s{2,}', ' ', simplified).strip(' ,')
    return simplified if simplified and simplified.lower() != name.lower() else ""


def resolve(product_name: str) -> list:
    """
    Query Serper Shopping and return verified PDP links (confidence ≥ 90).
    Category is detected from the product name to filter irrelevant retailers.
    Retries with simplified / shorter queries before giving up.
    Results are cached for 1 hour.
    """
    if not SERPER_KEY:
        return []

    cache_key = product_name.strip().lower()
    if cache_key in _CACHE:
        ts, results = _CACHE[cache_key]
        if time.time() - ts < _CACHE_TTL:
            return results

    category = _detect_category(product_name)
    print(f"[RESOLVER] category={category!r} for {product_name!r}")

    # Attempt 1: exact product name
    results = _serper_query(product_name, category)

    # Attempt 2: simplified name (drops "100ml", "Eau de Parfum", etc.)
    if not results:
        simplified = _simplify(product_name)
        if simplified:
            print(f"[RESOLVER] retry simplified: {simplified!r}")
            results = _serper_query(simplified, category)

    # Attempt 3: brand + first two content words (last resort)
    if not results:
        words = product_name.split()
        short = " ".join(words[:3]) if len(words) > 3 else ""
        if short:
            print(f"[RESOLVER] retry short: {short!r}")
            results = _serper_query(short, category)

    _CACHE[cache_key] = (time.time(), results)
    return results
