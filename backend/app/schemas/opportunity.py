from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class OpportunityCreate(BaseModel):
    title: str
    account_id: str
    contact_id: str | None = None
    stage: str = "prospecting"
    value: Annotated[float | None, Field(gt=0)] = None
    probability: Annotated[int | None, Field(ge=0, le=100)] = None
    expected_close_date: date | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = None
    account_id: str | None = None
    contact_id: str | None = None
    stage: str | None = None
    value: Annotated[float | None, Field(gt=0)] = None
    probability: Annotated[int | None, Field(ge=0, le=100)] = None
    expected_close_date: date | None = None

    model_config = ConfigDict(extra="ignore")


class OpportunityResponse(BaseModel):
    id: str
    title: str
    account_id: str
    contact_id: str | None
    stage: str
    value: float | None
    probability: int | None
    expected_close_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
