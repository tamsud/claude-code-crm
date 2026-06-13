from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity
from app.schemas.common import PaginatedResponse
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate


async def create_opportunity(db: AsyncSession, data: OpportunityCreate) -> Opportunity:
    from app.models.account import Account
    from app.models.contact import Contact

    if not (await db.execute(select(Account).where(Account.id == data.account_id))).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Account not found", headers={"X-Error-Code": "ACCOUNT_NOT_FOUND"})

    if data.contact_id:
        if not (await db.execute(select(Contact).where(Contact.id == data.contact_id))).scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Contact not found", headers={"X-Error-Code": "CONTACT_NOT_FOUND"})

    opp = Opportunity(**data.model_dump())
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return opp


async def get_opportunity(db: AsyncSession, opp_id: str) -> Opportunity:
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found", headers={"X-Error-Code": "OPPORTUNITY_NOT_FOUND"})
    return opp


_OPP_SORT = {
    "title": Opportunity.title,
    "stage": Opportunity.stage,
    "value": Opportunity.value,
    "probability": Opportunity.probability,
    "expected_close_date": Opportunity.expected_close_date,
    "created_at": Opportunity.created_at,
    "updated_at": Opportunity.updated_at,
}


async def list_opportunities(
    db: AsyncSession,
    page: int,
    size: int,
    stage: str | None = None,
    account_id: str | None = None,
    contact_id: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> PaginatedResponse:
    offset = (page - 1) * size
    sort_col = _OPP_SORT.get(sort_by, Opportunity.created_at)
    order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()

    query = select(Opportunity).order_by(order)
    count_query = select(func.count()).select_from(Opportunity)

    filters = []
    if stage:
        filters.append(Opportunity.stage == stage)
    if account_id:
        filters.append(Opportunity.account_id == account_id)
    if contact_id:
        filters.append(Opportunity.contact_id == contact_id)
    if search:
        filters.append(Opportunity.title.ilike(f"%{search}%"))

    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)

    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def update_opportunity(db: AsyncSession, opp_id: str, data: OpportunityUpdate) -> Opportunity:
    opp = await get_opportunity(db, opp_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(opp, field, value)
    await db.commit()
    await db.refresh(opp)
    return opp


async def delete_opportunity(db: AsyncSession, opp_id: str) -> None:
    opp = await get_opportunity(db, opp_id)
    await db.delete(opp)
    await db.commit()
