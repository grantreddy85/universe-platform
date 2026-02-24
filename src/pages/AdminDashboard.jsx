import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Shield, Clock, PlayCircle, CheckCircle, XCircle,
  ChevronRight, AlertCircle, BarChart2, Users, FlaskConical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusConfig = {
  pending:   { icon: Clock,        color: "bg-gray-100 text-gray-600",   label: "Pending" },
  in_review: { icon: Shield,       color: "bg-blue-100 text-blue-600",   label: "In Review" },
  running:   { icon: PlayCircle,   color: "bg-amber-100 text-amber-600", label: "Running" },
  approved:  { icon: CheckCircle,  color: "bg-green-100 text-green-600", label: "Approved" },
  rejected:  { icon: XCircle,     color: "bg-red-100 text-red-600",     label: "Rejected" },
};

const STATUS_FILTERS = ["all", "pending", "in_review", "running", "approved", "rejected"];

export default function AdminDashboard() {
  const [user, setUser] = React.useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: validations = [], isLoading } = useQuery({
    queryKey: ["admin-validations"],
    queryFn: () => base44.entities.ValidationRequest.list("-created_date", 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 200),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ValidationRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-validations"] }),
  });

  const getProject = (projectId) => projects.find((p) => p.id === projectId);

  const filtered = statusFilter === "all"
    ? validations
    : validations.filter((v) => v.status === statusFilter);

  // Stats
  const stats = {
    total: validations.length,
    pending: validations.filter((v) => v.status === "pending").length,
    inReview: validations.filter((v) => v.status === "in_review").length,
    approved: validations.filter((v) => v.status === "approved").length,
  };

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Platform Admin</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and review all validation requests across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Requests", value: stats.total, icon: BarChart2, color: "text-gray-600 bg-gray-100" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "In Review", value: stats.inReview, icon: Shield, color: "text-blue-600 bg-blue-50" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600 bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              statusFilter === f
                ? "bg-[#000021] text-[#00F2FF]"
                : "bg-white border border-gray-100 text-gray-500 hover:border-gray-300"
            }`}
          >
            {f === "all" ? "All" : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Validations list */}
      {isLoading ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">Loading validations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No validation requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const config = statusConfig[v.status] || statusConfig.pending;
            const Icon = config.icon;
            const project = getProject(v.project_id);

            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + status */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{v.title}</h3>
                      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-gray-400 mb-3">
                      Project: <span className="text-gray-600 font-medium">{project?.title || "Unknown"}</span>
                      {" · "}
                      By: <span className="text-gray-600 font-medium">{v.created_by}</span>
                      {" · "}
                      Type: <span className="text-gray-600 font-medium capitalize">{v.type?.replace("_", " ")}</span>
                    </p>

                    {/* Scores */}
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      {v.reproducibility_score !== undefined && (
                        <span className="text-gray-500">Reproducibility: <span className="text-gray-900 font-medium">{v.reproducibility_score}%</span></span>
                      )}
                      {v.confidence_index !== undefined && (
                        <span className="text-gray-500">Confidence: <span className="text-gray-900 font-medium">{v.confidence_index}%</span></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {v.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => updateMutation.mutate({ id: v.id, status: "in_review" })}
                      >
                        Start Review
                      </Button>
                    )}
                    {v.status === "in_review" && (
                      <>
                        <Button
                          size="sm"
                          className="text-xs h-7 bg-green-600 hover:bg-green-700"
                          onClick={() => updateMutation.mutate({ id: v.id, status: "approved" })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => updateMutation.mutate({ id: v.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Link
                      to={createPageUrl("ProjectDetail") + `?id=${v.project_id}`}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      View Project <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}