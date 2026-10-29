"""Validated checkout and private order access. No catalogue or seed writes."""
import asyncio
import hashlib
import hmac
import json
import os
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from itertools import product as combinations
from typing import Annotated, Literal, Optional, get_args
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/api")
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Money = Annotated[Decimal, Field(ge=0, le=10000000, max_digits=12, decimal_places=2, allow_inf_nan=False)]
Stage = Literal[
    "order_placed", "payment_pending", "payment_confirmed", "sourcing_from_india",
    "received_at_india_hub", "shipped_to_maldives", "arrived_in_male",
    "sent_to_island_courier", "out_for_delivery", "delivered",
]
STAGES = get_args(Stage)


class OrderItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: UUID
    quantity: Annotated[int, Field(strict=True, ge=1, le=99)] = 1
    variant: Optional[Text] = None


class OrderPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    customer_name: Text
    customer_phone: Annotated[str, StringConstraints(pattern=r"^\+?[0-9][0-9 ()-]{6,24}$")]
    customer_email: Optional[EmailStr] = None
    island: Text
    address_line: Annotated[str, StringConstraints(min_length=1, max_length=500)]
    notes: Annotated[str, StringConstraints(max_length=2000)] = ""
    payment_method: Text
    items: Annotated[list[OrderItem], Field(min_length=1, max_length=100)]
    expected_total_mvr: Money

    @field_validator("customer_email", mode="before")
    @classmethod
    def empty_email(cls, value):
        return None if value == "" else value

    @field_validator("items")
    @classmethod
    def unique_lines(cls, items):
        keys = [(item.product_id, item.variant) for item in items]
        if len(set(keys)) != len(keys):
            raise ValueError("Duplicate product/variant lines are not allowed")
        return items


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fulfillment_status: Stage
    expected_status: Stage


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(503, "Order storage is not configured")
    return db


def supabase_settings():
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise HTTPException(503, "Store service is not configured")
    return url, key


class Catalog:
    async def select(self, table, params):
        url, key = supabase_settings()
        headers = {"apikey": key}
        if key.count(".") == 2:  # Legacy anon JWT; publishable keys are not JWTs.
            headers["Authorization"] = f"Bearer {key}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{url}/rest/v1/{table}", params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                raise ValueError("Invalid catalogue response")
            return data
        except (httpx.HTTPError, ValueError):
            raise HTTPException(503, "Catalogue verification is temporarily unavailable") from None

    async def snapshot(self, payload):
        ids = ",".join(sorted({str(item.product_id) for item in payload.items}))
        products, variants, zones = await asyncio.gather(
            self.select("products", {"select": "id,title,sku,price_mvr,main_image_url,product_type,stock_status,size_options,color_options,estimated_delivery_min_days,estimated_delivery_max_days,is_active,status", "id": f"in.({ids})", "status": "eq.published", "is_active": "eq.true"}),
            self.select("product_variants", {"select": "*", "product_id": f"in.({ids})"}),
            self.select("delivery_zones", {"select": "*", "island_name": f"eq.{payload.island}", "is_active": "eq.true"}),
        )
        return products, variants, zones


def get_catalog():
    return Catalog()


def payment_methods():
    """Only operator-supplied methods with actual instructions can be enabled."""
    try:
        methods = json.loads(os.getenv("CHECKOUT_PAYMENT_METHODS", "[]"))
        if not isinstance(methods, list):
            raise ValueError()
        ids = set()
        for method in methods:
            if (not isinstance(method, dict) or method.get("id") not in
                    {"bml_transfer", "mib_transfer", "mfaisaa", "dhiraagu_pay"}):
                raise ValueError()
            if method["id"] in ids:
                raise ValueError()
            ids.add(method["id"])
            for key in ("label", "instructions"):
                if not isinstance(method.get(key), str) or not method[key].strip() or len(method[key]) > 2000:
                    raise ValueError()
        return [{key: method[key] for key in ("id", "label", "instructions")} for method in methods]
    except (ValueError, TypeError):
        raise HTTPException(503, "Checkout configuration needs review") from None


def checkout_config():
    methods = payment_methods()
    enabled = os.getenv("ORDERS_ENABLED", "false").lower() == "true" and bool(methods)
    return {"enabled": enabled, "payment_methods": methods if enabled else []}


async def verified_admin_user(token):
    url, key = supabase_settings()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {token}"})
        if response.status_code in (401, 403):
            raise HTTPException(401, "Please sign in again")
        response.raise_for_status()
        user = response.json()
        if not isinstance(user, dict) or not user.get("id"):
            raise ValueError()
        return user
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, "Admin authentication is temporarily unavailable") from None


