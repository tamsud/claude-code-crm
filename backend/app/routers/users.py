from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin, require_any_authenticated
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.user import SeedUsersResponse, UserCreate, UserMeUpdate, UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await user_service.list_users(db, page=page, size=page_size)


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await user_service.create_user(db, data)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(require_any_authenticated)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserMeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    return await user_service.update_me(db, current_user, data)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await user_service.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await user_service.update_user(db, user_id, data)
