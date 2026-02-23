import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Shield, Clock, PlayCircle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending: { icon: Clock, color: "bg-gray-100 text-gray-600", label: "Pending" },
  in_review: { icon: Shield, color: "bg-blue-100 text-blue-600", label: "In Review" },
  running: { icon: PlayCircle, color: "bg-amber-100 text-amber-600", label: "Running" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-600", label: "Rejected" },
};

export default function Validations() {
  const [userEmail, setUserEmail] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then((u) => setUserEmail(u.email)).catch(() => {}); }, []);

  const { data: validations = [], isLoading } = useQuery({
    queryKey: ["validations", userEmail],
    queryFn: () => base44.entities.ValidationRequest.filter({ created_by: userEmail }, "-created_date"),
    enabled: !!userEmail,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", userEmail],
    queryFn: () => base44.entities.Project.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const getProjectTitle = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title || "Unknown Project";
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Validations
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Track validation requests across all projects
        </p>
      </div>

      {/* Validations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">Loading validations...</p>
        </div>
      ) : validations.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No validations yet</h3>
          <p className="text-xs text-gray-400">
            Validation requests will appear here when you submit them from your projects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {validations.map((validation) => {
            const config = statusConfig[validation.status] || statusConfig.pending;
            const Icon = config.icon;

            return (
              <div
                key={validation.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {validation.title}
                      </h3>
                      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Project: {getProjectTitle(validation.project_id)}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">
                        Type: <span className="text-gray-900 font-medium">{validation.type}</span>
                      </span>
                      {validation.reproducibility_score !== undefined && (
                        <span className="text-gray-500">
                          Reproducibility: <span className="text-gray-900 font-medium">{validation.reproducibility_score}%</span>
                        </span>
                      )}
                      {validation.confidence_index !== undefined && (
                        <span className="text-gray-500">
                          Confidence: <span className="text-gray-900 font-medium">{validation.confidence_index}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={createPageUrl("ProjectDetail") + `?id=${validation.project_id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}