from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class SignupCompanyRequest(BaseModel):
    companyName: Optional[str] = None
    name: Optional[str] = None
    adminFirstName: Optional[str] = None
    first_name: Optional[str] = None
    adminLastName: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    password: str
    industry: Optional[str] = None
    companySize: Optional[str] = None
    website: Optional[str] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    address: Optional[str] = None
    agreeTerms: Optional[bool] = None

    @property
    def resolved_company_name(self) -> str:
        return (self.companyName or self.name or "").strip()

    @property
    def resolved_first_name(self) -> str:
        return (self.adminFirstName or self.first_name or "").strip()

    @property
    def resolved_last_name(self) -> str:
        return (self.adminLastName or self.last_name or "").strip()

class LoginRequest(BaseModel):
    email: str  # email or employee_id
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class InviteEmployeeRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    role: str = "employee" # admin/hr/employee
