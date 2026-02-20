import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Clock, CheckCircle, AlertCircle, Loader2, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const statusConfig = {
  pending:    { label: "Pending",    color: "bg-gray-100 text-gray-600",   icon: Clock },
  in_review:  { label: "In Review",  color: "bg-blue-100 text-blue-600",   icon: Loader2 },
  processing: { label: "Processing", color: "bg-amber-100 text-amber-600", icon: Loader2 },
  completed:  { label: "Completed",  color: "bg-emerald-100 text-emerald-600", icon: CheckCircle },
  rejected:   { label: "Rejected",   color: "bg-red-100 text-red-600",     icon: AlertCircle },
};

export default function LabsTab({ project }) {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["lab-requests-project", project?.id],
    queryFn: () => base44.entities.LabRequest.filter({ project_id: project.id }, "-created_date", 50),
    enabled: !!project?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["lab-services"],
    queryFn: () => base44.entities.LabService.list(),
    enabled: requests.length > 0,
  });

  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-7 h-7 text-teal-500" strokeWidth={1.6} />
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-2">No Lab Requests Yet</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            Submit a request from the Labs page to link lab experiments to this project.
          </p>
          <Link to={createPageUrl("Labs")}>
            <Button size="sm" variant="outline">
              <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
              Go to Labs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">Lab Requests</h2>
        <Link to={createPageUrl("Labs")}>
          <Button size="sm" variant="outline" className="text-xs h-7 px-3">
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Browse Labs
          </Button>
        </Link>
      </div>

      {requests.map((req) => {
        const service = serviceMap[req.service_id];
        const sc = statusConfig[req.status] || statusConfig.pending;
        const StatusIcon = sc.icon;

        return (
          <div key={req.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{req.title}</p>
                {service && (
                  <p className="text-xs text-gray-400 mt-0.5">{service.name}</p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.color}`}>
                <StatusIcon className={`w-2.5 h-2.5 ${req.status === "processing" || req.status === "in_review" ? "animate-spin" : ""}`} />
                {sc.label}
              </span>
            </div>

            {/* Description */}
            {req.description && (
              <p className="text-xs text-gray-500 leading-relaxed">{req.description}</p>
            )}

            {/* Results */}
            {req.status === "completed" && (
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Results</p>
                {req.results_summary && (
                  <p className="text-xs text-gray-600 leading-relaxed bg-emerald-50 rounded-lg p-3">{req.results_summary}</p>
                )}
                {req.results_file_url && (
                  <a
                    href={req.results_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download results file
                  </a>
                )}
              </div>
            )}

            {/* Operator notes if rejected */}
            {req.status === "rejected" && req.operator_notes && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3">{req.operator_notes}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span>{req.request_type === "data_upload" ? "Data Upload" : "Sample Submission"}</span>
              {req.created_date && (
                <span>{new Date(req.created_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}