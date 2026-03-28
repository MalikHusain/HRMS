// components/OfferLetterModal.jsx
//
// Standalone button + modal for HR dashboard.
// HR fills in ALL fields manually — no candidate pre-selection needed.
//
// Usage:
//   import OfferLetterModal from "./components/OfferLetterModal";
//   <OfferLetterModal token={token} companyName="Your Company Pvt. Ltd." />

import { useState } from "react";

const API = "http://localhost:5000/api/offer-letter/generate";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ── reusable field ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800
        placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:border-transparent transition"
    />
  );
}

// ── section divider ───────────────────────────────────────────────────────────
function Section({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function OfferLetterModal({ token, companyName = "Your Company" }) {
  const EMPTY = {
    candidateName: "", position: "",
    department: "", salary: "", joiningDate: "",
    hrName: "", hrDesignation: "",
  };

  const [open,    setOpen]   = useState(false);
  const [form,    setForm]   = useState(EMPTY);
  const [loading, setLoading]= useState(false);
  const [error,   setError]  = useState("");
  const [success, setSuccess]= useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleClose = () => {
    setOpen(false);
    setForm(EMPTY);
    setError("");
    setSuccess(false);
  };

  const handleGenerate = async () => {
    // Client-side validation
    if (!form.candidateName.trim()) return setError("Candidate name is required.");
    if (!form.position.trim())      return setError("Position / Job title is required.");
    if (!form.hrName.trim())        return setError("HR name is required.");
    if (!form.hrDesignation.trim()) return setError("HR designation is required.");

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(API, {
        method:  "POST",
        headers: authHeaders(token),
        body:    JSON.stringify({ ...form, companyName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Server error. Please try again.");
      }

      // Trigger browser PDF download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `OfferLetter_${form.candidateName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setLoading(false);

      // Auto-close after 2 s on success
      setTimeout(handleClose, 2000);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Dashboard trigger button ── */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800
          active:scale-95 text-white font-semibold text-sm px-4 py-2.5 rounded-xl
          shadow-md transition-all duration-150"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
               a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
        Generate Offer Letter
      </button>

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
          bg-black/50 backdrop-blur-sm p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg
            max-h-[92vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-600
              px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  Generate Offer Letter
                </h2>
                <p className="text-blue-200 text-xs mt-0.5">
                  Fill in the details — PDF downloads instantly
                </p>
              </div>
              <button onClick={handleClose}
                className="text-white/70 hover:text-white transition p-1 rounded-lg
                  hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-4 flex flex-col gap-4">

              {/* ── Candidate Details ── */}
              <Section title="Candidate Details" icon="👤" />

              <Field label="Candidate Full Name" required>
                <Input value={form.candidateName} onChange={set("candidateName")}
                  placeholder="e.g. Aisha Malik" />
              </Field>

              <Field label="Position / Job Title" required>
                <Input value={form.position} onChange={set("position")}
                  placeholder="e.g. Senior Software Engineer" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Department">
                  <Input value={form.department} onChange={set("department")}
                    placeholder="e.g. Engineering" />
                </Field>
                <Field label="Joining Date">
                  <Input type="date" value={form.joiningDate}
                    onChange={set("joiningDate")} />
                </Field>
              </div>

              <Field label="Annual CTC / Salary">
                <Input value={form.salary} onChange={set("salary")}
                  placeholder="e.g. ₹12,00,000 per annum" />
              </Field>

              {/* ── HR Details ── */}
              <Section title="HR / Signatory Details" icon="🖊️" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="HR Name" required>
                  <Input value={form.hrName} onChange={set("hrName")}
                    placeholder="e.g. Rajesh Kumar" />
                </Field>
                <Field label="HR Designation" required>
                  <Input value={form.hrDesignation} onChange={set("hrDesignation")}
                    placeholder="e.g. HR Manager" />
                </Field>
              </div>

              {/* Company name (read-only display) */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg
                px-3 py-2 flex items-center gap-2">
                <span className="text-base">🏢</span>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    Company (from settings)
                  </p>
                  <p className="text-sm text-slate-700 font-medium">{companyName}</p>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200
                  text-red-700 text-sm px-3 py-2.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Success banner */}
              {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200
                  text-green-700 text-sm px-3 py-2.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Offer letter downloaded! Closing…
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3
              justify-end shrink-0 bg-slate-50">
              <button onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-slate-300
                  text-slate-700 text-sm font-medium hover:bg-white transition">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || success}
                className="flex items-center gap-2 px-5 py-2 rounded-lg
                  bg-blue-700 hover:bg-blue-800 disabled:opacity-60
                  text-white text-sm font-semibold transition active:scale-95"
              >
                {loading ? (
                  <><Spinner />Generating…</>
                ) : success ? (
                  <>✓ Downloaded</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2
                           M7 10l5 5m0 0l5-5m-5 5V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}