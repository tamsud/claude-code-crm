from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import SeedUsersResponse
from app.services import user_service

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/bootstrap-status")
async def bootstrap_status(db: AsyncSession = Depends(get_db)):
    """Returns whether the database needs first-time setup (no auth required)."""
    user_count = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    return {"needs_setup": user_count == 0}


@router.post("/seed-users", response_model=SeedUsersResponse, status_code=201)
async def seed_users(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Create the 3 demo role users (admin/manager/sales). Idempotent — skips existing.

    Bootstrap mode: allowed without authentication when the users table is empty.
    Once any user exists, admin JWT is required.
    """
    user_count = (await db.execute(select(func.count()).select_from(User))).scalar_one()

    if user_count > 0:
        auth_header = request.headers.get("Authorization", "")
        scheme, token = get_authorization_scheme_param(auth_header)
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        current_user = await get_current_user(token=token, db=db)
        if current_user.role != UserRole.admin.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )

    result = await user_service.seed_users(db)
    return SeedUsersResponse(**result)


@router.delete("/clear", status_code=204)
async def clear_database(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Wipe all CRM records (leads, activities, contacts, accounts, opportunities).
    Does NOT delete user accounts. Requires admin role."""
    from app.services import seed_service
    await seed_service.clear_all(db)
