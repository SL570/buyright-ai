import json
import os
import time
import uuid
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from upstash_redis import Redis as UpstashRedis
from upstash_ratelimit import Ratelimit, FixedWindow

from database import engine, Base
from routers import auth as auth_router
from routers import wishlist as wishlist_router
from routers import group_deals as group_deals_router
from routers import chat as chat_router
from routers import procurement as procurement_router
from routers import billing as billing_router
from routers import history as history_router
from tasks.price_monitor import check_prices

load_dotenv()

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=False,
)

# Create all tables
Base.metadata.create_all(bind=engine)

# Upstash rate limiter (falls back to in-memory slowapi if not configured)
_upstash_url   = os.getenv("UPSTASH_REDIS_REST_URL", "")
_upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")
if _upstash_url and _upstash_token:
    _redis = UpstashRedis(url=_upstash_url, token=_upstash_token)
    ratelimit = Ratelimit(redis=_redis, limiter=FixedWindow(max_requests=20, window=60))
else:
    ratelimit = None

limiter = Limiter(key_func=get_remote_address, default_limits=["20/minute"])

app = FastAPI(title="BuyRight AI", version="2.0.0", docs_url=None, redoc_url=None, openapi_url=None)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    t0 = time.monotonic()
    response = await call_next(request)
    req_id = getattr(request.state, "request_id", "-")
    ip = request.client.host if request.client else "-"
    print(json.dumps({
        "ts":     datetime.utcnow().isoformat() + "Z",
        "req_id": req_id,
        "method": request.method,
        "path":   request.url.path,
        "status": response.status_code,
        "ip":     ip,
        "ms":     round((time.monotonic() - t0) * 1000),
    }), flush=True)
    return response


@app.middleware("http")
async def csrf_check_middleware(request: Request, call_next):
    # Stripe webhook uses its own HMAC — skip CSRF for it
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and \
            request.url.path != "/billing/webhook":
        origin = request.headers.get("origin", "")
        if origin:  # browsers always send Origin on cross-origin requests
            allowed = {o.rstrip("/") for o in _origins}
            if origin.rstrip("/") not in allowed:
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})
    return await call_next(request)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.middleware("http")
async def upstash_rate_limit_middleware(request: Request, call_next):
    if ratelimit:
        try:
            ip = request.client.host if request.client else "unknown"
            result = ratelimit.limit(ip)
            if not result.allowed:
                return JSONResponse(status_code=429, content={"detail": "Too many requests."})
        except Exception:
            pass
    return await call_next(request)

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
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router.router)
app.include_router(wishlist_router.router)
app.include_router(group_deals_router.router)
app.include_router(chat_router.router)
app.include_router(procurement_router.router)
app.include_router(billing_router.router)
app.include_router(history_router.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred."},
    )


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok"}


@app.get("/api/price-check")
@limiter.limit("20/minute")
def price_check(request: Request):
    return {"item": "Sample Laptop", "current_price": 799, "recommendation": "Wait 7 days"}


# ── Background price monitor ──────────────────────────────────────────
scheduler = BackgroundScheduler()
scheduler.add_job(check_prices, "interval", hours=1, id="price_monitor")
scheduler.start()


@app.on_event("startup")
def seed_pinecone():
    """Seed Pinecone knowledge base on first startup (no-op if already populated)."""
    try:
        from services.vector import index_is_empty
        from scripts.seed_knowledge import KNOWLEDGE, main as run_seed
        if index_is_empty():
            print("[PINECONE] Index empty — seeding knowledge base...")
            run_seed()
        else:
            print("[PINECONE] Knowledge base already seeded.")
    except Exception as e:
        print(f"[PINECONE] Startup seed skipped: {e}")


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
