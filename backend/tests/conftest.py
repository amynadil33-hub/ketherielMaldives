"""Every test uses in-memory storage and blocks outbound sockets."""
import asyncio
import copy
import json
import socket
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

from backend import commerce
from backend.server import app

PRODUCT_ID = "d8f4931b-dd90-4541-937b-bc6acbe3d5f4"
ADMIN_ID = "6bdf2b70-4bae-41c1-a552-8a04b267d359"
TOKEN = "a" * 43


class Collection:
    def __init__(self):
        self.rows = []
        self.insertions = 0

    async def find_one(self, query, projection=None):
        await asyncio.sleep(0)
        row = next((row for row in self.rows if all(row.get(key) == value for key, value in query.items())), None)
        return copy.deepcopy(row) if row else None

    async def insert_one(self, document):
        await asyncio.sleep(0)  # Exercise competing checkout attempts.
        if any(row.get("_id") == document.get("_id") for row in self.rows):
            raise DuplicateKeyError("duplicate")
        self.rows.append(copy.deepcopy(document))
        self.insertions += 1

    def find(self, query, projection):
        self.projection = projection
        return self

    def sort(self, *args):
        return self

    async def to_list(self, count):
        return [{key: value for key, value in row.items() if self.projection.get(key) != 0} for row in self.rows[:count]]

    async def update_one(self, query, update):
        row = next((row for row in self.rows if all(row.get(key) == value for key, value in query.items())), None)
        if row:
            row.update(update["$set"])
        return SimpleNamespace(matched_count=int(row is not None))


class Catalog:
    def __init__(self):
        self.calls = 0
        self.products = [{"id": PRODUCT_ID, "title": "Reviewed product", "sku": "REVIEWED-1", "price_mvr": "100.25",
                          "product_type": "preorder", "stock_status": "preorder", "is_active": True, "status": "published",
                          "size_options": [], "color_options": [], "estimated_delivery_min_days": 15, "estimated_delivery_max_days": 15}]
        self.variants = []
        self.zones = [{"island_name": "Test Island", "atoll": "Test Atoll", "is_active": True, "delivery_fee_mvr": "20.10", "extra_min_days": 0, "extra_max_days": 0}]

    async def snapshot(self, payload):
        self.calls += 1
        return copy.deepcopy((self.products, self.variants, self.zones))


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    original_connect = socket.socket.connect

    def denied(sock, address):
        # Windows implements socket.socketpair(), which asyncio needs for its
        # self-pipe, with an internal TCP connection to the loopback adapter.
        if isinstance(address, tuple) and address[0] in {"127.0.0.1", "::1"}:
            return original_connect(sock, address)
        raise AssertionError("Outbound network is forbidden in isolated tests")

    monkeypatch.setattr(socket.socket, "connect", denied)


@pytest.fixture
def environment(monkeypatch):
    monkeypatch.setenv("ORDERS_ENABLED", "true")
    monkeypatch.setenv("CHECKOUT_PAYMENT_METHODS", json.dumps([{"id": "bml_transfer", "label": "Test transfer", "instructions": "Sandbox instructions only"}]))
    monkeypatch.setenv("SUPABASE_ADMIN_USER_IDS", ADMIN_ID)
    async def verify(token):
        if token == "test-admin":
            return {"id": ADMIN_ID}
        if token == "test-customer":
            return {"id": str(uuid4()), "user_metadata": {"role": "admin"}}
        raise HTTPException(401, "Invalid token")
    monkeypatch.setattr(commerce, "verified_admin_user", verify)
    storage = SimpleNamespace(orders=Collection(), sourcing_requests=Collection())
    catalogue = Catalog()
    app.state.db = storage
    app.dependency_overrides[commerce.get_catalog] = lambda: catalogue
    yield SimpleNamespace(db=storage, catalog=catalogue, app=app)
    app.dependency_overrides.clear()
    app.state.db = None


@pytest.fixture
def client(environment):
    with TestClient(environment.app) as client:
        yield client


@pytest.fixture
def payload():
    return {"customer_name": "Test Customer", "customer_phone": "+9607000000", "customer_email": None,
            "island": "Test Island", "address_line": "Test address", "notes": "", "payment_method": "bml_transfer",
            "items": [{"product_id": PRODUCT_ID, "quantity": 2, "variant": None}], "expected_total_mvr": "220.60"}


@pytest.fixture
def headers():
    return {"Idempotency-Key": str(uuid4()), "X-Order-Token": TOKEN}
