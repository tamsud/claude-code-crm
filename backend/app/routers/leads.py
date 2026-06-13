from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_any_authenticated, require_manager_or_above
from app.config import settings
from app.database import get_db
from app.models.lead import LeadStatus
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.schemas.opportunity import OpportunityResponse
from app.schemas.common import PaginatedResponse
from app.services import lead_service

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.get("/", response_model=PaginatedResponse[LeadResponse])
async def list_leads(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    status: LeadStatus | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await lead_service.list_leads(db, page=page, size=page_size, status=status.value if status else None, search=search, sort_by=sort_by, sort_dir=sort_dir)


@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    return await lead_service.create_lead(db, data, created_by_user_id=current_user.id)


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await lead_service.get_lead(db, lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    return await lead_service.update_lead(db, lead_id, data, requesting_user=current_user)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    await lead_service.delete_lead(db, lead_id)


@router.post("/{lead_id}/convert", response_model=OpportunityResponse, status_code=201)
async def convert_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await lead_service.convert_lead(db, lead_id)
