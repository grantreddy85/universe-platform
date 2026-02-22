import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Calendar, FolderKanban, Box, Shield, Globe, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["user-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 100),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["user-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 100),
  });

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Profile</h1>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user.full_name || "Researcher"}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </div>
          </div>
        </div>
        {user.created_date && (
          <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Member since {format(new Date(user.created_date), "MMMM yyyy")}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <FolderKanban className="w-5 h-5 text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-semibold text-gray-900">{projects.length}</p>
          <p className="text-xs text-gray-400">Projects</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <Box className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-xl font-semibold text-gray-900">{assets.length}</p>
          <p className="text-xs text-gray-400">Assets</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <Shield className="w-5 h-5 text-violet-500 mx-auto mb-2" />
          <p className="text-xl font-semibold text-gray-900">
            {assets.filter((a) => a.status === "validated" || a.status === "tokenised").length}
          </p>
          <p className="text-xs text-gray-400">Validated</p>
        </div>
      </div>
    </div>
  );
}