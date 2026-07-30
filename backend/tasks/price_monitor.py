"""
Price monitor — disabled until a real scraping service is integrated.

To enable: implement _fetch_current_price() with a real HTTP scraper
(e.g. Playwright, ScraperAPI, or Oxylabs), then register check_prices()
with APScheduler in main.py.
"""


def check_prices():
    """No-op until real price scraping is implemented."""
    print("[PRICE MONITOR] Disabled — implement _fetch_current_price() with a real scraper before enabling.")
