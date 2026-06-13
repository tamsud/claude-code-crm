"""
Tests for the Leads resource  —  /api/v1/leads/

Request shapes
--------------
LeadCreate : { first_name*, last_name*, email*, phone (str|null),
               company (str|null), source (str|null), notes (str|null) }
LeadUpdate : same fields + status (LeadStatus enum), all optional

Response shape
--------------
{ id, first_name, last_name, email, phone, company, status,
  source, notes, converted_opportunity_id (uuid|null),
  created_at, updated_at }

List filters
------------
?status=new|contacted|qualified|lost

Lead status state machine
--------------------------
new  ──→  contacted  ──→  qualified
 │            │                │
 └────────────┴────────────────┴──→  lost  (terminal — no further transitions)

Valid transitions:
  new → contacted          new → lost
  contacted → qualified    contacted → lost
  qualified → lost

Invalid transitions (400 INVALID_LEAD_TRANSITION):
  new → qualified          new → new
  contacted → new          contacted → contacted
  qualified → new          qualified → contacted
  lost → *  (terminal)
"""
ENDPOINT = "/api/v1/leads/"


# ── CREATE ──────────────────────────────────────────────────────────────────

async def test_create_lead_minimal(client):
    """first_name, last_name, email are required."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Sara",
        "last_name": "Connor",
        "email": "sara.connor@future.com",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["first_name"] == "Sara"
    assert body["last_name"] == "Connor"
    assert body["email"] == "sara.connor@future.com"
    assert body["phone"] is None
    assert body["company"] is None
    assert body["source"] is None
    assert body["notes"] is None


async def test_create_lead_always_starts_new(client):
    """Status is always set to 'new' on creation regardless of payload."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Alex",
        "last_name": "New",
        "email": "alex.new@example.com",
    })
    assert r.status_code == 201
    assert r.json()["status"] == "new"


async def test_create_lead_full(client):
    """All optional fields are stored and returned."""
    r = await client.post(ENDPOINT, json={
        "first_name": "Tom",
        "last_name": "Full",
        "email": "tom.full@example.com",
        "phone": "+1-555-0300",
        "company": "Acme Ltd",
        "source": "LinkedIn",
        "notes": "Met at conference",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["company"] == "Acme Ltd"
    assert body["source"] == "LinkedIn"
    assert body["notes"] == "Met at conference"
    assert body["converted_opportunity_id"] is None


async def test_create_lead_missing_required_returns_422(client):
    r = await client.post(ENDPOINT, json={"first_name": "NoLast"})
    assert r.status_code == 422
    assert r.json()["code"] == "VALIDATION_ERROR"


async def test_create_lead_duplicate_emails_allowed(client):
    """Lead emails are NOT unique — the same email can appear multiple times."""
    payload = {"first_name": "Dup", "last_name": "Lead", "email": "dup@dup.com"}
    r1 = await client.post(ENDPOINT, json=payload)
    r2 = await client.post(ENDPOINT, json=payload)
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["id"] != r2.json()["id"]


async def test_create_lead_response_shape(client):
    r = await client.post(ENDPOINT, json={
        "first_name": "Shape",
        "last_name": "Check",
        "email": "shape@lead.com",
    })
    body = r.json()
    required = {"id", "first_name", "last_name", "email", "phone", "company",
                "status", "source", "notes", "converted_opportunity_id",
                "created_at", "updated_at"}
    assert required.issubset(body.keys())


# ── READ / LIST ──────────────────────────────────────────────────────────────

async def test_get_lead_by_id(client, lead):
    r = await client.get(f"{ENDPOINT}{lead['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == lead["id"]


async def test_get_lead_not_found(client):
    r = await client.get(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


async def test_list_leads_empty(client):
    r = await client.get(ENDPOINT)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_list_leads_filter_by_status(client):
    """?status= returns only leads with that status."""
    # Create leads in different statuses
    lead_new = (await client.post(ENDPOINT, json={
        "first_name": "New", "last_name": "L", "email": "new@example.com",
    })).json()
    lead_to_contact = (await client.post(ENDPOINT, json={
        "first_name": "Cont", "last_name": "L", "email": "cont@example.com",
    })).json()
    await client.patch(f"{ENDPOINT}{lead_to_contact['id']}", json={"status": "contacted"})

    r_new = await client.get(f"{ENDPOINT}?status=new")
    r_cont = await client.get(f"{ENDPOINT}?status=contacted")

    assert r_new.json()["total"] == 1
    assert r_new.json()["items"][0]["id"] == lead_new["id"]
    assert r_cont.json()["total"] == 1


async def test_list_leads_filter_by_all_statuses(client):
    """Each valid status value is accepted as a filter."""
    for status in ("new", "contacted", "qualified", "lost"):
        r = await client.get(f"{ENDPOINT}?status={status}")
        assert r.status_code == 200


# ── STATE MACHINE — VALID TRANSITIONS ────────────────────────────────────────

async def test_transition_new_to_contacted(client, lead):
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "contacted"})
    assert r.status_code == 200
    assert r.json()["status"] == "contacted"


async def test_transition_new_to_lost(client, lead):
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "lost"})
    assert r.status_code == 200
    assert r.json()["status"] == "lost"


