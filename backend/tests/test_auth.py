"""Auth endpoint tests — requires a running in-memory SQLite test DB."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.auth.password import hash_password

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def auth_engine():
    engine = create_async_engine(TEST_DB_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def http_client(auth_engine):
    Session = sessionmaker(auth_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with Session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def seed_user(auth_engine):
    Session = sessionmaker(auth_engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        user = User(
            email="admin@crm.local",
            hashed_password=hash_password("password123"),
            role=UserRole.admin.value,
            display_name="Admin",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


@pytest.mark.asyncio
async def test_login_success(http_client: AsyncClient, seed_user):
    resp = await http_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@crm.local", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(http_client: AsyncClient, seed_user):
    resp = await http_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@crm.local", "password": "wrongpass"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(http_client: AsyncClient):
    resp = await http_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@crm.local", "password": "password123"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(http_client: AsyncClient):
    resp = await http_client.get("/api/v1/accounts/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_token(http_client: AsyncClient, seed_user):
    login_resp = await http_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@crm.local", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    resp = await http_client.get(
        "/api/v1/accounts/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
