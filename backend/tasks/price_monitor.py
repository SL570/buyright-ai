"""
Price monitor — runs hourly via APScheduler.
Simulates price fluctuation (±15%) for demo purposes.
In production, replace _fetch_current_price() with a real scraping service.
"""
import random
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal
from models import WishlistItem, PriceHistory, User
from services.email_service import send_price_drop_alert


def _fetch_current_price(url: str, last_known_price: float) -> float:
    """
    Demo: simulate market price fluctuation ±15%.
    Replace this function with a real price scraper in production.
    """
    fluctuation = random.uniform(-0.15, 0.15)
    new_price   = last_known_price * (1 + fluctuation)
    return round(max(new_price, 1.0), 2)


def check_prices():
    """Run once per hour — check all wishlist items for price changes."""
    db: Session = SessionLocal()
    try:
        items = db.query(WishlistItem).all()
        for item in items:
            try:
                new_price = _fetch_current_price(item.url, item.price)

                # Store in price history
                snapshot = PriceHistory(item_id=item.id, price=new_price)
                db.add(snapshot)

                # Check if price dropped below target
                if item.target_price and new_price <= item.target_price:
                    user = db.query(User).filter(User.id == item.user_id).first()
                    if user:
                        send_price_drop_alert(
                            to_email=user.email,
                            product_name=item.name,
                            product_url=item.url,
                            old_price=item.price,
                            new_price=new_price,
                            target_price=item.target_price,
                        )

                # Update item price and last_checked
                item.price        = new_price
                item.last_checked = datetime.utcnow()

            except Exception as e:
                print(f"[PRICE MONITOR] Error checking item {item.id}: {e}")

        db.commit()
        print(f"[PRICE MONITOR] Checked {len(items)} items at {datetime.utcnow().isoformat()}")

    except Exception as e:
        print(f"[PRICE MONITOR] Fatal error: {e}")
    finally:
        db.close()
