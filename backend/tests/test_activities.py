"""
Tests for the Activities resource  —  /api/v1/activities/

Request shapes
--------------
ActivityCreate : { type* ("call"|"email"|"meeting"), subject* (str),
                   notes (str|null), activity_date (ISO-8601 | null),
                   contact_id (uuid|null), opportunity_id (uuid|null) }
  ⚠ At least one of contact_id or opportunity_id must be provided (422 otherwise)

ActivityUpdate : same fields, all optional
  ⚠ Cannot set BOTH contact_id AND opportunity_id to null in a single PATCH

Response shape
--------------
{ id, type, subject, notes, activity_date, contact_id, opportunity_id,
  created_at, updated_at }

List filters
------------
?type=call|email|meeting  ?contact_id=<uuid>  ?opportunity_id=<uuid>

Business rules
--------------
- Must be linked to at least one of contact or opportunity at all times
- contact_id and opportunity_id must reference existing records (404 if not)
"""

ENDPOINT = "/api/v1/activities/"


# ── CREATE ──────────────────────────────────────────────────────────────────

async def test_create_activity_linked_to_contact(client, contact):
    """Activity can be linked to just a contact."""
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "subject": "Initial call",
        "contact_id": contact["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["type"] == "call"
    assert body["subject"] == "Initial call"
    assert body["contact_id"] == contact["id"]
    assert body["opportunity_id"] is None


async def test_create_activity_linked_to_opportunity(client, opportunity):
    """Activity can be linked to just an opportunity."""
    r = await client.post(ENDPOINT, json={
        "type": "meeting",
        "subject": "Demo session",
        "opportunity_id": opportunity["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["opportunity_id"] == opportunity["id"]
    assert body["contact_id"] is None


async def test_create_activity_linked_to_both(client, contact, opportunity):
    """Activity can be linked to both a contact and an opportunity."""
    r = await client.post(ENDPOINT, json={
        "type": "email",
        "subject": "Follow-up email",
        "contact_id": contact["id"],
        "opportunity_id": opportunity["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["contact_id"] == contact["id"]
    assert body["opportunity_id"] == opportunity["id"]


async def test_create_activity_no_link_returns_422(client):
    """Omitting both contact_id and opportunity_id returns 422."""
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "subject": "Unlinked call",
    })
    assert r.status_code == 422
    body = r.json()
    assert body["code"] == "VALIDATION_ERROR"


async def test_create_activity_null_links_returns_422(client):
    """Explicitly setting both link fields to null also returns 422."""
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "subject": "Null links",
        "contact_id": None,
        "opportunity_id": None,
    })
    assert r.status_code == 422


async def test_create_activity_invalid_type_returns_422(client, contact):
    """Type must be one of 'call', 'email', 'meeting'."""
    r = await client.post(ENDPOINT, json={
        "type": "text_message",
        "subject": "Bad type",
        "contact_id": contact["id"],
    })
    assert r.status_code == 422


async def test_create_activity_missing_type_returns_422(client, contact):
    r = await client.post(ENDPOINT, json={
        "subject": "No type",
        "contact_id": contact["id"],
    })
    assert r.status_code == 422


async def test_create_activity_missing_subject_returns_422(client, contact):
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "contact_id": contact["id"],
    })
    assert r.status_code == 422


async def test_create_activity_invalid_contact_returns_404(client):
    """Non-existent contact_id returns 404."""
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "subject": "Ghost contact",
        "contact_id": "00000000-0000-0000-0000-000000000000",
    })
    assert r.status_code == 404


async def test_create_activity_invalid_opportunity_returns_404(client, contact):
    """Non-existent opportunity_id returns 404."""
    r = await client.post(ENDPOINT, json={
        "type": "call",
        "subject": "Ghost opportunity",
        "contact_id": contact["id"],
        "opportunity_id": "00000000-0000-0000-0000-000000000000",
    })
    assert r.status_code == 404


async def test_create_activity_all_types(client, contact):
    """All three activity types are accepted."""
    for activity_type in ("call", "email", "meeting"):
        r = await client.post(ENDPOINT, json={
            "type": activity_type,
            "subject": f"Test {activity_type}",
            "contact_id": contact["id"],
        })
        assert r.status_code == 201, f"type '{activity_type}' should be valid"
        assert r.json()["type"] == activity_type


