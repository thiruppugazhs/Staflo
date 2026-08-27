from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.session import engine, Base
from .routers import auth, users, attendance, leave, payroll, documents, reports, companies, avatars, notifications, meetings, chatbot, interns, payments
# import models to register with SQLAlchemy Base.metadata
from .models import (
    Company, User, AttendanceRecord, LeaveType, LeaveRequest, LeaveBalance,
    SalaryComponent, SalaryStructure, PayrollRun, Document, Meeting,
    InternshipDetail, InternEvaluation
)
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Staflo API", version="1.0.0", description="Staflo HRMS - React FastAPI Supabase")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    # unhandled exceptions bypass CORSMiddleware (it sits outside it), so 500s must
    # add CORS headers manually or the browser masks the real error as a CORS failure
    traceback.print_exc()
    origin = request.headers.get("origin")
    headers = {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": origin or "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"}, headers=headers)

# Mount routers on all prefixes so any baseURL configuration in Vercel/Vite works seamlessly
all_routers = [
    auth.router, users.router, attendance.router, leave.router,
    payroll.router, documents.router, reports.router, companies.router,
    avatars.router, notifications.router, meetings.router, chatbot.router,
    interns.router, payments.router
]

for prefix in ["/api/v1", "/v1", ""]:
    for r in all_routers:
        app.include_router(r, prefix=prefix)

# serve local uploads fallback (for dev when Supabase not configured)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
@app.get("/api")
@app.get("/api/v1")
async def root():
    return {"message": "Staflo API running", "docs": "/docs"}

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "app": "Staflo API"}

@app.on_event("startup")
async def on_startup():
    # Database tables are managed via Supabase / Alembic migrations
    pass

# For local dev: uvicorn app.main:app --reload
