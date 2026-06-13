"""
RBAC (Role-Based Access Control) tests.

Covers:
- Admin: full access to /users, /admin/*, and all CRM endpoints
- Manager: full access to CRM data; cannot access /users or /admin/*
- Sales Rep: can create own leads/activities; cannot delete CRM records or access admin
- Sales Rep ownership: cannot update/delete another user's lead
"""
import pytest_asyncio
import pytest
from httpx import AsyncClient


# ── Helper ───────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def lead_by_sales(sales_client):
    """A lead created by the sales rep."""
    r = await sales_client.post("/api/v1/leads/", json={
        "first_name": "Sales",
        "last_name": "OwnLead",
        "email": "sales.own@example.com",
        "company": "Own Corp",
    })
    assert r.status_code == 201
    return r.json()


@pytest_asyncio.fixture
async def lead_by_admin(client):
    """A lead created by the admin."""
    r = await client.post("/api/v1/leads/", json={
        "first_name": "Admin",
        "last_name": "OwnLead",
        "email": "admin.own@example.com",
        "company": "Admin Corp",
    })
    assert r.status_code == 201
    return r.json()


# ── Admin permissions ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_admin_can_list_users(client: AsyncClient):
    r = await client.get("/api/v1/users/")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_admin_can_create_account(client: AsyncClient):
    r = await client.post("/api/v1/accounts/", json={"name": "Admin Account"})
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_delete_account(client: AsyncClient):
    r = await client.post("/api/v1/accounts/", json={"name": "To Delete"})
    acct_id = r.json()["id"]
    r2 = await client.delete(f"/api/v1/accounts/{acct_id}")
    assert r2.status_code == 204


@pytest.mark.asyncio
async def test_admin_can_seed_users(client: AsyncClient):
    r = await client.post("/api/v1/admin/seed-users")
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_clear_data(client: AsyncClient):
    r = await client.delete("/api/v1/admin/clear")
    assert r.status_code == 204


# ── Manager permissions ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_manager_cannot_list_users(manager_client: AsyncClient):
    r = await manager_client.get("/api/v1/users/")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_manager_cannot_access_admin_clear(manager_client: AsyncClient):
    r = await manager_client.delete("/api/v1/admin/clear")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_manager_can_create_account(manager_client: AsyncClient):
    r = await manager_client.post("/api/v1/accounts/", json={"name": "Mgr Account"})
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_manager_can_delete_account(manager_client: AsyncClient):
    r = await manager_client.post("/api/v1/accounts/", json={"name": "Mgr Delete"})
    acct_id = r.json()["id"]
    r2 = await manager_client.delete(f"/api/v1/accounts/{acct_id}")
    assert r2.status_code == 204


@pytest.mark.asyncio
async def test_manager_can_create_lead(manager_client: AsyncClient):
    r = await manager_client.post("/api/v1/leads/", json={
        "first_name": "Mgr",
        "last_name": "Lead",
        "email": "mgr.lead@example.com",
    })
    assert r.status_code == 201


# ── Sales Rep permissions ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_sales_cannot_list_users(sales_client: AsyncClient):
    r = await sales_client.get("/api/v1/users/")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_sales_cannot_create_account(sales_client: AsyncClient):
    r = await sales_client.post("/api/v1/accounts/", json={"name": "Sales Account"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_sales_cannot_delete_lead(sales_client: AsyncClient, lead_by_sales):
    r = await sales_client.delete(f"/api/v1/leads/{lead_by_sales['id']}")
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_sales_can_create_own_lead(sales_client: AsyncClient):
    r = await sales_client.post("/api/v1/leads/", json={
        "first_name": "Sales",
        "last_name": "NewLead",
        "email": "sales.new@example.com",
    })
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_sales_can_update_own_lead(sales_client: AsyncClient, lead_by_sales):
    r = await sales_client.patch(
        f"/api/v1/leads/{lead_by_sales['id']}",
        json={"status": "contacted"},
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_sales_cannot_update_others_lead(sales_client: AsyncClient, lead_by_admin):
    r = await sales_client.patch(
        f"/api/v1/leads/{lead_by_admin['id']}",
        json={"status": "contacted"},
    )
    assert r.status_code == 403


# ── Unauthenticated ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_unauth_cannot_access_accounts(unauth_client: AsyncClient):
    r = await unauth_client.get("/api/v1/accounts/")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_unauth_cannot_access_leads(unauth_client: AsyncClient):
    r = await unauth_client.get("/api/v1/leads/")
    assert r.status_code == 401
