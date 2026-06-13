from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.lead import LeadStatus


class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    company: str | None = None
    source: str | None = None
    notes: str | None = None


class LeadUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    status: LeadStatus | None = None
    source: str | None = None
    notes: str | None = None

    model_config = ConfigDict(extra="ignore")


class LeadResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    company: str | None
    status: str
    source: str | None
    notes: str | None
    converted_opportunity_id: str | None
    created_by_user_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
