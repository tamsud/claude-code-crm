import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ActivityType(str, Enum):
    call = "call"
    email = "email"
    meeting = "meeting"


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint(
            "contact_id IS NOT NULL OR opportunity_id IS NOT NULL",
            name="ck_activity_has_link",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type: Mapped[str] = mapped_column(String(10), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    activity_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    contact_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    opportunity_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    contact: Mapped["Contact | None"] = relationship("Contact", back_populates="activities", lazy="selectin")
    opportunity: Mapped["Opportunity | None"] = relationship("Opportunity", back_populates="activities", lazy="selectin")
