import sys, json, io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY, TA_LEFT
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import Flowable
from datetime import datetime


# ── Brand colours ──────────────────────────────────────────────
PRIMARY   = colors.HexColor("#1A3C6E")   # deep navy
ACCENT    = colors.HexColor("#2E86C1")   # medium blue
LIGHT_BG  = colors.HexColor("#EBF5FB")   # pale blue tint
GOLD      = colors.HexColor("#F0B429")   # gold accent
DARK_TEXT = colors.HexColor("#1C2833")
MID_TEXT  = colors.HexColor("#5D6D7E")
WHITE     = colors.white
PAGE_W, PAGE_H = A4


# ── Custom canvas with header / footer ─────────────────────────
class LetterCanvas(canvas.Canvas):
    def __init__(self, *args, company_name="Your Company",
                 company_address="", company_phone="", company_email="",
                 company_website="", **kwargs):
        super().__init__(*args, **kwargs)
        self.company_name    = company_name
        self.company_address = company_address
        self.company_phone   = company_phone
        self.company_email   = company_email
        self.company_website = company_website
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_header()
            self._draw_footer(page_count)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_header(self):
        # Navy header band
        self.setFillColor(PRIMARY)
        self.rect(0, PAGE_H - 28*mm, PAGE_W, 28*mm, fill=1, stroke=0)

        # Gold accent stripe
        self.setFillColor(GOLD)
        self.rect(0, PAGE_H - 30*mm, PAGE_W, 2*mm, fill=1, stroke=0)

        # Company name
        self.setFillColor(WHITE)
        self.setFont("Helvetica-Bold", 18)
        self.drawString(18*mm, PAGE_H - 16*mm, self.company_name.upper())

        # Tagline / document type label
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#AED6F1"))
        self.drawString(18*mm, PAGE_H - 23*mm, "HUMAN RESOURCES  ·  OFFER OF EMPLOYMENT")

        # Right-side contact block
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#D6EAF8"))
        right_x = PAGE_W - 18*mm
        lines = [l for l in [
            self.company_address,
            self.company_phone,
            self.company_email,
            self.company_website,
        ] if l]
        start_y = PAGE_H - 10*mm
        for line in lines:
            self.drawRightString(right_x, start_y, line)
            start_y -= 4.5*mm

    def _draw_footer(self, page_count):
        # Thin gold line above footer
        self.setStrokeColor(GOLD)
        self.setLineWidth(0.8)
        self.line(18*mm, 18*mm, PAGE_W - 18*mm, 18*mm)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(MID_TEXT)
        self.drawString(18*mm, 12*mm,
            "This offer is confidential and intended solely for the named candidate.")
        self.drawRightString(PAGE_W - 18*mm, 12*mm,
            f"Page {self._pageNumber} of {page_count}")


# ── Thin horizontal rule flowable ──────────────────────────────
def rule(color=ACCENT, thickness=0.5, space_before=4, space_after=4):
    return HRFlowable(
        width="100%", thickness=thickness, color=color,
        spaceAfter=space_after, spaceBefore=space_before
    )


# ── Style factory ──────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    def s(name, **kw):
        defaults = dict(fontName="Helvetica", fontSize=10,
                        textColor=DARK_TEXT, leading=14, spaceAfter=0)
        defaults.update(kw)
        return ParagraphStyle(name=name, **defaults)

    return {
        "section_head": s("SH",
            fontName="Helvetica-Bold", fontSize=10, textColor=WHITE,
            leading=14, spaceBefore=0, spaceAfter=0),
        "body": s("Body", fontSize=10, leading=15, alignment=TA_JUSTIFY,
                  spaceAfter=6),
        "body_bold": s("BB", fontName="Helvetica-Bold", fontSize=10,
                       leading=15, spaceAfter=4),
        "label": s("Lbl", fontName="Helvetica-Bold", fontSize=9,
                   textColor=MID_TEXT, leading=13),
        "value": s("Val", fontSize=10, leading=13, textColor=DARK_TEXT),
        "small": s("Sm", fontSize=8, textColor=MID_TEXT, leading=11),
        "sign_name": s("SN", fontName="Helvetica-Bold", fontSize=11,
                       textColor=PRIMARY, leading=14),
        "sign_title": s("ST", fontSize=9, textColor=MID_TEXT, leading=12),
        "date_ref": s("DR", fontSize=9, textColor=MID_TEXT,
                      alignment=TA_RIGHT, leading=12),
        "greet": s("Gr", fontSize=11, leading=16, spaceAfter=4),
        "closing": s("Cl", fontSize=10, leading=15, spaceAfter=2),
    }


