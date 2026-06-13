from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_message import EmailMessage
from app.schemas.common import PaginatedResponse
from app.schemas.email_message import EmailSend


async def send_email(db: AsyncSession, data: EmailSend) -> EmailMessage:
    msg = EmailMessage(**data.model_dump())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def get_email(db: AsyncSession, email_id: str) -> EmailMessage:
    result = await db.execute(select(EmailMessage).where(EmailMessage.id == email_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(
            status_code=404,
            detail="Email not found",
            headers={"X-Error-Code": "EMAIL_NOT_FOUND"},
        )
    return msg


async def list_emails(
    db: AsyncSession,
    page: int,
    size: int,
    to: str | None = None,
) -> PaginatedResponse:
    offset = (page - 1) * size
    query = select(EmailMessage).order_by(EmailMessage.sent_at.desc())
    count_query = select(func.count()).select_from(EmailMessage)
    if to:
        query = query.where(EmailMessage.to_email == to)
        count_query = count_query.where(EmailMessage.to_email == to)
    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def clear_emails(db: AsyncSession) -> None:
    await db.execute(delete(EmailMessage))
    await db.commit()
