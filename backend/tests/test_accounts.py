"""
Tests for the Accounts resource  —  /api/v1/accounts/

Request shapes
--------------
AccountCreate : { name* (str), industry (str|null), website (str|null),
                  phone (str|null), address (str|null) }
AccountUpdate : same fields, all optional; unknown keys ignored

Response shape
--------------
{ id (uuid str), name, industry, website, phone, address,
  created_at (ISO-8601), updated_at (ISO-8601) }

List response
-------------
{ total (int), page (int), size (int), items: [AccountResponse] }

Error shape  (4xx)
------------------
{ detail (str), code (str) }
  422 → code = "VALIDATION_ERROR", detail is a list of Pydantic error objects
  4xx → code = "HTTP_ERROR", detail is a human-readable string
"""

ENDPOINT = "/api/v1/accounts/"


# ── CREATE ──────────────────────────────────────────────────────────────────

async def test_create_account_minimal(client):
    """Only 'name' is required; optional fields default to null."""
    r = await client.post(ENDPOINT, json={"name": "Minimal Corp"})
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Minimal Corp"
    assert body["industry"] is None
    assert body["website"] is None
    assert body["phone"] is None
    assert body["address"] is None
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body


async def test_create_account_all_fields(client):
    """All optional fields are stored and returned."""
    payload = {
        "name": "Full Corp",
        "industry": "Finance",
        "website": "https://fullcorp.example.com",
        "phone": "+1-555-9999",
        "address": "1 Finance Plaza, New York, NY",
    }
    r = await client.post(ENDPOINT, json=payload)
    assert r.status_code == 201
    body = r.json()
    for key, value in payload.items():
        assert body[key] == value


async def test_create_account_missing_name_returns_422(client):
    """'name' is required; omitting it returns 422 Validation Error."""
    r = await client.post(ENDPOINT, json={})
    assert r.status_code == 422
    body = r.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert isinstance(body["detail"], list)


async def test_create_account_returns_uuid_id(client):
    """The server generates and returns a UUID string id."""
    r = await client.post(ENDPOINT, json={"name": "UUID Check Corp"})
    assert r.status_code == 201
    body = r.json()
    # UUID v4 is 36 chars with hyphens
    assert len(body["id"]) == 36
    assert body["id"].count("-") == 4


# ── READ ─────────────────────────────────────────────────────────────────────

