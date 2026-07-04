from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import Optional, List
from datetime import datetime

TRUSTED_DOMAINS = {"amazon.com", "walmart.com", "bestbuy.com", "target.com"}


# ── Auth ──────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email:    EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserOut(BaseModel):
    id:         int
    email:      str
    created_at: datetime
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type:   str


# ── Wishlist ───────────────────────────────────────────────────────────
class WishlistItemCreate(BaseModel):
    name:         str
    url:          HttpUrl
    price:        float
    target_price: Optional[float] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_in_range(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        if v > 10_000:
            raise ValueError("Price cannot exceed $10,000")
        return v

    @field_validator("target_price")
    @classmethod
    def target_price_valid(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("Target price must be greater than 0")
            if v > 10_000:
                raise ValueError("Target price cannot exceed $10,000")
        return v

    @field_validator("url")
    @classmethod
    def url_trusted_domain(cls, v: HttpUrl) -> HttpUrl:
        host   = v.host or ""
        domain = host.removeprefix("www.")
        if domain not in TRUSTED_DOMAINS:
            raise ValueError(
                f"URL must be from a trusted retailer: {', '.join(sorted(TRUSTED_DOMAINS))}"
            )
        return v


class PriceHistoryOut(BaseModel):
    id:         int
    price:      float
    checked_at: datetime
    model_config = {"from_attributes": True}


class WishlistItemOut(BaseModel):
    id:            int
    name:          str
    url:           str
    price:         float
    target_price:  Optional[float]
    ai_verdict:    Optional[str]
    ai_reasoning:  Optional[str]
    ai_checked_at: Optional[datetime]
    last_checked:  Optional[datetime]
    created_at:    datetime
    model_config = {"from_attributes": True}


# ── Group Deals ────────────────────────────────────────────────────────
class GroupDealCreate(BaseModel):
    product_name:   str
    product_url:    HttpUrl
    current_price:  float
    target_price:   float
    target_members: int = 5

    @field_validator("product_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @field_validator("current_price", "target_price")
    @classmethod
    def price_valid(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        if v > 10_000:
            raise ValueError("Price cannot exceed $10,000")
        return v

    @field_validator("target_members")
    @classmethod
    def members_valid(cls, v: int) -> int:
        if v < 2:
            raise ValueError("Need at least 2 members for a group deal")
        if v > 100:
            raise ValueError("Target members cannot exceed 100")
        return v

    @field_validator("product_url")
    @classmethod
    def url_trusted(cls, v: HttpUrl) -> HttpUrl:
        host   = v.host or ""
        domain = host.removeprefix("www.")
        if domain not in TRUSTED_DOMAINS:
            raise ValueError(
                f"URL must be from a trusted retailer: {', '.join(sorted(TRUSTED_DOMAINS))}"
            )
        return v


class GroupDealOut(BaseModel):
    id:                 int
    product_name:       str
    product_url:        str
    current_price:      float
    target_price:       float
    target_members:     int
    status:             str
    negotiation_script: Optional[str]
    created_by:         int
    created_at:         datetime
    member_count:       int = 0
    is_member:          bool = False
    model_config = {"from_attributes": True}