# ── Section header band ─────────────────────────────────────────
def section_header(text, styles):
    tbl = Table([[Paragraph(f"  {text}", styles["section_head"])]],
                colWidths=["100%"])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]))
    return tbl


# ── Two-column info table ───────────────────────────────────────
def info_table(rows, styles):
    """rows = list of (label, value) tuples; renders in 2 columns."""
    # Pair rows side-by-side
    paired = []
    for i in range(0, len(rows), 2):
        left = rows[i]
        right = rows[i + 1] if i + 1 < len(rows) else ("", "")
        paired.append([
            Paragraph(left[0],  styles["label"]),
            Paragraph(left[1],  styles["value"]),
            Paragraph(right[0], styles["label"]),
            Paragraph(right[1], styles["value"]),
        ])

    col_w = (PAGE_W - 36*mm) / 4
    tbl = Table(paired, colWidths=[col_w*0.7, col_w*1.3, col_w*0.7, col_w*1.3])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_BG),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [WHITE, LIGHT_BG]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#D5DBDB")),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


# ── Compensation breakdown table ───────────────────────────────
def comp_table(salary_str, styles):
    """Parse 'INR 12,00,000 per annum' or just show raw string."""
    header_style = ParagraphStyle("CH", fontName="Helvetica-Bold",
                                  fontSize=9, textColor=WHITE, leading=13)
    cell_style   = ParagraphStyle("CC", fontSize=9,
                                  textColor=DARK_TEXT, leading=13)
    amt_style    = ParagraphStyle("CA", fontName="Helvetica-Bold",
                                  fontSize=9, textColor=PRIMARY, leading=13,
                                  alignment=TA_RIGHT)

    data = [
        [Paragraph("COMPONENT", header_style),
         Paragraph("DETAILS",   header_style),
         Paragraph("AMOUNT",    header_style)],
        [Paragraph("Total CTC (Annual)", cell_style),
         Paragraph("Cost to Company", cell_style),
         Paragraph(salary_str, amt_style)],
        [Paragraph("Payment Schedule", cell_style),
         Paragraph("Monthly via bank transfer", cell_style),
         Paragraph("", cell_style)],
        [Paragraph("Statutory Benefits", cell_style),
         Paragraph("PF, Gratuity, Medical Insurance as applicable", cell_style),
         Paragraph("Included", amt_style)],
    ]
    col_w = (PAGE_W - 36*mm)
    tbl = Table(data, colWidths=[col_w*0.28, col_w*0.44, col_w*0.28])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  PRIMARY),
        ("BACKGROUND",    (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#D5DBDB")),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return tbl


# ── Signature block ─────────────────────────────────────────────
def signature_block(hr_name, hr_designation, company_name, styles):
    sig_label = ParagraphStyle("SL", fontSize=8, textColor=MID_TEXT, leading=11)
    data = [[
        Paragraph("", sig_label),   # candidate acceptance (left)
        Paragraph("", sig_label),   # spacer
        Paragraph("", sig_label),   # authorized signatory (right)
    ]]
    # Signature lines
    line_tbl = Table([[
        Table([
            [Paragraph("_" * 38, styles["body"])],
            [Paragraph(f"Candidate Signature", sig_label)],
            [Paragraph(f"Name: ___________________________", sig_label)],
            [Paragraph(f"Date:  ___________________________", sig_label)],
        ], colWidths=["100%"]),
        Spacer(10, 1),
        Table([
            [Paragraph("_" * 38, styles["body"])],
            [Paragraph(f"{hr_name}", styles["sign_name"])],
            [Paragraph(f"{hr_designation}", styles["sign_title"])],
            [Paragraph(f"{company_name}", styles["sign_title"])],
        ], colWidths=["100%"]),
    ]], colWidths=["45%", "10%", "45%"])
    line_tbl.setStyle(TableStyle([
        ("VALIGN",  (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    return line_tbl


# ── Main generator ─────────────────────────────────────────────
def generate(data):
    candidate_name   = data.get("candidateName", "")
    position         = data.get("position", "")
    department       = data.get("department", "")
    salary           = data.get("salary", "")
    joining_date     = data.get("joiningDate", "")
    hr_name          = data.get("hrName", "")
    hr_designation   = data.get("hrDesignation", "")
    company_name     = data.get("companyName", "Your Company")
    company_address  = data.get("companyAddress", "")
    company_phone    = data.get("companyPhone", "")
    company_email    = data.get("companyEmail", "")
    company_website  = data.get("companyWebsite", "")
    employee_id      = data.get("employeeId", "")
    work_location    = data.get("workLocation", "")
    work_type        = data.get("workType", "Full-Time")
    ref_number       = data.get("refNumber", f"HR/{datetime.now().year}/OL/{datetime.now().strftime('%m%d')}")
    offer_date       = data.get("offerDate", datetime.now().strftime("%d %B %Y"))
    acceptance_days  = data.get("acceptanceDays", "7")
    probation_months = data.get("probationMonths", "6")

    buffer = io.BytesIO()

    def canvas_maker(filename, doc=None, **kwargs):
        return LetterCanvas(
            filename,
            pagesize=A4,
            company_name=company_name,
            company_address=company_address,
            company_phone=company_phone,
            company_email=company_email,
            company_website=company_website,
        )

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=35*mm, bottomMargin=25*mm,
    )

    ST = make_styles()
    story = []

    # ── Date & Reference ──────────────────────────────────────
    story.append(Paragraph(
        f"Date: <b>{offer_date}</b>&nbsp;&nbsp;&nbsp;&nbsp;"
        f"Ref: <b>{ref_number}</b>",
        ST["date_ref"]))
    story.append(Spacer(1, 4*mm))

    # ── Addressee ─────────────────────────────────────────────
    story.append(Paragraph(f"<b>{candidate_name}</b>", ST["greet"]))
    story.append(Spacer(1, 2*mm))

    # ── Subject line ──────────────────────────────────────────
    subj_style = ParagraphStyle("Subj", fontName="Helvetica-Bold",
                                fontSize=12, textColor=PRIMARY,
                                leading=16, spaceAfter=4)
    story.append(Paragraph(
        f"OFFER OF EMPLOYMENT — {position.upper()}", subj_style))
    story.append(rule(GOLD, thickness=1.5, space_before=2, space_after=6))

    # ── Opening paragraph ─────────────────────────────────────
    story.append(Paragraph(
        f"Dear <b>{candidate_name.split()[0]}</b>,", ST["body"]))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f"We are delighted to extend this formal Offer of Employment to you for the position of "
        f"<b>{position}</b> within the <b>{department}</b> department at "
        f"<b>{company_name}</b>. This offer reflects our confidence in your abilities "
        f"and the value we believe you will bring to our team.",
        ST["body"]))
    story.append(Spacer(1, 4*mm))

    # ── SECTION 1: Employment Details ─────────────────────────
    story.append(KeepTogether([
        section_header("1.  EMPLOYMENT DETAILS", ST),
        Spacer(1, 2*mm),
        info_table([
            ("Position / Designation:", position),
            ("Department:",             department),
            ("Employee ID:",            employee_id or "To be assigned"),
            ("Employment Type:",        work_type),
            ("Date of Joining:",        joining_date),
            ("Work Location:",          work_location or "Head Office"),
            ("Probation Period:",       f"{probation_months} Months"),
            ("Notice Period:",          "30 Days (post-probation)"),
        ], ST),
        Spacer(1, 4*mm),
    ]))

    # ── SECTION 2: Compensation ───────────────────────────────
    story.append(KeepTogether([
        section_header("2.  COMPENSATION & BENEFITS", ST),
        Spacer(1, 2*mm),
        comp_table(salary, ST),
        Spacer(1, 3*mm),
        Paragraph(
            "The compensation structure outlined above is subject to applicable tax "
            "deductions at source (TDS) as per prevailing Income Tax regulations. "
            "Detailed salary breakup will be shared with you upon joining.",
            ST["small"]),
        Spacer(1, 4*mm),
    ]))

    # ── SECTION 3: Terms & Conditions ─────────────────────────
    story.append(section_header("3.  TERMS & CONDITIONS", ST))
    story.append(Spacer(1, 2*mm))

    conditions = [
        ("<b>Background Verification:</b>",
         "This offer is contingent upon the successful completion of a background verification "
         "check, including employment history, educational qualifications, and reference checks."),
        ("<b>Document Submission:</b>",
         "You are required to submit all original documents for verification on or before your "
         "date of joining, including educational certificates, previous employment letters, "
         "government-issued photo ID, and address proof."),
        ("<b>Confidentiality:</b>",
         "By accepting this offer you agree to maintain the strictest confidentiality regarding "
         "all proprietary information, trade secrets, and business data of the company."),
        ("<b>Non-Compete / Non-Solicitation:</b>",
         "You agree not to engage in any employment or business activity that directly competes "
         "with the company during your tenure and for a period of 12 months thereafter."),
        ("<b>Offer Validity:</b>",
         f"This offer is valid for <b>{acceptance_days} calendar days</b> from the date of "
         f"issuance. Failure to accept within this period shall render the offer null and void."),
    ]

    for title, body in conditions:
        row_data = [[
            Paragraph(title, ST["body_bold"]),
            Paragraph(body, ST["body"]),
        ]]
        ct = Table(row_data, colWidths=["28%", "72%"])
        ct.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 0),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ]))
        story.append(ct)
        story.append(rule(colors.HexColor("#D5DBDB"), thickness=0.4,
                         space_before=0, space_after=0))

    story.append(Spacer(1, 4*mm))

    # ── SECTION 4: Closing ────────────────────────────────────
    story.append(section_header("4.  ACCEPTANCE", ST))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        f"We are excited about the prospect of you joining our team and look forward to "
        f"working together toward shared success. Please sign and return a copy of this "
        f"letter within <b>{acceptance_days} days</b> as confirmation of your acceptance.",
        ST["body"]))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "Should you have any questions or require further clarification, please do not "
        "hesitate to reach out to our HR department.",
        ST["body"]))
    story.append(Spacer(1, 6*mm))

    # ── Signature block ───────────────────────────────────────
    story.append(signature_block(hr_name, hr_designation, company_name, ST))
    story.append(Spacer(1, 6*mm))

    # ── Disclaimer ────────────────────────────────────────────
    story.append(rule(colors.HexColor("#D5DBDB"), thickness=0.4))
    story.append(Paragraph(
        "This document is system-generated by the HRMS platform and is legally binding "
        "upon acceptance. Any alteration to this document renders it invalid.",
        ST["small"]))

    doc.build(story, canvasmaker=canvas_maker)
    buffer.seek(0)
    return buffer.read()


if __name__ == "__main__":
    data = json.loads(sys.argv[1])
    sys.stdout.buffer.write(generate(data))