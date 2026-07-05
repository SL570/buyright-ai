from datetime import datetime
from sqlalchemy.orm import Session
from models import AuditEvent


def log_event(
    db:      Session,
    action:  str,
    user_id: int | None = None,
    ip:      str | None = None,
    detail:  str | None = None,
) -> None:
    event = AuditEvent(
        user_id=user_id,
        action=action,
        ip_address=ip,
        detail=detail,
        created_at=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
