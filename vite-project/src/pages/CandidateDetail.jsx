import { useParams, useNavigate } from "react-router-dom";
import { candidates, statusConfig } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Download,
  Upload,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusFlow = ["applied", "interviewed", "offered", "onboarded"];

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Candidate not found</p>
          <Button variant="outline" onClick={() => navigate("/candidates")}>
            Back to Candidates
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusFlow.indexOf(candidate.status);

  const handleStatusChange = (newStatus) => {
    toast.success(`Status updated to ${statusConfig[newStatus].label}`);
  };

  return (
    <div className="page-container max-w-4xl">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/candidates")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Candidates
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">
              {candidate.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl font-bold">{candidate.name}</h1>
              <StatusBadge status={candidate.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{candidate.position} · {candidate.department}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: "Email", value: candidate.email },
            { icon: Phone, label: "Phone", value: candidate.phone },
            { icon: Briefcase, label: "Position", value: candidate.position },
            { icon: Building2, label: "Department", value: candidate.department },
            {
              icon: Calendar,
              label: "Applied Date",
              value: new Date(candidate.appliedDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Candidate Pipeline</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statusFlow.map((status, i) => {
              const isCompleted = currentStepIndex >= i;
              const isCurrent = candidate.status === status;
              return (
                <div key={status} className="flex items-center">
                  <button
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {statusConfig[status].label}
                  </button>
                  {i < statusFlow.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
            <div className="ml-2">
              <button
                onClick={() => handleStatusChange("rejected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  candidate.status === "rejected"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Documents ({candidate.documents.length})</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
          </div>
          <div className="space-y-2">
            {candidate.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CandidateDetail;
