from __future__ import annotations
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, func, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..db.session import Base

class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    organizer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    meet_link: Mapped[str] = mapped_column(String(500), nullable=True)
    calendar_event_id: Mapped[str] = mapped_column(String(200), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(Enum(MeetingStatus), default=MeetingStatus.scheduled, nullable=False)
    attendee_ids: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)  # list of user_id strings
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
