"""Add added_price to extension

Revision ID: a1b2c3d4e5f6
Revises: 1a31ce608336
Create Date: 2026-08-25 07:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "6e1b3f4f8f09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "extension",
        sa.Column("added_price", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("extension", "added_price")
