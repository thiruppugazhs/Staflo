from __future__ import annotations
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, ForeignKey, DateTime, func, Text, Enum, Date, Numeric, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from ..db.session import Base

class InternshipStatus(str, enum.Enum):
    active = "active"
    extended = "extended"
    completed = "completed"
    converted = "converted"
    terminated = "terminated"

class ConversionStatus(str, enum.Enum):
    pending = "pending"
    offered = "offered"
    accepted = "accepted"
    rejected = "rejected"

class EvaluationType(str, enum.Enum):
    midterm = "midterm"
    final = "final"

class Recommendation(str, enum.Enum):
    convert = "convert"
    extend = "extend"
    end = "end"

class InternshipDetail(Base):
    __tablename__ = "internship_details"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    mentor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    stipend: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(Enum(InternshipStatus), default=InternshipStatus.active, nullable=False)
    project_title: Mapped[str] = mapped_column(String(200), nullable=True)
    institute: Mapped[str] = mapped_column(String(200), nullable=True)
    evaluation_score: Mapped[float] = mapped_column(Float, nullable=True)
    conversion_status: Mapped[str] = mapped_column(Enum(ConversionStatus), default=ConversionStatus.pending, nullable=False)
    conversion_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class InternEvaluation(Base):
    __tablename__ = "intern_evaluations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    intern_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    evaluator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    evaluation_type: Mapped[str] = mapped_column(Enum(EvaluationType), nullable=False)
    technical: Mapped[int] = mapped_column(nullable=False)      # 1-10, weight 30%
    communication: Mapped[int] = mapped_column(nullable=False)  # 1-10, weight 20%
    teamwork: Mapped[int] = mapped_column(nullable=False)       # 1-10, weight 20%
    punctuality: Mapped[int] = mapped_column(nullable=False)    # 1-10, weight 15%
    initiative: Mapped[int] = mapped_column(nullable=False)     # 1-10, weight 15%
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)  # computed /100
    strengths: Mapped[str] = mapped_column(Text, nullable=True)
    improvements: Mapped[str] = mapped_column(Text, nullable=True)
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str] = mapped_column(Enum(Recommendation), nullable=True)  # final only
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

def compute_overall(technical: int, communication: int, teamwork: int, punctuality: int, initiative: int) -> float:
    """Add ons.md scoring: Tech 30% + Comm 20% + Team 20% + Punct 15% + Init 15%, scaled to 100."""
    return round((technical * 0.30 + communication * 0.20 + teamwork * 0.20 + punctuality * 0.15 + initiative * 0.15) * 10, 1)

def score_band(score: float) -> str:
    if score >= 90: return "outstanding"
    if score >= 75: return "excellent"
    if score >= 60: return "good"
    if score >= 45: return "average"
    return "below_expectations"
