import React from "react";
import { format } from "date-fns";
import {
  FileText,
  Lightbulb,
  FlaskConical,
  GitBranch,
  Shield,
  Box,
  FolderKanban
} from "lucide-react";

const typeIcons = {
  project: FolderKanban,
  document: FileText,
  hypothesis: Lightbulb,
  cohort: FlaskConical,
  workflow: GitBranch,
  validation: Shield,
  asset: Box,
  tokenisation: Box,
};

export default function ActivityItem({ activity }) {
  const Icon = typeIcons[activity.entity_type] || FileText;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{activity.action}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {activity.created_date
            ? format(new Date(activity.created_date), "MMM d, h:mm a")
            : ""}
        </p>
      </div>
    </div>
  );
}