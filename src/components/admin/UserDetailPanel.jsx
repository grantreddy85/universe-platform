import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderKanban, Box, CheckCircle2, FlaskConical, Crown, User, Calendar } from "lucide-react";
import { format } from "date-fns";

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function UserDetailPanel({ user }) {
  const { data: projects = [] } = useQuery({
    queryKey: ["user-projects", user.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }),
    enabled: !!user.email
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["user-assets", user.email],
    queryFn: () => base44.entities.Asset.filter({ created_by: user.email }),
    enabled: !!user.email
  });

  const validatedAssets = assets.filter(a => a.status === "validated" || a.status === "tokenised");
  const tokenisedAssets = assets.filter(a => a.status === "tokenised");

  return (
    <div className="space-y-4">
      {/* User header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#000021]/5 flex items-center justify-center">
            {user.role === "admin"
              ? <Crown className="w-5 h-5 text-amber-500" />
              : <User className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user.full_name || "Unnamed User"}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
            user.role === "admin" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
          }`}>
            {user.role || "user"}
          </span>
        </div>
        {user.created_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Calendar className="w-3 h-3" />
            Joined {format(new Date(user.created_date), "MMM d, yyyy")}
          </div>
        )}
        {user.orcid_id && (
          <a
            href={`https://orcid.org/${user.orcid_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#A6CE39] hover:underline mt-1">
            <span className="font-bold">iD</span> orcid.org/{user.orcid_id}
          </a>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Projects" value={projects.length} color="#3b82f6" />
        <Stat label="Assets" value={assets.length} color="#6366f1" />
        <Stat label="Validated" value={validatedAssets.length} color="#10b981" />
        <Stat label="Tokenised" value={tokenisedAssets.length} color="#f59e0b" />
      </div>

      {/* Recent projects */}
      {projects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Projects</p>
          <div className="space-y-2">
            {projects.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <p className="text-xs text-gray-700 truncate flex-1">{p.title}</p>
                <span className="text-[10px] text-gray-400">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}