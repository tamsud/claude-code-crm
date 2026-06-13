from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class EmailSend(BaseModel):
    from_email: EmailStr
    to_email: EmailStr
    subject: str
    body: str | None = None
    html_body: str | None = None


class EmailResponse(BaseModel):
    id: str
    from_email: str
    to_email: str
    subject: str
    body: str | None
    html_body: str | None
    sent_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
