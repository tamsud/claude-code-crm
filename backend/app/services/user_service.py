from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.password import hash_password
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserMeUpdate, UserUpdate


async def list_users(db: AsyncSession, page: int, size: int) -> PaginatedResponse:
    offset = (page - 1) * size
    total = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    items = (await db.execute(select(User).offset(offset).limit(size))).scalars().all()
    return PaginatedResponse(total=total, page=page, size=size, items=list(items))


async def get_user(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    existing = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role.value,
        display_name=data.display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user_id: str, data: UserUpdate) -> User:
    user = await get_user(db, user_id)
    updates = data.model_dump(exclude_unset=True)
    if "role" in updates and updates["role"] is not None:
        updates["role"] = updates["role"].value
    for field, value in updates.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def update_me(db: AsyncSession, user: User, data: UserMeUpdate) -> User:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def seed_users(db: AsyncSession) -> dict[str, int]:
    """Create the 3 demo users. Skips any that already exist."""
    demo = [
        {"email": "admin@crm.local", "role": UserRole.admin, "display_name": "Admin User"},
        {"email": "manager@crm.local", "role": UserRole.manager, "display_name": "Manager User"},
        {"email": "sales@crm.local", "role": UserRole.sales_rep, "display_name": "Sales Rep"},
    ]
    created = 0
    skipped = 0
    for item in demo:
        existing = (await db.execute(select(User).where(User.email == item["email"]))).scalar_one_or_none()
        if existing:
            skipped += 1
        else:
            user = User(
                email=item["email"],
                hashed_password=hash_password("password123"),
                role=item["role"].value,
                display_name=item["display_name"],
            )
            db.add(user)
            created += 1
    await db.commit()
    return {"created": created, "skipped": skipped}
