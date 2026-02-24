import React from "react";
import { Lock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function EscrowPanel({ tokenisedAssets, platformEscrowPct }) {
  // For each tokenised asset, show creator share vs platform escrow
  const chartData = tokenisedAssets.slice(0, 8).map((a) => {
    const royalty = a.tokenisation?.royalty_percentage || 0;
    const escrow = Math.min(royalty, platformEscrowPct);
    const creator = Math.max(0, royalty - escrow);
    return {
      name: a.title?.length > 14 ? a.title.slice(0, 14) + "…" : (a.title || "Asset"),
      "Creator Pool": creator,
      "UniVerse Escrow": escrow,
    };
  });

  const totalRoyalty = tokenisedAssets.reduce(
    (s, a) => s + (a.tokenisation?.royalty_percentage || 0), 0
  );
  const totalEscrow = Math.min(tokenisedAssets.length * platformEscrowPct, totalRoyalty);
  const totalCreator = Math.max(0, totalRoyalty - totalEscrow);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        Escrow & Royalty Distribution
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        UniVerse holds a <span className="font-semibold text-amber-600">{platformEscrowPct}%</span> platform escrow on each tokenised asset's royalty.
      </p>

      {/* Summary row */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1 bg-violet-50 rounded-lg p-3">
          <p className="text-[10px] text-violet-500 mb-0.5">Creator Pool</p>
          <p className="text-lg font-semibold text-violet-700">{totalCreator.toFixed(1)}%</p>
        </div>
        <div className="flex-1 bg-amber-50 rounded-lg p-3">
          <p className="text-[10px] text-amber-500 mb-0.5">UniVerse Escrow</p>
          <p className="text-lg font-semibold text-amber-700">{totalEscrow.toFixed(1)}%</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={10}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} unit="%" width={28} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Bar dataKey="Creator Pool" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            <Bar dataKey="UniVerse Escrow" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-xs text-gray-400 text-center py-6">No tokenised assets to display.</p>
      )}
    </div>
  );
}