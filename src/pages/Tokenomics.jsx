import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { Coins, Lock, Shield, TrendingUp, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TokenSupplyRing from "@/components/tokenomics/TokenSupplyRing.jsx";
import EscrowPanel from "@/components/tokenomics/EscrowPanel.jsx";
import AssetRoyaltyCard from "@/components/tokenomics/AssetRoyaltyCard.jsx";

export default function Tokenomics() {
  const [expandedAsset, setExpandedAsset] = useState(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["tokenomics-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["tokenomics-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 100),
  });

  const tokenisedAssets = assets.filter(
    (a) => a.status === "tokenised" || a.status === "published"
  );
  const validatedAssets = assets.filter((a) => a.status === "validated");
  const draftAssets = assets.filter((a) => a.status === "draft");

  // Platform-wide royalty pool: sum of all royalty_percentages
  const totalRoyaltyPool = tokenisedAssets.reduce((sum, a) => {
    return sum + (a.tokenisation?.royalty_percentage || 0);
  }, 0);

  // Platform escrow: 5% of total royalty pool held by UniVerse
  const platformEscrowPct = 5;
  const creatorPool = Math.max(0, totalRoyaltyPool - platformEscrowPct * tokenisedAssets.length);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-violet-500" />
          Tokenomics
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Platform-wide token supply, royalty distribution, and escrow overview.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Assets", value: assets.length, color: "text-gray-900", icon: Shield },
          { label: "Tokenised", value: tokenisedAssets.length, color: "text-violet-600", icon: Coins },
          { label: "Validated", value: validatedAssets.length, color: "text-emerald-600", icon: TrendingUp },
          { label: "Contributors", value: [...new Set(assets.flatMap(a => (a.attribution || []).map(x => x.contributor)))].length, color: "text-blue-600", icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two-column: Supply Ring + Escrow */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <TokenSupplyRing
          tokenised={tokenisedAssets.length}
          validated={validatedAssets.length}
          draft={draftAssets.length}
          total={assets.length}
        />
        <EscrowPanel
          tokenisedAssets={tokenisedAssets}
          platformEscrowPct={platformEscrowPct}
        />
      </div>

      {/* Per-Asset Royalty Breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Per-Asset Royalty & Attribution
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse h-16" />
            ))}
          </div>
        ) : tokenisedAssets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <Lock className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No tokenised assets yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokenisedAssets.map((asset) => (
              <AssetRoyaltyCard
                key={asset.id}
                asset={asset}
                project={projects.find((p) => p.id === asset.project_id)}
                expanded={expandedAsset === asset.id}
                onToggle={() =>
                  setExpandedAsset(expandedAsset === asset.id ? null : asset.id)
                }
                platformEscrowPct={platformEscrowPct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}