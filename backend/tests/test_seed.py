"""
Tests for the Seed API (/api/v1/seed/).

Covers: POST (seed demo data), DELETE (clear all), idempotency, counts,
demo data verification, seed→clear→seed cycle.
"""
import pytest


# ---------------------------------------------------------------------------
# POST /api/v1/seed/
# ---------------------------------------------------------------------------

class TestSeedDemo:
    async def test_seed_returns_201(self, client):
        r = await client.post("/api/v1/seed/")
        assert r.status_code == 201

    async def test_seed_response_shape(self, client):
        r = await client.post("/api/v1/seed/")
        data = r.json()
        assert "message" in data
        assert "seeded" in data
        counts = data["seeded"]
        for key in ("accounts", "contacts", "leads", "opportunities", "activities", "emails"):
            assert key in counts

    async def test_seed_returns_correct_counts(self, client):
        r = await client.post("/api/v1/seed/")
        counts = r.json()["seeded"]
        assert counts["accounts"] == 4
        assert counts["contacts"] == 4
        assert counts["leads"] == 3
        assert counts["opportunities"] == 4
        assert counts["activities"] == 9
        assert counts["emails"] == 8

    async def test_seed_message_field(self, client):
        r = await client.post("/api/v1/seed/")
        assert "seeded successfully" in r.json()["message"].lower()

    async def test_seed_creates_accounts(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/accounts/")
        data = r.json()
        assert data["total"] == 4
        names = {a["name"] for a in data["items"]}
        assert "TechStart Inc" in names
        assert "HealthCare Pro" in names
        assert "Finance Solutions Ltd" in names
        assert "Global Retail Corp" in names

    async def test_seed_creates_contacts(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/contacts/")
        data = r.json()
        assert data["total"] == 4
        emails = {c["email"] for c in data["items"]}
        assert "tom.wilson@techstart.io" in emails
        assert "sarah.j@healthcarepro.com" in emails
        assert "m.chen@financesolutions.co" in emails
        assert "emma.davis@globalretail.com" in emails

    async def test_seed_creates_leads(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/leads/")
        data = r.json()
        assert data["total"] == 3
        statuses = {l["status"] for l in data["items"]}
        assert "qualified" in statuses
        assert "lost" in statuses
        assert "new" in statuses

    async def test_seed_creates_opportunities(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/opportunities/")
        data = r.json()
        assert data["total"] == 4
        stages = {o["stage"] for o in data["items"]}
        assert "prospecting" in stages
        assert "proposal" in stages
        assert "negotiation" in stages
        assert "closed-won" in stages

    async def test_seed_creates_activities(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/activities/")
        data = r.json()
        assert data["total"] == 9

    async def test_seed_creates_emails(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/mock-email/")
        data = r.json()
        assert data["total"] == 8

    async def test_seed_emails_all_from_crm_demo_local(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/mock-email/", params={"size": 100})
        for email in r.json()["items"]:
            assert email["from_email"] == "crm@demo.local"

    async def test_seed_is_idempotent(self, client):
        r1 = await client.post("/api/v1/seed/")
        r2 = await client.post("/api/v1/seed/")
        assert r1.status_code == 201
        assert r2.status_code == 201
        # Second seed clears first, so counts stay the same
        assert r2.json()["seeded"]["accounts"] == 4

    async def test_seed_clears_existing_data_first(self, client):
        # Create some data manually
        await client.post("/api/v1/accounts/", json={"name": "Extra Account"})
        # Seed should wipe it and replace with demo data
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/accounts/")
        assert r.json()["total"] == 4
        names = {a["name"] for a in r.json()["items"]}
        assert "Extra Account" not in names

    async def test_seed_opportunity_values(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/opportunities/", params={"size": 100})
        values = {o["value"] for o in r.json()["items"]}
        assert 75000.0 in values
        assert 120000.0 in values
        assert 250000.0 in values
        assert 500000.0 in values

    async def test_seed_activity_types(self, client):
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/activities/", params={"size": 100})
        types = {a["type"] for a in r.json()["items"]}
        assert "call" in types
        assert "email" in types
        assert "meeting" in types


# ---------------------------------------------------------------------------
# DELETE /api/v1/seed/
# ---------------------------------------------------------------------------

class TestClearAll:
    async def test_clear_returns_204(self, client):
        r = await client.delete("/api/v1/seed/")
        assert r.status_code == 204

    async def test_clear_removes_all_accounts(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/accounts/")
        assert r.json()["total"] == 0

    async def test_clear_removes_all_contacts(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/contacts/")
        assert r.json()["total"] == 0

    async def test_clear_removes_all_leads(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/leads/")
        assert r.json()["total"] == 0

    async def test_clear_removes_all_opportunities(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/opportunities/")
        assert r.json()["total"] == 0

    async def test_clear_removes_all_activities(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/activities/")
        assert r.json()["total"] == 0

    async def test_clear_removes_all_emails(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/mock-email/")
        assert r.json()["total"] == 0

    async def test_clear_on_empty_db_is_idempotent(self, client):
        r1 = await client.delete("/api/v1/seed/")
        r2 = await client.delete("/api/v1/seed/")
        assert r1.status_code == 204
        assert r2.status_code == 204

    async def test_clear_removes_manually_created_data(self, client):
        await client.post("/api/v1/accounts/", json={"name": "Manual Account"})
        await client.delete("/api/v1/seed/")
        r = await client.get("/api/v1/accounts/")
        assert r.json()["total"] == 0


# ---------------------------------------------------------------------------
# Seed → Clear → Seed cycle (demo workflow)
# ---------------------------------------------------------------------------

class TestSeedClearCycle:
    async def test_seed_clear_seed_restores_demo_data(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        r = await client.post("/api/v1/seed/")
        assert r.status_code == 201
        counts = r.json()["seeded"]
        assert counts["accounts"] == 4
        assert counts["contacts"] == 4

    async def test_seed_after_clear_has_correct_totals_in_db(self, client):
        await client.post("/api/v1/seed/")
        await client.delete("/api/v1/seed/")
        await client.post("/api/v1/seed/")
        r = await client.get("/api/v1/accounts/")
        assert r.json()["total"] == 4
        r = await client.get("/api/v1/opportunities/")
        assert r.json()["total"] == 4

    async def test_multiple_seed_cycles(self, client):
        for _ in range(3):
            r_seed = await client.post("/api/v1/seed/")
            assert r_seed.json()["seeded"]["accounts"] == 4
            r_del = await client.delete("/api/v1/seed/")
            assert r_del.status_code == 204
            r_acc = await client.get("/api/v1/accounts/")
            assert r_acc.json()["total"] == 0
