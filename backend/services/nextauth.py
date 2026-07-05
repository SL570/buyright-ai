import os
from jose import jwt, JWTError
from fastapi import HTTPException, status

NEXTAUTH_SECRET = os.environ.get("NEXTAUTH_SECRET", "")


def verify_nextauth_token(token: str) -> dict:
    if not NEXTAUTH_SECRET:
        raise HTTPException(status_code=500, detail="NEXTAUTH_SECRET not configured")
    try:
        payload = jwt.decode(
            token,
            NEXTAUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )
