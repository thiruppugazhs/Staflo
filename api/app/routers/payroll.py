from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from ..db.session import get_db
from ..core.deps import get_current_user, require_admin
from ..models.payroll import SalaryComponent, SalaryStructure
from ..models.user import User
from ..services.payroll_engine import compute_payroll

router = APIRouter(prefix="/payroll", tags=["payroll"])

@router.get("/components")
async def list_components(db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    res = await db.execute(select(SalaryComponent).where(SalaryComponent.company_id==current.company_id))
    comps = res.scalars().all()
    return [{"id": str(c.id), "name": c.name, "type": c.type, "value_type": c.value_type, "value": float(c.value), "percentage_of": c.percentage_of, "is_mandatory": c.is_mandatory} for c in comps]

@router.post("/components")
async def create_component(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    comp = SalaryComponent(
        company_id=current.company_id,
        name=payload["name"],
        type=payload["type"],  # earning/deduction
        value_type=payload["value_type"],
        value=payload["value"],
        percentage_of=payload.get("percentage_of"),
        is_mandatory=payload.get("is_mandatory", False)
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return {"id": str(comp.id)}

@router.put("/components/{comp_id}")
async def update_component(comp_id: uuid.UUID, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(SalaryComponent).where(SalaryComponent.id==comp_id, SalaryComponent.company_id==current.company_id))
    comp = res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Not found")
    for k in ["name","type","value_type","value","percentage_of","is_mandatory"]:
        if k in payload:
            setattr(comp, k, payload[k])
    await db.commit()
    return {"updated": True}

@router.delete("/components/{comp_id}")
async def delete_component(comp_id: uuid.UUID, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    res = await db.execute(select(SalaryComponent).where(SalaryComponent.id==comp_id, SalaryComponent.company_id==current.company_id))
    comp = res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(comp)
    await db.commit()
    return {"deleted": True}

@router.post("/compute")
async def compute(payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    monthly = float(payload["monthly_wage"])
    comps = payload.get("components")
    if comps is None:
        # fetch from DB templates
        res = await db.execute(select(SalaryComponent).where(SalaryComponent.company_id==current.company_id))
        db_comps = res.scalars().all()
        comps = [{"name": c.name, "type": c.type, "value_type": c.value_type, "value": float(c.value), "percentage_of": c.percentage_of} for c in db_comps]
    result = compute_payroll(monthly, comps)
    return result

@router.get("/all")
async def list_all_payroll(db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    # admin view payroll of all employees (spec 3.6.2)
    q = select(SalaryStructure).where(SalaryStructure.company_id == current.company_id).order_by(SalaryStructure.created_at.desc())
    res = await db.execute(q)
    structs = res.scalars().all()
    # keep latest per user
    latest = {}
    for s in structs:
        uid = str(s.user_id)
        if uid not in latest:
            latest[uid] = s
    # join user info
    out = []
    for uid, s in latest.items():
        u = await db.execute(select(User).where(User.id == s.user_id))
        user = u.scalar_one_or_none()
        out.append({"user_id": uid, "employee_id": user.employee_id if user else "", "name": f"{user.first_name} {user.last_name}" if user else "", "monthly_wage": float(s.monthly_wage), "yearly_wage": float(s.yearly_wage), "breakdown": s.breakdown, "effective_from": s.effective_from.isoformat() if s.effective_from else None})
    return out

@router.get("/salary/{user_id}")
async def get_salary(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current: User = Depends(get_current_user)):
    # employee can only see own, admin can see all
    if current.role == "employee" and str(current.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden: salary only visible to admin")
    res = await db.execute(select(SalaryStructure).where(SalaryStructure.user_id==user_id).order_by(SalaryStructure.created_at.desc()))
    struct = res.scalars().first()
    if not struct:
        return {"monthly_wage": None, "breakdown": None}
    return {"id": str(struct.id), "user_id": str(struct.user_id), "monthly_wage": float(struct.monthly_wage), "yearly_wage": float(struct.yearly_wage), "breakdown": struct.breakdown, "effective_from": struct.effective_from.isoformat() if struct.effective_from else None}

@router.post("/salary/{user_id}")
async def set_salary(user_id: uuid.UUID, payload: dict, db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    # check user belongs to company
    u = await db.execute(select(User).where(User.id==user_id, User.company_id==current.company_id))
    if not u.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found in company")
    monthly = float(payload["monthly_wage"])
    comps = payload.get("components")
    # compute breakdown
    if comps is None:
        res = await db.execute(select(SalaryComponent).where(SalaryComponent.company_id==current.company_id))
        db_comps = res.scalars().all()
        comps = [{"name": c.name, "type": c.type, "value_type": c.value_type, "value": float(c.value), "percentage_of": c.percentage_of} for c in db_comps]
        if not comps:
            # default demo components if none defined
            comps = [
                {"name": "Basic", "type":"earning","value_type":"percentage","value":40,"percentage_of":"wage"},
                {"name": "HRA", "type":"earning","value_type":"percentage","value":20,"percentage_of":"wage"},
                {"name": "Conveyance", "type":"earning","value_type":"fixed","value":5000},
                {"name": "PF", "type":"deduction","value_type":"percentage","value":12,"percentage_of":"basic"},
                {"name": "Professional Tax", "type":"deduction","value_type":"fixed","value":200},
            ]
    result = compute_payroll(monthly, comps)
    if result["warnings"]:
        # still allow but return warning
        pass
    struct = SalaryStructure(user_id=user_id, company_id=current.company_id, monthly_wage=monthly, yearly_wage=result["yearly_wage"], breakdown=result, effective_from=payload.get("effective_from"))
    db.add(struct)
    await db.commit()
    await db.refresh(struct)
    return {"id": str(struct.id), "breakdown": result}

@router.post("/seed-defaults")
async def seed_defaults(db: AsyncSession = Depends(get_db), current: User = Depends(require_admin)):
    existing = await db.execute(select(SalaryComponent).where(SalaryComponent.company_id==current.company_id))
    if existing.scalars().first():
        return {"message":"Already seeded"}
    defaults = [
        {"name":"Basic","type":"earning","value_type":"percentage","value":40,"percentage_of":"wage","is_mandatory":True},
        {"name":"HRA","type":"earning","value_type":"percentage","value":20,"percentage_of":"wage"},
        {"name":"Conveyance Allowance","type":"earning","value_type":"fixed","value":3000},
        {"name":"Special Allowance","type":"earning","value_type":"percentage","value":15,"percentage_of":"wage"},
        {"name":"Provident Fund","type":"deduction","value_type":"percentage","value":12,"percentage_of":"basic"},
        {"name":"Professional Tax","type":"deduction","value_type":"fixed","value":200},
    ]
    for d in defaults:
        c = SalaryComponent(company_id=current.company_id, **d)
        db.add(c)
    await db.commit()
    return {"seeded": len(defaults)}
