from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.seed import SeedResponse
from app.services import seed_service

router = APIRouter(prefix="/api/v1/seed", tags=["seed"])


@router.post("/", response_model=SeedResponse, status_code=201)
async def seed_demo(
    db: AsyncSession = Depends(get_db),
):
    """Populate the database with demo CRM data. No auth required."""
    return await seed_service.seed_demo(db)


@router.delete("/", status_code=204)
async def clear_all(
    db: AsyncSession = Depends(get_db),
):
    """Remove all CRM records. No auth required."""
    await seed_service.clear_all(db)
