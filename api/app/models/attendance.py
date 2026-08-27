from __future__ import annotations
import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, func, Date, Float, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, date
from ..db.session import Base
import enum

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    leave = "leave"
    break_ = "break"

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(AttendanceStatus, values_callable=lambda e: [m.value for m in e]),
        default=AttendanceStatus.present,
    )
    working_hours: Mapped[float] = mapped_column(Float, nullable=True)
    location_in: Mapped[dict] = mapped_column(JSONB, nullable=True)
    location_out: Mapped[dict] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
