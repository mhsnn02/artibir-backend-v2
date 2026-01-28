"""repair_existing_tables

Revision ID: 04c7c44ea233
Revises: 1bdac221e9bf
Create Date: 2026-01-28 20:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '04c7c44ea233'
down_revision: Union[str, Sequence[str], None] = '1bdac221e9bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # --- USERS TABLE REPAIR ---
    columns = [c['name'] for c in inspector.get_columns('users')]
    
    # List of columns to check and add if missing
    columns_to_add = [
        ('is_email_verified', sa.Boolean(), sa.false()),
        ('is_phone_verified', sa.Boolean(), sa.false()),
        ('email_verification_code', sa.String(), None),
        ('phone_verification_code', sa.String(), None),
        ('tc_no', sa.String(length=11), None),
        ('id_card_front_url', sa.String(length=255), None),
        ('id_card_back_url', sa.String(length=255), None),
        ('blue_tick_status', sa.String(length=20), 'none'),
        ('student_document_barcode', sa.String(length=50), None),
        ('is_student_verified', sa.Boolean(), sa.false()),
        ('trust_score', sa.Integer(), 0),
        ('is_verified', sa.Boolean(), sa.false()),
        ('current_latitude', sa.Numeric(precision=10, scale=8), None),
        ('current_longitude', sa.Numeric(precision=11, scale=8), None),
        ('last_location_update', sa.DateTime(), None),
    ]
    
    for col_name, col_type, default_val in columns_to_add:
        if col_name not in columns:
            print(f"Adding missing column: {col_name}")
            op.add_column('users', sa.Column(col_name, col_type, server_default=sa.text(str(default_val)) if default_val is not None and not isinstance(default_val, str) else None))
        else:
            print(f"Column {col_name} already exists.")

def downgrade() -> None:
    pass
