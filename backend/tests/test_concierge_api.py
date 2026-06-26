"""Backend API tests for Maldives AI Retail Concierge.

Covers:
- Health
- AI endpoints (chat, find-it-for-me, product-description)
- Sourcing requests CRUD
- Orders create/get/status update
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://shopping-nexus-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root_returns_ok(self, session):
        r = session.get(f"{API}/", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "maldives-concierge"
        assert "time" in data


# ---------- AI ----------
class TestAI:
    def test_chat_returns_reply(self, session):
        payload = {
            "session_id": f"test-session-{int(time.time())}",
            "message": "Hi! Do you deliver to Addu?",
            "context": {"island": "Addu (Hithadhoo)"},
        }
        r = session.post(f"{API}/ai/chat", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "reply" in data
        assert isinstance(data["reply"], str)
        assert len(data["reply"]) > 0
        # ensure not the misconfigured fallback
        assert "not configured" not in data["reply"].lower()

    def test_find_it_for_me(self, session):
        payload = {
            "product_url": "https://www.amazon.in/dp/B09N3ZNHTY",
            "description": "boAt Airdopes 141 wireless earbuds",
            "budget_mvr": 800,
            "quantity": 1,
            "island": "Male",
        }
        r = session.post(f"{API}/ai/find-it-for-me", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "raw" in data
        assert isinstance(data["raw"], str) and len(data["raw"]) > 0
        # draft may be parsed JSON or None
        if data.get("draft") is not None:
            assert isinstance(data["draft"], dict)

    def test_product_description(self, session):
        payload = {
            "raw_text": "boAt Airdopes 141 earbuds, 42H playback, ENx tech, IPX4, bluetooth 5.1",
            "brand": "boAt",
            "category": "Electronics",
        }
        r = session.post(f"{API}/ai/product-description", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "raw" in data and isinstance(data["raw"], str)
        if data.get("result") is not None:
            assert isinstance(data["result"], dict)


# ---------- Sourcing ----------
class TestSourcing:
    created_id = None

    def test_create_sourcing(self, session):
        payload = {
            "customer_name": "TEST_Customer Ali",
            "customer_phone": "+9607000000",
            "customer_email": "test@example.com",
            "island": "Male",
            "atoll": "Kaafu",
            "product_url": "https://example.com/item",
            "product_description": "Test sourcing item",
            "budget_mvr": 500,
            "quantity": 2,
            "notes": "TEST entry",
        }
        r = session.post(f"{API}/sourcing-requests", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        assert data["status"] == "new"
        TestSourcing.created_id = data["id"]

    def test_list_sourcing_contains_created(self, session):
        r = session.get(f"{API}/sourcing-requests", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        ids = [x.get("id") for x in rows]
        assert TestSourcing.created_id in ids


# ---------- Orders ----------
class TestOrders:
    created_id = None
    created_number = None

    def _order_payload(self):
        return {
            "customer_name": "TEST_Buyer",
            "customer_phone": "+9607912865",
            "customer_email": "buyer@test.com",
            "island": "Male",
            "atoll": "Kaafu",
            "address_line": "Test Street 12",
            "notes": "TEST order",
            "payment_method": "BML transfer",
            "items": [
                {
                    "product_id": "boat-airdopes-141",
                    "title": "boAt Airdopes 141",
                    "sku": "BA-141",
                    "quantity": 1,
                    "price_mvr": 799,
                    "variant": "Black",
                    "main_image_url": "https://example.com/x.jpg",
                    "product_type": "preorder",
                }
            ],
            "subtotal_mvr": 799,
            "delivery_fee_mvr": 75,
            "discount_mvr": 0,
            "total_mvr": 874,
            "estimated_delivery_min_days": 7,
            "estimated_delivery_max_days": 14,
        }

    def test_create_order(self, session):
        r = session.post(f"{API}/orders", json=self._order_payload(), timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and "order_number" in data
        assert data["status"] == "order_placed"
        assert data["order_number"].startswith("MV")
        TestOrders.created_id = data["id"]
        TestOrders.created_number = data["order_number"]

    def test_get_order_by_number(self, session):
        assert TestOrders.created_number
        r = session.get(f"{API}/orders/{TestOrders.created_number}", timeout=30)
        assert r.status_code == 200
        doc = r.json()
        assert doc["order_number"] == TestOrders.created_number
        assert doc["fulfillment_status"] == "order_placed"
        assert doc["total_mvr"] == 874
        assert "_id" not in doc

    def test_advance_status(self, session):
        assert TestOrders.created_id
        body = {"fulfillment_status": "payment_confirmed"}
        r = session.patch(f"{API}/orders/{TestOrders.created_id}/status", json=body, timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # verify persistence
        r2 = session.get(f"{API}/orders/{TestOrders.created_number}", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["fulfillment_status"] == "payment_confirmed"

    def test_get_missing_order_404(self, session):
        r = session.get(f"{API}/orders/MVDOESNOTEXIST", timeout=30)
        assert r.status_code == 404
