"""
Tests for the Contacts resource  —  /api/v1/contacts/

Request shapes
--------------
ContactCreate : { first_name*, last_name*, email* (valid email),
                  phone (str|null), job_title (str|null), account_id (uuid|null) }
ContactUpdate : same fields, all optional

Response shape
--------------
{ id, first_name, last_name, email, phone, job_title, account_id,
  created_at, updated_at }

List filters
------------
?account_id=<uuid>   filter contacts belonging to an account

Business rules
--------------
- email must be unique across all contacts (409 EMAIL_CONFLICT on violation)
- Updating to your own current email is allowed (no self-conflict)
"""

ENDPOINT = "/api/v1/contacts/"


# ── CREATE ──────────────────────────────────────────────────────────────────

async def test_create_contact_minimal(client):
    """first_name, last_name, email are required; others default to null."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Alice",
        "last_name": "Walker",
        "email": "alice.walker@example.com",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["first_name"] == "Alice"
    assert body["last_name"] == "Walker"
    assert body["email"] == "alice.walker@example.com"
    assert body["phone"] is None
    assert body["job_title"] is None
    assert body["account_id"] is None
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body


async def test_create_contact_full(client, account):
    """All optional fields are accepted and returned."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Bob",
        "last_name": "Jones",
        "email": "bob.jones@acme.com",
        "phone": "+1-555-0200",
        "job_title": "CTO",
        "account_id": account["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["job_title"] == "CTO"
    assert body["account_id"] == account["id"]


async def test_create_contact_missing_required_fields(client):
    """Omitting required fields returns 422."""
    r = await client.post(ENDPOINT, json={"first_name": "NoEmail"})
    assert r.status_code == 422
    assert r.json()["code"] == "VALIDATION_ERROR"


async def test_create_contact_invalid_email_format(client):
    """Malformed email returns 422."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Bad",
        "last_name": "Email",
        "email": "not-an-email",
    })
    assert r.status_code == 422


async def test_create_contact_duplicate_email_returns_409(client, contact):
    """Creating a second contact with the same email returns 409 EMAIL_CONFLICT."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Duplicate",
        "last_name": "Person",
        "email": contact["email"],   # same as fixture
    })
    assert r.status_code == 409
    body = r.json()
    assert "email" in body["detail"].lower()


async def test_create_contact_response_shape(client):
    """Response contains every declared field."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Shape",
        "last_name": "Check",
        "email": "shape.check@example.com",
    })
    body = r.json()
    required = {"id", "first_name", "last_name", "email", "phone", "job_title",
                "account_id", "created_at", "updated_at"}
    assert required.issubset(body.keys())


# ── READ ─────────────────────────────────────────────────────────────────────

async def test_get_contact_by_id(client, contact):
    r = await client.get(f"{ENDPOINT}{contact['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == contact["id"]
    assert body["email"] == contact["email"]


async def test_get_contact_not_found(client):
    r = await client.get(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
    assert "not found" in r.json()["detail"].lower()


# ── LIST ─────────────────────────────────────────────────────────────────────

async def test_list_contacts_empty(client):
    r = await client.get(ENDPOINT)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_list_contacts_contains_created(client, contact):
    r = await client.get(ENDPOINT)
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == contact["id"]


async def test_list_contacts_filter_by_account(client, account):
    """?account_id= returns only contacts for that account."""
    # Contact at the test account
    await client.post(ENDPOINT, json={
        "first_name": "In", "last_name": "Account",
        "email": "in.account@acme.com", "account_id": account["id"],
    })
    # Contact at a different account
    other = (await client.post("/api/v1/accounts/", json={"name": "Other Corp"})).json()
    await client.post(ENDPOINT, json={
        "first_name": "Other", "last_name": "Account",
        "email": "other@other.com", "account_id": other["id"],
    })
    # Unlinked contact
    await client.post(ENDPOINT, json={
        "first_name": "No", "last_name": "Account", "email": "no@account.com",
    })

    r = await client.get(f"{ENDPOINT}?account_id={account['id']}")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["email"] == "in.account@acme.com"


async def test_list_contacts_filter_by_account_no_results(client, account):
    """Filter by account with no contacts returns empty list."""
    r = await client.get(f"{ENDPOINT}?account_id={account['id']}")
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


# ── UPDATE ───────────────────────────────────────────────────────────────────

async def test_update_contact_partial(client, contact):
    """PATCH a single field; other fields are unchanged."""
    r = await client.patch(f"{ENDPOINT}{contact['id']}", json={"job_title": "VP Sales"})
    assert r.status_code == 200
    body = r.json()
    assert body["job_title"] == "VP Sales"
    assert body["email"] == contact["email"]   # unchanged


async def test_update_contact_email_to_new_unique_email(client, contact):
    """Updating email to a new unused email succeeds."""
    r = await client.patch(f"{ENDPOINT}{contact['id']}", json={"email": "new.email@example.com"})
    assert r.status_code == 200
    assert r.json()["email"] == "new.email@example.com"


async def test_update_contact_same_email_allowed(client, contact):
    """Patching email to the same current value does not trigger a conflict."""
    r = await client.patch(f"{ENDPOINT}{contact['id']}", json={"email": contact["email"]})
    assert r.status_code == 200
    assert r.json()["email"] == contact["email"]


async def test_update_contact_duplicate_email_returns_409(client, contact):
    """Patching email to another contact's email returns 409."""
    other = (await client.post(ENDPOINT, json={
        "first_name": "Second", "last_name": "Contact", "email": "second@example.com",
    })).json()
    r = await client.patch(f"{ENDPOINT}{other['id']}", json={"email": contact["email"]})
    assert r.status_code == 409
    assert "email" in r.json()["detail"].lower()


async def test_update_contact_not_found(client):
    r = await client.patch(
        f"{ENDPOINT}00000000-0000-0000-0000-000000000000",
        json={"first_name": "Ghost"},
    )
    assert r.status_code == 404


# ── DELETE ───────────────────────────────────────────────────────────────────

async def test_delete_contact(client, contact):
    r = await client.delete(f"{ENDPOINT}{contact['id']}")
    assert r.status_code == 204
    assert (await client.get(f"{ENDPOINT}{contact['id']}")).status_code == 404


async def test_delete_contact_not_found(client):
    r = await client.delete(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
