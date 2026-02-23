import React from "react";
import { FolderKanban, Shield, Box, Coins } from "lucide-react";

export default function ProfileCard({ user, stats }) {
  const statsConfig = [
    { label: "Projects", value: stats.projects, icon: FolderKanban, color: "text-blue-500" },
    { label: "Validations", value: stats.validations, icon: Shield, color: "text-amber-500" },
    { label: "Assets", value: stats.assets, icon: Box, color: "text-green-500" },
    { label: "Tokenised", value: stats.tokenised, icon: Coins, color: "text-purple-500" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-10">
      <div className="flex items-center gap-4 mb-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-[#000021] flex items-center justify-center flex-shrink-0 text-[#00F2FF] text-2xl font-semibold">
          {user?.full_name?.charAt(0)?.toUpperCase() || "R"}
        </div>
        
        {/* User Info */}
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">{user?.full_name || "Researcher"}</h2>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Researcher"} & Researcher
          </p>
          {user?.orcid_id && (
            <a
              href={`https://orcid.org/${user.orcid_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#A6CE39] hover:underline mt-1.5"
            >
              <span className="font-bold">iD</span> orcid.org/{user.orcid_id}
            </a>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${stat.color}`} strokeWidth={2} />
                <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
              </div>
              <span className="text-[10px] text-gray-400 text-center">{stat.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}