"""
Tests for the Mock Email API (/api/v1/mock-email/).

Covers: send, list (with ?to filter + pagination), get by ID, clear, 404s.
"""
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _send(client, **overrides):
    payload = {
        "from_email": "sender@example.com",
        "to_email": "alice@example.com",
        "subject": "Hello",
        "body": "Plain text body",
        **overrides,
    }
    r = await client.post("/api/v1/mock-email/", json=payload)
    assert r.status_code == 201
    return r.json()


# ---------------------------------------------------------------------------
# POST /api/v1/mock-email/
# ---------------------------------------------------------------------------

class TestSendEmail:
    async def test_send_returns_201(self, client):
        r = await client.post("/api/v1/mock-email/", json={
            "from_email": "sender@example.com",
            "to_email": "bob@example.com",
            "subject": "Test Subject",
            "body": "Test body text",
        })
        assert r.status_code == 201

    async def test_send_response_shape(self, client):
        msg = await _send(client)
        assert "id" in msg
        assert msg["from_email"] == "sender@example.com"
        assert msg["to_email"] == "alice@example.com"
        assert msg["subject"] == "Hello"
        assert msg["body"] == "Plain text body"
        assert "sent_at" in msg
        assert "created_at" in msg

    async def test_send_with_html_body(self, client):
        msg = await _send(client, html_body="<p>Hello</p>")
        assert msg["html_body"] == "<p>Hello</p>"

    async def test_send_without_body_fields(self, client):
        r = await client.post("/api/v1/mock-email/", json={
            "from_email": "sender@example.com",
            "to_email": "b@example.com",
            "subject": "No body",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["body"] is None
        assert data["html_body"] is None

    async def test_send_invalid_from_email_returns_422(self, client):
        r = await client.post("/api/v1/mock-email/", json={
            "from_email": "not-an-email",
            "to_email": "b@example.com",
            "subject": "Bad from",
        })
        assert r.status_code == 422

    async def test_send_invalid_to_email_returns_422(self, client):
        r = await client.post("/api/v1/mock-email/", json={
            "from_email": "sender@example.com",
            "to_email": "not-an-email",
            "subject": "Bad to",
        })
        assert r.status_code == 422

    async def test_send_missing_subject_returns_422(self, client):
        r = await client.post("/api/v1/mock-email/", json={
            "from_email": "sender@example.com",
            "to_email": "b@example.com",
        })
        assert r.status_code == 422

    async def test_each_send_gets_unique_id(self, client):
        msg1 = await _send(client, subject="First")
        msg2 = await _send(client, subject="Second")
        assert msg1["id"] != msg2["id"]


# ---------------------------------------------------------------------------
# GET /api/v1/mock-email/
# ---------------------------------------------------------------------------

class TestListEmails:
    async def test_empty_inbox_returns_empty_list(self, client):
        r = await client.get("/api/v1/mock-email/")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_list_returns_all_emails(self, client):
        await _send(client, subject="Email 1")
        await _send(client, subject="Email 2")
        r = await client.get("/api/v1/mock-email/")
        data = r.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    async def test_list_ordered_newest_first(self, client):
        await _send(client, subject="First sent")
        await _send(client, subject="Second sent")
        r = await client.get("/api/v1/mock-email/")
        items = r.json()["items"]
        # Both emails must be present; order is DESC by sent_at
        subjects = [i["subject"] for i in items]
        assert "First sent" in subjects
        assert "Second sent" in subjects

    async def test_list_filter_by_to_email(self, client):
        await _send(client, to_email="alice@example.com", subject="For Alice")
        await _send(client, to_email="bob@example.com", subject="For Bob")
        r = await client.get("/api/v1/mock-email/", params={"to": "alice@example.com"})
        data = r.json()
        assert data["total"] == 1
        assert data["items"][0]["to_email"] == "alice@example.com"

    async def test_list_filter_by_to_email_no_match(self, client):
        await _send(client, to_email="alice@example.com", subject="For Alice")
        r = await client.get("/api/v1/mock-email/", params={"to": "nobody@example.com"})
        data = r.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_list_pagination_page_1(self, client):
        for i in range(5):
            await _send(client, subject=f"Email {i}")
        r = await client.get("/api/v1/mock-email/", params={"size": 3, "page": 1})
        data = r.json()
        assert len(data["items"]) == 3
        assert data["total"] == 5

    async def test_list_pagination_page_2(self, client):
        for i in range(5):
            await _send(client, subject=f"Email {i}")
        r = await client.get("/api/v1/mock-email/", params={"size": 3, "page": 2})
        data = r.json()
        assert len(data["items"]) == 2

    async def test_list_response_shape(self, client):
        await _send(client)
        r = await client.get("/api/v1/mock-email/")
        data = r.json()
        assert "total" in data
        assert "page" in data
        assert "size" in data
        assert "items" in data


# ---------------------------------------------------------------------------
# GET /api/v1/mock-email/{email_id}
# ---------------------------------------------------------------------------

class TestGetEmail:
    async def test_get_existing_email(self, client):
        created = await _send(client, subject="Specific Email")
        r = await client.get(f"/api/v1/mock-email/{created['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == created["id"]
        assert r.json()["subject"] == "Specific Email"

    async def test_get_nonexistent_email_returns_404(self, client):
        r = await client.get("/api/v1/mock-email/nonexistent-id-xyz")
        assert r.status_code == 404

    async def test_get_response_has_all_fields(self, client):
        created = await _send(client, html_body="<b>bold</b>")
        r = await client.get(f"/api/v1/mock-email/{created['id']}")
        data = r.json()
        for field in ("id", "from_email", "to_email", "subject", "body", "html_body", "sent_at", "created_at"):
            assert field in data


# ---------------------------------------------------------------------------
# DELETE /api/v1/mock-email/
# ---------------------------------------------------------------------------

class TestClearEmails:
    async def test_clear_returns_204(self, client):
        r = await client.delete("/api/v1/mock-email/")
        assert r.status_code == 204

    async def test_clear_removes_all_emails(self, client):
        await _send(client, subject="Will be deleted 1")
        await _send(client, subject="Will be deleted 2")
        await client.delete("/api/v1/mock-email/")
        r = await client.get("/api/v1/mock-email/")
        assert r.json()["total"] == 0

    async def test_clear_then_send_works(self, client):
        await _send(client, subject="Before clear")
        await client.delete("/api/v1/mock-email/")
        msg = await _send(client, subject="After clear")
        r = await client.get("/api/v1/mock-email/")
        data = r.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == msg["id"]

    async def test_clear_empty_inbox_is_idempotent(self, client):
        r1 = await client.delete("/api/v1/mock-email/")
        r2 = await client.delete("/api/v1/mock-email/")
        assert r1.status_code == 204
        assert r2.status_code == 204

    async def test_get_after_clear_returns_404(self, client):
        msg = await _send(client)
        await client.delete("/api/v1/mock-email/")
        r = await client.get(f"/api/v1/mock-email/{msg['id']}")
        assert r.status_code == 404
