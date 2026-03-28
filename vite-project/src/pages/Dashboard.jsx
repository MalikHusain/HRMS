import { Users, UserCheck, Clock, UserX, TrendingUp, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { CandidateTable } from "@/components/CandidateTable";
import { candidates } from "@/data/mockData";
import { motion } from "framer-motion";
import AttendanceSection from "@/components/AttendanceSection";
import OfferLetterModal from "../components/OfferLetterModal";

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {

  const token = localStorage.getItem("hrms_token");
  const user  = JSON.parse(localStorage.getItem("hrms_user") || "{}");
  const isHR  = user.role === "hr";

  // Pipeline stats
  const stats = [
    {
      title: "Total Candidates",
      value: candidates.length,
      change: "+12% from last month",
      changeType: "positive",
      icon: Users,
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Onboarded",
      value: candidates.filter((c) => c.status === "onboarded").length,
      change: "+3 this month",
      changeType: "positive",
      icon: UserCheck,
      iconBg: "bg-success/10 text-success",
    },
    {
      title: "In Progress",
      value: candidates.filter((c) => ["applied", "interviewed", "offered"].includes(c.status)).length,
      change: "5 pending review",
      changeType: "neutral",
      icon: Clock,
      iconBg: "bg-warning/10 text-warning",
    },
    {
      title: "Rejected",
      value: candidates.filter((c) => c.status === "rejected").length,
      icon: UserX,
      iconBg: "bg-destructive/10 text-destructive",
    },
  ];

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 5);

  return (
    <div className="page-container">

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Welcome back! Here's an overview of your HR pipeline.</p>
      </motion.div>

      {/* ── Pipeline Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={i * 0.08} />
        ))}
      </div>

      {/* ── Recent Candidates ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Candidates</h2>
          <a href="/candidates" className="text-sm text-primary font-medium hover:underline">View all →</a>
        </div>
        <CandidateTable candidates={recentCandidates} />
      </motion.div>

      {/* ── Pipeline + Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Pipeline by Status
          </h3>
          <div className="space-y-3">
            {[
              { label: "Applied",     count: candidates.filter(c => c.status === "applied").length,     color: "bg-info" },
              { label: "Interviewed", count: candidates.filter(c => c.status === "interviewed").length, color: "bg-warning" },
              { label: "Offered",     count: candidates.filter(c => c.status === "offered").length,     color: "bg-primary" },
              { label: "Onboarded",   count: candidates.filter(c => c.status === "onboarded").length,   color: "bg-success" },
              { label: "Rejected",    count: candidates.filter(c => c.status === "rejected").length,    color: "bg-destructive" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${candidates.length ? (item.count / candidates.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-medium w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass-card rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">

            {/* Add Candidate */}
            <a href="/candidates"
              className="flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/20">
              Add Candidate
            </a>

            {/* Generate Offer Letter — HR only, opens real modal */}
            {isHR ? (
              <div className="flex items-center justify-center">
                <OfferLetterModal
                  token={token}
                  companyName="Your Company Pvt. Ltd."
                />
              </div>
            ) : (
              <a href="/offer-letters"
                className="flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/20">
                Generate Offer
              </a>
            )}

            {/* Export CSV */}
            <a href="#"
              className="flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/20">
              Export CSV
            </a>

            {/* View Reports */}
            <a href="#"
              className="flex items-center justify-center rounded-lg border border-border bg-card p-3 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/20">
              View Reports
            </a>

          </div>
        </motion.div>
      </div>

      {/* ── Attendance Section (real PostgreSQL data) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
      >
        <AttendanceSection />
      </motion.div>

    </div>
  );
};

export default Dashboard;