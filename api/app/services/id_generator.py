import re

def generate_employee_id(company_name: str, seq: int) -> str:
    # take initials: first letters of words, up to 2 chars
    words = re.findall(r"[A-Za-z]+", company_name)
    if not words:
        prefix = "OS"
    elif len(words) == 1:
        prefix = words[0][:2].upper()
    else:
        prefix = (words[0][0] + words[1][0]).upper()
    # pad to 4 digits like OS0001
    return f"{prefix}{seq:04d}"

def generate_temp_password(length: int = 10) -> str:
    import secrets, string
    alphabet = string.ascii_letters + string.digits + "!@#"
    return ''.join(secrets.choice(alphabet) for _ in range(length))
