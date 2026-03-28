// AttendanceSection.jsx
// Fully connected to PostgreSQL via /api/attendance endpoints.
// Expects hrms_token in localStorage (set by HRMSAuth.jsx on login).

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/attendance";

function authHeaders() {
  const token = localStorage.getItem("hrms_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const fmt   = (d) => (d instanceof Date ? d : new Date(d)).toISOString().split("T")[0];
const today = new Date();

// Last 7 days array
const LAST7 = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (6 - i));
  return {
    date:  fmt(d),
    label: d.toLocaleDateString("en-US", { weekday: "short" }),
    day:   d.getDate(),
  };
});

const STATUS_CONFIG = {
  present: { label: "Present",  color: "bg-emerald-500/15 text-emerald-600 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  absent:  { label: "Absent",   color: "bg-red-500/10 text-red-600 border-red-200",             dot: "bg-red-500",     bar: "bg-red-500"     },
  late:    { label: "Late",     color: "bg-amber-500/10 text-amber-600 border-amber-200",       dot: "bg-amber-400",   bar: "bg-amber-400"   },
  leave:   { label: "On Leave", color: "bg-blue-500/10 text-blue-600 border-blue-200",          dot: "bg-blue-400",    bar: "bg-blue-400"    },
  wfh:     { label: "WFH",      color: "bg-purple-500/10 text-purple-600 border-purple-200",    dot: "bg-purple-400",  bar: "bg-purple-400"  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  clock:    "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l3 3",
  users:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  badge:    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  login:    "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  plus:     "M12 5v14M5 12h14",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700","bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700","bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700","bg-orange-100 text-orange-700",
];

function Avatar({ name = "", index = 0, size = "w-9 h-9" }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border p-5 flex items-start gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon d={icon} size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const r = 40, cx = 50, cy = 50, stroke = 12;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {data.map((seg, i) => {
          const pct  = seg.value / total;
          const dash = pct * circumference;
          const gap  = circumference - dash;
          const rotate = offset * 360 - 90;
          offset += pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
              style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "50% 50%", transition: "all 0.5s ease" }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="white" />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold text-slate-800">{data.reduce((s,d)=>s+d.value,0)}</p>
        <p className="text-[9px] text-slate-400 font-medium">Total</p>
      </div>
    </div>
  );
}

// Weekly dots using real API data per-employee
function WeekDots({ weeklyMap }) {
  return (
    <div className="flex gap-1">
      {LAST7.map(({ date, label }) => {
        const s   = weeklyMap?.[date] || "absent";
        const cfg = STATUS_CONFIG[s];
        return (
          <div key={date} className="flex flex-col items-center gap-1" title={`${label}: ${cfg.label}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.bar}`} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Leave Request Modal ──────────────────────────────────────────────────────
function LeaveModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    leave_type: "casual", from_date: fmt(today), to_date: fmt(today), reason: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</label>
            <select value={form.leave_type} onChange={e => set("leave_type", e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300">
              {["casual","sick","earned","unpaid","wfh"].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
              <input type="date" value={form.from_date} onChange={e => set("from_date", e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
              <input type="date" value={form.to_date} onChange={e => set("to_date", e.target.value)}
                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)}
              placeholder="Optional reason…" rows={3}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AttendanceSection() {
  const user = JSON.parse(localStorage.getItem("hrms_user") || "{}");
  const isHR = user.role === "hr";

  const [activeDay,    setActiveDay]    = useState(fmt(today));
  const [employees,    setEmployees]    = useState([]);   // HR daily list
  const [summary,      setSummary]      = useState({ present:0, late:0, absent:0, leave:0, wfh:0, total:0 });
  const [weeklyMaps,   setWeeklyMaps]   = useState({});   // { userId: { date: status } }
  const [filter,       setFilter]       = useState("all");
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [clockedIn,    setClockedIn]    = useState(false);
  const [showLeave,    setShowLeave]    = useState(false);
  const [toast,        setToast]        = useState(null);
  const [clockLoading, setClockLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch daily attendance (HR) ──
  const fetchDaily = useCallback(async (date) => {
    if (!isHR) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/daily?date=${date}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployees(data.employees || []);

      // Build weekly maps per employee
      const maps = {};
      await Promise.all(
        (data.employees || []).map(async (emp) => {
          try {
            const r  = await fetch(`${API}/weekly?user_id=${emp.id}`, { headers: authHeaders() });
            const d  = await r.json();
            const m  = {};
            (d.records || []).forEach(rec => { m[fmt(rec.date)] = rec.status; });
            maps[emp.id] = m;
          } catch { maps[emp.id] = {}; }
        })
      );
      setWeeklyMaps(maps);
    } catch (err) {
      showToast(err.message || "Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  }, [isHR]);

  // ── Fetch summary ──
  const fetchSummary = useCallback(async (date) => {
    if (!isHR) return;
    try {
      const res  = await fetch(`${API}/summary?date=${date}`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setSummary(data.summary || {});
    } catch { /* silent */ }
  }, [isHR]);

  // ── Fetch own weekly (employee view) ──
  const fetchMyWeekly = useCallback(async () => {
    if (isHR) return;
    try {
      const res  = await fetch(`${API}/weekly`, { headers: authHeaders() });
      const data = await res.json();
      const m    = {};
      (data.records || []).forEach(rec => { m[fmt(rec.date)] = rec.status; });
      setWeeklyMaps({ [user.id]: m });
      // If today has a clock-in, mark as clocked in
      const todayRec = (data.records || []).find(r => fmt(r.date) === fmt(today));
      if (todayRec?.clock_in) setClockedIn(true);
    } catch { /* silent */ }
  }, [isHR, user.id]);

  useEffect(() => {
    fetchDaily(activeDay);
    fetchSummary(activeDay);
    fetchMyWeekly();
  }, [activeDay, fetchDaily, fetchSummary, fetchMyWeekly]);

  // ── Clock In / Out ──
  const handleClock = async () => {
    setClockLoading(true);
    try {
      const endpoint = clockedIn ? "clock-out" : "clock-in";
      const res  = await fetch(`${API}/${endpoint}`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClockedIn(!clockedIn);
      showToast(data.message);
      fetchMyWeekly();
    } catch (err) {
      showToast(err.message || "Clock action failed", "error");
    } finally {
      setClockLoading(false);
    }
  };

  // ── HR Mark Attendance ──
  const markStatus = async (userId, status) => {
    try {
      const res  = await fetch(`${API}/mark`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ user_id: userId, date: activeDay, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Optimistic update
      setEmployees(prev => prev.map(e =>
        e.id === userId ? { ...e, status } : e
      ));
      fetchSummary(activeDay);
      showToast("Attendance updated");
    } catch (err) {
      showToast(err.message || "Failed to update", "error");
    }
  };

  // ── Submit Leave ──
  const submitLeave = async (form) => {
    try {
      const res  = await fetch(`${API}/leaves`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowLeave(false);
      showToast("Leave request submitted!");
    } catch (err) {
      showToast(err.message || "Failed to submit leave", "error");
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const rows = [
      ["Name", "Department", "Employee ID", "Status", "Clock In", "Clock Out"],
      ...employees.map(e => [
        `${e.first_name} ${e.last_name}`,
        e.department || "",
        e.employee_id || "",
        e.status,
        e.clock_in  ? new Date(e.clock_in).toLocaleTimeString()  : "—",
        e.clock_out ? new Date(e.clock_out).toLocaleTimeString() : "—",
      ])
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendance_${activeDay}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Filtered employees ──
  const filtered = employees.filter(emp => {
    const matchFilter = filter === "all" || emp.status === filter;
    const matchSearch = `${emp.first_name} ${emp.last_name} ${emp.department || ""}`.toLowerCase()
      .includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const donutData = [
    { label: "Present", value: summary.present || 0, color: "#10b981" },
    { label: "WFH",     value: summary.wfh     || 0, color: "#a855f7" },
    { label: "Late",    value: summary.late     || 0, color: "#f59e0b" },
    { label: "Leave",   value: summary.leave    || 0, color: "#3b82f6" },
    { label: "Absent",  value: summary.absent   || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // ── Render ──
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium border
          ${toast.type === "error"
            ? "bg-white border-red-200 text-red-600"
            : "bg-white border-emerald-200 text-emerald-700"}`}>
          <Icon d={toast.type === "error" ? ICONS.x : ICONS.check} size={14} />
          {toast.msg}
        </div>
      )}

      {/* Leave modal */}
      {showLeave && <LeaveModal onClose={() => setShowLeave(false)} onSubmit={submitLeave} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Attendance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Employee: Clock in/out */}
          {!isHR && (
            <button onClick={handleClock} disabled={clockLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors
                ${clockedIn ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} disabled:opacity-60`}>
              <Icon d={clockedIn ? ICONS.logout : ICONS.login} size={14} />
              {clockLoading ? "Please wait…" : clockedIn ? "Clock Out" : "Clock In"}
            </button>
          )}
          {/* Employee: Apply leave */}
          {!isHR && (
            <button onClick={() => setShowLeave(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Icon d={ICONS.calendar} size={14} />
              Apply Leave
            </button>
          )}
          {/* HR: Export */}
          {isHR && (
            <>
              <button onClick={() => { fetchDaily(activeDay); fetchSummary(activeDay); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Icon d={ICONS.refresh} size={14} />
                Refresh
              </button>
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
                <Icon d={ICONS.download} size={14} />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Stat Cards (HR only) ── */}
      {isHR && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={ICONS.check}  label="Present"  value={summary.present || 0}
            sub={`${summary.total ? Math.round((summary.present||0)/summary.total*100) : 0}% attendance`}
            color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={ICONS.clock}  label="Late"     value={summary.late || 0}    sub="Clocked in late"  color="bg-amber-100 text-amber-600" />
          <StatCard icon={ICONS.x}      label="Absent"   value={summary.absent || 0}  sub="Not checked in"   color="bg-red-100 text-red-500"     />
          <StatCard icon={ICONS.badge}  label="On Leave" value={(summary.leave||0)+(summary.wfh||0)}
            sub={`${summary.leave||0} leave · ${summary.wfh||0} WFH`}
            color="bg-blue-100 text-blue-600" />
        </div>
      )}

      {/* ── Week Bar + Donut (HR) ── */}
      {isHR && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Day selector */}
          <div className="md:col-span-2 bg-white rounded-2xl border shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Select Day</p>
            <div className="grid grid-cols-7 gap-2">
              {LAST7.map(({ date, label, day }) => {
                const isActive = date === activeDay;
                const isToday  = date === fmt(today);
                const cnt = employees.filter(e => e.status === "present").length;
                return (
                  <button key={date} onClick={() => setActiveDay(date)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-center
                      ${isActive
                        ? "bg-slate-800 border-slate-800 text-white shadow-md"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
                    <span className={`text-base font-bold ${isToday && !isActive ? "text-emerald-600" : ""}`}>{day}</span>
                    {isActive && <span className="text-[9px] font-medium text-emerald-300">{cnt}P</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Donut */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col items-center justify-center gap-4">
            <p className="text-sm font-semibold text-slate-700 self-start">Today's Overview</p>
            {donutData.length > 0
              ? <DonutChart data={donutData} />
              : <p className="text-sm text-slate-400 py-6">No data</p>
            }
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
              {donutData.map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs font-bold text-slate-700 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Employee self-view: weekly strip ── */}
      {!isHR && (
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">My Last 7 Days</p>
          <div className="grid grid-cols-7 gap-2">
            {LAST7.map(({ date, label, day }) => {
              const s   = weeklyMaps[user.id]?.[date] || "absent";
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={date} className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-100 bg-slate-50 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                  <span className="text-base font-bold text-slate-700">{day}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} title={cfg.label} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />{v.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter + Search (HR only) ── */}
      {isHR && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee or department…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...Object.keys(STATUS_CONFIG)].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all capitalize
                  ${filter === f
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                {f === "all" ? "All" : STATUS_CONFIG[f].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Attendance Table (HR only) ── */}
      {isHR && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <span className="ml-3 text-sm text-slate-400">Loading attendance…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Employee","Department","Status","7-Day","Clock In","Clock Out","Mark"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">No employees found</td></tr>
                  ) : filtered.map((emp, i) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${emp.first_name} ${emp.last_name}`} index={i} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-slate-400">{emp.employee_id || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{emp.department || "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={emp.status} /></td>
                      <td className="px-5 py-3.5"><WeekDots weeklyMap={weeklyMaps[emp.id] || {}} /></td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                        {emp.clock_in  ? new Date(emp.clock_in).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})  : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                        {emp.clock_out ? new Date(emp.clock_out).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <button key={key} onClick={() => markStatus(emp.id, key)}
                              title={cfg.label}
                              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center
                                ${emp.status === key ? `${cfg.dot} border-transparent` : "bg-white border-slate-200 hover:border-slate-400"}`}>
                              {emp.status === key && <span className="w-2 h-2 rounded-full bg-white/80" />}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of {employees.length} employees
            </p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1 text-xs text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
