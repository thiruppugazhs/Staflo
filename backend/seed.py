"""Seed demo data for VibeHR"""
import asyncio
from app.db.session import AsyncSessionLocal, engine, Base
from app.models.company import Company
from app.models.user import User
from app.core.security import hash_password
from app.services.id_generator import generate_employee_id
import uuid

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        # check existing
        res = await db.execute(select(Company).limit(1))
        if res.scalar_one_or_none():
            print("Already seeded")
            return
        comp = Company(name="Olive Systems", slug="olive-systems")
        db.add(comp)
        await db.flush()
        admin = User(
            company_id=comp.id,
            employee_id=generate_employee_id("Olive Systems", 1),
            email="admin@VibeHR.local",
            password_hash=hash_password("Admin@123"),
            role="admin",
            first_name="Olive",
            last_name="Admin",
            phone="9999999999",
            department="HR",
            job_title="HR Manager",
            email_verified=True
        )
        db.add(admin)
        emp1 = User(
            company_id=comp.id,
            employee_id=generate_employee_id("Olive Systems", 2),
            email="john.doe@VibeHR.local",
            password_hash=hash_password("Employee@123"),
            role="employee",
            first_name="John",
            last_name="Doe",
            phone="8888888888",
            department="Engineering",
            job_title="Developer",
            email_verified=True
        )
        db.add(emp1)
        emp2 = User(
            company_id=comp.id,
            employee_id=generate_employee_id("Olive Systems", 3),
            email="jane.smith@VibeHR.local",
            password_hash=hash_password("Employee@123"),
            role="employee",
            first_name="Jane",
            last_name="Smith",
            department="Design",
            job_title="Designer",
            email_verified=True
        )
        db.add(emp2)
        comp.created_by_user_id = admin.id
        await db.commit()
        print(f"Seeded: admin@VibeHR.local / Admin@123 -> {admin.employee_id}")
        print(f"emp: john.doe@VibeHR.local / Employee@123 -> {emp1.employee_id}")

if __name__ == "__main__":
    asyncio.run(seed())
