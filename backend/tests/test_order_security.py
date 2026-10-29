import asyncio
import copy
from uuid import uuid4

import httpx
import pytest
from fastapi import HTTPException

from backend import commerce
from conftest import ADMIN_ID, TOKEN


def create(client, payload, headers):
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.parametrize("quantity", [-1, 0, 1.5, "2", True, 100])
def test_rejects_invalid_quantities(client, payload, headers, quantity, environment):
    payload["items"][0]["quantity"] = quantity
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 422
    assert not environment.db.orders.rows


@pytest.mark.parametrize("change", [
    {"items": []}, {"expected_total_mvr": -1}, {"expected_total_mvr": "NaN"},
    {"expected_total_mvr": "Infinity"}, {"expected_total_mvr": "1.001"},
    {"customer_phone": "invalid"}, {"customer_name": " "}, {"address_line": " "},
    {"customer_email": "invalid"}, {"subtotal_mvr": 0}, {"total_mvr": 0}, {"discount_mvr": 50},
])
def test_invalid_or_authoritative_fields_rejected(client, payload, headers, change):
    payload.update(change)
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 422


def test_browser_cannot_supply_product_prices_or_titles(client, payload, headers):
    payload["items"][0].update(price_mvr=0, title="Forged")
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 422


def test_duplicate_lines_rejected(client, payload, headers):
    payload["items"] *= 2
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 422


@pytest.mark.parametrize("headers", [{}, {"Idempotency-Key": "not-a-uuid", "X-Order-Token": TOKEN}, {"Idempotency-Key": str(uuid4()), "X-Order-Token": "short"}])
def test_checkout_requires_replay_key_and_strong_private_code(client, payload, headers):
    assert client.post("/api/orders", json=payload, headers=headers).status_code in (401, 422)


def test_server_totals_and_details_are_authoritative(client, payload, headers, environment):
    result = create(client, payload, headers)
    row = environment.db.orders.rows[0]
    assert row["total_mvr"] == 220.60
    assert row["subtotal_mvr"] == 200.50
    assert row["delivery_fee_mvr"] == 20.10
    assert row["items"][0]["title"] == "Reviewed product"
    assert row["items"][0]["price_mvr"] == 100.25
    assert row["atoll"] == "Test Atoll"
    assert row["estimated_delivery_min_days"] == row["estimated_delivery_max_days"] == 15
    assert row["payment_status"] == "pending"
    assert TOKEN not in str(row)
    assert "access_token_hash" not in result


def test_stale_price_requires_review_without_creating_order(client, payload, headers, environment):
    payload["expected_total_mvr"] = "1"
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409
    assert not environment.db.orders.rows


@pytest.mark.parametrize("change", [{"status": "draft"}, {"is_active": False}, {"stock_status": "out_of_stock"}, {"product_type": "ready_stock"}])
def test_unapproved_unavailable_or_unreserved_stock_rejected(client, payload, headers, environment, change):
    environment.catalog.products[0].update(change)
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409
    assert not environment.db.orders.rows


def test_unknown_product_and_unserved_island_rejected(client, payload, headers, environment):
    payload["items"][0]["product_id"] = str(uuid4())
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409
    environment.catalog.zones = []
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409


@pytest.mark.parametrize("field,value", [("price_mvr", None), ("price_mvr", "NaN"), ("price_mvr", -5), ("price_mvr", "1.234"), ("estimated_delivery_min_days", None), ("estimated_delivery_max_days", 2)])
def test_invalid_catalogue_data_fails_closed(client, payload, headers, environment, field, value):
    environment.catalog.products[0][field] = value
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 503
    assert not environment.db.orders.rows


def test_variants_required_and_validated_with_canonical_price(client, payload, headers, environment):
    row = environment.catalog.products[0]
    row.update(size_options=["M", "L"], color_options=["Blue"])
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409
    payload["items"][0]["variant"] = "XL / Blue"
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409
    payload["items"][0]["variant"] = "M / Blue"
    environment.catalog.variants = [{"id": "variant-1", "product_id": row["id"], "size": "M", "color": "Blue", "price_mvr": "120.50", "stock_status": "preorder", "sku": "M-BLUE"}]
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 409  # price changed
    payload["expected_total_mvr"] = "261.10"
    create(client, payload, headers)
    assert environment.db.orders.rows[0]["items"][0]["sku"] == "M-BLUE"


@pytest.mark.parametrize("setting,value", [("ORDERS_ENABLED", "false"), ("CHECKOUT_PAYMENT_METHODS", "[]"), ("CHECKOUT_PAYMENT_METHODS", "invalid")])
def test_unconfirmed_checkout_configuration_fails_closed(client, payload, headers, monkeypatch, setting, value):
    monkeypatch.setenv(setting, value)
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 503


