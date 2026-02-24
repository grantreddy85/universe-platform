import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const ROLE_COLORS = {
  researcher: { bar: "#3b82f6", badge: "bg-blue-50 text-blue-700", label: "Researcher" },
  lab: { bar: "#14b8a6", badge: "bg-teal-50 text-teal-700", label: "Lab" },
  universe: { bar: "#8b5cf6", badge: "bg-violet-50 text-violet-700", label: "UniVerse" },
  investor: { bar: "#f59e0b", badge: "bg-amber-50 text-amber-700", label: "Investor" },
  funder: { bar: "#f97316", badge: "bg-orange-50 text-orange-700", label: "Funder" },
  tool_creator: { bar: "#6b7280", badge: "bg-gray-100 text-gray-700", label: "Tool Creator" },
};

const FALLBACK_COLORS = ["#3b82f6","#14b8a6","#8b5cf6","#f59e0b","#f97316","#6b7280","#ec4899","#6366f1"];

export default function AttributionDisplay({ attribution = [] }) {
  if (!attribution.length) return null;

  const pieData = attribution.map((a, i) => ({
    name: a.contributor || "TBD",
    value: a.share_percentage || 0,
    color: (ROLE_COLORS[a.role]?.bar) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  // Group by role
  const grouped = attribution.reduce((acc, a) => {
    const role = a.role || "researcher";
    if (!acc[role]) acc[role] = [];
    acc[role].push(a);
    return acc;
  }, {});

  return (
    <div>
      {/* Visual bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-4">
        {attribution.map((a, i) => (
          <div
            key={i}
            style={{
              width: `${a.share_percentage}%`,
              backgroundColor: (ROLE_COLORS[a.role]?.bar) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pie chart */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{d.name}</span>
                <span className="text-[10px] font-semibold text-gray-700">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grouped contributor list */}
        <div className="space-y-3">
          {Object.entries(grouped).map(([role, contributors]) => {
            const roleMeta = ROLE_COLORS[role] || { badge: "bg-gray-100 text-gray-700", label: role };
            return (
              <div key={role}>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${roleMeta.badge}`}>
                  {roleMeta.label}
                </span>
                <div className="space-y-1">
                  {contributors.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50">
                      <span className="text-gray-800 font-medium truncate">{c.contributor || "TBD"}</span>
                      <span className="text-gray-500 font-semibold ml-2 flex-shrink-0">{c.share_percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}