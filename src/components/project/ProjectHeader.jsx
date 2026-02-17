import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-blue-50 text-blue-600",
  validation: "bg-amber-50 text-amber-600",
  validated: "bg-emerald-50 text-emerald-600",
  tokenised: "bg-violet-50 text-violet-600",
};

export default function ProjectHeader({ project }) {
  return (
    <div className="border-b border-gray-100 bg-white px-6 lg:px-10 py-5">
      <Link
        to={createPageUrl("Projects")}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-3"
      >
        <ChevronLeft className="w-3 h-3" />
        Projects
      </Link>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {project.title}
            </h1>
            <Badge
              variant="secondary"
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 ${
                statusStyles[project.status] || statusStyles.draft
              }`}
            >
              {project.status || "draft"}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">{project.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}