"""
Tests for pagination behavior across all list endpoints.

Every list endpoint supports:
  ?page=<int ≥ 1>   default: 1
  ?size=<int>        default: 20,  max: 100

Response envelope:
  { total (int), page (int), size (int), items (list) }

Rules:
  - size is capped at 100 regardless of requested value
  - page=1 starts at the first record
  - total always reflects the full unfiltered (or filtered) count
"""

ACCOUNTS = "/api/v1/accounts/"
CONTACTS = "/api/v1/contacts/"
LEADS = "/api/v1/leads/"
OPPORTUNITIES = "/api/v1/opportunities/"
ACTIVITIES = "/api/v1/activities/"


# ── ACCOUNTS PAGINATION ──────────────────────────────────────────────────────

async def test_accounts_default_page_and_size(client):
    """Default response has page=1 and size=20."""
    r = await client.get(ACCOUNTS)
    body = r.json()
    assert body["page"] == 1
    assert body["size"] == 20


async def test_accounts_custom_size(client):
    for i in range(5):
        await client.post(ACCOUNTS, json={"name": f"Corp {i}"})
    r = await client.get(f"{ACCOUNTS}?size=3")
    body = r.json()
    assert body["size"] == 3
    assert len(body["items"]) == 3
    assert body["total"] == 5


async def test_accounts_page_2(client):
    for i in range(4):
        await client.post(ACCOUNTS, json={"name": f"Corp {i}"})
    p1 = (await client.get(f"{ACCOUNTS}?page=1&size=2")).json()
    p2 = (await client.get(f"{ACCOUNTS}?page=2&size=2")).json()
    ids_p1 = {item["id"] for item in p1["items"]}
    ids_p2 = {item["id"] for item in p2["items"]}
    assert ids_p1.isdisjoint(ids_p2)
    assert p1["total"] == p2["total"] == 4


async def test_accounts_size_capped_at_100(client):
    """Requesting size > 100 is silently capped at 100."""
    r = await client.get(f"{ACCOUNTS}?size=999")
    body = r.json()
    assert body["size"] == 100


async def test_accounts_page_beyond_results_returns_empty_items(client):
    """Requesting a page past the last record returns empty items list, not 404."""
    await client.post(ACCOUNTS, json={"name": "Only Corp"})
    r = await client.get(f"{ACCOUNTS}?page=99&size=20")
    body = r.json()
    assert r.status_code == 200
    assert body["total"] == 1       # count unchanged
    assert body["items"] == []      # no items on page 99


async def test_pagination_invalid_page_returns_422(client):
    """page must be ≥ 1; page=0 returns 422."""
    r = await client.get(f"{ACCOUNTS}?page=0")
    assert r.status_code == 422


# ── CONTACTS PAGINATION ──────────────────────────────────────────────────────

async def test_contacts_pagination(client, account):
    for i in range(6):
        await client.post(CONTACTS, json={
            "first_name": f"User{i}", "last_name": "Test",
            "email": f"user{i}@test.com",
        })
    r = await client.get(f"{CONTACTS}?page=1&size=4")
    body = r.json()
    assert body["total"] == 6
    assert len(body["items"]) == 4
    assert body["page"] == 1


# ── LEADS PAGINATION ─────────────────────────────────────────────────────────

async def test_leads_pagination(client):
    for i in range(5):
        await client.post(LEADS, json={
            "first_name": f"Lead{i}", "last_name": "Test", "email": f"lead{i}@test.com",
        })
    r = await client.get(f"{LEADS}?page=2&size=2")
    body = r.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["page"] == 2


# ── OPPORTUNITIES PAGINATION ──────────────────────────────────────────────────

async def test_opportunities_pagination(client, account):
    for i in range(4):
        await client.post(OPPORTUNITIES, json={"title": f"Deal {i}", "account_id": account["id"]})
    r = await client.get(f"{OPPORTUNITIES}?size=2")
    body = r.json()
    assert body["total"] == 4
    assert len(body["items"]) == 2


# ── ACTIVITIES PAGINATION ─────────────────────────────────────────────────────

async def test_activities_pagination(client, account):
    contact = (await client.post(CONTACTS, json={
        "first_name": "Pager", "last_name": "Contact", "email": "pager@test.com",
    })).json()
    for i in range(5):
        await client.post(ACTIVITIES, json={
            "type": "call", "subject": f"Call {i}", "contact_id": contact["id"],
        })
    r = await client.get(f"{ACTIVITIES}?size=3")
    body = r.json()
    assert body["total"] == 5
    assert len(body["items"]) == 3
