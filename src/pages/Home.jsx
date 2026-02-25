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
  FlaskConical } from
"lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/home/StatsCard";
import ProjectCard from "../components/home/ProjectCard";
import ActivityItem from "../components/home/ActivityItem";
import MarketplaceBar from "../components/home/MarketplaceBar";
import EcosystemBanner from "../components/home/EcosystemBanner";

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const subscriptionStatus = user?.subscription_status || "free";

  const userEmail = user?.email;

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", userEmail],
    queryFn: () => base44.entities.Project.filter({ created_by: userEmail }, "-updated_date", 6),
    enabled: !!userEmail
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["validations", userEmail],
    queryFn: () => base44.entities.ValidationRequest.filter({ created_by: userEmail }, "-created_date", 50),
    enabled: !!userEmail
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets", userEmail],
    queryFn: () => base44.entities.Asset.filter({ created_by: userEmail }, "-created_date", 50),
    enabled: !!userEmail
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", userEmail],
    queryFn: () => base44.entities.Activity.filter({ created_by: userEmail }, "-created_date", 4),
    enabled: !!userEmail
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["lab_requests_home", userEmail],
    queryFn: () => base44.entities.LabRequest.filter({ requester_email: userEmail }, "-updated_date", 10),
    enabled: !!userEmail
  });

  const { data: labServices = [] } = useQuery({
    queryKey: ["lab_services_home"],
    queryFn: () => base44.entities.LabService.list()
  });

  const activeValidations = validations.filter(
    (v) => v.status === "in_review" || v.status === "running"
  ).length;
  const validatedAssets = assets.filter((a) => a.status === "validated" || a.status === "tokenised").length;
  const tokenisedAssets = assets.filter((a) => a.status === "tokenised").length;

  const firstName = user?.full_name?.split(" ")[0] || "Researcher";

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header / Profile */}
      <div className="mb-10 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[#000021] flex items-center justify-center flex-shrink-0 text-[#00F2FF] text-xl font-semibold">
          {user?.full_name?.charAt(0)?.toUpperCase() || "R"}
        </div>
        <div>
          <h1 className="text-[#525153] text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Researcher"} · Resume your research or start something new.
          </p>
          {user?.orcid_id &&
          <a
            href={`https://orcid.org/${user.orcid_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#A6CE39] hover:underline mt-1">

              <span className="font-bold">iD</span> orcid.org/{user.orcid_id}
            </a>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatsCard label="Active Projects" value={projects.length} icon={FolderKanban} accent="blue" linkTo="Projects" />
        <StatsCard label="In Validation" value={activeValidations} icon={Shield} accent="amber" linkTo="Validations" />
        <StatsCard label="Validated Assets" value={validatedAssets} icon={Box} accent="green" linkTo="ValidatedAssets" />
        <StatsCard label="Tokenised" value={tokenisedAssets} icon={Coins} accent="purple" linkTo="Tokenisation" />
      </div>

      {/* Projects + Activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Projects + Marketplace Bar */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#525153] text-sm font-semibold uppercase tracking-wider">CONTINUE RESEARCH

              </h2>
              <Link to={createPageUrl("Projects")}>
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {projects.length === 0 ?
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-[#525153] mb-1 text-sm font-semibold">Start your first project</h3>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                  Create a project to begin structuring your research, uploading literature, and generating hypotheses.
                </p>
                <Link to={createPageUrl("Projects")}>
                  <Button size="sm" className="bg-[#000021] text-[#00f2ff] px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-8 hover:bg-blue-700">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New Project
                  </Button>
                </Link>
              </div> :

            <div className="grid sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project) =>
              <ProjectCard key={project.id} project={project} />
              )}
              </div>
            }
          </div>

          {/* Marketplace Bar - below project cards, same width */}
          <MarketplaceBar />
        </div>

        {/* Right: Activity */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div>
            <h2 className="text-[#525153] mb-5 text-sm font-semibold uppercase tracking-wider">RECENT ACTIVITY

            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              {activities.length === 0 ?
              <p className="text-xs text-gray-400 text-center py-8">
                  No recent activity yet.
                </p> :

              <div className="divide-y divide-gray-50">
                  {activities.map((activity) =>
                <ActivityItem key={activity.id} activity={activity} />
                )}
                </div>
              }
            </div>
          </div>

          {/* Lab Activity */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6994076dc777dd78309c97c9/c5397ab22_UniVerseLabs-Logo-01300x.png" alt="UniVerse Labs" className="h-9 object-contain" />
              <Link to={createPageUrl("Labs")}>
                <Button variant="ghost" size="sm" className="text-[#525153] px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-8 hover:text-gray-900">
                  View Labs <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              {labRequests.length === 0 ?
              <p className="text-xs text-gray-400 text-center py-8">No lab requests yet.</p> :

              <div className="divide-y divide-gray-50">
                  {labRequests.slice(0, 5).map((req) => {
                  const service = labServices.find((s) => s.id === req.service_id);
                  const STATUS_CONFIG = {
                    pending: { color: "bg-amber-100 text-amber-600", label: "Pending" },
                    in_review: { color: "bg-blue-100 text-blue-600", label: "In Review" },
                    processing: { color: "bg-purple-100 text-purple-600", label: "Processing" },
                    completed: { color: "bg-emerald-100 text-emerald-600", label: "Completed" },
                    rejected: { color: "bg-red-100 text-red-500", label: "Rejected" }
                  };
                  const sc = STATUS_CONFIG[req.status] || { color: "bg-gray-100 text-gray-500", label: req.status };
                  return (
                    <div key={req.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FlaskConical className="w-4 h-4 text-teal-600" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{req.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{service?.name || "Lab Service"}</p>
                          <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                      </div>);

                })}
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Banner */}
      <div className="mt-8">
        <EcosystemBanner projects={projects} subscriptionStatus={subscriptionStatus} />
      </div>
    </div>);

}