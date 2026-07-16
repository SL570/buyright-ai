import os
import jwt
from fastapi import HTTPException, status

NEXTAUTH_SECRET = os.environ.get("NEXTAUTH_SECRET", "")


def verify_nextauth_token(token: str) -> dict:
    if not NEXTAUTH_SECRET:
        raise HTTPException(status_code=500, detail="Auth not configured")
    try:
        payload = jwt.decode(
            token,
            NEXTAUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
