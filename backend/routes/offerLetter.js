import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { spawn } from "child_process";

const router = express.Router();

// ── Auth ─────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET || "hrms_secret"
    );
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function hrOnly(req, res, next) {
  if (req.user.role !== "hr") {
    return res.status(403).json({ error: "HR only" });
  }
  next();
}

// ── Python Script (FIXED INDENTATION) ─────────────────
const PYTHON_SCRIPT = `
import sys, json, io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

def generate(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)

    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Offer Letter", styles["Title"]))
    story.append(Paragraph("Candidate: " + data["candidateName"], styles["Normal"]))
    story.append(Paragraph("Position: " + data["position"], styles["Normal"]))
    story.append(Paragraph("Company: " + data.get("companyName", ""), styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

data = json.loads(sys.argv[1])
sys.stdout.buffer.write(generate(data))
`.trim();   // ✅ IMPORTANT

const SCRIPT_PATH = "./utils/offerLetterGen.py";

// Create file once
if (!fs.existsSync("./utils")) {
  fs.mkdirSync("./utils", { recursive: true });
}


// ── ROUTE ─────────────────────────────────────
router.post("/generate", auth, hrOnly, (req, res) => {
  const {
    candidateName,
    position,
    department,
    salary,
    joiningDate,
    hrName,
    hrDesignation,
    companyName = "Your Company",
  } = req.body;

  if (!candidateName || !position || !hrName || !hrDesignation) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  const payload = JSON.stringify({
    candidateName,
    position,
    department,
    salary,
    joiningDate,
    hrName,
    hrDesignation,
    companyName,
  });

  const python = spawn("python", [SCRIPT_PATH, payload]);

  let chunks = [];
  let errorOccurred = false;

  python.stdout.on("data", (data) => {
    chunks.push(data);
  });

  python.stderr.on("data", (err) => {
    console.error("Python Error:", err.toString());
    errorOccurred = true;
  });

  python.on("close", (code) => {
    if (errorOccurred || code !== 0) {
      return res.status(500).json({
        error: "Failed to generate offer letter",
      });
    }

    const pdfBuffer = Buffer.concat(chunks);

    const safeName = candidateName.replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="OfferLetter_${safeName}.pdf"`
    );

    res.send(pdfBuffer);
  });
});

export default router;