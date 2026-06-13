from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contact import Contact
from app.schemas.common import PaginatedResponse
from app.schemas.contact import ContactCreate, ContactUpdate


async def _check_email_unique(db: AsyncSession, email: str, exclude_id: str | None = None) -> None:
    query = select(Contact).where(Contact.email == email)
    if exclude_id:
        query = query.where(Contact.id != exclude_id)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
            headers={"X-Error-Code": "EMAIL_CONFLICT"},
        )


async def create_contact(db: AsyncSession, data: ContactCreate) -> Contact:
    await _check_email_unique(db, data.email)
    contact = Contact(**data.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


async def get_contact(db: AsyncSession, contact_id: str) -> Contact:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found", headers={"X-Error-Code": "CONTACT_NOT_FOUND"})
    return contact


_CONTACT_SORT = {
    "first_name": Contact.first_name,
    "last_name": Contact.last_name,
    "email": Contact.email,
    "job_title": Contact.job_title,
    "created_at": Contact.created_at,
    "updated_at": Contact.updated_at,
}


async def list_contacts(
    db: AsyncSession,
    page: int,
    size: int,
    account_id: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> PaginatedResponse:
    from sqlalchemy import or_
    offset = (page - 1) * size
    sort_col = _CONTACT_SORT.get(sort_by, Contact.created_at)
    order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()

    query = select(Contact).order_by(order)
    count_query = select(func.count()).select_from(Contact)
    filters = []
    if account_id:
        filters.append(Contact.account_id == account_id)
    if search:
        pattern = f"%{search}%"
        filters.append(or_(
            Contact.first_name.ilike(pattern),
            Contact.last_name.ilike(pattern),
            Contact.email.ilike(pattern),
        ))
    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)
    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def update_contact(db: AsyncSession, contact_id: str, data: ContactUpdate) -> Contact:
    contact = await get_contact(db, contact_id)
    updates = data.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] != contact.email:
        await _check_email_unique(db, updates["email"], exclude_id=contact_id)
    for field, value in updates.items():
        setattr(contact, field, value)
    await db.commit()
    await db.refresh(contact)
    return contact


async def delete_contact(db: AsyncSession, contact_id: str) -> None:
    contact = await get_contact(db, contact_id)
    await db.delete(contact)
    await db.commit()
