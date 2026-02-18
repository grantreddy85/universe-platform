import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Sparkles, Send, TrendingUp, Globe, Users, DollarSign,
  CheckCircle2, Clock, FlaskConical, Lightbulb, Database, BarChart3,
  FileText, ShieldCheck, BookOpen, ExternalLink, Star, Image
} from "lucide-react";
import InfographicModal from "@/components/project/tabs/InfographicModal";

const typeIcons = {
  hypothesis: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
  cohort: { icon: FlaskConical, color: "text-teal-500", bg: "bg-teal-50" },
  dataset: { icon: Database, color: "text-blue-500", bg: "bg-blue-50" },
  workflow_result: { icon: BarChart3, color: "text-purple-500", bg: "bg-purple-50" },
  validation_report: { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
  publication: { icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50" },
};

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  validated: "bg-emerald-50 text-emerald-700",
  tokenised: "bg-violet-50 text-violet-700",
  published: "bg-blue-50 text-blue-700",
};

// Simulated marketplace earnings data
const mockEarnings = [
  { month: "Nov 2025", amount: 0 },
  { month: "Dec 2025", amount: 120 },
  { month: "Jan 2026", amount: 340 },
  { month: "Feb 2026", amount: 210 },
];

const mockLicenses = [
  { org: "BioMed Research Ltd", type: "Non-exclusive", since: "Dec 2025", status: "active" },
  { org: "PharmaCo Inc", type: "Evaluation", since: "Jan 2026", status: "active" },
];

const mockLinkedProjects = [
  { name: "Global Oncology Meta-Study", role: "Contributing Dataset", status: "active" },
];

export default function AssetDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const assetId = params.get("id");
  const projectId = params.get("project_id");

  const [marketplaceSubmitted, setMarketplaceSubmitted] = useState(false);
  const [showInfographic, setShowInfographic] = useState(false);

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => base44.entities.Asset.filter({ id: assetId }),
    enabled: !!assetId,
    select: (data) => data[0],
  });

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    enabled: !!projectId,
    select: (data) => data[0],
  });

  // Fetch all related research components from the project
  const { data: hypotheses = [] } = useQuery({
    queryKey: ["hypotheses", projectId],
    queryFn: () => base44.entities.Hypothesis.filter({ project_id: projectId }, "-created_date", 50),
    enabled: !!projectId,
  });
  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts", projectId],
    queryFn: () => base44.entities.Cohort.filter({ project_id: projectId }, "-created_date", 50),
    enabled: !!projectId,
  });
  const { data: workflows = [] } = useQuery({
    queryKey: ["workflows", projectId],
    queryFn: () => base44.entities.Workflow.filter({ project_id: projectId }, "-created_date", 50),
    enabled: !!projectId,
  });
  const { data: validations = [] } = useQuery({
    queryKey: ["validations", projectId],
    queryFn: () => base44.entities.ValidationRequest.filter({ project_id: projectId }, "-created_date", 50),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.update(assetId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset", assetId] }),
  });

  const handleSendToMarketplace = () => {
    updateMutation.mutate({ status: "published", "tokenisation.published_to_marketplace": true });
    setMarketplaceSubmitted(true);
  };

  if (assetLoading || !asset) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-gray-400 text-sm">Loading asset...</div>
      </div>
    );
  }

  const typeConfig = typeIcons[asset.type] || typeIcons.publication;
  const TypeIcon = typeConfig.icon;
  const isOnMarketplace = asset.status === "published" || marketplaceSubmitted;
  const totalEarnings = mockEarnings.reduce((s, m) => s + m.amount, 0);

  const components = [
    ...hypotheses.map(h => ({ ...h, _kind: "hypothesis", label: "Hypothesis" })),
    ...cohorts.map(c => ({ ...c, _kind: "cohort", label: "Cohort" })),
    ...workflows.map(w => ({ ...w, _kind: "workflow_result", label: "Workflow" })),
    ...validations.map(v => ({ ...v, _kind: "validation_report", label: "Validation" })),
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.bg}`}>
                <TypeIcon className={`w-6 h-6 ${typeConfig.color}`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{asset.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 capitalize">{asset.type?.replace(/_/g, " ")}</span>
                  <span className="text-gray-200">·</span>
                  <Badge className={`text-[10px] uppercase ${statusStyles[asset.status] || statusStyles.draft}`}>
                    {asset.status || "draft"}
                  </Badge>
                  {isOnMarketplace && (
                    <Badge className="text-[10px] bg-blue-600 text-white">
                      <Globe className="w-2.5 h-2.5 mr-1" />
                      On Marketplace
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isOnMarketplace && asset.status === "validated" && (
              <Button
                onClick={handleSendToMarketplace}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to IP Marketplace
              </Button>
            )}
          </div>
          {asset.description && (
            <p className="text-sm text-gray-500 mt-4 max-w-2xl">{asset.description}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-3 gap-6">
        {/* Left: Research Lineage */}
        <div className="col-span-2 space-y-6">

          {/* Research Components */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Research Lineage</h2>
            <p className="text-xs text-gray-400 mb-5">All research components from this project that underpin this asset.</p>
            {components.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-8">No components found in this project yet.</p>
            ) : (
              <div className="space-y-2">
                {components.map((comp) => {
                  const cfg = typeIcons[comp._kind] || typeIcons.publication;
                  const Ico = cfg.icon;
                  return (
                    <div key={comp.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        <Ico className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{comp.title}</p>
                        <p className="text-[10px] text-gray-400">{comp.label}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                        {comp.status || "draft"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attribution */}
          {asset.attribution?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Attribution</h2>
              <div className="space-y-2">
                {asset.attribution.map((attr, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{attr.contributor}</p>
                      <p className="text-[10px] text-gray-400">{attr.role}</p>
                    </div>
                    {attr.share_percentage && (
                      <span className="text-xs font-semibold text-gray-600">{attr.share_percentage}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IP Marketplace Activity */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">IP Marketplace Activity</h2>
              {isOnMarketplace && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Live
                </span>
              )}
            </div>

            {!isOnMarketplace ? (
              <div className="text-center py-10">
                <Globe className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">This asset hasn't been listed on the marketplace yet.</p>
                {asset.status === "validated" && (
                  <Button
                    onClick={handleSendToMarketplace}
                    size="sm"
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send to IP Marketplace
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Earnings Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-semibold">Total Earned</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">${totalEarnings}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-semibold">Licensees</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{mockLicenses.length}</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-4">
                    <div className="flex items-center gap-1.5 text-violet-600 mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-semibold">This Month</span>
                    </div>
                    <p className="text-xl font-bold text-violet-700">${mockEarnings[mockEarnings.length - 1].amount}</p>
                  </div>
                </div>

                {/* Monthly earnings bar chart */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-3">Monthly Earnings (USD)</p>
                  <div className="flex items-end gap-3 h-20">
                    {mockEarnings.map((m) => {
                      const maxVal = Math.max(...mockEarnings.map(x => x.amount), 1);
                      const pct = (m.amount / maxVal) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-500">${m.amount}</span>
                          <div
                            className="w-full bg-blue-500 rounded-t-sm transition-all"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                          <span className="text-[9px] text-gray-400 truncate w-full text-center">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Licenses */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-3">Active Licenses</p>
                  <div className="space-y-2">
                    {mockLicenses.map((lic, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{lic.org}</p>
                          <p className="text-[10px] text-gray-400">{lic.type} · Since {lic.since}</p>
                        </div>
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-700">{lic.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Part of Larger Projects */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Part of Larger Projects</h2>
            {isOnMarketplace ? (
              <div className="space-y-2">
                {mockLinkedProjects.map((lp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{lp.name}</p>
                      <p className="text-[10px] text-gray-400">{lp.role}</p>
                    </div>
                    <Badge className="text-[10px] bg-blue-50 text-blue-600">{lp.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 text-center py-8">Not yet part of any external projects.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Project</span>
                <span className="font-medium text-gray-700 truncate max-w-[120px]">{project?.title || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Components</span>
                <span className="font-medium text-gray-700">{components.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Contributors</span>
                <span className="font-medium text-gray-700">{asset.attribution?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Marketplace</span>
                <span className={`font-medium ${isOnMarketplace ? "text-emerald-600" : "text-gray-400"}`}>
                  {isOnMarketplace ? "Listed" : "Not listed"}
                </span>
              </div>
            </div>
          </div>

          {/* Component breakdown mini pills */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Composition</h3>
            <div className="space-y-2">
              {[
                { label: "Hypotheses", count: hypotheses.length, cfg: typeIcons.hypothesis },
                { label: "Cohorts", count: cohorts.length, cfg: typeIcons.cohort },
                { label: "Workflows", count: workflows.length, cfg: typeIcons.workflow_result },
                { label: "Validations", count: validations.length, cfg: typeIcons.validation_report },
              ].map(({ label, count, cfg }) => {
                const I = cfg.icon;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg}`}>
                      <I className={`w-3 h-3 ${cfg.color}`} />
                    </div>
                    <span className="text-xs text-gray-600 flex-1">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Actions</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-start"
              onClick={() => navigate(createPageUrl("ProjectDetail") + `?id=${projectId}&tab=assets`)}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Back to Project Assets
            </Button>
            {(asset.type === "publication" || asset.type === "validation_report") && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs justify-start"
                onClick={() => setShowInfographic(true)}
              >
                <Image className="w-3.5 h-3.5 mr-2" />
                Generate Infographic
              </Button>
            )}
            {!isOnMarketplace && asset.status === "validated" && (
              <Button
                size="sm"
                className="w-full text-xs justify-start bg-blue-600 hover:bg-blue-700"
                onClick={handleSendToMarketplace}
              >
                <Globe className="w-3.5 h-3.5 mr-2" />
                List on IP Marketplace
              </Button>
            )}
            {isOnMarketplace && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs justify-start text-blue-600 border-blue-200"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                View on Marketplace
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}