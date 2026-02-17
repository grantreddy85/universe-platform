import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Coins, Lock, Users, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function TokenisationTab({ project }) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["project-assets-token", project.id],
    queryFn: () => base44.entities.Asset.filter({ project_id: project.id }, "-created_date", 100),
  });

  const validatedAssets = assets.filter(
    (a) => a.status === "validated" || a.status === "tokenised" || a.status === "published"
  );
  const tokenisedAssets = assets.filter((a) => a.status === "tokenised" || a.status === "published");

  const isEligible =
    project.status === "validated" || project.status === "tokenised";

  if (!isEligible) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Tokenisation Locked</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Complete validation to unlock tokenisation. Your project needs to reach the "Validated" stage before assets can be tokenised.
          </p>
          <div className="mt-6">
            <p className="text-[11px] text-gray-400 mb-2">Project Stage</p>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] uppercase">
              {project.status || "draft"}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Tokenisation
        </h2>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Validated Assets</p>
          <p className="text-2xl font-semibold text-gray-900">{validatedAssets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Tokenised</p>
          <p className="text-2xl font-semibold text-violet-600">{tokenisedAssets.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Commercial Readiness</p>
          <Progress value={project.commercial_readiness || 0} className="h-1.5 mt-2" />
          <p className="text-xs text-gray-600 mt-1">{project.commercial_readiness || 0}%</p>
        </div>
      </div>

      {/* Asset List */}
      <div className="space-y-3">
        {validatedAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white rounded-lg border border-gray-100 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{asset.title}</h3>
                <p className="text-xs text-gray-400 capitalize mt-0.5">
                  {asset.type?.replace(/_/g, " ")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] uppercase ${
                  asset.status === "tokenised"
                    ? "bg-violet-50 text-violet-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {asset.status}
              </Badge>
            </div>

            {asset.attribution?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Attribution
                </p>
                <div className="space-y-1">
                  {asset.attribution.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{a.contributor}</span>
                      <span className="text-gray-400">{a.share_percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}