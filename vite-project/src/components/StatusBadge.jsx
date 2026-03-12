import { statusConfig } from "@/data/mockData";

export function StatusBadge({ status }) {
  const config = statusConfig[status];
  return (
    <span className={`status-badge ${config.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
