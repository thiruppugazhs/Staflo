from __future__ import annotations
import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, func, Date, Enum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
from ..db.session import Base
import enum

class LeaveTypeName(str, enum.Enum):
    paid = "paid"
    sick = "sick"
    unpaid = "unpaid"

class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class LeaveType(Base):
    __tablename__ = "leave_types"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name: Mapped[str] = mapped_column(Enum(LeaveTypeName), nullable=False)
    days_per_year: Mapped[int] = mapped_column(Integer, default=12)
    requires_docs: Mapped[bool] = mapped_column(default=False)

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    paid_remaining: Mapped[int] = mapped_column(Integer, default=12)
    sick_remaining: Mapped[int] = mapped_column(Integer, default=7)
    unpaid_taken: Mapped[int] = mapped_column(Integer, default=0)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(Enum(LeaveTypeName), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    days: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    doc_url: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(Enum(LeaveStatus), default=LeaveStatus.pending)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewer_comment: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
