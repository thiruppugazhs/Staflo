import pytest
from app.services.validators import validate_password
from app.services.payroll_engine import compute_payroll
from app.services.id_generator import generate_employee_id

def test_password_rules():
    try:
        validate_password("weak")
        assert False, "should fail"
    except Exception as e:
        assert "at least 8" in str(e.detail)

    # valid
    validate_password("Strong@123")

def test_payroll():
    res = compute_payroll(50000, [
        {"name":"Basic","type":"earning","value_type":"percentage","value":40,"percentage_of":"wage"},
        {"name":"HRA","type":"earning","value_type":"percentage","value":20,"percentage_of":"wage"},
        {"name":"PF","type":"deduction","value_type":"percentage","value":12,"percentage_of":"basic"},
    ])
    assert res["basic_amount"] == 20000
    assert res["net_pay"] > 0
    assert len(res["breakdown"]) == 3

def test_employee_id():
    assert generate_employee_id("Olive Systems", 1) == "OS0001"
    assert generate_employee_id("Acme", 12) == "AC0012"
