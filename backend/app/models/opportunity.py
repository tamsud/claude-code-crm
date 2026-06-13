import uuid
from datetime import date, datetime
from enum import Enum

from sqlalchemy import CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OpportunityStage(str, Enum):
    prospecting = "prospecting"
    proposal = "proposal"
    negotiation = "negotiation"
    closed_won = "closed-won"
    closed_lost = "closed-lost"


class Opportunity(Base):
    __tablename__ = "opportunities"
    __table_args__ = (
        CheckConstraint("value > 0", name="ck_opportunity_value_positive"),
        CheckConstraint("probability >= 0 AND probability <= 100", name="ck_opportunity_probability_range"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    account_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    contact_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    stage: Mapped[str] = mapped_column(String(20), nullable=False, default=OpportunityStage.prospecting.value)
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    probability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_close_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    account: Mapped["Account"] = relationship("Account", back_populates="opportunities", lazy="selectin")
    contact: Mapped["Contact | None"] = relationship("Contact", lazy="selectin")
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="opportunity", lazy="selectin")
