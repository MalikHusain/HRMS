import { candidates, statusConfig } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const OfferLetters = () => {
  const eligibleCandidates = candidates.filter((c) =>
    ["offered", "onboarded"].includes(c.status)
  );

  const handleGenerate = (name) => {
    toast.success(`Offer letter generated for ${name}`);
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <h1 className="page-title">Offer Letters</h1>
        <p className="page-description">Generate and manage offer letter PDFs for candidates.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {eligibleCandidates.map((candidate, i) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="glass-card-hover rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {candidate.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.position}</p>
                </div>
              </div>
              <StatusBadge status={candidate.status} />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>{candidate.department}</span>
              <span>·</span>
              <span>
                Applied{" "}
                {new Date(candidate.appliedDate).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => handleGenerate(candidate.name)}
              >
                <FileText className="h-3.5 w-3.5" />
                Generate PDF
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {eligibleCandidates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No candidates eligible for offer letters yet.</p>
          <p className="text-xs">Candidates must have "Offered" or "Onboarded" status.</p>
        </div>
      )}
    </div>
  );
};

export default OfferLetters;
