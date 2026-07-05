import os
import time
import httpx
from jose import jwt, jwk, JWTError
from fastapi import HTTPException, status

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_JWKS_URL   = os.getenv("CLERK_JWKS_URL", "")

_cache: dict = {"keys": [], "fetched_at": 0.0}


def _load_jwks() -> None:
    if not CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL not configured")
    resp = httpx.get(CLERK_JWKS_URL, timeout=10)
    resp.raise_for_status()
    _cache["keys"]       = resp.json().get("keys", [])
    _cache["fetched_at"] = time.time()


def _get_key(kid: str):
    if time.time() - _cache["fetched_at"] > 3600 or not _cache["keys"]:
        _load_jwks()
    for k in _cache["keys"]:
        if k.get("kid") == kid:
            return jwk.construct(k)
    # Key not matched — JWKS may have rotated
    _load_jwks()
    for k in _cache["keys"]:
        if k.get("kid") == kid:
            return jwk.construct(k)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token signing key not found",
    )


def verify_clerk_token(token: str) -> dict:
    try:
        header  = jwt.get_unverified_header(token)
        pub_key = _get_key(header.get("kid", ""))
        payload = jwt.decode(
            token,
            pub_key.to_dict(),
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def fetch_clerk_user_email(clerk_id: str) -> str:
    """Fetch primary email from Clerk backend API (called once per new user)."""
    if not CLERK_SECRET_KEY:
        return f"{clerk_id}@clerk.user"
    try:
        resp = httpx.get(
            f"https://api.clerk.com/v1/users/{clerk_id}",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=10,
        )
        resp.raise_for_status()
        data     = resp.json()
        emails   = data.get("email_addresses", [])
        prim_id  = data.get("primary_email_address_id")
        for e in emails:
            if e.get("id") == prim_id:
                return e["email_address"]
        if emails:
            return emails[0]["email_address"]
    except Exception:
        pass
    return f"{clerk_id}@clerk.user"
