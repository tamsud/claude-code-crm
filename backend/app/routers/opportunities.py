from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_any_authenticated, require_manager_or_above
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.opportunity import OpportunityCreate, OpportunityResponse, OpportunityUpdate
from app.services import opportunity_service

router = APIRouter(prefix="/api/v1/opportunities", tags=["opportunities"])


@router.get("/", response_model=PaginatedResponse[OpportunityResponse])
async def list_opportunities(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    stage: str | None = Query(None),
    account_id: str | None = Query(None),
    contact_id: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await opportunity_service.list_opportunities(
        db, page=page, size=page_size, stage=stage, account_id=account_id, contact_id=contact_id,
        search=search, sort_by=sort_by, sort_dir=sort_dir
    )


@router.post("/", response_model=OpportunityResponse, status_code=201)
async def create_opportunity(
    data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await opportunity_service.create_opportunity(db, data)


@router.get("/{opp_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opp_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await opportunity_service.get_opportunity(db, opp_id)


@router.patch("/{opp_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opp_id: str,
    data: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    return await opportunity_service.update_opportunity(db, opp_id, data)


@router.delete("/{opp_id}", status_code=204)
async def delete_opportunity(
    opp_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    await opportunity_service.delete_opportunity(db, opp_id)
