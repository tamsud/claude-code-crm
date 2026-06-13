"""Add created_by_user_id FK to leads and activities for ownership tracking

Revision ID: 004
Revises: 003
Create Date: 2026-06-13
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("leads") as batch_op:
        batch_op.add_column(
            sa.Column("created_by_user_id", sa.String(36), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_leads_created_by_user_id",
            "users",
            ["created_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )

    with op.batch_alter_table("activities") as batch_op:
        batch_op.add_column(
            sa.Column("created_by_user_id", sa.String(36), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_activities_created_by_user_id",
            "users",
            ["created_by_user_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("activities") as batch_op:
        batch_op.drop_constraint("fk_activities_created_by_user_id", type_="foreignkey")
        batch_op.drop_column("created_by_user_id")

    with op.batch_alter_table("leads") as batch_op:
        batch_op.drop_constraint("fk_leads_created_by_user_id", type_="foreignkey")
        batch_op.drop_column("created_by_user_id")
