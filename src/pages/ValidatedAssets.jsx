import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Box, CheckCircle, Coins, ArrowLeft, FileText, Database, Workflow, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeConfig = {
  hypothesis: { icon: FileText, color: "bg-purple-100 text-purple-600" },
  cohort: { icon: Database, color: "bg-blue-100 text-blue-600" },
  dataset: { icon: Database, color: "bg-cyan-100 text-cyan-600" },
  workflow_result: { icon: Workflow, color: "bg-amber-100 text-amber-600" },
  validation_report: { icon: CheckCircle, color: "bg-green-100 text-green-600" },
  publication: { icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
};

const statusConfig = {
  validated: { icon: CheckCircle, color: "bg-green-100 text-green-600", label: "Validated" },
  tokenised: { icon: Coins, color: "bg-purple-100 text-purple-600", label: "Tokenised" },
};

export default function ValidatedAssets() {
  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => { base44.auth.me().then((u) => setUserEmail(u.email)).catch(() => {}); }, []);

  const { data: allAssets = [], isLoading } = useQuery({
    queryKey: ["assets", userEmail],
    queryFn: () => base44.entities.Asset.filter({ created_by: userEmail }, "-created_date"),
    enabled: !!userEmail,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", userEmail],
    queryFn: () => base44.entities.Project.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const validatedAssets = allAssets.filter(
    (a) => a.status === "validated" || a.status === "tokenised"
  );

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
          Validated Assets
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Browse validated and tokenised research assets
        </p>
      </div>

      {/* Assets List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">Loading assets...</p>
        </div>
      ) : validatedAssets.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Box className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No validated assets yet</h3>
          <p className="text-xs text-gray-400">
            Assets will appear here once they've been validated in your projects.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validatedAssets.map((asset) => {
            const typeConf = typeConfig[asset.type] || typeConfig.hypothesis;
            const statusConf = statusConfig[asset.status] || statusConfig.validated;
            const TypeIcon = typeConf.icon;
            const StatusIcon = statusConf.icon;

            return (
              <div
                key={asset.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-all hover:shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${typeConf.color} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                      {asset.title}
                    </h3>
                    <Badge className={`${statusConf.color} text-xs flex items-center gap-1 w-fit`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConf.label}
                    </Badge>
                  </div>
                </div>
                
                {asset.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-2">
                    {getProjectTitle(asset.project_id)}
                  </p>
                  {asset.attribution && asset.attribution.length > 0 && (
                    <p className="text-xs text-gray-400 mb-3">
                      {asset.attribution.length} contributor{asset.attribution.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  <Link
                    to={createPageUrl("ProjectDetail") + `?id=${asset.project_id}`}
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