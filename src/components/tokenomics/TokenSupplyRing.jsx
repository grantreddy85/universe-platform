import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  tokenised: "#7c3aed",
  validated: "#10b981",
  draft: "#e5e7eb",
};

export default function TokenSupplyRing({ tokenised, validated, draft, total }) {
  const data = [
    { name: "Tokenised", value: tokenised, color: COLORS.tokenised },
    { name: "Validated", value: validated, color: COLORS.validated },
    { name: "Draft / Other", value: draft, color: COLORS.draft },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[260px]">
        <p className="text-sm text-gray-400">No assets on platform yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Platform Token Supply</h3>
      <p className="text-xs text-gray-400 mb-4">Total asset lifecycle distribution across the platform</p>
      <div className="flex items-center gap-6">
        <div className="w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [`${v} assets`, name]}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-gray-600">{d.name}</span>
              <span className="text-xs font-semibold text-gray-900 ml-1">{d.value}</span>
              <span className="text-[10px] text-gray-400">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Total: </span>
            <span className="text-sm font-semibold text-gray-900">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}