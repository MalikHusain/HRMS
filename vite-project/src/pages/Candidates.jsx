// pages/Candidates.jsx
// Fully connected to PostgreSQL via /api/candidates endpoints.
// Replaces mock data entirely.

import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:5000/api/candidates";

function authHeaders(isFormData = false) {
  const token = localStorage.getItem("hrms_token");
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  applied:     { label: "Applied",     color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-500"    },
  interviewed: { label: "Interviewed", color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500"   },
  offered:     { label: "Offered",     color: "bg-violet-50 text-violet-700 border-violet-200",dot: "bg-violet-500"  },
  onboarded:   { label: "Onboarded",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"     },
};

const FILE_ICONS = {
  "application/pdf":                                                         "📄",
  "application/msword":                                                      "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "image/jpeg": "🖼️", "image/jpg": "🖼️", "image/png": "🖼️",
};

function fileIcon(mimetype) { return FILE_ICONS[mimetype] || "📎"; }
function fileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  plus:     "M12 5v14M5 12h14",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  upload:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  x:        "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
};

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700","bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700","bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700","bg-orange-100 text-orange-700",
];

function Avatar({ name = "", index = 0 }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.applied;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Add Candidate Modal ──────────────────────────────────────────────────────
function AddCandidateModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", position: "", department: "", status: "applied", notes: "",
  });
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const tooBig   = selected.filter(f => f.size > 10 * 1024 * 1024);
    if (tooBig.length) { setError("Some files exceed 10 MB limit"); return; }
    setFiles(prev => [...prev, ...selected]);
    setError("");
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append("documents", f));

      const res  = await fetch(API, { method: "POST", headers: authHeaders(true), body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add candidate");
      onSave(data.candidate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 bg-white transition-all";
  const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Add Candidate</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={`mt-1.5 ${inputCls}`} placeholder="Full name"
                value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input className={`mt-1.5 ${inputCls}`} type="email" placeholder="email@example.com"
                value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
          </div>

          {/* Phone + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input className={`mt-1.5 ${inputCls}`} placeholder="+91 00000 00000"
                value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Position</label>
              <input className={`mt-1.5 ${inputCls}`} placeholder="e.g. Backend Engineer"
                value={form.position} onChange={e => set("position", e.target.value)} />
            </div>
          </div>

          {/* Department + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Department</label>
              <select className={`mt-1.5 ${inputCls}`}
                value={form.department} onChange={e => set("department", e.target.value)}>
                <option value="">Select…</option>
                {["Engineering","Design","Marketing","Finance","HR","Sales","Operations"].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={`mt-1.5 ${inputCls}`}
                value={form.status} onChange={e => set("status", e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`mt-1.5 ${inputCls} resize-none`} rows={2}
              placeholder="Optional notes…"
              value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          {/* ── Document Upload (FR-04) ── */}
          <div>
            <label className={labelCls}>Documents (max 10 MB each)</label>
            <div
              className="mt-1.5 border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
            >
              <Icon d={ICONS.upload} size={20} />
              <p className="text-sm text-slate-500 mt-2">
                Drag & drop or <span className="text-slate-700 font-semibold">click to browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG · max 10 MB each</p>
              <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden" onChange={handleFiles} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <span className="text-lg">{fileIcon(f.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{fileSize(f.size)}</p>
                    </div>
                    <button onClick={() => removeFile(i)}
                      className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Icon d={ICONS.x} size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60">
            {loading ? "Saving…" : "Add Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Upload Panel (for existing candidates) ─────────────────────────
function DocumentPanel({ candidate, onUpdate, onClose }) {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const fileRef = useRef();

  const docs = candidate.documents || [];

  const handleFiles = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const uploadFiles = async () => {
    if (!files.length) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("documents", f));
      const res  = await fetch(`${API}/${candidate.id}/documents`, {
        method: "POST", headers: authHeaders(true), body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles([]);
      onUpdate(data.candidate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (index) => {
    try {
      const res  = await fetch(`${API}/${candidate.id}/documents/${index}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data.candidate);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Documents</h3>
            <p className="text-xs text-slate-500 mt-0.5">{candidate.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Existing documents */}
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No documents uploaded yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                  <span className="text-xl">{fileIcon(doc.mimetype)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {fileSize(doc.size)} · {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={`http://localhost:5000/${doc.path}`} target="_blank" rel="noreferrer"
                    className="text-slate-400 hover:text-blue-500 transition-colors">
                    <Icon d={ICONS.eye} size={14} />
                  </a>
                  <button onClick={() => deleteDoc(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors">
                    <Icon d={ICONS.trash} size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload new */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
            onClick={() => fileRef.current?.click()}>
            <Icon d={ICONS.upload} size={18} />
            <p className="text-sm text-slate-500 mt-1.5">Click to upload more files</p>
            <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden" onChange={handleFiles} />
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50 rounded-lg px-3 py-1.5">
                  <span>{fileIcon(f.type)}</span>
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-slate-400">{fileSize(f.size)}</span>
                </div>
              ))}
              <button onClick={uploadFiles} disabled={loading}
                className="mt-1 w-full py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60">
                {loading ? "Uploading…" : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status Update Dropdown ───────────────────────────────────────────────────
function StatusDropdown({ candidate, onUpdate }) {
  const [open, setOpen] = useState(false);

  const update = async (status) => {
    setOpen(false);
    try {
      const res  = await fetch(`${API}/${candidate.id}/status`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.candidate);
    } catch { /* silent */ }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="cursor-pointer">
        <StatusBadge status={candidate.status} />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => update(k)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors
                ${candidate.status === k ? "bg-slate-50" : ""}`}>
              <span className={`w-2 h-2 rounded-full ${v.dot}`} />
              {v.label}
              {candidate.status === k && <Icon d={ICONS.check} size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Candidates Page ─────────────────────────────────────────────────────
export default function Candidates() {
  const user  = JSON.parse(localStorage.getItem("hrms_user") || "{}");
  const isHR  = user.role === "hr";

  const [candidates,  setCandidates]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [showAdd,     setShowAdd]     = useState(false);
  const [docPanel,    setDocPanel]    = useState(null);  // candidate object
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);
      const res  = await fetch(`${API}?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCandidates(data.candidates || []);
    } catch (err) {
      showToast(err.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(t);
  }, [fetchCandidates]);

  const handleAdd = (candidate) => {
    setCandidates(prev => [candidate, ...prev]);
    setShowAdd(false);
    showToast("Candidate added!");
  };

  const handleUpdate = (updated) => {
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (docPanel?.id === updated.id) setDocPanel(updated);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this candidate?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setCandidates(prev => prev.filter(c => c.id !== id));
      showToast("Candidate deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Name","Email","Phone","Position","Department","Status","Applied Date","Documents"],
      ...candidates.map(c => [
        c.name, c.email, c.phone || "", c.position || "",
        c.department || "", c.status,
        new Date(c.applied_date).toLocaleDateString(),
        (c.documents || []).length,
      ])
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `candidates_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pipeline counts
  const counts = Object.fromEntries(
    Object.keys(STATUS).map(k => [k, candidates.filter(c => c.status === k).length])
  );

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

      {showAdd  && <AddCandidateModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {docPanel && <DocumentPanel candidate={docPanel} onUpdate={handleUpdate} onClose={() => setDocPanel(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Candidates</h1>
          <p className="text-sm text-slate-500 mt-0.5">{candidates.length} total candidates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCandidates}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Icon d={ICONS.refresh} size={14} />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Icon d={ICONS.download} size={14} />
            Export CSV
          </button>
          {isHR && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm">
              <Icon d={ICONS.plus} size={14} />
              Add Candidate
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline pills ── */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
            ${filter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
          All · {candidates.length}
        </button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
              ${filter === k ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}>
            {v.label} · {counts[k] || 0}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon d={ICONS.search} size={14} />
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, position…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-400">Loading…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Candidate","Position","Department","Status","Applied","Documents","Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No candidates found
                  </td></tr>
                ) : candidates.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} index={i} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{c.position || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{c.department || "—"}</td>
                    <td className="px-5 py-3.5">
                      {isHR
                        ? <StatusDropdown candidate={c} onUpdate={handleUpdate} />
                        : <StatusBadge status={c.status} />
                      }
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(c.applied_date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setDocPanel(c)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        <Icon d={ICONS.file} size={12} />
                        {(c.documents || []).length} file{(c.documents || []).length !== 1 ? "s" : ""}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDocPanel(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Icon d={ICONS.upload} size={14} />
                        </button>
                        {isHR && (
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Icon d={ICONS.trash} size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-600">{candidates.length}</span> candidates
          </p>
        </div>
      </div>
    </div>
  );
}