async def require_admin(authorization: Annotated[Optional[str], Header()] = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Admin sign-in required")
    allowed = {value.strip() for value in os.getenv("SUPABASE_ADMIN_USER_IDS", "").split(",") if value.strip()}
    if not allowed:
        raise HTTPException(503, "Admin access is not configured")
    user = await verified_admin_user(authorization[7:])
    if user["id"] not in allowed:
        raise HTTPException(403, "Admin access required")
    return user


def money(value):
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount < 0 or amount > 10000000 or amount != amount.quantize(Decimal("0.01")):
            raise ValueError()
        return amount
    except (InvalidOperation, ValueError, TypeError):
        raise HTTPException(503, "Catalogue pricing needs review") from None


def days(value):
    if type(value) is not int or not 0 <= value <= 365:
        raise HTTPException(503, "Delivery configuration needs review")
    return value


def canonical_order(payload, products, variants, zones):
    zones = [zone for zone in zones if zone.get("is_active") is True and zone.get("island_name") == payload.island]
    if len(zones) != 1:
        raise HTTPException(409, "Delivery is not available for the selected island")
    zone = zones[0]
    available = {str(row["id"]): row for row in products if row.get("status") == "published" and row.get("is_active") is True}
    items, delivery_min, delivery_max = [], [], []
    subtotal = Decimal("0")
    for item in payload.items:
        row = available.get(str(item.product_id))
        if not row or row.get("stock_status") not in {"preorder", "in_stock"}:
            raise HTTPException(409, "An item is no longer available. Please review your cart")
        # Cross-database stock reservations are not implemented. Do not oversell ready stock.
        if row.get("product_type") != "preorder":
            raise HTTPException(409, "Ready-stock checkout is not yet enabled. Please contact support")
        options = []
        for name in ("size_options", "color_options"):
            values = row.get(name) or []
            if not isinstance(values, list) or any(not isinstance(v, str) or not v for v in values):
                raise HTTPException(503, "Product options need review")
            options.append(values or [None])
        valid_labels = {" / ".join(value for value in pair if value) or None for pair in combinations(*options)}
        if item.variant not in valid_labels:
            raise HTTPException(409, "Please select valid product options")
        product_variants = [v for v in variants if str(v.get("product_id")) == str(item.product_id)]
        variant = None
        if product_variants:
            matches = [v for v in product_variants if (v.get("variant_name") or " / ".join(filter(None, (v.get("size"), v.get("color")))) or None) == item.variant]
            if len(matches) != 1 or matches[0].get("stock_status") not in {"preorder", "in_stock"}:
                raise HTTPException(409, "The selected variant is unavailable")
            variant = matches[0]
        price = money(variant["price_mvr"] if variant and variant.get("price_mvr") is not None else row.get("price_mvr"))
        if price == 0:
            raise HTTPException(503, "Product pricing needs review")
        minimum, maximum = days(row.get("estimated_delivery_min_days")), days(row.get("estimated_delivery_max_days"))
        if minimum > maximum:
            raise HTTPException(503, "Delivery configuration needs review")
        delivery_min.append(minimum)
        delivery_max.append(maximum)
        subtotal += price * item.quantity
        items.append({"product_id": str(item.product_id), "variant_id": variant.get("id") if variant else None,
                      "title": row["title"], "sku": (variant or {}).get("sku") or row.get("sku"),
                      "quantity": item.quantity, "price_mvr": float(price), "variant": item.variant,
                      "main_image_url": row.get("main_image_url"), "product_type": row["product_type"]})
    fee = money(zone.get("delivery_fee_mvr"))
    total = subtotal + fee
    if total != payload.expected_total_mvr:
        raise HTTPException(409, "Prices or delivery fees have changed. Refresh your cart before ordering")
    extra_min, extra_max = days(zone.get("extra_min_days")), days(zone.get("extra_max_days"))
    if extra_min > extra_max:
        raise HTTPException(503, "Delivery configuration needs review")
    return {"items": items, "atoll": zone.get("atoll"), "subtotal_mvr": float(subtotal),
            "delivery_fee_mvr": float(fee), "discount_mvr": 0, "total_mvr": float(total),
            "estimated_delivery_min_days": max(delivery_min) + extra_min,
            "estimated_delivery_max_days": max(delivery_max) + extra_max}


def access_hash(token):
    if not token or not re.fullmatch(r"[A-Za-z0-9_-]{43,128}", token):
        raise HTTPException(401, "A private order access token is required")
    return hashlib.sha256(token.encode()).hexdigest()


@router.get("/checkout/config")
async def config(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return checkout_config()


@router.get("/admin/session")
async def admin_session(user=Depends(require_admin)):
    return {"id": user["id"]}


@router.post("/orders")
async def create_order(payload: OrderPayload, response: Response,
                       idempotency_key: Annotated[UUID, Header()],
                       x_order_token: Annotated[str, Header()],
                       db=Depends(get_db), catalog=Depends(get_catalog)):
    response.headers["Cache-Control"] = "no-store"
    token_hash = access_hash(x_order_token)
    request_hash = hashlib.sha256(payload.model_dump_json().encode()).hexdigest()
    identity = f"checkout:{idempotency_key}"

    def receipt(row):
        if not hmac.compare_digest(row.get("access_token_hash", ""), token_hash) or row.get("request_hash") != request_hash:
            raise HTTPException(409, "This checkout attempt has already been used. Start a new checkout")
        return {"id": row["id"], "order_number": row["order_number"], "status": row["fulfillment_status"]}

    # Check retries before configuration/catalogue reads: a lost success response stays recoverable.
    existing = await db.orders.find_one({"_id": identity})
    if existing:
        return receipt(existing)
    configuration = checkout_config()
    if not configuration["enabled"]:
        raise HTTPException(503, "Checkout is not yet available")
    if payload.payment_method not in {method["id"] for method in configuration["payment_methods"]}:
        raise HTTPException(422, "The selected payment method is not available")
    products, variants, zones = await catalog.snapshot(payload)
    try:
        canonical = canonical_order(payload, products, variants, zones)
    except HTTPException as exc:
        raise HTTPException(exc.status_code, {"code": "checkout_rejected", "message": exc.detail}) from None
    doc = payload.model_dump(mode="json", exclude={"items", "expected_total_mvr"})
    now = datetime.now(timezone.utc).isoformat()
    doc.update(canonical, _id=identity, id=str(uuid4()), order_number="MV" + uuid4().hex.upper(),
               payment_status="pending", fulfillment_status="order_placed", created_at=now, updated_at=now,
               access_token_hash=token_hash, request_hash=request_hash)
    try:
        await db.orders.insert_one(doc)
    except DuplicateKeyError:
        existing = await db.orders.find_one({"_id": identity})
        if not existing:
            raise HTTPException(409, "Checkout conflict. Please retry") from None
        return receipt(existing)
    return receipt(doc)


@router.get("/orders/{order_number}")
async def get_order(order_number: str, response: Response,
                    x_order_token: Annotated[Optional[str], Header()] = None, db=Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    token_hash = access_hash(x_order_token)
    # Missing and incorrect tokens never reveal whether an order exists. Legacy orders fail closed.
    row = await db.orders.find_one({"order_number": order_number, "access_token_hash": token_hash})
    if not row:
        raise HTTPException(404, "Order not found or access unavailable")
    allowed = ("order_number", "customer_name", "customer_phone", "island", "atoll", "address_line",
               "items", "subtotal_mvr", "delivery_fee_mvr", "total_mvr", "payment_method", "payment_status",
               "fulfillment_status", "estimated_delivery_min_days", "estimated_delivery_max_days", "created_at")
    return {key: row[key] for key in allowed if key in row}


@router.get("/orders", dependencies=[Depends(require_admin)])
async def list_orders(response: Response, db=Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return await db.orders.find({}, {"_id": 0, "access_token_hash": 0, "request_hash": 0}).sort("created_at", -1).to_list(200)


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: UUID, body: StatusUpdate, user=Depends(require_admin), db=Depends(get_db)):
    current, next_stage = STAGES.index(body.expected_status), STAGES.index(body.fulfillment_status)
    if next_stage != current + 1:
        raise HTTPException(409, "Orders must advance one stage at a time")
    changes = {"fulfillment_status": body.fulfillment_status, "updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user["id"]}
    if body.fulfillment_status == "payment_confirmed":
        changes["payment_status"] = "confirmed"
        changes["payment_verified_by"] = user["id"]
    result = await db.orders.update_one({"id": str(order_id), "fulfillment_status": body.expected_status}, {"$set": changes})
    if not result.matched_count:
        raise HTTPException(409, "Order not found or status changed. Refresh before updating")
    return {"ok": True}
