from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.sales_rep
    display_name: str | None = None


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
    display_name: str | None = None


class UserMeUpdate(BaseModel):
    display_name: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SeedUsersResponse(BaseModel):
    created: int
    skipped: int
