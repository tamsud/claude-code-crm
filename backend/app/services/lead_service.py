from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead, LeadStatus
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.lead import LeadCreate, LeadUpdate

VALID_TRANSITIONS: dict[str, set[str]] = {
    LeadStatus.new.value:       {LeadStatus.contacted.value, LeadStatus.lost.value},
    LeadStatus.contacted.value: {LeadStatus.qualified.value, LeadStatus.lost.value},
    LeadStatus.qualified.value: {LeadStatus.lost.value},
    LeadStatus.lost.value:      set(),
}


def _validate_transition(current: str, new: str) -> None:
    allowed = VALID_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: '{current}' → '{new}'. "
                f"Allowed transitions from '{current}': {sorted(allowed) or 'none (terminal state)'}."
            ),
            headers={"X-Error-Code": "INVALID_LEAD_TRANSITION"},
        )


async def create_lead(db: AsyncSession, data: LeadCreate, created_by_user_id: str | None = None) -> Lead:
    lead = Lead(**data.model_dump(), status=LeadStatus.new.value, created_by_user_id=created_by_user_id)
    db.add(lead)
    await db.flush()

    from app.models.email_message import EmailMessage
    notification = EmailMessage(
        from_email="crm-system@demo.local",
        to_email="crm-leads@company.internal",
        subject=f"New Lead: {lead.first_name} {lead.last_name}",
        body=(
            f"A new lead has been captured.\n\n"
            f"Name: {lead.first_name} {lead.last_name}\n"
            f"Email: {lead.email}\n"
            f"Phone: {lead.phone or 'N/A'}\n"
            f"Company: {lead.company or 'N/A'}\n"
            f"Source: {lead.source or 'N/A'}\n"
            f"Notes: {lead.notes or 'N/A'}\n"
        ),
    )
    db.add(notification)

    await db.commit()
    await db.refresh(lead)
    return lead


async def get_lead(db: AsyncSession, lead_id: str) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found", headers={"X-Error-Code": "LEAD_NOT_FOUND"})
    return lead


_LEAD_SORT = {
    "first_name": Lead.first_name,
    "last_name": Lead.last_name,
    "company": Lead.company,
    "status": Lead.status,
    "created_at": Lead.created_at,
    "updated_at": Lead.updated_at,
}


async def list_leads(
    db: AsyncSession,
    page: int,
    size: int,
    status: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> PaginatedResponse:
    from sqlalchemy import or_
    offset = (page - 1) * size
    sort_col = _LEAD_SORT.get(sort_by, Lead.created_at)
    order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()

    query = select(Lead).order_by(order)
    count_query = select(func.count()).select_from(Lead)
    filters = []
    if status:
        filters.append(Lead.status == status)
    if search:
        pattern = f"%{search}%"
        filters.append(or_(
            Lead.first_name.ilike(pattern),
            Lead.last_name.ilike(pattern),
            Lead.email.ilike(pattern),
            Lead.company.ilike(pattern),
        ))
    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)
    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def update_lead(db: AsyncSession, lead_id: str, data: LeadUpdate, requesting_user: User | None = None) -> Lead:
    lead = await get_lead(db, lead_id)
    if requesting_user and requesting_user.role == UserRole.sales_rep.value:
        if lead.created_by_user_id != requesting_user.id:
            raise HTTPException(status_code=403, detail="You can only edit leads you created")
    updates = data.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] is not None:
        new_status = updates["status"].value if hasattr(updates["status"], "value") else updates["status"]
        _validate_transition(lead.status, new_status)
        updates["status"] = new_status
    for field, value in updates.items():
        setattr(lead, field, value)
    await db.commit()
    await db.refresh(lead)
    return lead


async def delete_lead(db: AsyncSession, lead_id: str) -> None:
    lead = await get_lead(db, lead_id)
    await db.delete(lead)
    await db.commit()


async def convert_lead(db: AsyncSession, lead_id: str):
    """Atomic lead conversion: qualified lead → Opportunity + Account + Contact."""
    from app.models.account import Account
    from app.models.contact import Contact
    from app.models.opportunity import Opportunity
    from app.schemas.opportunity import OpportunityResponse

    lead = await get_lead(db, lead_id)

    if lead.status != LeadStatus.qualified.value:
        raise HTTPException(
            status_code=400,
            detail=f"Lead must have status 'qualified' before conversion. Current status: '{lead.status}'.",
            headers={"X-Error-Code": "LEAD_NOT_QUALIFIED"},
        )

    if lead.converted_opportunity_id:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Lead has already been converted. "
                f"Existing opportunity ID: {lead.converted_opportunity_id}"
            ),
            headers={"X-Error-Code": "LEAD_ALREADY_CONVERTED"},
        )

    async with db.begin_nested():
        # 1. Find or create Account
        account = None
        if lead.company:
            result = await db.execute(
                select(Account).where(func.lower(Account.name) == lead.company.lower())
            )
            account = result.scalar_one_or_none()
        if not account:
            account = Account(name=lead.company or f"{lead.first_name} {lead.last_name}")
            db.add(account)
            await db.flush()

        # 2. Find or create Contact
        result = await db.execute(select(Contact).where(Contact.email == lead.email))
        contact = result.scalar_one_or_none()
        if not contact:
            contact = Contact(
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=lead.email,
                phone=lead.phone,
                account_id=account.id,
            )
            db.add(contact)
            await db.flush()

        # 3. Create Opportunity
        opportunity = Opportunity(
            title=f"{lead.first_name} {lead.last_name} - Opportunity",
            account_id=account.id,
            contact_id=contact.id,
            stage="prospecting",
        )
        db.add(opportunity)
        await db.flush()

        # 4. Link lead to opportunity
        lead.converted_opportunity_id = opportunity.id

    await db.commit()
    await db.refresh(opportunity)
    return opportunity
