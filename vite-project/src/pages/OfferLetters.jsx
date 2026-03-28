// pages/OfferLetters.jsx
// Dedicated Offer Letters page — accessible via /offer-letters route.
// HR can fill in all details and download a professional PDF offer letter.

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, User, Briefcase, Building2, Calendar, IndianRupee, PenLine } from "lucide-react";

const API = "http://localhost:5000/api/offer-letter/generate";

// ─── helpers ─────────────────────────────────────────────────────────────────
function authHeaders() {
  const token = localStorage.getItem("hrms_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all placeholder-slate-400";

// ─── History item ─────────────────────────────────────────────────────────────
function HistoryCard({ item, onDownload }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{item.candidateName}</p>
          <p className="text-xs text-slate-500">{item.position} · {item.department || "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">{item.generatedAt}</span>
        <button
          onClick={() => onDownload(item)}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold transition-all hover:bg-primary/90">
          <Download className="h-3.5 w-3.5" />
          Re-download
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OfferLetters() {
  const user  = JSON.parse(localStorage.getItem("hrms_user") || "{}");
  const isHR  = user.role === "hr";

  const EMPTY = {
    candidateName: "",
    position:      "",
    department:    "",
    salary:        "",
    joiningDate:   "",
    hrName:        "",
    hrDesignation: "",
    companyName:   "Your Company Pvt. Ltd.",
  };

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);   // session history

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!form.candidateName.trim()) return "Candidate name is required.";
    if (!form.position.trim())      return "Position is required.";
    if (!form.hrName.trim())        return "HR name is required.";
    if (!form.hrDesignation.trim()) return "HR designation is required.";
    return null;
  };

  const downloadPDF = async (formData) => {
    const res = await fetch(API, {
      method:  "POST",
      headers: authHeaders(),
      body:    JSON.stringify(formData),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to generate offer letter");
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `OfferLetter_${formData.candidateName.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await downloadPDF(form);

      // Add to session history
      setHistory(prev => [{
        ...form,
        generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        id: Date.now(),
      }, ...prev]);

      setSuccess(`Offer letter for ${form.candidateName} downloaded successfully!`);

      // Reset form after 2s
      setTimeout(() => {
        setSuccess("");
        setForm(EMPTY);
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedownload = async (item) => {
    try {
      await downloadPDF(item);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Non-HR view ─────────────────────────────────────────────────────────────
  if (!isHR) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700">HR Access Only</h2>
          <p className="text-sm text-slate-400">Only HR personnel can generate offer letters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">Offer Letters</h1>
          <p className="page-description">Generate and download professional PDF offer letters.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Form Card (left / wider) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">New Offer Letter</h2>
              <p className="text-xs text-slate-500">Fill in the details — PDF downloads instantly</p>
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* ── Section: Candidate ── */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Candidate Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Candidate Full Name" required icon={User}>
                  <input
                    className={inputCls}
                    placeholder="e.g. Aisha Malik"
                    value={form.candidateName}
                    onChange={set("candidateName")}
                  />
                </Field>

                <Field label="Position / Job Title" required icon={Briefcase}>
                  <input
                    className={inputCls}
                    placeholder="e.g. Senior Software Engineer"
                    value={form.position}
                    onChange={set("position")}
                  />
                </Field>

                <Field label="Department" icon={Building2}>
                  <select className={inputCls} value={form.department} onChange={set("department")}>
                    <option value="">Select department…</option>
                    {["Engineering","Design","Marketing","Finance","HR","Sales","Operations"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Date of Joining" icon={Calendar}>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.joiningDate}
                    onChange={set("joiningDate")}
                  />
                </Field>

                <Field label="Annual CTC / Salary" icon={IndianRupee}>
                  <input
                    className={inputCls}
                    placeholder="e.g. ₹12,00,000 per annum"
                    value={form.salary}
                    onChange={set("salary")}
                  />
                </Field>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* ── Section: HR / Signatory ── */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5" /> HR / Signatory Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="HR Name" required icon={User}>
                  <input
                    className={inputCls}
                    placeholder="e.g. Rajesh Kumar"
                    value={form.hrName}
                    onChange={set("hrName")}
                  />
                </Field>

                <Field label="HR Designation" required icon={Briefcase}>
                  <input
                    className={inputCls}
                    placeholder="e.g. HR Manager"
                    value={form.hrDesignation}
                    onChange={set("hrDesignation")}
                  />
                </Field>

                <Field label="Company Name" icon={Building2}>
                  <input
                    className={inputCls}
                    placeholder="Your Company Pvt. Ltd."
                    value={form.companyName}
                    onChange={set("companyName")}
                  />
                </Field>
              </div>
            </div>

            {/* ── Error / Success ── */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            {/* ── Submit ── */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <><Spinner /> Generating PDF…</>
              ) : (
                <><Download className="h-4 w-4" /> Download Offer Letter PDF</>
              )}
            </button>

          </div>
        </motion.div>

        {/* ── Right panel: Tips + History ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tips card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              What's included in the PDF
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {[
                "Company letterhead with name & tagline",
                "Auto-generated reference number",
                "Terms of employment table",
                "HR & candidate signature blocks",
                "Company stamp area",
                "Confidentiality footer",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Session history */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Generated This Session</h3>
              <p className="text-xs text-slate-400 mt-0.5">History resets on page refresh</p>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No letters generated yet
                </p>
              ) : (
                history.map(item => (
                  <HistoryCard key={item.id} item={item} onDownload={handleRedownload} />
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}