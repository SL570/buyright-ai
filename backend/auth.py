from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User
from services.nextauth import verify_nextauth_token
from services.audit import log_event
from services.email import send_welcome_email
from services.sms import send_welcome_sms

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token   = credentials.credentials
    payload = verify_nextauth_token(token)
    email: str = payload.get("email", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No email in token",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        log_event(db, action="user_created", user_id=user.id, detail=f"email={email}")
        send_welcome_email(email)
        if user.phone:
            send_welcome_sms(user.phone)

    return user
