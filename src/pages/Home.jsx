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
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/home/StatsCard";
import ProjectCard from "../components/home/ProjectCard";
import ActivityItem from "../components/home/ActivityItem";
import LabActivitySection from "../components/home/LabActivitySection";

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
    queryFn: () => base44.entities.Activity.list("-created_date", 4),
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["lab_requests_home"],
    queryFn: () => base44.entities.LabRequest.list("-updated_date", 10),
  });

  const { data: labServices = [] } = useQuery({
    queryKey: ["lab_services_home"],
    queryFn: () => base44.entities.LabService.list(),
  });

  // Mock marketplace feed data (placeholder until Marketplace is implemented)
  const marketplaceFeed = [
    {
      id: 1,
      projectTitle: "Neural Pathway Mapping in C. elegans",
      amount: "$2.5M",
      investors: 12,
      date: "2026-02-15",
      category: "Neuroscience",
    },
    {
      id: 2,
      projectTitle: "CRISPR-Based Gene Therapy for Rare Diseases",
      amount: "$4.8M",
      investors: 23,
      date: "2026-02-14",
      category: "Gene Therapy",
    },
    {
      id: 3,
      projectTitle: "Microbiome Analysis for Personalized Medicine",
      amount: "$1.9M",
      investors: 8,
      date: "2026-02-13",
      category: "Precision Health",
    },
  ];

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
        <StatsCard label="Active Projects" value={projects.length} icon={FolderKanban} accent="blue" linkTo="Projects" />
        <StatsCard label="In Validation" value={activeValidations} icon={Shield} accent="amber" linkTo="Validations" />
        <StatsCard label="Validated Assets" value={validatedAssets} icon={Box} accent="green" linkTo="ValidatedAssets" />
        <StatsCard label="Tokenised" value={tokenisedAssets} icon={Coins} accent="purple" linkTo="Tokenisation" />
      </div>

      {/* Lab Activity */}
      {labRequests.length > 0 && (
        <LabActivitySection labRequests={labRequests} labServices={labServices} />
      )}

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
        <div className="space-y-6">
          {/* Recent Activity */}
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

          {/* Marketplace Feed */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5">
              Marketplace Highlights
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              {marketplaceFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-green-600" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-1">
                      {item.projectTitle}
                    </h4>
                    <p className="text-[11px] text-gray-400 mb-2">{item.category}</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="font-semibold text-green-600">{item.amount}</span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3 h-3" />
                        {item.investors} investors
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-gray-300 text-center pt-2 italic">
                Coming Soon: Live marketplace feed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}