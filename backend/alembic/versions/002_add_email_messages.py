"""Add email_messages table for mock email API

Revision ID: 002
Revises: 001
Create Date: 2026-06-13
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_messages",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("from_email", sa.String(255), nullable=False),
        sa.Column("to_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("html_body", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_messages_to_email", "email_messages", ["to_email"])


def downgrade() -> None:
    op.drop_index("ix_email_messages_to_email", table_name="email_messages")
    op.drop_table("email_messages")
