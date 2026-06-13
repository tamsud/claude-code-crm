from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.activity import ActivityType


class ActivityCreate(BaseModel):
    type: ActivityType
    subject: str
    notes: str | None = None
    activity_date: datetime | None = None
    contact_id: str | None = None
    opportunity_id: str | None = None

    @model_validator(mode="after")
    def require_at_least_one_link(self) -> "ActivityCreate":
        if self.contact_id is None and self.opportunity_id is None:
            raise ValueError("Activity must be linked to at least one Contact or Opportunity.")
        return self


class ActivityUpdate(BaseModel):
    type: ActivityType | None = None
    subject: str | None = None
    notes: str | None = None
    activity_date: datetime | None = None
    contact_id: str | None = None
    opportunity_id: str | None = None

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="after")
    def require_at_least_one_link(self) -> "ActivityUpdate":
        # Only validate if both are explicitly set to None in the update
        if self.contact_id is None and self.opportunity_id is None:
            if "contact_id" in self.model_fields_set and "opportunity_id" in self.model_fields_set:
                raise ValueError("Activity must be linked to at least one Contact or Opportunity.")
        return self


class ActivityResponse(BaseModel):
    id: str
    type: str
    subject: str
    notes: str | None
    activity_date: datetime
    contact_id: str | None
    opportunity_id: str | None
    created_by_user_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
