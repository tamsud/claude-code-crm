"""
Tests for the Opportunities resource  —  /api/v1/opportunities/

Request shapes
--------------
OpportunityCreate : { title*, account_id* (uuid), contact_id (uuid|null),
                      stage (str, default "prospecting"),
                      value (float > 0 | null), probability (0-100 | null),
                      expected_close_date (YYYY-MM-DD | null) }
OpportunityUpdate : same fields, all optional

Response shape
--------------
{ id, title, account_id, contact_id, stage, value, probability,
  expected_close_date, created_at, updated_at }

List filters
------------
?stage=<str>  ?account_id=<uuid>  ?contact_id=<uuid>

Stages (free-form — any stage can be set directly):
  prospecting | proposal | negotiation | closed-won | closed-lost

Business rules
--------------
- account_id must reference an existing account (404 if not)
- contact_id must reference an existing contact (404 if not), when provided
- value must be > 0 when provided (422 otherwise)
- probability must be 0-100 when provided (422 otherwise)
"""

ENDPOINT = "/api/v1/opportunities/"


# ── CREATE ──────────────────────────────────────────────────────────────────

async def test_create_opportunity_minimal(client, account):
    """title and account_id are required; stage defaults to 'prospecting'."""
    r = await client.post(ENDPOINT, json={
        "title": "New Deal",
        "account_id": account["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "New Deal"
    assert body["account_id"] == account["id"]
    assert body["stage"] == "prospecting"
    assert body["value"] is None
    assert body["probability"] is None
    assert body["contact_id"] is None
    assert body["expected_close_date"] is None


async def test_create_opportunity_full(client, account, contact):
    """All optional fields are accepted and returned."""
    r = await client.post(ENDPOINT, json={
        "title": "Full Deal",
        "account_id": account["id"],
        "contact_id": contact["id"],
        "stage": "proposal",
        "value": 50000.0,
        "probability": 65,
        "expected_close_date": "2026-09-30",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["value"] == 50000.0
    assert body["probability"] == 65
    assert body["expected_close_date"] == "2026-09-30"
    assert body["contact_id"] == contact["id"]


async def test_create_opportunity_missing_title_returns_422(client, account):
    r = await client.post(ENDPOINT, json={"account_id": account["id"]})
    assert r.status_code == 422
    assert r.json()["code"] == "VALIDATION_ERROR"


async def test_create_opportunity_missing_account_returns_422(client):
    r = await client.post(ENDPOINT, json={"title": "No Account"})
    assert r.status_code == 422


async def test_create_opportunity_invalid_account_returns_404(client):
    """Non-existent account_id returns 404."""
    r = await client.post(ENDPOINT, json={
        "title": "Ghost Deal",
        "account_id": "00000000-0000-0000-0000-000000000000",
    })
    assert r.status_code == 404
    assert "not found" in r.json()["detail"].lower()


async def test_create_opportunity_invalid_contact_returns_404(client, account):
    """Non-existent contact_id returns 404."""
    r = await client.post(ENDPOINT, json={
        "title": "Ghost Contact Deal",
        "account_id": account["id"],
        "contact_id": "00000000-0000-0000-0000-000000000000",
    })
    assert r.status_code == 404


async def test_create_opportunity_zero_value_returns_422(client, account):
    """value must be strictly > 0; 0 is rejected."""
    r = await client.post(ENDPOINT, json={
        "title": "Zero Deal",
        "account_id": account["id"],
        "value": 0,
    })
    assert r.status_code == 422


async def test_create_opportunity_negative_value_returns_422(client, account):
    """Negative value is rejected."""
    r = await client.post(ENDPOINT, json={
        "title": "Negative Deal",
        "account_id": account["id"],
        "value": -100.0,
    })
    assert r.status_code == 422


async def test_create_opportunity_probability_over_100_returns_422(client, account):
    r = await client.post(ENDPOINT, json={
        "title": "Too Sure",
        "account_id": account["id"],
        "probability": 101,
    })
    assert r.status_code == 422


async def test_create_opportunity_negative_probability_returns_422(client, account):
    r = await client.post(ENDPOINT, json={
        "title": "Negative Prob",
        "account_id": account["id"],
        "probability": -1,
    })
    assert r.status_code == 422


async def test_create_opportunity_probability_boundary_values(client, account):
    """Probability of 0 and 100 are both valid."""
    for prob in (0, 100):
        r = await client.post(ENDPOINT, json={
            "title": f"Prob {prob}",
            "account_id": account["id"],
            "probability": prob,
        })
        assert r.status_code == 201, f"probability={prob} should be valid"
        assert r.json()["probability"] == prob


async def test_create_opportunity_response_shape(client, account):
    r = await client.post(ENDPOINT, json={"title": "Shape", "account_id": account["id"]})
    body = r.json()
    required = {"id", "title", "account_id", "contact_id", "stage", "value",
                "probability", "expected_close_date", "created_at", "updated_at"}
    assert required.issubset(body.keys())


async def test_create_opportunity_all_stages_valid(client, account):
    """All stage values are accepted on create."""
    for stage in ("prospecting", "proposal", "negotiation", "closed-won", "closed-lost"):
        r = await client.post(ENDPOINT, json={
            "title": f"Stage {stage}",
            "account_id": account["id"],
            "stage": stage,
        })
        assert r.status_code == 201, f"stage '{stage}' should be valid"
        assert r.json()["stage"] == stage


# ── READ ─────────────────────────────────────────────────────────────────────

async def test_get_opportunity_by_id(client, opportunity):
    r = await client.get(f"{ENDPOINT}{opportunity['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == opportunity["id"]


async def test_get_opportunity_not_found(client):
    r = await client.get(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


# ── LIST ─────────────────────────────────────────────────────────────────────

async def test_list_opportunities_empty(client):
    r = await client.get(ENDPOINT)
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_list_opportunities_contains_created(client, opportunity):
    r = await client.get(ENDPOINT)
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == opportunity["id"]


async def test_list_filter_by_stage(client, account):
    await client.post(ENDPOINT, json={"title": "Prospecting", "account_id": account["id"], "stage": "prospecting"})
    await client.post(ENDPOINT, json={"title": "Proposal", "account_id": account["id"], "stage": "proposal"})

    r = await client.get(f"{ENDPOINT}?stage=prospecting")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["stage"] == "prospecting"


async def test_list_filter_by_account(client, account):
    await client.post(ENDPOINT, json={"title": "Deal A", "account_id": account["id"]})
    other_acc = (await client.post("/api/v1/accounts/", json={"name": "Other Corp"})).json()
    await client.post(ENDPOINT, json={"title": "Deal B", "account_id": other_acc["id"]})

    r = await client.get(f"{ENDPOINT}?account_id={account['id']}")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["account_id"] == account["id"]


async def test_list_filter_by_contact(client, account, contact):
    await client.post(ENDPOINT, json={
        "title": "With Contact", "account_id": account["id"], "contact_id": contact["id"],
    })
    await client.post(ENDPOINT, json={"title": "No Contact", "account_id": account["id"]})

    r = await client.get(f"{ENDPOINT}?contact_id={contact['id']}")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["contact_id"] == contact["id"]


# ── UPDATE ───────────────────────────────────────────────────────────────────

async def test_update_opportunity_stage(client, opportunity):
    r = await client.patch(f"{ENDPOINT}{opportunity['id']}", json={"stage": "proposal"})
    assert r.status_code == 200
    assert r.json()["stage"] == "proposal"


async def test_update_opportunity_value(client, opportunity):
    r = await client.patch(f"{ENDPOINT}{opportunity['id']}", json={"value": 99999.99})
    assert r.status_code == 200
    assert r.json()["value"] == 99999.99


async def test_update_opportunity_invalid_value_returns_422(client, opportunity):
    r = await client.patch(f"{ENDPOINT}{opportunity['id']}", json={"value": 0})
    assert r.status_code == 422


async def test_update_opportunity_to_closed_won(client, opportunity):
    r = await client.patch(f"{ENDPOINT}{opportunity['id']}", json={"stage": "closed-won"})
    assert r.status_code == 200
    assert r.json()["stage"] == "closed-won"


async def test_update_opportunity_not_found(client):
    r = await client.patch(
        f"{ENDPOINT}00000000-0000-0000-0000-000000000000", json={"stage": "proposal"}
    )
    assert r.status_code == 404


async def test_update_opportunity_partial_preserves_fields(client, opportunity):
    """PATCH with one field only changes that field."""
    r = await client.patch(f"{ENDPOINT}{opportunity['id']}", json={"title": "Renamed Deal"})
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Renamed Deal"
    assert body["stage"] == opportunity["stage"]    # unchanged


# ── DELETE ───────────────────────────────────────────────────────────────────

async def test_delete_opportunity(client, opportunity):
    r = await client.delete(f"{ENDPOINT}{opportunity['id']}")
    assert r.status_code == 204
    assert (await client.get(f"{ENDPOINT}{opportunity['id']}")).status_code == 404


async def test_delete_opportunity_not_found(client):
    r = await client.delete(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
