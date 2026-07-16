import os
from upstash_redis import Redis
from upstash_ratelimit import Ratelimit, FixedWindow

_url   = os.getenv("UPSTASH_REDIS_REST_URL", "")
_token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

_user_ai_limiter = None
if _url and _token:
    _redis = Redis(url=_url, token=_token)
    # 10 AI requests per user per 60 seconds
    _user_ai_limiter = Ratelimit(redis=_redis, limiter=FixedWindow(max_requests=10, window=60))


def check_user_rate_limit(user_email: str) -> bool:
    """Returns True if allowed, False if this user has hit their per-user limit."""
    if not _user_ai_limiter:
        return True
    try:
        result = _user_ai_limiter.limit(f"user:{user_email}")
        return result.allowed
    except Exception:
        return True  # fail open — don't block users because Redis is down
