from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)   # null for OAuth-only users
    clerk_id        = Column(String, unique=True, index=True, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    wishlist_items    = relationship("WishlistItem", back_populates="owner", cascade="all, delete")
    group_memberships = relationship("GroupDealMember", back_populates="user", cascade="all, delete")
    audit_events      = relationship("AuditEvent", back_populates="user", cascade="all, delete")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    url          = Column(String, nullable=False)
    price        = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    last_checked = Column(DateTime, nullable=True)

    ai_verdict    = Column(String, nullable=True)
    ai_reasoning  = Column(Text, nullable=True)
    ai_checked_at = Column(DateTime, nullable=True)

    owner         = relationship("User", back_populates="wishlist_items")
    price_history = relationship("PriceHistory", back_populates="item", cascade="all, delete")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id         = Column(Integer, primary_key=True, index=True)
    item_id    = Column(Integer, ForeignKey("wishlist_items.id"), nullable=False)
    price      = Column(Float, nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("WishlistItem", back_populates="price_history")


class GroupDeal(Base):
    __tablename__ = "group_deals"

    id                 = Column(Integer, primary_key=True, index=True)
    product_name       = Column(String, nullable=False)
    product_url        = Column(String, nullable=False)
    current_price      = Column(Float, nullable=False)
    target_price       = Column(Float, nullable=False)
    target_members     = Column(Integer, default=5)
    status             = Column(String, default="forming")  # forming | active | expired
    negotiation_script = Column(Text, nullable=True)
    created_by         = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at         = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User")
    members = relationship("GroupDealMember", back_populates="deal", cascade="all, delete")


class GroupDealMember(Base):
    __tablename__ = "group_deal_members"

    id            = Column(Integer, primary_key=True, index=True)
    group_deal_id = Column(Integer, ForeignKey("group_deals.id"), nullable=False)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at     = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("group_deal_id", "user_id", name="uq_deal_user"),)

    deal = relationship("GroupDeal", back_populates="members")
    user = relationship("User", back_populates="group_memberships")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    action     = Column(String, nullable=False)   # "user_created" | "wishlist_add" | etc.
    ip_address = Column(String, nullable=True)
    detail     = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_events")
