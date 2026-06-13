from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_any_authenticated, require_manager_or_above
from app.database import get_db
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate
from app.schemas.common import PaginatedResponse
from app.services import contact_service
from app.config import settings

router = APIRouter(prefix="/api/v1/contacts", tags=["contacts"])


@router.get("/", response_model=PaginatedResponse[ContactResponse])
async def list_contacts(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    account_id: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await contact_service.list_contacts(db, page=page, size=page_size, account_id=account_id, search=search, sort_by=sort_by, sort_dir=sort_dir)


@router.post("/", response_model=ContactResponse, status_code=201)
async def create_contact(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await contact_service.create_contact(db, data)


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await contact_service.get_contact(db, contact_id)


@router.patch("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await contact_service.update_contact(db, contact_id, data)


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    await contact_service.delete_contact(db, contact_id)
