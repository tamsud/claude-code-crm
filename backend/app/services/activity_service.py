from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.models.user import User, UserRole
from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.schemas.common import PaginatedResponse


async def _verify_links(db: AsyncSession, contact_id: str | None, opportunity_id: str | None) -> None:
    from app.models.contact import Contact
    from app.models.opportunity import Opportunity

    if contact_id:
        if not (await db.execute(select(Contact).where(Contact.id == contact_id))).scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Contact not found", headers={"X-Error-Code": "CONTACT_NOT_FOUND"})
    if opportunity_id:
        if not (await db.execute(select(Opportunity).where(Opportunity.id == opportunity_id))).scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Opportunity not found", headers={"X-Error-Code": "OPPORTUNITY_NOT_FOUND"})


async def create_activity(db: AsyncSession, data: ActivityCreate, created_by_user_id: str | None = None) -> Activity:
    await _verify_links(db, data.contact_id, data.opportunity_id)
    payload = data.model_dump()
    payload["type"] = payload["type"].value if hasattr(payload["type"], "value") else payload["type"]
    activity = Activity(**payload, created_by_user_id=created_by_user_id)
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def get_activity(db: AsyncSession, activity_id: str) -> Activity:
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found", headers={"X-Error-Code": "ACTIVITY_NOT_FOUND"})
    return activity


_ACTIVITY_SORT = {
    "subject": Activity.subject,
    "type": Activity.type,
    "activity_date": Activity.activity_date,
    "created_at": Activity.created_at,
    "updated_at": Activity.updated_at,
}


async def list_activities(
    db: AsyncSession,
    page: int,
    size: int,
    type: str | None = None,
    contact_id: str | None = None,
    opportunity_id: str | None = None,
    search: str | None = None,
    sort_by: str = "activity_date",
    sort_dir: str = "desc",
) -> PaginatedResponse:
    offset = (page - 1) * size
    sort_col = _ACTIVITY_SORT.get(sort_by, Activity.activity_date)
    order = sort_col.asc() if sort_dir == "asc" else sort_col.desc()

    query = select(Activity).order_by(order)
    count_query = select(func.count()).select_from(Activity)

    filters = []
    if type:
        filters.append(Activity.type == type)
    if contact_id:
        filters.append(Activity.contact_id == contact_id)
    if opportunity_id:
        filters.append(Activity.opportunity_id == opportunity_id)
    if search:
        filters.append(Activity.subject.ilike(f"%{search}%"))

    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)

    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query.offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def update_activity(db: AsyncSession, activity_id: str, data: ActivityUpdate, requesting_user: User | None = None) -> Activity:
    activity = await get_activity(db, activity_id)
    if requesting_user and requesting_user.role == UserRole.sales_rep.value:
        if activity.created_by_user_id != requesting_user.id:
            raise HTTPException(status_code=403, detail="You can only edit activities you created")
    updates = data.model_dump(exclude_unset=True)

    new_contact_id = updates.get("contact_id", activity.contact_id)
    new_opportunity_id = updates.get("opportunity_id", activity.opportunity_id)
    if new_contact_id is None and new_opportunity_id is None:
        raise HTTPException(
            status_code=400,
            detail="Activity must be linked to at least one Contact or Opportunity.",
            headers={"X-Error-Code": "ACTIVITY_NO_LINK"},
        )

    await _verify_links(db, updates.get("contact_id"), updates.get("opportunity_id"))

    if "type" in updates and hasattr(updates["type"], "value"):
        updates["type"] = updates["type"].value

    for field, value in updates.items():
        setattr(activity, field, value)
    await db.commit()
    await db.refresh(activity)
    return activity


async def delete_activity(db: AsyncSession, activity_id: str) -> None:
    activity = await get_activity(db, activity_id)
    await db.delete(activity)
    await db.commit()
