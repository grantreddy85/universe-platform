import React from "react";
import { ChevronDown, ChevronRight, Coins, User } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const ESCROW_COLOR = "#f59e0b";

export default function AssetRoyaltyCard({ asset, project, expanded, onToggle, platformEscrowPct }) {
  const royaltyPct = asset.tokenisation?.royalty_percentage || 0;
  const attribution = asset.attribution || [];
  const escrowShare = Math.min(royaltyPct, platformEscrowPct);
  const creatorRoyalty = Math.max(0, royaltyPct - escrowShare);

  // Build pie data: each contributor gets their share of the creator royalty
  const totalShares = attribution.reduce((s, a) => s + (a.share_percentage || 0), 0);
  const pieData = [
    ...attribution.map((a, i) => ({
      name: a.contributor || `Contributor ${i + 1}`,
      role: a.role,
      value: totalShares > 0
        ? parseFloat(((a.share_percentage / totalShares) * creatorRoyalty).toFixed(2))
        : parseFloat((creatorRoyalty / Math.max(attribution.length, 1)).toFixed(2)),
      color: COLORS[i % COLORS.length],
    })),
    { name: "UniVerse Escrow", role: "Platform", value: escrowShare, color: ESCROW_COLOR },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{asset.title}</span>
            <Badge variant="secondary" className="bg-violet-50 text-violet-600 text-[10px] uppercase">
              {asset.status}
            </Badge>
            {project && (
              <span className="text-[11px] text-gray-400 truncate">· {project.title}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" /> {royaltyPct}% royalty
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {attribution.length} contributor{attribution.length !== 1 ? "s" : ""}
            </span>
            {asset.tokenisation?.token_id && (
              <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                {asset.tokenisation.token_id}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Pie chart */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={60}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`${v}%`, name]}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex flex-col gap-1.5">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: d.color }}
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-700 leading-none">{d.name}</p>
                      {d.role && (
                        <p className="text-[10px] text-gray-400">{d.role}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-900 ml-auto pl-3">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution table */}
            {attribution.length > 0 && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Attribution</p>
                <div className="space-y-2">
                  {attribution.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{a.contributor}</p>
                        <p className="text-[10px] text-gray-400">{a.role}</p>
                      </div>
                      <span className="text-xs font-semibold text-violet-600 flex-shrink-0">
                        {a.share_percentage ?? "—"}%
                      </span>
                    </div>
                  ))}
                  {/* UniVerse escrow row */}
                  <div className="flex items-center gap-3 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-800">UniVerse Platform Escrow</p>
                      <p className="text-[10px] text-amber-500">Held by platform</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 flex-shrink-0">
                      {escrowShare}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}