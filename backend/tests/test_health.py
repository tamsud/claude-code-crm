"""
Tests for GET /health

Response: { "status": "ok" }
No authentication required.
"""


async def test_health_returns_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


async def test_health_is_fast(client):
    """Health endpoint must respond; latency not asserted but call must succeed."""
    r = await client.get("/health")
    assert r.status_code == 200
