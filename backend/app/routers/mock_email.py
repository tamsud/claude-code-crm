from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin, require_any_authenticated
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.email_message import EmailResponse, EmailSend
from app.services import mock_email_service

router = APIRouter(prefix="/api/v1/mock-email", tags=["mock-email"])


@router.post("/", response_model=EmailResponse, status_code=201)
async def send_email(
    data: EmailSend,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await mock_email_service.send_email(db, data)


@router.get("/", response_model=PaginatedResponse[EmailResponse])
async def list_emails(
    page: int = Query(1, ge=1),
    size: int = Query(None),
    to: str | None = Query(None, description="Filter by recipient email address"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    page_size = min(size or settings.page_size_default, settings.page_size_max)
    return await mock_email_service.list_emails(db, page=page, size=page_size, to=to)


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_any_authenticated),
):
    return await mock_email_service.get_email(db, email_id)


@router.delete("/", status_code=204)
async def clear_emails(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await mock_email_service.clear_emails(db)
