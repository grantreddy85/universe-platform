import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  FolderKanban,
  Shield,
  Box,
  Coins,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/home/StatsCard";
import ProjectCard from "../components/home/ProjectCard";
import ActivityItem from "../components/home/ActivityItem";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 6),
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["validations"],
    queryFn: () => base44.entities.ValidationRequest.list("-created_date", 50),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 50),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-created_date", 8),
  });

  const activeValidations = validations.filter(
    (v) => v.status === "in_review" || v.status === "running"
  ).length;
  const validatedAssets = assets.filter((a) => a.status === "validated" || a.status === "tokenised").length;
  const tokenisedAssets = assets.filter((a) => a.status === "tokenised").length;

  const firstName = user?.full_name?.split(" ")[0] || "Researcher";

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Resume your research or start something new.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatsCard label="Active Projects" value={projects.length} icon={FolderKanban} accent="blue" />
        <StatsCard label="In Validation" value={activeValidations} icon={Shield} accent="amber" />
        <StatsCard label="Validated Assets" value={validatedAssets} icon={Box} accent="green" />
        <StatsCard label="Tokenised" value={tokenisedAssets} icon={Coins} accent="purple" />
      </div>

      {/* Projects + Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Continue Research
            </h2>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Start your first project</h3>
              <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                Create a project to begin structuring your research, uploading literature, and generating hypotheses.
              </p>
              <Link to={createPageUrl("Projects")}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No recent activity yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}