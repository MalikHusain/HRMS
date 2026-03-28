import { useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  user:      "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  mail:      "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 7L4 6m16 0l-8 5",
  lock:      "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  badge:     "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  briefcase: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  phone:     "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  building:  "M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18zM2 22h20M6 12h4m4 0h4M6 8h4m4 0h4M6 16h4m4 0h4",
  arrow:     "M5 12h14M12 5l7 7-7 7",
  check:     "M20 6L9 17l-5-5",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  sun:       "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 000 14A7 7 0 0012 5z",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
};

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLES = {
  employee: {
    label: "Employee", emoji: "👔",
    accent: "#10b981",
    accentBorder: "rgba(16,185,129,0.25)",
    gradient: "from-emerald-500 to-teal-600",
    ringDark:  "focus:ring-emerald-500/30 focus:border-emerald-500",
    ringLight: "focus:ring-emerald-400/40 focus:border-emerald-500",
    btn:        "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25",
    badgeDark:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    badgeLight: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  candidate: {
    label: "Candidate", emoji: "🎯",
    accent: "#8b5cf6",
    accentBorder: "rgba(139,92,246,0.25)",
    gradient: "from-violet-500 to-purple-600",
    ringDark:  "focus:ring-violet-500/30 focus:border-violet-500",
    ringLight: "focus:ring-violet-400/40 focus:border-violet-500",
    btn:        "bg-violet-500 hover:bg-violet-600 shadow-violet-500/25",
    badgeDark:  "bg-violet-500/10 text-violet-400 border-violet-500/25",
    badgeLight: "bg-violet-50 text-violet-600 border-violet-200",
  },
  hr: {
    label: "HR Manager", emoji: "🏢",
    accent: "#f59e0b",
    accentBorder: "rgba(245,158,11,0.25)",
    gradient: "from-amber-500 to-orange-500",
    ringDark:  "focus:ring-amber-500/30 focus:border-amber-500",
    ringLight: "focus:ring-amber-400/40 focus:border-amber-500",
    btn:        "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25",
    badgeDark:  "bg-amber-500/10 text-amber-400 border-amber-500/25",
    badgeLight: "bg-amber-50 text-amber-600 border-amber-200",
  },
};

// ─── Password Strength ────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return {
    score,
    label: ["", "Weak", "Fair", "Good", "Strong"][score],
    color: ["", "bg-red-500", "bg-yellow-400", "bg-blue-400", "bg-emerald-500"][score],
  };
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, icon, type = "text", placeholder, value, onChange, extra, ring, dark }) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? "text-slate-500" : "text-slate-400"}`}>
          <Icon d={icon} size={15} />
        </span>
        <input
          type={isPw && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full border rounded-xl pl-10 ${isPw ? "pr-10" : "pr-4"} py-3 text-sm outline-none transition-all focus:ring-2 ${ring}
            ${dark
              ? "bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder-slate-500 focus:bg-slate-800"
              : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-sm"
            }`}
        />
        {isPw && (
          <button type="button" onClick={() => setShow(s => !s)}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
            <Icon d={show ? icons.eyeOff : icons.eye} size={15} />
          </button>
        )}
      </div>
      {extra}
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────
function SelectField({ label, icon, options, value, onChange, ring, dark }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${dark ? "text-slate-500" : "text-slate-400"}`}>
          <Icon d={icon} size={15} />
        </span>
        <select
          value={value}
          onChange={onChange}
          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all focus:ring-2 ${ring} appearance-none cursor-pointer
            ${dark
              ? "bg-slate-800/60 border-slate-700/60 text-slate-300"
              : "bg-white border-slate-200 text-slate-700 shadow-sm"
            }`}>
          <option value="" disabled>Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ role, cfg, dark, onSuccess }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const ring = dark ? cfg.ringDark : cfg.ringLight;

  const idField = {
    employee:  { label: "Employee ID",   icon: icons.badge, placeholder: "EMP-0001",       type: "text"  },
    candidate: { label: "Email Address", icon: icons.mail,  placeholder: "you@email.com",   type: "email" },
    hr:        { label: "HR Email",      icon: icons.user,  placeholder: "hr@company.com",  type: "email" },
  }[role];

  const handle = async () => {
    if (!id || !pw) return;
    setLoading(true);

    try {
      const body = role === "employee"
        ? { employee_id: id, password: pw, role }
        : { email: id, password: pw, role };

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("hrms_token", data.token);
      localStorage.setItem("hrms_user", JSON.stringify(data.user));

      setLoading(false);
      onSuccess();

    } catch (err) {
      console.error(err);
      alert("Cannot connect to server. Is backend running?");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handle(); }} className="flex flex-col gap-5">
      <Field
        label={idField.label}
        icon={idField.icon}
        type={idField.type}
        placeholder={idField.placeholder}
        value={id}
        onChange={e => setId(e.target.value)}
        ring={ring}
        dark={dark}
      />
      <Field
        label="Password"
        icon={icons.lock}
        type="password"
        placeholder="••••••••"
        value={pw}
        onChange={e => setPw(e.target.value)}
        ring={ring}
        dark={dark}
      />

      <div className="flex justify-end -mt-2">
        <a href="#" className={`text-xs transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
          Forgot password?
        </a>
      </div>

      <button type="submit" disabled={loading}
        className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${cfg.btn} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
          : <><span>Sign In</span><Icon d={icons.arrow} size={15} /></>}
      </button>

      <div className={`flex items-center gap-3 text-xs ${dark ? "text-slate-600" : "text-slate-400"}`}>
        <div className={`flex-1 h-px ${dark ? "bg-slate-700/60" : "bg-slate-200"}`} />SSO
        <div className={`flex-1 h-px ${dark ? "bg-slate-700/60" : "bg-slate-200"}`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {["Google", "Microsoft"].map(p => (
          <button key={p} type="button"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all
              ${dark
                ? "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm"
              }`}>
            <span className="font-bold">{p[0]}</span>{p}
          </button>
        ))}
      </div>
    </form>
  );
}


// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm({ role, cfg, dark, onSuccess }) {
  // ── Controlled state for every field ──
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [pw,         setPw]         = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [agreed,     setAgreed]     = useState(false);
  const [loading,    setLoading]    = useState(false);

  // Employee-specific
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Candidate-specific
  const [applyingFor,  setApplyingFor]  = useState("");
  const [experience,   setExperience]   = useState("");

  // HR-specific
  const [hrRole,       setHrRole]       = useState("");
  const [hrAccessCode, setHrAccessCode] = useState("");

  const strength = getStrength(pw);
  const ring     = dark ? cfg.ringDark : cfg.ringLight;

  const handle = async () => {
    // ── Basic validation ──
    if (!firstName || !lastName || !email || !phone || !pw || !confirmPw) {
      alert("Please fill in all required fields.");
      return;
    }
    if (pw !== confirmPw) {
      alert("Passwords do not match.");
      return;
    }
    if (strength.score < 2) {
      alert("Please choose a stronger password.");
      return;
    }
    if (!agreed) {
      alert("Please agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      // Build payload based on role
      const payload = {
        first_name:  firstName,
        last_name:   lastName,
        email,
        phone,
        password:    pw,
        role,                        // "employee" | "candidate" | "hr"
      };

      if (role === "employee") {
        payload.department   = department;
        payload.employee_id  = employeeId;
      }
      // candidate / hr extra fields are informational for now;
      // extend your DB schema & register route to store them as needed.

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();

    } catch (err) {
      console.error(err);
      alert("Cannot connect to server. Is backend running?");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" icon={icons.user}  placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)}  ring={ring} dark={dark} />
        <Field label="Last Name"  icon={icons.user}  placeholder="Doe"  value={lastName}  onChange={e => setLastName(e.target.value)}   ring={ring} dark={dark} />
      </div>

      <Field label="Email Address" icon={icons.mail}  type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} ring={ring} dark={dark} />
      <Field label="Phone"         icon={icons.phone}              placeholder="+91 00000 00000"  value={phone} onChange={e => setPhone(e.target.value)} ring={ring} dark={dark} />

      {/* Role-specific fields */}
      {role === "employee" && (
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Department" icon={icons.building}
            options={["Engineering","Marketing","Finance","Operations","HR","Sales"]}
            value={department} onChange={e => setDepartment(e.target.value)}
            ring={ring} dark={dark}
          />
          <Field label="Employee ID" icon={icons.badge} placeholder="EMP-0001"
            value={employeeId} onChange={e => setEmployeeId(e.target.value)} ring={ring} dark={dark} />
        </div>
      )}

      {role === "candidate" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Applying For" icon={icons.briefcase} placeholder="Position / Role"
            value={applyingFor} onChange={e => setApplyingFor(e.target.value)} ring={ring} dark={dark} />
          <SelectField label="Experience" icon={icons.key}
            options={["Fresher","1–2 yrs","3–5 yrs","5–10 yrs","10+ yrs"]}
            value={experience} onChange={e => setExperience(e.target.value)}
            ring={ring} dark={dark}
          />
        </div>
      )}

      {role === "hr" && (
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="HR Role" icon={icons.shield}
            options={["HR Manager","HR Executive","Recruiter","Payroll Specialist","HR Admin"]}
            value={hrRole} onChange={e => setHrRole(e.target.value)}
            ring={ring} dark={dark}
          />
          <Field label="HR Access Code" icon={icons.key} placeholder="HR-ADMIN-XXX"
            value={hrAccessCode} onChange={e => setHrAccessCode(e.target.value)} ring={ring} dark={dark} />
        </div>
      )}

      {/* Password */}
      <Field label="Password" icon={icons.lock} type="password" placeholder="Create password"
        value={pw} onChange={e => setPw(e.target.value)} ring={ring} dark={dark}
        extra={pw && (
          <div className="flex items-center gap-2 mt-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength.score ? strength.color : dark ? "bg-slate-700" : "bg-slate-200"}`} />
            ))}
            <span className={`text-xs ml-1 w-10 ${dark ? "text-slate-400" : "text-slate-500"}`}>{strength.label}</span>
          </div>
        )}
      />

      {/* Confirm Password */}
      <Field label="Confirm Password" icon={icons.lock} type="password" placeholder="Repeat password"
        value={confirmPw} onChange={e => setConfirmPw(e.target.value)} ring={ring} dark={dark}
        extra={confirmPw && pw !== confirmPw && (
          <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
        )}
      />

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div onClick={() => setAgreed(a => !a)}
          className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-all flex items-center justify-center
            ${agreed ? "border-transparent" : dark ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-white"}`}
          style={agreed ? { background: cfg.accent, borderColor: cfg.accent } : {}}>
          {agreed && <Icon d={icons.check} size={10} stroke="#fff" />}
        </div>
        <span className={`text-xs leading-relaxed transition-colors ${dark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-700"}`}>
          I agree to the{" "}
          <a href="#" className={`underline underline-offset-2 ${dark ? "text-slate-200" : "text-slate-700"}`}>Terms of Service</a>
          {" "}and{" "}
          <a href="#" className={`underline underline-offset-2 ${dark ? "text-slate-200" : "text-slate-700"}`}>Privacy Policy</a>
        </span>
      </label>

      {/* Submit */}
      <button onClick={handle} disabled={loading || !agreed}
        className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${cfg.btn} ${(loading || !agreed) ? "opacity-60 cursor-not-allowed" : ""}`}>
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
          : <><span>Create Account</span><Icon d={icons.arrow} size={15} /></>}
      </button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose, dark }) {
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-[slideDown_.35s_ease]
      ${dark ? "bg-slate-800 border border-emerald-500/40 text-emerald-400" : "bg-white border border-emerald-200 text-emerald-600"}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${dark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
        <Icon d={icons.check} size={11} stroke="#10b981" />
      </div>
      {msg}
      <button onClick={onClose} className={`ml-2 ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>✕</button>
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`relative w-14 h-7 rounded-full border-2 transition-all duration-300 flex items-center
        ${dark ? "bg-slate-700 border-slate-600" : "bg-slate-100 border-slate-200"}`}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <span className={`absolute w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center
        ${dark ? "translate-x-[30px] bg-slate-900" : "translate-x-[2px] bg-white"}`}>
        <Icon d={dark ? icons.moon : icons.sun} size={11} stroke={dark ? "#94a3b8" : "#f59e0b"} />
      </span>
      <span className={`absolute left-1.5 transition-opacity duration-200 ${dark ? "opacity-0" : "opacity-50"}`}>
        <Icon d={icons.sun} size={10} stroke="#f59e0b" />
      </span>
      <span className={`absolute right-1.5 transition-opacity duration-200 ${dark ? "opacity-50" : "opacity-0"}`}>
        <Icon d={icons.moon} size={10} stroke="#94a3b8" />
      </span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HRMSAuth({ onLogin }) {
  const [role, setRole]   = useState("employee");
  const [tab, setTab]     = useState("login");
  const [toast, setToast] = useState(null);
  const [dark, setDark]   = useState(true);

  const cfg = ROLES[role];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLoginSuccess  = () => {
    showToast(`Welcome back! Redirecting to ${cfg.label} dashboard…`);
    if (onLogin) onLogin();
  };
  const handleSignupSuccess = () => {
    showToast(`Account created! ${role === "hr" ? "Awaiting admin approval." : "You can now sign in."}`);
    setTab("login"); // ← auto-switch to login after registration
  };

  const bg              = dark ? "bg-slate-950 text-slate-100"          : "bg-slate-50 text-slate-900";
  const card            = dark ? "bg-slate-900/80 border-slate-700/50"  : "bg-white border-slate-200";
  const tabBg           = dark ? "bg-slate-800/60"                       : "bg-slate-100";
  const tabInactive     = dark ? "text-slate-400 hover:text-slate-200"  : "text-slate-500 hover:text-slate-700";
  const roleBtnInactive = dark
    ? "border-slate-700/60 text-slate-400 bg-slate-800/40 hover:border-slate-600 hover:text-slate-200"
    : "border-slate-200 text-slate-500 bg-white hover:border-slate-300 hover:text-slate-700 shadow-sm";
  const gridColor = dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.04)";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-colors duration-300 ${bg}`}
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px)`,
          backgroundSize: "48px 48px"
        }} />

      {/* Glow orbs */}
      {dark && <>
        <div className="fixed top-0 left-0 w-[600px] h-[400px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: cfg.accent, transition: "background 0.4s" }} />
        <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.08] pointer-events-none"
          style={{ background: cfg.accent, transition: "background 0.4s" }} />
      </>}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} dark={dark} />}

      {/* Theme Toggle */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-2.5">
        <span className={`text-xs font-medium select-none ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {dark ? "Dark" : "Light"}
        </span>
        <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xl shadow-lg`}>
              {cfg.emoji}
            </div>
            <span className="text-2xl font-black tracking-tight">
              HR<span style={{ color: cfg.accent }}>MS</span>
            </span>
          </div>
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Human Resource Management System
          </p>
        </div>

        {/* Role Switcher */}
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {Object.entries(ROLES).map(([key, r]) => (
            <button key={key} onClick={() => setRole(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
                ${role === key ? "border-transparent text-white" : roleBtnInactive}`}
              style={role === key ? { background: r.accent } : {}}>
              <span>{r.emoji}</span>{r.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className={`relative border rounded-3xl p-8 shadow-2xl backdrop-blur-sm transition-colors duration-300 ${card}`}
          style={{
            boxShadow: dark
              ? `0 0 0 1px ${cfg.accentBorder}, 0 25px 60px rgba(0,0,0,0.5)`
              : `0 0 0 1px ${cfg.accentBorder}, 0 20px 40px rgba(0,0,0,0.07)`
          }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-8 right-8 h-px rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }} />

          {/* Badge */}
          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${dark ? cfg.badgeDark : cfg.badgeLight}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.accent }} />
              {cfg.label}
            </span>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight mb-1">
              {tab === "login" ? (role === "hr" ? "Admin Portal" : "Welcome back") : "Create account"}
            </h1>
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {tab === "login"
                ? `Sign in to your ${cfg.label.toLowerCase()} account`
                : `Register as a ${cfg.label.toLowerCase()}`}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className={`flex rounded-2xl p-1 mb-7 gap-1 ${tabBg}`}>
            {["login", "signup"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? "text-white shadow" : tabInactive}`}
                style={tab === t ? { background: cfg.accent } : {}}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div key={`${role}-${tab}-${dark}`} className="animate-[fadeSlide_.25s_ease]">
            {tab === "login"
              ? <LoginForm  role={role} cfg={cfg} dark={dark} onSuccess={handleLoginSuccess}  />
              : <SignupForm role={role} cfg={cfg} dark={dark} onSuccess={handleSignupSuccess} />
            }
          </div>
        </div>

        {/* Footer */}
        <p className={`text-center text-xs mt-6 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          © 2026 HRMS Platform · Secure Access Portal
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
