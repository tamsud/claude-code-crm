"""
End-to-end workflow tests — realistic user journeys for FE developers.

These tests document complete flows through the CRM API as a FE client
would experience them. They serve as living documentation for:
  - The exact sequence of API calls needed for common workflows
  - The data shape returned at each step
  - The state dependencies between entities
"""

ACCOUNTS = "/api/v1/accounts/"
CONTACTS = "/api/v1/contacts/"
LEADS = "/api/v1/leads/"
OPPORTUNITIES = "/api/v1/opportunities/"
ACTIVITIES = "/api/v1/activities/"


# ── WORKFLOW 1: Full Sales Pipeline ──────────────────────────────────────────

async def test_workflow_full_sales_pipeline(client):
    """
    Complete path from inquiry to closed deal:

    1. Create account (company)
    2. Create contact at that account
    3. Capture an inbound lead
    4. Work the lead through status stages → qualified
    5. Convert lead → creates Opportunity automatically
    6. Log a call on the opportunity
    7. Move opportunity to closed-won
    """
    # 1. Create account
    acc = (await client.post(ACCOUNTS, json={
        "name": "Enterprise Co", "industry": "Manufacturing",
    })).json()
    assert acc["name"] == "Enterprise Co"

    # 2. Create contact
    ctr = (await client.post(CONTACTS, json={
        "first_name": "Alice", "last_name": "Wang",
        "email": "alice.wang@enterprise.co",
        "job_title": "Director of Operations",
        "account_id": acc["id"],
    })).json()
    assert ctr["account_id"] == acc["id"]

    # 3. Capture lead
    lead = (await client.post(LEADS, json={
        "first_name": "Alice", "last_name": "Wang",
        "email": "alice.wang@enterprise.co",
        "company": "Enterprise Co",
        "source": "Website Contact Form",
    })).json()
    assert lead["status"] == "new"
    assert lead["converted_opportunity_id"] is None

    # 4a. First contact made
    lead = (await client.patch(f"{LEADS}{lead['id']}", json={"status": "contacted"})).json()
    assert lead["status"] == "contacted"

    # 4b. Lead qualifies
    lead = (await client.patch(f"{LEADS}{lead['id']}", json={"status": "qualified"})).json()
    assert lead["status"] == "qualified"

    # 5. Convert lead to opportunity
    conv_r = await client.post(f"{LEADS}{lead['id']}/convert")
    assert conv_r.status_code == 201
    opp = conv_r.json()
    opp_id = opp["id"]
    assert opp["stage"] == "prospecting"

    # Lead should now reference the opportunity
    updated_lead = (await client.get(f"{LEADS}{lead['id']}")).json()
    assert updated_lead["converted_opportunity_id"] == opp_id

    # 6. Log a discovery call
    activity = (await client.post(ACTIVITIES, json={
        "type": "call",
        "subject": "Discovery call — Enterprise Co",
        "notes": "Discussed requirements and timeline",
        "opportunity_id": opp_id,
    })).json()
    assert activity["type"] == "call"
    assert activity["opportunity_id"] == opp_id

    # 7. Move to closed-won
    closed = (await client.patch(f"{OPPORTUNITIES}{opp_id}", json={"stage": "closed-won"})).json()
    assert closed["stage"] == "closed-won"


# ── WORKFLOW 2: Lead Nurturing to Lost ───────────────────────────────────────

async def test_workflow_lead_lost_lifecycle(client):
    """
    Lead that doesn't convert:

    new → contacted → lost (terminal)
    Verify no further status changes possible after lost.
    """
    lead = (await client.post(LEADS, json={
        "first_name": "Dave", "last_name": "Cold",
        "email": "dave.cold@coldleads.com",
    })).json()
    assert lead["status"] == "new"

    lead = (await client.patch(f"{LEADS}{lead['id']}", json={"status": "contacted"})).json()
    assert lead["status"] == "contacted"

    lead = (await client.patch(f"{LEADS}{lead['id']}", json={"status": "lost"})).json()
    assert lead["status"] == "lost"

    # Terminal: all further transitions are blocked
    for target in ("new", "contacted", "qualified", "lost"):
        r = await client.patch(f"{LEADS}{lead['id']}", json={"status": target})
        assert r.status_code == 400, f"Transition lost→{target} should be blocked"


# ── WORKFLOW 3: Account Deletion Guard ───────────────────────────────────────

async def test_workflow_account_deletion_requires_cleanup(client):
    """
    FE must guide the user to remove contacts/opportunities before
    deleting an account — raw deletion will return 409.

    Flow:
    1. Create account + contact
    2. Try delete → 409 (contacts block it)
    3. Remove contact
    4. Delete account → 204
    """
    acc = (await client.post(ACCOUNTS, json={"name": "Cleanup Corp"})).json()
    ctr = (await client.post(CONTACTS, json={
        "first_name": "Temp", "last_name": "Person",
        "email": "temp@cleanup.com",
        "account_id": acc["id"],
    })).json()

    # Should fail — has a contact
    r = await client.delete(f"{ACCOUNTS}{acc['id']}")
    assert r.status_code == 409
    assert "contact" in r.json()["detail"].lower()

    # Remove the contact
    r = await client.delete(f"{CONTACTS}{ctr['id']}")
    assert r.status_code == 204

    # Now the account can be deleted
    r = await client.delete(f"{ACCOUNTS}{acc['id']}")
    assert r.status_code == 204

    # Confirm gone
    assert (await client.get(f"{ACCOUNTS}{acc['id']}")).status_code == 404


# ── WORKFLOW 4: Activity Timeline for a Contact ───────────────────────────────

