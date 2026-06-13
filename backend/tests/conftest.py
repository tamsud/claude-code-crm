"""
Shared pytest fixtures for the Sales CRM test suite.

All tests run against a dedicated SQLite test database.
Every table is truncated before each test — no state leaks between tests.

Auth note: The default `client` fixture is pre-authenticated as admin to avoid
updating every existing test after RBAC was added. Use `unauth_client` when
testing 401/403 responses.
"""
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.auth.password import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole

TEST_DATABASE_URL = "sqlite+aiosqlite:///./crm_test.db"


@pytest_asyncio.fixture(scope="session")
async def engine():
    _engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    @event.listens_for(_engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)   # clean slate on every session start
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_tables(engine):
    """Truncate all rows before every test for complete isolation."""
    async with engine.begin() as conn:
        await conn.execute(text("PRAGMA foreign_keys=OFF"))
        for table in ("activities", "leads", "opportunities", "contacts",
                      "email_messages", "accounts", "users"):
            await conn.execute(text(f"DELETE FROM {table}"))
        await conn.execute(text("PRAGMA foreign_keys=ON"))


def _session_override(engine):
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async def override():
        async with Session() as session:
            yield session

    return override


async def _seed_admin(engine) -> User:
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        user = User(
            email="admin@test.local",
            hashed_password=hash_password("password123"),
            role=UserRole.admin.value,
            display_name="Test Admin",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


async def _get_token(ac: AsyncClient, email: str, password: str = "password123") -> str:
    r = await ac.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


@pytest_asyncio.fixture
async def unauth_client(engine):
    """No-auth client for testing 401/403 flows."""
    app.dependency_overrides[get_db] = _session_override(engine)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(engine):
    """Default authenticated client (admin role). Keeps existing tests working."""
    admin = await _seed_admin(engine)
    app.dependency_overrides[get_db] = _session_override(engine)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        token = await _get_token(ac, admin.email)
        ac.headers["Authorization"] = f"Bearer {token}"
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client):
    """Alias for `client` — use in new tests for clarity."""
    yield client


@pytest_asyncio.fixture
async def manager_client(engine):
    """Authenticated as manager role."""
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        user = User(
            email="manager@test.local",
            hashed_password=hash_password("password123"),
            role=UserRole.manager.value,
            display_name="Test Manager",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    app.dependency_overrides[get_db] = _session_override(engine)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        token = await _get_token(ac, "manager@test.local")
        ac.headers["Authorization"] = f"Bearer {token}"
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sales_client(engine):
    """Authenticated as sales_rep role."""
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as db:
        user = User(
            email="sales@test.local",
            hashed_password=hash_password("password123"),
            role=UserRole.sales_rep.value,
            display_name="Test Sales",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    app.dependency_overrides[get_db] = _session_override(engine)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        token = await _get_token(ac, "sales@test.local")
        ac.headers["Authorization"] = f"Bearer {token}"
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Data-factory fixtures — create canonical test records via the HTTP API
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def account(client):
    r = await client.post("/api/v1/accounts/", json={"name": "Acme Corp", "industry": "Technology"})
    assert r.status_code == 201
    return r.json()


@pytest_asyncio.fixture
async def contact(client, account):
    r = await client.post("/api/v1/contacts/", json={
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@acme.com",
        "phone": "+1-555-0101",
        "account_id": account["id"],
    })
    assert r.status_code == 201
    return r.json()


@pytest_asyncio.fixture
async def lead(client):
    r = await client.post("/api/v1/leads/", json={
        "first_name": "Bob",
        "last_name": "Smith",
        "email": "bob.smith@prospect.com",
        "company": "Prospect Inc",
        "source": "Website",
    })
    assert r.status_code == 201
    return r.json()


@pytest_asyncio.fixture
async def qualified_lead(client, lead):
    await client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "contacted"})
    r = await client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "qualified"})
    assert r.status_code == 200
    return r.json()


@pytest_asyncio.fixture
async def opportunity(client, account, contact):
    r = await client.post("/api/v1/opportunities/", json={
        "title": "Deal with Acme",
        "account_id": account["id"],
        "contact_id": contact["id"],
        "stage": "prospecting",
        "value": 10000.0,
        "probability": 40,
    })
    assert r.status_code == 201
    return r.json()
