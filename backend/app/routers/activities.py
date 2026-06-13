from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_any_authenticated, require_manager_or_above
from app.config import settings
from app.database import get_db
from app.models.activity import ActivityType
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.schemas.common import PaginatedResponse
from app.services import activity_service

router = APIRouter(prefix="/api/v1/activities", tags=["activities"])


@router.get("/", response_model=PaginatedResponse[ActivityResponse])
async def list_activities(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    type: ActivityType | None = Query(None),
    contact_id: str | None = Query(None),
    opportunity_id: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("activity_date"),
    sort_dir: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await activity_service.list_activities(
        db,
        page=page,
        size=page_size,
        type=type.value if type else None,
        contact_id=contact_id,
        opportunity_id=opportunity_id,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("/", response_model=ActivityResponse, status_code=201)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    return await activity_service.create_activity(db, data, created_by_user_id=current_user.id)


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await activity_service.get_activity(db, activity_id)


@router.patch("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    return await activity_service.update_activity(db, activity_id, data, requesting_user=current_user)


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_manager_or_above),
):
    await activity_service.delete_activity(db, activity_id)