async def test_workflow_activity_timeline(client, account, contact):
    """
    Log a sequence of activities for a contact over time and retrieve
    them using type and contact filters.
    """
    opp = (await client.post(OPPORTUNITIES, json={
        "title": "Active Deal", "account_id": account["id"],
        "contact_id": contact["id"],
    })).json()

    # Log multiple activities
    await client.post(ACTIVITIES, json={
        "type": "call", "subject": "Intro call",
        "contact_id": contact["id"], "opportunity_id": opp["id"],
    })
    await client.post(ACTIVITIES, json={
        "type": "email", "subject": "Proposal sent",
        "opportunity_id": opp["id"],
    })
    await client.post(ACTIVITIES, json={
        "type": "meeting", "subject": "Product demo",
        "contact_id": contact["id"],
    })

    # All activities for this contact
    r = await client.get(f"{ACTIVITIES}?contact_id={contact['id']}")
    assert r.json()["total"] == 2   # intro call + demo (email has no contact)

    # All activities for the opportunity
    r = await client.get(f"{ACTIVITIES}?opportunity_id={opp['id']}")
    assert r.json()["total"] == 2   # intro call + proposal email

    # Filter by type
    r = await client.get(f"{ACTIVITIES}?type=meeting")
    assert r.json()["total"] == 1

    r = await client.get(f"{ACTIVITIES}?type=email")
    assert r.json()["total"] == 1


# ── WORKFLOW 5: Opportunity Funnel View ──────────────────────────────────────

async def test_workflow_opportunity_funnel(client, account):
    """
    Create opportunities in multiple stages and retrieve per-stage counts —
    the typical data a FE pipeline/funnel view would request.
    """
    stages = [
        ("Prospect A", "prospecting"),
        ("Prospect B", "prospecting"),
        ("Proposal C", "proposal"),
        ("Negotiation D", "negotiation"),
        ("Won E", "closed-won"),
    ]
    for title, stage in stages:
        r = await client.post(OPPORTUNITIES, json={
            "title": title, "account_id": account["id"], "stage": stage,
        })
        assert r.status_code == 201

    # Funnel counts
    r_prospecting = await client.get(f"{OPPORTUNITIES}?stage=prospecting")
    r_proposal = await client.get(f"{OPPORTUNITIES}?stage=proposal")
    r_negotiation = await client.get(f"{OPPORTUNITIES}?stage=negotiation")
    r_won = await client.get(f"{OPPORTUNITIES}?stage=closed-won")
    r_lost = await client.get(f"{OPPORTUNITIES}?stage=closed-lost")

    assert r_prospecting.json()["total"] == 2
    assert r_proposal.json()["total"] == 1
    assert r_negotiation.json()["total"] == 1
    assert r_won.json()["total"] == 1
    assert r_lost.json()["total"] == 0

    # Total pipeline
    all_r = await client.get(OPPORTUNITIES)
    assert all_r.json()["total"] == 5


# ── WORKFLOW 6: Email Uniqueness Across Contacts ──────────────────────────────

async def test_workflow_contact_email_uniqueness(client):
    """
    Demonstrates the email-uniqueness constraint:
    - Contact emails must be globally unique
    - Lead emails do NOT need to be unique
    """
    # Contacts must have unique emails
    r1 = await client.post(CONTACTS, json={
        "first_name": "First", "last_name": "Copy", "email": "copy@test.com",
    })
    assert r1.status_code == 201

    r2 = await client.post(CONTACTS, json={
        "first_name": "Second", "last_name": "Copy", "email": "copy@test.com",
    })
    assert r2.status_code == 409

    # Leads do allow duplicate emails (raw inquiries)
    l1 = await client.post(LEADS, json={
        "first_name": "Lead1", "last_name": "Dup", "email": "dup.lead@test.com",
    })
    l2 = await client.post(LEADS, json={
        "first_name": "Lead2", "last_name": "Dup", "email": "dup.lead@test.com",
    })
    assert l1.status_code == 201
    assert l2.status_code == 201


# ── WORKFLOW 7: Error Response Format Reference ───────────────────────────────

async def test_workflow_error_response_formats(client):
    """
    Documents the two error response shapes the FE must handle:

    422 Validation Error:
      { "detail": [...list of pydantic errors...], "code": "VALIDATION_ERROR" }

    4xx HTTP Error (404, 400, 409):
      { "detail": "Human-readable string", "code": "HTTP_ERROR" }
    """
    # 422 — validation error
    r422 = await client.post(ACCOUNTS, json={})
    assert r422.status_code == 422
    body422 = r422.json()
    assert body422["code"] == "VALIDATION_ERROR"
    assert isinstance(body422["detail"], list)

    # 404 — not found
    r404 = await client.get(f"{ACCOUNTS}00000000-0000-0000-0000-000000000000")
    assert r404.status_code == 404
    body404 = r404.json()
    assert body404["code"] == "HTTP_ERROR"
    assert isinstance(body404["detail"], str)

    # 400 — invalid lead transition
    lead = (await client.post(LEADS, json={
        "first_name": "X", "last_name": "Y", "email": "x@y.com",
    })).json()
    r400 = await client.patch(f"{LEADS}{lead['id']}", json={"status": "qualified"})
    assert r400.status_code == 400
    body400 = r400.json()
    assert body400["code"] == "HTTP_ERROR"
    assert isinstance(body400["detail"], str)

    # 409 — email conflict
    await client.post(CONTACTS, json={
        "first_name": "A", "last_name": "B", "email": "conflict@test.com",
    })
    r409 = await client.post(CONTACTS, json={
        "first_name": "C", "last_name": "D", "email": "conflict@test.com",
    })
    assert r409.status_code == 409
    body409 = r409.json()
    assert body409["code"] == "HTTP_ERROR"
    assert isinstance(body409["detail"], str)
