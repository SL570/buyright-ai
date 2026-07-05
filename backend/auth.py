from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User
from services.clerk_auth import verify_clerk_token, fetch_clerk_user_email
from services.audit import log_event

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token    = credentials.credentials
    payload  = verify_clerk_token(token)
    clerk_id: str = payload.get("sub", "")

    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        email = fetch_clerk_user_email(clerk_id)
        user  = User(email=email, clerk_id=clerk_id)
        db.add(user)
        db.commit()
        db.refresh(user)
        log_event(db, action="user_created", user_id=user.id, detail=f"clerk_id={clerk_id}")

    return user
