import React from "react";

const COLORS = [
  { bar: "#3b82f6", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { bar: "#14b8a6", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  { bar: "#8b5cf6", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  { bar: "#f59e0b", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { bar: "#f97316", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { bar: "#ec4899", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  { bar: "#6366f1", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

export default function TopicClustersDisplay({ topicClusters = [] }) {
  if (!topicClusters.length) return null;

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden h-4 mb-3 gap-0.5">
        {topicClusters.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-center transition-all"
            style={{
              width: `${c.weight_percentage}%`,
              backgroundColor: COLORS[i % COLORS.length].bar,
            }}
            title={`${c.topic}: ${c.weight_percentage}%`}
          >
            {c.weight_percentage >= 10 && (
              <span className="text-white text-[9px] font-semibold truncate px-1">{c.weight_percentage}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {topicClusters.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${COLORS[i % COLORS.length].badge}`}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length].bar }}
            />
            {c.topic}
            <span className="opacity-60">{c.weight_percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}