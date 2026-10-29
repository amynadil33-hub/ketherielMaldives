"""Isolated smoke tests replacing the original live, unauthenticated demo tests."""
import pytest


def test_health(client):
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["cache-control"] == "no-store"


def test_checkout_config_never_exposes_secrets(client):
    response = client.get("/api/checkout/config")
    assert response.json() == {"enabled": True, "payment_methods": [{"id": "bml_transfer", "label": "Test transfer", "instructions": "Sandbox instructions only"}]}


def test_product_description_requires_admin(client):
    assert client.post("/api/ai/product-description", json={"raw_text": "Example"}).status_code == 401


def test_admin_access_fails_closed_without_allowlist(client, monkeypatch):
    monkeypatch.delenv("SUPABASE_ADMIN_USER_IDS", raising=False)
    assert client.get("/api/admin/session", headers={"Authorization": "Bearer test-admin"}).status_code == 503
