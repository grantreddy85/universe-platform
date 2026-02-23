import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Globe, Lock } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-blue-50 text-blue-600",
  validation: "bg-amber-50 text-amber-600",
  validated: "bg-emerald-50 text-emerald-600",
  tokenised: "bg-violet-50 text-violet-600"
};

export default function ProjectCard({ project }) {
  return (
    <Link
      to={createPageUrl(`ProjectDetail?id=${project.id}`)}
      className="group block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">

      <div className="flex items-start justify-between mb-3">
        <Badge
          variant="secondary"
          className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 ${
          statusStyles[project.status] || statusStyles.draft}`
          }>

          {project.status || "draft"}
        </Badge>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-[#525153] mb-1 text-sm font-semibold line-clamp-1">{project.title}</h3>
      <p className="text-xs text-gray-400 line-clamp-2 mb-4 min-h-[32px]">
        {project.description || "No description yet"}
      </p>
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {project.updated_date ?
          format(new Date(project.updated_date), "MMM d") :
          "Recently"}
        </div>
        {project.field &&
        <span className="bg-gray-50 px-2 py-0.5 rounded text-gray-500">{project.field}</span>
        }
        <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        project.visibility_setting === "private" ?
        "bg-gray-100 text-gray-500" :
        "bg-blue-50 text-blue-500"}`
        }>
          {project.visibility_setting === "private" ?
          <><Lock className="w-2.5 h-2.5" /> Private</> :
          <><Globe className="w-2.5 h-2.5" /> Shared</>
          }
        </span>
      </div>
    </Link>);

}