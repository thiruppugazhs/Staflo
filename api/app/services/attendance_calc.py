from datetime import datetime

def calc_working_hours(check_in: datetime, check_out: datetime) -> float:
    delta = check_out - check_in
    return round(delta.total_seconds() / 3600, 2)

def determine_status(working_hours: float | None, is_on_leave: bool=False) -> str:
    if is_on_leave:
        return "leave"
    if working_hours is None:
        return "absent"
    if working_hours < 4:
        return "absent"
    if working_hours < 6:
        return "half_day"
    return "present"
