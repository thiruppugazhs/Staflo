from __future__ import annotations
import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, func, Integer, Enum, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, date
from ..db.session import Base
import enum

class ComponentType(str, enum.Enum):
    earning = "earning"
    deduction = "deduction"

class ValueType(str, enum.Enum):
    fixed = "fixed"
    percentage = "percentage"

class SalaryComponent(Base):
    __tablename__ = "salary_components"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(Enum(ComponentType), nullable=False)
    value_type: Mapped[str] = mapped_column(Enum(ValueType), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10,2), nullable=False)  # amount or %
    percentage_of: Mapped[str] = mapped_column(String(50), nullable=True)  # wage, basic
    is_mandatory: Mapped[bool] = mapped_column(default=False)

class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    monthly_wage: Mapped[float] = mapped_column(Numeric(12,2), nullable=False)
    yearly_wage: Mapped[float] = mapped_column(Numeric(12,2), nullable=False)
    breakdown: Mapped[dict] = mapped_column(JSONB, nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class PayrollRun(Base):
    __tablename__ = "payroll_runs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
