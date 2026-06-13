# Sales CRM — Backend

**Stack:** Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2 · Alembic · SQLite · JWT (python-jose) · bcrypt (passlib)

## Local Setup

```bash
cd backend

# 1. Create virtual environment (Python 3.12+)
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
.venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env: set JWT_SECRET_KEY to a secure 32+ char random string

# 4. Run migrations
alembic upgrade head

# 5. Start server
uvicorn app.main:app --reload
```

API: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./crm.db` | Database connection string |
| `JWT_SECRET_KEY` | `changeme-replace-...` | **Change in production!** Min 32 chars |
| `JWT_EXPIRE_MINUTES` | `60` | Token expiry in minutes |

## Authentication

All API endpoints (except `GET /health` and `POST /api/v1/auth/login`) require a Bearer token:

```bash
# 1. Seed demo users (first time only)
# Login as admin and POST /api/v1/admin/seed-users

# 2. Get a token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@crm.local","password":"password123"}' | jq -r .access_token)

# 3. Use it
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/accounts/
```

## RBAC

| Role | Can |
|------|-----|
| **Admin** | Everything + user management + seed/clear |
| **Manager** | CRUD on all CRM entities; no user management |
| **Sales Rep** | Read all; create/edit own leads and activities only |

## Project Layout

```
backend/
├── app/
│   ├── main.py               # FastAPI app + router registration
│   ├── config.py             # Settings (pydantic-settings)
│   ├── database.py           # Async SQLAlchemy engine + session
│   ├── auth/                 # JWT, bcrypt, FastAPI Depends guards
│   │   ├── dependencies.py   # get_current_user, require_admin, etc.
│   │   ├── jwt.py            # create_access_token, decode_token
│   │   └── password.py       # hash_password, verify_password
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic v2 request/response schemas
│   ├── routers/              # Route handlers (one per entity)
│   └── services/             # Business logic (one per entity)
├── alembic/versions/         # Database migrations (001–004)
├── tests/                    # pytest test suite
├── requirements.txt
├── requirements-dev.txt
├── alembic.ini
└── .env.example
```

## Running Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Migrations

```bash
alembic upgrade head          # Apply all pending
alembic downgrade -1          # Roll back one
alembic revision --autogenerate -m "describe change"  # Generate new
```