def test_unsupported_payment_is_rejected(client, payload, headers):
    payload["payment_method"] = "slip_upload"
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 422


def test_identical_retry_returns_original_even_when_catalogue_changes(client, payload, headers, environment, monkeypatch):
    first = create(client, payload, headers)
    environment.catalog.products = []
    monkeypatch.setenv("ORDERS_ENABLED", "false")
    assert create(client, payload, headers) == first
    assert environment.db.orders.insertions == 1
    assert environment.catalog.calls == 1


def test_key_cannot_be_reused_with_different_data_or_token(client, payload, headers, environment):
    create(client, payload, headers)
    changed = copy.deepcopy(payload)
    changed["address_line"] = "Changed"
    assert client.post("/api/orders", json=changed, headers=headers).status_code == 409
    assert client.post("/api/orders", json=payload, headers={**headers, "X-Order-Token": "b" * 43}).status_code == 409
    assert environment.db.orders.insertions == 1


@pytest.mark.asyncio
async def test_concurrent_checkout_retries_only_insert_once(environment, payload, headers):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=environment.app), base_url="http://test") as client:
        responses = await asyncio.gather(*[client.post("/api/orders", json=payload, headers=headers) for _ in range(8)])
    assert all(response.status_code == 200 for response in responses)
    assert len({response.json()["order_number"] for response in responses}) == 1
    assert environment.db.orders.insertions == 1


def test_order_details_require_private_code_and_never_return_internal_fields(client, payload, headers):
    result = create(client, payload, headers)
    url = f'/api/orders/{result["order_number"]}'
    assert client.get(url).status_code == 401
    assert client.get(url, headers={"X-Order-Token": "b" * 43}).status_code == 404
    assert client.get("/api/orders/unknown", headers={"X-Order-Token": "b" * 43}).status_code == 404
    assert client.get(url, headers={"Authorization": "Bearer test-admin"}).status_code == 401
    response = client.get(url, headers={"X-Order-Token": TOKEN})
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert "customer_email" not in response.json()
    assert not {"_id", "request_hash", "access_token_hash"} & response.json().keys()


def test_legacy_orders_without_access_hash_are_private(client, environment):
    environment.db.orders.rows.append({"order_number": "LEGACY", "customer_phone": "+9607000000"})
    assert client.get("/api/orders/LEGACY", headers={"X-Order-Token": TOKEN}).status_code == 404


@pytest.mark.parametrize("url", ["/api/orders", "/api/sourcing-requests", "/api/admin/session"])
def test_admin_reads_require_server_verified_admin(client, url):
    assert client.get(url).status_code == 401
    assert client.get(url, headers={"Authorization": "Bearer invalid"}).status_code == 401
    assert client.get(url, headers={"Authorization": "Bearer test-customer"}).status_code == 403
    assert client.get(url, headers={"Authorization": "Bearer test-admin"}).status_code == 200


def test_admin_listing_does_not_expose_private_token_hashes(client, payload, headers):
    create(client, payload, headers)
    response = client.get("/api/orders", headers={"Authorization": "Bearer test-admin"})
    assert "access_token_hash" not in response.text
    assert "request_hash" not in response.text
    assert response.headers["cache-control"] == "no-store"


def test_status_updates_require_auth_valid_transition_and_current_version(client, payload, headers):
    order = create(client, payload, headers)
    url = f'/api/orders/{order["id"]}/status'
    body = {"expected_status": "order_placed", "fulfillment_status": "payment_pending"}
    assert client.patch(url, json=body).status_code == 401
    auth = {"Authorization": "Bearer test-admin"}
    assert client.patch(url, json={**body, "fulfillment_status": "delivered"}, headers=auth).status_code == 409
    assert client.patch(url, json=body, headers=auth).status_code == 200
    assert client.patch(url, json=body, headers=auth).status_code == 409  # stale tab
    assert client.patch(url, json={"expected_status": "payment_pending", "fulfillment_status": "payment_confirmed"}, headers=auth).status_code == 200
    response = client.get(f'/api/orders/{order["order_number"]}', headers={"X-Order-Token": TOKEN})
    assert response.json()["payment_status"] == "confirmed"


def test_catalogue_failure_does_not_insert_order(client, payload, headers, environment, monkeypatch):
    async def failed(payload):
        raise HTTPException(503, "Catalogue unavailable")
    monkeypatch.setattr(environment.catalog, "snapshot", failed)
    assert client.post("/api/orders", json=payload, headers=headers).status_code == 503
    assert not environment.db.orders.rows
