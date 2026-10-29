import httpx
import pytest
from fastapi import HTTPException
from backend import commerce


@pytest.mark.asyncio
async def test_public_catalogue_requests_use_key_without_fake_bearer_token(monkeypatch, payload):
    monkeypatch.setenv("SUPABASE_URL", "https://test.invalid")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example")
    original = httpx.AsyncClient
    requests = []
    def handler(request):
        requests.append(request)
        assert request.headers["apikey"] == "sb_publishable_example"
        assert "authorization" not in request.headers
        if request.url.path.endswith("products"):
            assert request.url.params["status"] == "eq.published"
            assert request.url.params["is_active"] == "eq.true"
        return httpx.Response(200, json=[])
    monkeypatch.setattr(commerce.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    assert await commerce.Catalog().snapshot(commerce.OrderPayload(**payload)) == ([], [], [])
    assert len(requests) == 3


@pytest.mark.asyncio
@pytest.mark.parametrize("status,body", [(500, {}), (200, {"unexpected": "shape"})])
async def test_catalogue_transport_failures_are_not_treated_as_valid_empty_data(monkeypatch, status, body):
    monkeypatch.setenv("SUPABASE_URL", "https://test.invalid")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "example")
    original = httpx.AsyncClient
    monkeypatch.setattr(commerce.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(lambda request: httpx.Response(status, json=body)), **kwargs))
    with pytest.raises(HTTPException) as result:
        await commerce.Catalog().select("products", {})
    assert result.value.status_code == 503


@pytest.mark.asyncio
async def test_admin_identity_is_verified_with_supabase_not_client_metadata(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://test.invalid")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "example-public-key")
    monkeypatch.setenv("SUPABASE_ADMIN_USER_IDS", "admin-id")
    original = httpx.AsyncClient
    def handler(request):
        assert request.url.path == "/auth/v1/user"
        assert request.headers["authorization"] == "Bearer real-session"
        return httpx.Response(200, json={"id": "customer-id", "user_metadata": {"role": "admin"}})
    monkeypatch.setattr(commerce.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))
    with pytest.raises(HTTPException) as result:
        await commerce.require_admin("Bearer real-session")
    assert result.value.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize("status,body,expected", [(401, {}, 401), (200, {}, 503), (500, {}, 503)])
async def test_authentication_failures_fail_closed(monkeypatch, status, body, expected):
    monkeypatch.setenv("SUPABASE_URL", "https://test.invalid")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "example-public-key")
    original = httpx.AsyncClient
    monkeypatch.setattr(commerce.httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(lambda request: httpx.Response(status, json=body)), **kwargs))
    with pytest.raises(HTTPException) as result:
        await commerce.verified_admin_user("invalid-session")
    assert result.value.status_code == expected
