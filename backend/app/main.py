from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(title="Sales CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": "HTTP_ERROR"},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic v2 may embed non-JSON-serializable objects (e.g. ValueError) in
    # the `ctx` field of model_validator errors. Stringify ctx values to ensure
    # the response is always serializable.
    safe_errors = []
    for err in exc.errors():
        sanitized = dict(err)
        ctx = sanitized.get("ctx")
        if isinstance(ctx, dict):
            # Pydantic v2 model_validator errors embed the raw exception under
            # 'error'; stringify it so JSONResponse can serialize it.
            sanitized["ctx"] = {
                k: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
                for k, v in ctx.items()
            }
        safe_errors.append(sanitized)
    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors, "code": "VALIDATION_ERROR"},
    )


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


from app.routers import accounts, contacts, leads, opportunities, activities, seed, mock_email
from app.routers import auth as auth_router
from app.routers import users as users_router
from app.routers import admin as admin_router
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(users_router.router)
app.include_router(admin_router.router)
app.include_router(accounts.router)
app.include_router(contacts.router)
app.include_router(leads.router)
app.include_router(opportunities.router)
app.include_router(activities.router)
app.include_router(seed.router)
app.include_router(mock_email.router)
