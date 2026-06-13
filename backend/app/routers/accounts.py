from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_any_authenticated, require_manager_or_above
from app.database import get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.schemas.common import PaginatedResponse
from app.services import account_service
from app.config import settings

router = APIRouter(prefix="/api/v1/accounts", tags=["accounts"])


@router.get("/", response_model=PaginatedResponse[AccountResponse])
async def list_accounts(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await account_service.list_accounts(db, page=page, size=page_size, search=search, sort_by=sort_by, sort_dir=sort_dir)


@router.post("/", response_model=AccountResponse, status_code=201)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await account_service.create_account(db, data)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await account_service.get_account(db, account_id)


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    data: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await account_service.update_account(db, account_id, data)


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    await account_service.delete_account(db, account_id)
