from __future__ import annotations
import uuid
from typing import Optional
from sqlalchemy import String, Boolean, Enum, ForeignKey, DateTime, func, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
from ..db.session import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    hr = "hr"
    employee = "employee"
    intern = "intern"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    employee_id: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., OS0001 unique per company
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(Enum(UserRole), default=UserRole.employee, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    job_title: Mapped[str] = mapped_column(String(100), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_temp_password: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="users")

    __table_args__ = (
        # unique per company
        # UniqueConstraint('company_id', 'employee_id', name='uq_company_employee_id'),
        # UniqueConstraint('company_id', 'email', name='uq_company_email'),
        {},
    )
