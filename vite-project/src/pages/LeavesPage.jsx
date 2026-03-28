// pages/LeavesPage.jsx
// Add to App.jsx:
//   import LeavesPage from "./pages/LeavesPage";
//   <Route path="/leaves" element={<ProtectedRoute><LeavesPage /></ProtectedRoute>} />

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/attendance/leaves";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const LEAVE_TYPES = ["casual", "sick", "earned", "maternity", "paternity", "unpaid"];

const STATUS_CFG = {
  pending:  { label: "Pending",  bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"   },
  approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-500"  },
  rejected: { label: "Rejected", bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500"     },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  plus:    "M12 5v14M5 12h14",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  calendar:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function daysBetween(from, to) {
  const d = (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) + 1;
  return d > 0 ? d : 1;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700","bg-amber-100 text-amber-700","bg-rose-100 text-rose-700",
];
function Avatar({ name = "", index = 0 }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
      {initials}
    </div>
  );
}

// ─── Apply Leave Modal ────────────────────────────────────────────────────────
function ApplyLeaveModal({ onClose, onSave }) {
  const [form,    setForm]    = useState({ leave_type: "casual", from_date: "", to_date: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.from_date || !form.to_date) { setError("From and To dates are required"); return; }
    if (new Date(form.to_date) < new Date(form.from_date)) { setError("To date must be after From date"); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(API, { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      onSave(data.leave);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300 bg-white transition-all";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider";
  const days     = form.from_date && form.to_date ? daysBetween(form.from_date, form.to_date) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>
          )}

          <div>
            <label className={labelCls}>Leave Type</label>
            <select className={`mt-1.5 ${inputCls}`} value={form.leave_type} onChange={e => set("leave_type", e.target.value)}>
              {LEAVE_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From Date</label>
              <input type="date" className={`mt-1.5 ${inputCls}`}
                value={form.from_date} onChange={e => set("from_date", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>To Date</label>
              <input type="date" className={`mt-1.5 ${inputCls}`}
                value={form.to_date} onChange={e => set("to_date", e.target.value)} />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
              {days} day{days > 1 ? "s" : ""} of leave
            </div>
          )}

          <div>
            <label className={labelCls}>Reason</label>
            <textarea className={`mt-1.5 ${inputCls} resize-none`} rows={3}
              placeholder="Optional reason…"
              value={form.reason} onChange={e => set("reason", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60">
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeavesPage() {
  const user  = JSON.parse(localStorage.getItem("hrms_user") || "{}");
  const isHR  = user.role === "hr";

  const [leaves,    setLeaves]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [showApply, setShowApply] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [acting,    setActing]    = useState(null);  // leave id being approved/rejected

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res    = await fetch(`${API}${params}`, { headers: authHeaders() });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeaves(data.leaves || []);
    } catch (err) {
      showToast(err.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleApplied = (leave) => {
    setLeaves(prev => [leave, ...prev]);
    setShowApply(false);
    showToast("Leave request submitted! HR will be notified.");
  };

  const handleReview = async (id, status) => {
    setActing(id);
    try {
      const res  = await fetch(`${API}/${id}/review`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...data.leave } : l));
      showToast(`Leave ${status} successfully. Employee notified by email.`);
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActing(null);
    }
  };

  // Stats
  const counts = {
    all:      leaves.length,
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
  };

  const displayed = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div className="space-y-6 p-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium border
          ${toast.type === "error" ? "bg-white border-red-200 text-red-600" : "bg-white border-emerald-200 text-emerald-700"}`}>
          <Icon d={toast.type === "error" ? ICONS.x : ICONS.check} size={14} />
          {toast.msg}
        </div>
      )}

      {showApply && <ApplyLeaveModal onClose={() => setShowApply(false)} onSave={handleApplied} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isHR ? "Review and manage all employee leave requests" : "Apply and track your leave requests"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLeaves}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Icon d={ICONS.refresh} size={14} />
          </button>
          {!isHR && (
            <button onClick={() => setShowApply(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm">
              <Icon d={ICONS.plus} size={14} />
              Apply for Leave
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "all",      label: "Total",    color: "text-slate-700",   bg: "bg-slate-50"   },
          { key: "pending",  label: "Pending",  color: "text-amber-700",   bg: "bg-amber-50"   },
          { key: "approved", label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50" },
          { key: "rejected", label: "Rejected", color: "text-red-700",     bg: "bg-red-50"     },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-2xl p-4 border border-slate-100`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{counts[s.key]}</p>
          </div>
        ))}
      </div>

      {/* ── Filter pills ── */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize
              ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} · {counts[f] ?? 0}
          </button>
        ))}
      </div>

      {/* ── Leave cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Loading…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Icon d={ICONS.calendar} size={32} />
          <p className="mt-3 text-sm">No leave requests found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((leave, i) => {
            const empName = isHR
              ? `${leave.first_name || ""} ${leave.last_name || ""}`.trim() || "Employee"
              : user.name || "You";
            const days = daysBetween(leave.from_date, leave.to_date);

            return (
              <div key={leave.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">

                {/* Left — avatar + info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {isHR && <Avatar name={empName} index={i} />}
                  <div className="flex-1 min-w-0">
                    {isHR && (
                      <p className="text-sm font-bold text-slate-800">{empName}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold text-slate-700 capitalize">{leave.leave_type} leave</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{days} day{days > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(leave.from_date)} → {formatDate(leave.to_date)}
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-slate-400 mt-1 truncate">{leave.reason}</p>
                    )}
                    {leave.status !== "pending" && leave.reviewed_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        Reviewed {formatDate(leave.reviewed_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right — status + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={leave.status} />

                  {/* HR approve / reject buttons — only for pending */}
                  {isHR && leave.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(leave.id, "approved")}
                        disabled={acting === leave.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                        <Icon d={ICONS.check} size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(leave.id, "rejected")}
                        disabled={acting === leave.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Icon d={ICONS.x} size={12} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
