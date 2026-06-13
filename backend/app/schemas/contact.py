from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    job_title: str | None = None
    account_id: str | None = None


class ContactUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    job_title: str | None = None
    account_id: str | None = None

    model_config = ConfigDict(extra="ignore")


class ContactResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    phone: str | None
    job_title: str | None
    account_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
