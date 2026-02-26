import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ContributionHealth({ userEmail }) {
  const { data: subscription } = useQuery({
    queryKey: ["subscription", userEmail],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    select: (d) => d[0],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets_health", userEmail],
    queryFn: () => base44.entities.Asset.filter({ created_by: userEmail }, "-updated_date", 50),
    enabled: !!userEmail,
  });

  if (!subscription || subscription.plan !== "contributor") return null;

  const score = subscription.data_contribution_score || 0;
  const lastUpload = subscription.last_upload_date;
  const validatedAssets = assets.filter((a) => a.status === "validated" || a.status === "tokenised");

  // Days since last upload
  const daysSinceUpload = lastUpload
    ? Math.floor((Date.now() - new Date(lastUpload).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const uploadWarning = daysSinceUpload === null || daysSinceUpload > 25;
  const validationWarning = validatedAssets.length === 0;
  const isHealthy = !uploadWarning && !validationWarning;

  const progressPct = Math.min(100, (score / 30) * 100);

  return (
    <div className={`rounded-xl border p-4 mb-6 ${isHealthy ? "border-emerald-100 bg-emerald-50/40" : "border-amber-100 bg-amber-50/40"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${isHealthy ? "text-emerald-500" : "text-amber-500"}`} />
          <span className="text-xs font-semibold text-gray-700">Contribution Health</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isHealthy ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-600"}`}>
            {isHealthy ? "Active" : "Needs Attention"}
          </span>
        </div>
        <Link to={createPageUrl("Pricing")} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
          View Plan
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Score */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1">Contribution Score</p>
          <p className="text-lg font-bold text-gray-800">{score}</p>
          <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
            <div
              className={`h-1 rounded-full transition-all ${progressPct >= 100 ? "bg-emerald-400" : "bg-amber-400"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-1">{score}/30 for free tier</p>
        </div>

        {/* Upload status */}
        <div className={`bg-white rounded-lg p-3 border ${uploadWarning ? "border-amber-200" : "border-gray-100"}`}>
          <p className="text-[10px] text-gray-400 mb-1">Last Upload</p>
          {daysSinceUpload === null ? (
            <p className="text-xs font-semibold text-amber-500">No uploads yet</p>
          ) : (
            <p className={`text-xs font-semibold ${daysSinceUpload > 25 ? "text-amber-500" : "text-gray-700"}`}>
              {daysSinceUpload}d ago
            </p>
          )}
          {uploadWarning ? (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <p className="text-[9px] text-amber-500">Upload due in {lastUpload ? 30 - daysSinceUpload : 0}d</p>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <p className="text-[9px] text-emerald-600">On track</p>
            </div>
          )}
        </div>

        {/* Validated assets */}
        <div className={`bg-white rounded-lg p-3 border ${validationWarning ? "border-amber-200" : "border-gray-100"}`}>
          <p className="text-[10px] text-gray-400 mb-1">Validated Assets</p>
          <p className={`text-lg font-bold ${validationWarning ? "text-amber-500" : "text-gray-800"}`}>
            {validatedAssets.length}
          </p>
          {validationWarning ? (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <p className="text-[9px] text-amber-500">1 required / 60d</p>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <p className="text-[9px] text-emerald-600">Requirement met</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Your data trains the UniVerse Model and earns you platform credits. Stay active to keep your free Contributor access.{" "}
        <Link to={createPageUrl("Pricing")} className="text-blue-400 hover:underline">Learn how credits work →</Link>
      </p>
    </div>
  );
}