import React from "react";
import clsx from "clsx";

const statusMap: Record<string, string> = {
  draft:        "badge-info",
  submitted:    "badge-info",
  under_review: "badge-warning",
  shortlisted:  "badge-purple",
  rejected:     "badge-danger",
  enrolled:     "badge-success",
  applied:      "badge-info",
  pending:      "badge-warning",
  success:      "badge-success",
  failed:       "badge-danger",
  refunded:     "badge-warning",
  active:       "badge-success",
  inactive:     "badge-danger",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = statusMap[status?.toLowerCase()] || "badge-info";
  return (
    <span className={cls}>
      {status?.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}