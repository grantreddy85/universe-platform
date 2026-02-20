import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { FlaskConical, Clock, CheckCircle, Loader, ArrowRight, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: "text-amber-500",   bg: "bg-amber-50",   border: "border-amber-100",   label: "Pending" },
  in_review:  { icon: Loader,       color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-100",    label: "In Review" },
  processing: { icon: Loader,       color: "text-purple-500",  bg: "bg-purple-50",  border: "border-purple-100",  label: "Processing" },
  completed:  { icon: CheckCircle,  color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100", label: "Completed" },
  rejected:   { icon: FlaskConical, color: "text-red-400",     bg: "bg-red-50",     border: "border-red-100",     label: "Rejected" },
};

function LabRequestCard({ req, service }) {
  const cfg = STATUS_CONFIG[req.status] || { icon: Clock, color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-100", label: req.status };
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{req.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{service?.name || "Lab Service"}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {req.request_type && (
            <span className="text-[10px] text-gray-300 capitalize">{req.request_type.replace("_", " ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabActivitySection({ labRequests, labServices }) {
  const activeCount = labRequests.filter(
    (r) => r.status === "pending" || r.status === "in_review" || r.status === "processing"
  ).length;

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <TestTube className="w-3.5 h-3.5 text-teal-600" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Lab Activity</h2>
          {activeCount > 0 && (
            <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-100 rounded-full px-2 py-0.5 font-medium">
              {activeCount} active
            </span>
          )}
        </div>
        <Link to={createPageUrl("Labs")}>
          <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900">
            View Labs <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = labRequests.filter((r) => r.status === status).length;
          if (count === 0) return null;
          const Icon = cfg.icon;
          return (
            <div key={status} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
              <Icon className={`w-3 h-3 ${cfg.color}`} strokeWidth={2} />
              <span className={`text-[11px] font-medium ${cfg.color}`}>{count} {cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {labRequests.slice(0, 6).map((req) => (
          <LabRequestCard
            key={req.id}
            req={req}
            service={labServices.find((s) => s.id === req.service_id)}
          />
        ))}
      </div>
    </section>
  );
}