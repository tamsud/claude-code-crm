from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.contact import Contact
from app.schemas.account import AccountCreate, AccountUpdate
from app.schemas.common import PaginatedResponse


async def create_account(db: AsyncSession, data: AccountCreate) -> Account:
    account = Account(**data.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


async def get_account(db: AsyncSession, account_id: str) -> Account:
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found", headers={"X-Error-Code": "ACCOUNT_NOT_FOUND"})
    return account


_ACCOUNT_SORT = {
    "name": Account.name,
    "industry": Account.industry,
    "created_at": Account.created_at,
    "updated_at": Account.updated_at,
}


async def list_accounts(
    db: AsyncSession,
    page: int,
    size: int,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> PaginatedResponse:
    offset = (page - 1) * size
    sort_col = _ACCOUNT_SORT.get(sort_by, Account.created_at)
    order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()

    query = select(Account).order_by(order)
    count_query = select(func.count()).select_from(Account)
    if search:
        pattern = f"%{search}%"
        flt = Account.name.ilike(pattern)
        query = query.where(flt)
        count_query = count_query.where(flt)

    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def update_account(db: AsyncSession, account_id: str, data: AccountUpdate) -> Account:
    account = await get_account(db, account_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    await db.commit()
    await db.refresh(account)
    return account


async def delete_account(db: AsyncSession, account_id: str) -> None:
    account = await get_account(db, account_id)

    contact_count_result = await db.execute(
        select(func.count()).select_from(Contact).where(Contact.account_id == account_id)
    )
    contact_count = contact_count_result.scalar_one()

    # Import here to avoid circular imports at module load
    from app.models.opportunity import Opportunity
    opp_count_result = await db.execute(
        select(func.count()).select_from(Opportunity).where(Opportunity.account_id == account_id)
    )
    opp_count = opp_count_result.scalar_one()

    if contact_count > 0 or opp_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete account: has {contact_count} contact(s) and {opp_count} opportunity(ies)",
            headers={"X-Error-Code": "ACCOUNT_HAS_DEPENDENTS"},
        )

    await db.delete(account)
    await db.commit()
