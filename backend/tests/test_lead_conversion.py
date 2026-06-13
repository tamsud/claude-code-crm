"""
Tests for lead conversion  —  POST /api/v1/leads/{id}/convert

Business rules
--------------
- Lead must have status 'qualified' (400 LEAD_NOT_QUALIFIED otherwise)
- A lead can only be converted once (400 LEAD_ALREADY_CONVERTED on repeat)
- Conversion is atomic: creates Account + Contact + Opportunity in one transaction
- If an account with the same name (case-insensitive) already exists, it is reused
- If a contact with the same email already exists, it is reused
- After conversion, lead.converted_opportunity_id is set to the new opportunity's id

Response (201)
--------------
The newly created Opportunity object.
At minimum: { id, title, stage, account_id, contact_id }
"""

LEADS = "/api/v1/leads/"
ACCOUNTS = "/api/v1/accounts/"
CONTACTS = "/api/v1/contacts/"
OPPORTUNITIES = "/api/v1/opportunities/"


async def _make_lead(client, **overrides):
    payload = {
        "first_name": "Convert",
        "last_name": "Me",
        "email": "convert.me@prospect.com",
        "company": "Prospect Corp",
        **overrides,
    }
    r = await client.post(LEADS, json=payload)
    assert r.status_code == 201
    return r.json()


async def _qualify(client, lead_id):
    await client.patch(f"{LEADS}{lead_id}", json={"status": "contacted"})
    r = await client.patch(f"{LEADS}{lead_id}", json={"status": "qualified"})
    assert r.status_code == 200
    return r.json()


# ── HAPPY PATH ───────────────────────────────────────────────────────────────

async def test_convert_qualified_lead_returns_201(client):
    lead = await _make_lead(client)
    await _qualify(client, lead["id"])
    r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert r.status_code == 201


async def test_convert_creates_opportunity(client):
    lead = await _make_lead(client)
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    assert "id" in opp
    assert opp["stage"] == "prospecting"


async def test_convert_creates_account_from_company(client):
    lead = await _make_lead(client, company="NewCo Inc")
    await _qualify(client, lead["id"])
    await client.post(f"{LEADS}{lead['id']}/convert")
    # Account named "NewCo Inc" should now exist
    r = await client.get(ACCOUNTS)
    names = [a["name"] for a in r.json()["items"]]
    assert "NewCo Inc" in names


async def test_convert_creates_contact_from_lead(client):
    lead = await _make_lead(client, email="unique.convert@prospect.com")
    await _qualify(client, lead["id"])
    await client.post(f"{LEADS}{lead['id']}/convert")
    r = await client.get(CONTACTS)
    emails = [c["email"] for c in r.json()["items"]]
    assert "unique.convert@prospect.com" in emails


async def test_convert_sets_converted_opportunity_id(client):
    """After conversion, the lead's converted_opportunity_id is populated."""
    lead = await _make_lead(client)
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    updated_lead = (await client.get(f"{LEADS}{lead['id']}")).json()
    assert updated_lead["converted_opportunity_id"] == opp["id"]


async def test_convert_opportunity_linked_to_account_and_contact(client):
    lead = await _make_lead(client, company="Link Corp", email="link@corp.com")
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    # Verify opportunity has account and contact references
    assert opp.get("account_id") is not None
    assert opp.get("contact_id") is not None


# ── REUSE EXISTING RECORDS ───────────────────────────────────────────────────

async def test_convert_reuses_existing_account(client):
    """If an account with the same name already exists, it is reused (not duplicated)."""
    existing_acc = (await client.post(ACCOUNTS, json={"name": "Existing Co"})).json()
    lead = await _make_lead(client, company="Existing Co")
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    # Only one account should exist and the opportunity should link to it
    all_accs = (await client.get(ACCOUNTS)).json()
    assert all_accs["total"] == 1
    assert opp["account_id"] == existing_acc["id"]


async def test_convert_reuses_existing_account_case_insensitive(client):
    """Account lookup is case-insensitive ('ACME' matches 'Acme')."""
    existing_acc = (await client.post(ACCOUNTS, json={"name": "Acme Global"})).json()
    lead = await _make_lead(client, company="acme global")
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    assert opp["account_id"] == existing_acc["id"]
    assert (await client.get(ACCOUNTS)).json()["total"] == 1


async def test_convert_reuses_existing_contact(client):
    """If a contact with the same email exists, it is reused (not duplicated)."""
    acc = (await client.post(ACCOUNTS, json={"name": "PreExisting Corp"})).json()
    existing_contact = (await client.post(CONTACTS, json={
        "first_name": "Pre", "last_name": "Existing",
        "email": "pre.existing@prospect.com",
        "account_id": acc["id"],
    })).json()
    lead = await _make_lead(client, email="pre.existing@prospect.com", company="PreExisting Corp")
    await _qualify(client, lead["id"])
    opp = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    assert opp["contact_id"] == existing_contact["id"]
    assert (await client.get(CONTACTS)).json()["total"] == 1


# ── REJECTION CASES ──────────────────────────────────────────────────────────

async def test_convert_new_lead_rejected(client):
    """Cannot convert a lead with status 'new' — 400 LEAD_NOT_QUALIFIED."""
    lead = await _make_lead(client)
    # status is 'new' by default
    r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert r.status_code == 400
    assert "qualified" in r.json()["detail"].lower()


async def test_convert_contacted_lead_rejected(client, lead):
    """Cannot convert a lead with status 'contacted'."""
    await client.patch(f"{LEADS}{lead['id']}", json={"status": "contacted"})
    r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert r.status_code == 400
    assert "qualified" in r.json()["detail"].lower()


async def test_convert_lost_lead_rejected(client, lead):
    """Cannot convert a lead with status 'lost'."""
    await client.patch(f"{LEADS}{lead['id']}", json={"status": "lost"})
    r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert r.status_code == 400


async def test_convert_already_converted_returns_400(client):
    """Converting a lead twice returns 400 LEAD_ALREADY_CONVERTED with the existing opportunity id."""
    lead = await _make_lead(client)
    await _qualify(client, lead["id"])
    first = (await client.post(f"{LEADS}{lead['id']}/convert")).json()
    second_r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert second_r.status_code == 400
    body = second_r.json()
    # The error detail must mention the existing opportunity id
    assert first["id"] in body["detail"]


async def test_convert_nonexistent_lead_returns_404(client):
    r = await client.post(f"{LEADS}00000000-0000-0000-0000-000000000000/convert")
    assert r.status_code == 404
