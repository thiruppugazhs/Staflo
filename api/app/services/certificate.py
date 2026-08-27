"""Minimal dependency-free PDF generator for intern experience certificates."""

def _escape(s: str) -> str:
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

def _pdf_line(x: float, y: float, size: int, text: str, bold: bool = False) -> str:
    font = "F2" if bold else "F1"
    return f"BT /{font} {size} Tf {x} {y} Td ({_escape(text)}) Tj ET"

def certificate_pdf(
    company_name: str,
    intern_name: str,
    employee_id: str,
    department: str,
    project_title: str,
    start_date: str,
    end_date: str,
    evaluation_score: float | None,
    institute: str | None = None,
) -> bytes:
    lines = [
        (300, 760, 22, company_name, True),
        (232, 735, 14, "Certificate of Internship Completion", False),
        (250, 690, 12, "This is to certify that", False),
        (230, 660, 18, intern_name, True),
        (245, 630, 11, f"Employee ID: {employee_id}", False),
        (215, 600, 11, f"has successfully completed an internship from {start_date} to {end_date}", False),
        (255, 575, 11, f"in the {department} department.", False),
    ]
    if project_title:
        lines.append((235, 545, 11, f"Project: {project_title}", False))
    if institute:
        lines.append((235, 520, 11, f"Institute: {institute}", False))
    if evaluation_score is not None:
        lines.append((240, 490, 12, f"Final Evaluation Score: {evaluation_score}/100", True))
    lines.append((330, 420, 10, "Authorized Signatory", False))
    lines.append((330, 405, 10, company_name, False))

    content_parts = ["0.29 0.13 0.20 rg"]  # brand-ish color
    content_parts.append(_pdf_line(72, 800, 2, "", False))  # noop warm-up
    for x, y, size, text, bold in lines:
        content_parts.append(_pdf_line(x, y, size, text, bold))

    stream = "\n".join(content_parts).encode("latin-1", "replace")

    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>")
    objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref_pos = len(out)
    out += f"xref\n0 {len(objects)+1}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF".encode()
    return bytes(out)
