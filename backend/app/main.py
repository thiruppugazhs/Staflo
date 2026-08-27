from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.session import engine, Base
from .routers import auth, users, attendance, leave, payroll, documents, reports, companies, avatars, notifications, meetings, chatbot, interns
# import models to register
from .models import company, user, attendance as att_model, leave as leave_model, payroll as payroll_model, document as doc_model, meeting as meeting_model, intern as intern_model
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="DailyFlow API", version="1.0.0", description="HRMS - React FastAPI Supabase")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
    headers = {"Access-Control-Allow-Credentials": "true"}
    if origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"}, headers=headers)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(leave.router, prefix="/api/v1")
app.include_router(payroll.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(avatars.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(meetings.router, prefix="/api/v1")
app.include_router(chatbot.router, prefix="/api/v1")
app.include_router(interns.router, prefix="/api/v1")

# serve local uploads fallback (for dev when Supabase not configured)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "DailyFlow API running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def on_startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # existing DBs: add 'break' label to attendancestatus enum (idempotent, PG 10+)
            from sqlalchemy import text
            await conn.execute(text("ALTER TYPE attendancestatus ADD VALUE IF NOT EXISTS 'break'"))
    except Exception as e:
        print(f"[startup] DB auto-create skipped (configure DATABASE_URL): {e}")

# For local dev: uvicorn app.main:app --reload
