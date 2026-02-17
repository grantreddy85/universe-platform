import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Coins, ArrowRight, Lock, Box, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Tokenisation() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 100),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["all-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 200),
  });

  const eligibleProjects = projects.filter(
    (p) => p.status === "validated" || p.status === "tokenised"
  );

  const tokenisedCount = assets.filter(
    (a) => a.status === "tokenised" || a.status === "published"
  ).length;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tokenisation</h1>
        <p className="text-sm text-gray-400 mt-1">
          Convert validated research into digital IP assets.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Eligible Projects
          </div>
          <p className="text-2xl font-semibold text-gray-900">{eligibleProjects.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Coins className="w-3.5 h-3.5" />
            Tokenised Assets
          </div>
          <p className="text-2xl font-semibold text-violet-600">{tokenisedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Box className="w-3.5 h-3.5" />
            Total Assets
          </div>
          <p className="text-2xl font-semibold text-gray-900">{assets.length}</p>
        </div>
      </div>

      {/* Project List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : eligibleProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No eligible projects</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Projects must pass validation before they can be tokenised. Complete the validation stage in your projects.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eligibleProjects.map((project) => {
            const projectAssets = assets.filter((a) => a.project_id === project.id);
            const tokenised = projectAssets.filter(
              (a) => a.status === "tokenised" || a.status === "published"
            );
            return (
              <Link
                key={project.id}
                to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                className="block bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{project.title}</h3>
                      <Badge variant="secondary" className="bg-violet-50 text-violet-600 text-[10px] uppercase">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{projectAssets.length} assets</span>
                      <span>{tokenised.length} tokenised</span>
                      {project.commercial_readiness != null && (
                        <span>Readiness: {project.commercial_readiness}%</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}