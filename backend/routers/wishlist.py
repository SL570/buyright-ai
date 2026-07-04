from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, WishlistItem, PriceHistory
from schemas import WishlistItemCreate, WishlistItemOut, PriceHistoryOut
from auth import get_current_user
from services.ai_service import analyze_product

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def _run_ai_analysis(item_id: int, name: str, url: str, price: float):
    """Background task — analyze product with Claude and update the item."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        result = analyze_product(name, url, price)
        item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
        if item:
            item.ai_verdict    = result.get("verdict")
            item.ai_reasoning  = result.get("reasoning")
            item.ai_checked_at = datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"[AI] Error analyzing item {item_id}: {e}")
    finally:
        db.close()


@router.post("", response_model=WishlistItemOut, status_code=201)
def add_item(
    payload:          WishlistItemCreate,
    background_tasks: BackgroundTasks,
    db:               Session = Depends(get_db),
    user:             User    = Depends(get_current_user),
):
    item = WishlistItem(
        name=payload.name,
        url=str(payload.url),
        price=payload.price,
        target_price=payload.target_price,
        user_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Store initial price snapshot
    snapshot = PriceHistory(item_id=item.id, price=payload.price)
    db.add(snapshot)
    db.commit()

    # Run AI analysis in background (non-blocking)
    background_tasks.add_task(_run_ai_analysis, item.id, item.name, item.url, item.price)

    return item


@router.get("", response_model=List[WishlistItemOut])
def get_wishlist(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    return db.query(WishlistItem).filter(WishlistItem.user_id == user.id).all()


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    item = db.query(WishlistItem).filter(
        WishlistItem.id == item_id,
        WishlistItem.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.get("/{item_id}/history", response_model=List[PriceHistoryOut])
def get_price_history(
    item_id: int,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    item = db.query(WishlistItem).filter(
        WishlistItem.id == item_id,
        WishlistItem.user_id == user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return (
        db.query(PriceHistory)
        .filter(PriceHistory.item_id == item_id)
        .order_by(PriceHistory.checked_at.asc())
        .all()
    )
