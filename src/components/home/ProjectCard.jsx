import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Globe, Lock } from "lucide-react";
import { format } from "date-fns";

const FIELD_IMAGES = {
  biology:       "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80",
  chemistry:     "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&q=80",
  hydrazone:     "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&q=80",
  synthesis:     "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&q=80",
  genomics:      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
  crispr:        "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&q=80",
  gene:          "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&q=80",
  dna:           "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&q=80",
  neuroscience:  "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80",
  physics:       "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
  immunology:    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80",
  oncology:      "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=600&q=80",
  default:       "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80",
};

function getFieldImage(field, title = "") {
  const text = `${field || ""} ${title || ""}`.toLowerCase();
  const key = Object.keys(FIELD_IMAGES).find(k => text.includes(k));
  return key ? FIELD_IMAGES[key] : FIELD_IMAGES.default;
}

export default function ProjectCard({ project }) {
  return (
    <Link
      to={createPageUrl(`ProjectDetail?id=${project.id}`)}
      className="group block bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden">

      {/* Cover image */}
      <div className="h-28 overflow-hidden bg-gray-100">
        <img
          src={getFieldImage(project.field, project.title)}
          alt={project.title}
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
       <div className="flex items-start justify-between mb-3">
         <Badge
           variant="secondary"
           className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5`}
           style={{
             backgroundColor: `var(--color-status-${project.status || 'draft'}-bg)`,
             color: `var(--color-status-${project.status || 'draft'}-text)`
           }}>

          {project.status || "draft"}
        </Badge>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="mb-1 text-sm font-semibold line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>{project.title}</h3>
      <p className="text-xs line-clamp-2 mb-4 min-h-[32px]" style={{ color: 'var(--color-neutral-400)' }}>
        {project.description || "No description yet"}
      </p>
      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-neutral-400)' }}>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {project.updated_date ?
          format(new Date(project.updated_date), "MMM d") :
          "Recently"}
        </div>
        {project.field &&
        <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' }}>{project.field}</span>
        }
        <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium`}
        style={{
          backgroundColor: project.visibility_setting === "private" ? 'var(--color-neutral-100)' : 'var(--color-status-active-bg)',
          color: project.visibility_setting === "private" ? 'var(--color-neutral-500)' : 'var(--color-interactive-blue)'
        }}>
          {project.visibility_setting === "private" ?
          <><Lock className="w-2.5 h-2.5" /> Private</> :
          <><Globe className="w-2.5 h-2.5" /> Shared</>
          }
        </span>
        </div>
      </div>
    </Link>
  );
}