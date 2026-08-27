from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, date

class UserOut(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    employee_id: str
    email: str
    role: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    date_of_joining: Optional[date] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
