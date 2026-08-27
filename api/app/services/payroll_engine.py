from typing import List, Dict

def compute_payroll(monthly_wage: float, components: List[Dict]) -> Dict:
    """
    components: list of {name, type: earning/deduction, value_type: fixed/percentage, value: float, percentage_of: wage/basic}
    Returns breakdown with amounts per year/month and validations.
    Wireframe Important note: total earnings must not exceed wage, deductions separate.
    """
    breakdown = []
    basic_amount = None
    total_earnings = 0

    # first pass: find basic if exists else treat wage as base
    for c in components:
        if c["name"].lower() == "basic" and c["value_type"] == "percentage":
            basic_amount = monthly_wage * (c["value"] / 100)

    if basic_amount is None:
        basic_amount = monthly_wage * 0.4  # default fallback 40%

    for c in components:
        if c["value_type"] == "fixed":
            amount = float(c["value"])
        else:
            base = monthly_wage if c.get("percentage_of") in (None, "wage", "monthly_wage") else basic_amount
            # if percentage_of == "basic"
            if c.get("percentage_of") == "basic":
                base = basic_amount
            amount = base * (float(c["value"]) / 100)

        breakdown.append({
            "name": c["name"],
            "type": c["type"],
            "value_type": c["value_type"],
            "value": float(c["value"]),
            "percentage_of": c.get("percentage_of"),
            "amount_monthly": round(amount, 2),
            "amount_yearly": round(amount * 12, 2),
        })
        if c["type"] == "earning":
            total_earnings += amount

    # Validation
    warnings = []
    if total_earnings > monthly_wage + 0.01:
        warnings.append(f"Total earnings {total_earnings:.2f} exceeds monthly wage {monthly_wage:.2f}")

    # Compute net: earnings - deductions
    total_deductions = sum(b["amount_monthly"] for b in breakdown if b["type"] == "deduction")
    total_earnings_only = sum(b["amount_monthly"] for b in breakdown if b["type"] == "earning")
    net_pay = total_earnings_only - total_deductions

    return {
        "monthly_wage": monthly_wage,
        "yearly_wage": round(monthly_wage*12, 2),
        "basic_amount": round(basic_amount,2),
        "breakdown": breakdown,
        "total_earnings": round(total_earnings_only,2),
        "total_deductions": round(total_deductions,2),
        "net_pay": round(net_pay,2),
        "warnings": warnings
    }
