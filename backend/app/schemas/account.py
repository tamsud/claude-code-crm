from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    name: str
    industry: str | None = None
    website: str | None = None
    phone: str | None = None
    address: str | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    industry: str | None = None
    website: str | None = None
    phone: str | None = None
    address: str | None = None

    model_config = ConfigDict(extra="ignore")


class AccountResponse(BaseModel):
    id: str
    name: str
    industry: str | None
    website: str | None
    phone: str | None
    address: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
