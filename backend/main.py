import json
import os
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

from database import engine, Base
from routers import auth as auth_router
from routers import wishlist as wishlist_router
from routers import group_deals as group_deals_router
from routers import chat as chat_router
from routers import procurement as procurement_router
from tasks.price_monitor import check_prices

load_dotenv()

# Create all tables
Base.metadata.create_all(bind=engine)

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["20/minute"])

app = FastAPI(title="BuyRight AI", version="2.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_origins = [
    "http://localhost:3000",
    "https://buyright-ai-ten.vercel.app",
]
if os.getenv("FRONTEND_URL"):
    url = os.getenv("FRONTEND_URL").rstrip("/")
    if url not in _origins:
        _origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(wishlist_router.router)
app.include_router(group_deals_router.router)
app.include_router(chat_router.router)
app.include_router(procurement_router.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred."},
    )


@app.get("/")
def root():
    return {"message": "BuyRight AI v2 — price monitoring, AI verdicts, collective bargaining"}


@app.get("/api/price-check")
@limiter.limit("20/minute")
def price_check(request: Request):
    return {"item": "Sample Laptop", "current_price": 799, "recommendation": "Wait 7 days"}


# ── Background price monitor ──────────────────────────────────────────
scheduler = BackgroundScheduler()
scheduler.add_job(check_prices, "interval", hours=1, id="price_monitor")
scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