async def test_transition_contacted_to_qualified(client, lead):
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "contacted"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "qualified"})
    assert r.status_code == 200
    assert r.json()["status"] == "qualified"


async def test_transition_contacted_to_lost(client, lead):
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "contacted"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "lost"})
    assert r.status_code == 200
    assert r.json()["status"] == "lost"


async def test_transition_qualified_to_lost(client, qualified_lead):
    r = await client.patch(f"{ENDPOINT}{qualified_lead['id']}", json={"status": "lost"})
    assert r.status_code == 200
    assert r.json()["status"] == "lost"


# ── STATE MACHINE — INVALID TRANSITIONS ──────────────────────────────────────

async def test_transition_new_to_qualified_is_invalid(client, lead):
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "qualified"})
    assert r.status_code == 400
    body = r.json()
    assert "invalid" in body["detail"].lower() or "transition" in body["detail"].lower()


async def test_transition_new_to_new_is_invalid(client, lead):
    """Same-status transitions are also blocked."""
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "new"})
    assert r.status_code == 400


async def test_transition_contacted_to_new_is_invalid(client, lead):
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "contacted"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "new"})
    assert r.status_code == 400


async def test_transition_qualified_to_new_is_invalid(client, qualified_lead):
    r = await client.patch(f"{ENDPOINT}{qualified_lead['id']}", json={"status": "new"})
    assert r.status_code == 400


async def test_transition_qualified_to_contacted_is_invalid(client, qualified_lead):
    r = await client.patch(f"{ENDPOINT}{qualified_lead['id']}", json={"status": "contacted"})
    assert r.status_code == 400


async def test_transition_lost_to_new_is_invalid(client, lead):
    """'lost' is a terminal state — no transitions out of it."""
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "lost"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "new"})
    assert r.status_code == 400


async def test_transition_lost_to_contacted_is_invalid(client, lead):
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "lost"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "contacted"})
    assert r.status_code == 400


async def test_transition_lost_to_qualified_is_invalid(client, lead):
    await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "lost"})
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={"status": "qualified"})
    assert r.status_code == 400


async def test_update_lead_non_status_fields(client, lead):
    """Non-status fields can be updated without touching status."""
    r = await client.patch(f"{ENDPOINT}{lead['id']}", json={
        "notes": "Updated notes",
        "source": "Referral",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["notes"] == "Updated notes"
    assert body["source"] == "Referral"
    assert body["status"] == "new"   # unchanged


# ── DELETE ───────────────────────────────────────────────────────────────────

async def test_delete_lead(client, lead):
    r = await client.delete(f"{ENDPOINT}{lead['id']}")
    assert r.status_code == 204
    assert (await client.get(f"{ENDPOINT}{lead['id']}")).status_code == 404


async def test_delete_lead_not_found(client):
    r = await client.delete(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
