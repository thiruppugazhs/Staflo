import re
from fastapi import HTTPException

def validate_password(p: str):
    if len(p) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", p):
        raise HTTPException(status_code=400, detail="Password must contain uppercase letter")
    if not re.search(r"[a-z]", p):
        raise HTTPException(status_code=400, detail="Password must contain lowercase letter")
    if not re.search(r"[0-9]", p):
        raise HTTPException(status_code=400, detail="Password must contain number")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", p):
        raise HTTPException(status_code=400, detail="Password must contain special character")
    return True