async def test_create_activity_with_notes_and_date(client, contact):
    r = await client.post(ENDPOINT, json={
        "type": "meeting",
        "subject": "Quarterly review",
        "notes": "Discussed roadmap",
        "activity_date": "2026-07-01T10:00:00",
        "contact_id": contact["id"],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["notes"] == "Discussed roadmap"
    assert "2026-07-01" in body["activity_date"]


async def test_create_activity_response_shape(client, contact):
    r = await client.post(ENDPOINT, json={
        "type": "call", "subject": "Shape check", "contact_id": contact["id"],
    })
    body = r.json()
    required = {"id", "type", "subject", "notes", "activity_date",
                "contact_id", "opportunity_id", "created_at", "updated_at"}
    assert required.issubset(body.keys())


# ── READ ─────────────────────────────────────────────────────────────────────

async def test_get_activity_by_id(client, contact):
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Get me", "contact_id": contact["id"],
    })).json()
    r = await client.get(f"{ENDPOINT}{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


async def test_get_activity_not_found(client):
    r = await client.get(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


# ── LIST ─────────────────────────────────────────────────────────────────────

async def test_list_activities_empty(client):
    r = await client.get(ENDPOINT)
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_list_activities_filter_by_type(client, contact):
    await client.post(ENDPOINT, json={"type": "call", "subject": "Call 1", "contact_id": contact["id"]})
    await client.post(ENDPOINT, json={"type": "email", "subject": "Email 1", "contact_id": contact["id"]})
    await client.post(ENDPOINT, json={"type": "meeting", "subject": "Meeting 1", "contact_id": contact["id"]})

    for t in ("call", "email", "meeting"):
        r = await client.get(f"{ENDPOINT}?type={t}")
        body = r.json()
        assert body["total"] == 1, f"expected 1 result for type={t}"
        assert body["items"][0]["type"] == t


async def test_list_activities_filter_by_contact(client, account):
    c1 = (await client.post("/api/v1/contacts/", json={
        "first_name": "C1", "last_name": "L", "email": "c1@test.com", "account_id": account["id"],
    })).json()
    c2 = (await client.post("/api/v1/contacts/", json={
        "first_name": "C2", "last_name": "L", "email": "c2@test.com", "account_id": account["id"],
    })).json()
    await client.post(ENDPOINT, json={"type": "call", "subject": "C1 call", "contact_id": c1["id"]})
    await client.post(ENDPOINT, json={"type": "email", "subject": "C2 email", "contact_id": c2["id"]})

    r = await client.get(f"{ENDPOINT}?contact_id={c1['id']}")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["contact_id"] == c1["id"]


async def test_list_activities_filter_by_opportunity(client, contact, opportunity):
    await client.post(ENDPOINT, json={
        "type": "call", "subject": "Opp call", "opportunity_id": opportunity["id"],
    })
    await client.post(ENDPOINT, json={
        "type": "email", "subject": "Contact email", "contact_id": contact["id"],
    })

    r = await client.get(f"{ENDPOINT}?opportunity_id={opportunity['id']}")
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["opportunity_id"] == opportunity["id"]


# ── UPDATE ───────────────────────────────────────────────────────────────────

async def test_update_activity_subject(client, contact):
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Original", "contact_id": contact["id"],
    })).json()
    r = await client.patch(f"{ENDPOINT}{created['id']}", json={"subject": "Updated"})
    assert r.status_code == 200
    assert r.json()["subject"] == "Updated"
    assert r.json()["contact_id"] == contact["id"]  # unchanged


async def test_update_activity_type(client, contact):
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Type change", "contact_id": contact["id"],
    })).json()
    r = await client.patch(f"{ENDPOINT}{created['id']}", json={"type": "meeting"})
    assert r.status_code == 200
    assert r.json()["type"] == "meeting"


async def test_update_activity_remove_both_links_explicitly_returns_422(client, contact, opportunity):
    """Sending contact_id=null AND opportunity_id=null together is caught by the
    Pydantic schema validator → 422 (before the service layer runs)."""
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Linked",
        "contact_id": contact["id"], "opportunity_id": opportunity["id"],
    })).json()
    r = await client.patch(f"{ENDPOINT}{created['id']}", json={
        "contact_id": None, "opportunity_id": None,
    })
    assert r.status_code == 422
    assert r.json()["code"] == "VALIDATION_ERROR"


async def test_update_activity_remove_only_link_returns_400(client, contact):
    """Patching the single remaining link to null without mentioning the other
    field passes schema validation but the service-layer guard returns 400."""
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Contact only", "contact_id": contact["id"],
    })).json()
    # opportunity_id is already null; only contact_id is sent → validator doesn't fire,
    # service check sees both would be null and returns 400.
    r = await client.patch(f"{ENDPOINT}{created['id']}", json={"contact_id": None})
    assert r.status_code == 400
    body = r.json()
    assert "link" in body["detail"].lower() or "contact" in body["detail"].lower()


async def test_update_activity_invalid_contact_returns_404(client, contact):
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Update link", "contact_id": contact["id"],
    })).json()
    r = await client.patch(f"{ENDPOINT}{created['id']}", json={
        "contact_id": "00000000-0000-0000-0000-000000000000",
    })
    assert r.status_code == 404


async def test_update_activity_not_found(client):
    r = await client.patch(
        f"{ENDPOINT}00000000-0000-0000-0000-000000000000",
        json={"subject": "Ghost"},
    )
    assert r.status_code == 404


# ── DELETE ───────────────────────────────────────────────────────────────────

async def test_delete_activity(client, contact):
    created = (await client.post(ENDPOINT, json={
        "type": "call", "subject": "Delete me", "contact_id": contact["id"],
    })).json()
    r = await client.delete(f"{ENDPOINT}{created['id']}")
    assert r.status_code == 204
    assert (await client.get(f"{ENDPOINT}{created['id']}")).status_code == 404


async def test_delete_activity_not_found(client):
    r = await client.delete(f"{ENDPOINT}00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