async def test_get_account_by_id(client, account):
    """GET /api/v1/accounts/{id} returns the account."""
    r = await client.get(f"{ENDPOINT}{account['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == account["id"]
    assert body["name"] == account["name"]


async def test_get_account_response_shape(client, account):
    """Response contains every expected field."""
    r = await client.get(f"{ENDPOINT}{account['id']}")
    body = r.json()
    required = {"id", "name", "industry", "website", "phone", "address", "created_at", "updated_at"}
    assert required.issubset(body.keys())


async def test_get_account_not_found(client):
    """Non-existent ID returns 404."""
    r = await client.get(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
    body = r.json()
    assert "not found" in body["detail"].lower()
    assert body["code"] == "HTTP_ERROR"


# ── LIST ─────────────────────────────────────────────────────────────────────

async def test_list_accounts_empty(client):
    """Empty database returns zero-total paginated response."""
    r = await client.get(ENDPOINT)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []
    assert body["page"] == 1
    assert body["size"] == 20


async def test_list_accounts_contains_created(client, account):
    """Created account appears in list response."""
    r = await client.get(ENDPOINT)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    ids = [item["id"] for item in body["items"]]
    assert account["id"] in ids


async def test_list_accounts_multiple(client):
    """Multiple accounts all appear in list."""
    names = ["Alpha Corp", "Beta LLC", "Gamma Inc"]
    for name in names:
        await client.post(ENDPOINT, json={"name": name})
    r = await client.get(ENDPOINT)
    body = r.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3


async def test_list_pagination_size_param(client):
    """?size=N limits items returned; total reflects real count."""
    for i in range(5):
        await client.post(ENDPOINT, json={"name": f"Corp {i}"})
    r = await client.get(f"{ENDPOINT}?page=1&size=2")
    body = r.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["size"] == 2


async def test_list_pagination_page_2(client):
    """Page 2 returns the next batch."""
    for i in range(4):
        await client.post(ENDPOINT, json={"name": f"Corp {i}"})
    page1 = (await client.get(f"{ENDPOINT}?page=1&size=2")).json()
    page2 = (await client.get(f"{ENDPOINT}?page=2&size=2")).json()
    ids_p1 = {item["id"] for item in page1["items"]}
    ids_p2 = {item["id"] for item in page2["items"]}
    assert ids_p1.isdisjoint(ids_p2)
    assert len(ids_p1) == 2
    assert len(ids_p2) == 2


# ── UPDATE ───────────────────────────────────────────────────────────────────

async def test_update_account_partial(client, account):
    """PATCH with one field only changes that field."""
    r = await client.patch(f"{ENDPOINT}{account['id']}", json={"industry": "Healthcare"})
    assert r.status_code == 200
    body = r.json()
    assert body["industry"] == "Healthcare"
    assert body["name"] == account["name"]     # unchanged
    assert body["id"] == account["id"]         # unchanged


async def test_update_account_multiple_fields(client, account):
    """PATCH can update several fields in one request."""
    r = await client.patch(
        f"{ENDPOINT}{account['id']}",
        json={"name": "Renamed Corp", "phone": "+44-20-0000-0000"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Renamed Corp"
    assert body["phone"] == "+44-20-0000-0000"


async def test_update_account_not_found(client):
    """Patching a non-existent account returns 404."""
    r = await client.patch(
        f"{ENDPOINT}00000000-0000-0000-0000-000000000000",
        json={"name": "Ghost"},
    )
    assert r.status_code == 404


async def test_update_account_ignores_extra_fields(client, account):
    """Unknown fields in the request body are silently ignored (no 422)."""
    r = await client.patch(
        f"{ENDPOINT}{account['id']}",
        json={"name": "Clean Corp", "non_existent_field": "value"},
    )
    assert r.status_code == 200
    assert "non_existent_field" not in r.json()


# ── DELETE ───────────────────────────────────────────────────────────────────

async def test_delete_account_success(client, account):
    """DELETE returns 204 and the account is gone."""
    r = await client.delete(f"{ENDPOINT}{account['id']}")
    assert r.status_code == 204
    get_r = await client.get(f"{ENDPOINT}{account['id']}")
    assert get_r.status_code == 404


async def test_delete_account_not_found(client):
    """Deleting a non-existent account returns 404."""
    r = await client.delete(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


async def test_delete_account_blocked_by_contacts(client, account, contact):
    """Account with associated contacts cannot be deleted — 409 ACCOUNT_HAS_DEPENDENTS."""
    r = await client.delete(f"{ENDPOINT}{account['id']}")
    assert r.status_code == 409
    body = r.json()
    assert "contact" in body["detail"].lower()


async def test_delete_account_blocked_by_opportunities(client, account):
    """Account with associated opportunities cannot be deleted — 409."""
    await client.post("/api/v1/opportunities/", json={
        "title": "Blocking Deal",
        "account_id": account["id"],
        "stage": "prospecting",
    })
    r = await client.delete(f"{ENDPOINT}{account['id']}")
    assert r.status_code == 409
    body = r.json()
    assert "opportunit" in body["detail"].lower()


async def test_delete_account_succeeds_after_contact_removed(client, account, contact):
    """Account can be deleted once its contacts are removed first."""
    await client.delete(f"/api/v1/contacts/{contact['id']}")
    r = await client.delete(f"{ENDPOINT}{account['id']}")
    assert r.status_code == 204
