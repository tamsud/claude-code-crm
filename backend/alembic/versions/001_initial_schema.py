"""Initial schema: accounts, contacts, leads, opportunities, activities

Revision ID: 001
Revises:
Create Date: 2026-06-13
"""
from __future__ import annotations

import uuid

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels: str | tuple[str, ...] | None = None
depends_on: str | tuple[str, ...] | None = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # accounts
    # -------------------------------------------------------------------------
    op.create_table(
        "accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
    )

    # -------------------------------------------------------------------------
    # contacts
    # -------------------------------------------------------------------------
    op.create_table(
        "contacts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("job_title", sa.String(100), nullable=True),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
    )

    # -------------------------------------------------------------------------
    # opportunities (created before leads so leads FK can reference it)
    # -------------------------------------------------------------------------
    op.create_table(
        "opportunities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("contact_id", sa.String(36), sa.ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("stage", sa.String(20), nullable=False, server_default="prospecting"),
        sa.Column("value", sa.Float, nullable=True),
        sa.Column("probability", sa.Integer, nullable=True),
        sa.Column("expected_close_date", sa.Date, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.CheckConstraint("value > 0", name="ck_opportunity_value_positive"),
        sa.CheckConstraint("probability >= 0 AND probability <= 100", name="ck_opportunity_probability_range"),
    )

    # -------------------------------------------------------------------------
    # leads
    # -------------------------------------------------------------------------
    op.create_table(
        "leads",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "converted_opportunity_id",
            sa.String(36),
            sa.ForeignKey("opportunities.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
    )

    # -------------------------------------------------------------------------
    # activities
    # -------------------------------------------------------------------------
    op.create_table(
        "activities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "activity_date",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column("contact_id", sa.String(36), sa.ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "opportunity_id",
            sa.String(36),
            sa.ForeignKey("opportunities.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            nullable=False,
            server_default=sa.text("(datetime('now'))"),
        ),
        sa.CheckConstraint(
            "contact_id IS NOT NULL OR opportunity_id IS NOT NULL",
            name="ck_activity_has_link",
        ),
    )

    # Indexes
    op.create_index("ix_contacts_account_id", "contacts", ["account_id"])
    op.create_index("ix_leads_status", "leads", ["status"])
    op.create_index("ix_opportunities_account_id", "opportunities", ["account_id"])
    op.create_index("ix_opportunities_contact_id", "opportunities", ["contact_id"])
    op.create_index("ix_opportunities_stage", "opportunities", ["stage"])
    op.create_index("ix_activities_contact_id", "activities", ["contact_id"])
    op.create_index("ix_activities_opportunity_id", "activities", ["opportunity_id"])
    op.create_index("ix_activities_type", "activities", ["type"])


def downgrade() -> None:
    op.drop_table("activities")
    op.drop_table("leads")
    op.drop_table("opportunities")
    op.drop_table("contacts")
    op.drop_table("accounts")
