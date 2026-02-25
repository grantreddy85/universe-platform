import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import {
  Shield, FolderKanban, Box, FlaskConical, Activity, ChevronDown, ChevronRight
} from "lucide-react";
import AdminModeToggle from "@/components/admin/AdminModeToggle";
import UserDirectoryPanel from "@/components/admin/UserDirectoryPanel";
import UserDetailPanel from "@/components/admin/UserDetailPanel";
import PlatformIntelligenceRAG from "@/components/admin/PlatformIntelligenceRAG";

const STATUS_COLORS = {
  pending: "#f59e0b", in_review: "#3b82f6", running: "#8b5cf6",
  approved: "#10b981", rejected: "#ef4444", draft: "#9ca3af",
  active: "#3b82f6", validated: "#10b981", tokenised: "#6366f1",
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
        <Icon className="w-4 h-4" style={{ color }} strokeWidth={1.7} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function MiniChart({ title, data }) {
  if (data.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
      <p className="text-xs text-gray-400 text-center py-6">No data yet</p>
    </div>
  );
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={50} paddingAngle={3}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1 text-[10px] text-gray-500">
            <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 200),
  });

  const { data: allValidations = [] } = useQuery({
    queryKey: ["admin-validations"],
    queryFn: () => base44.entities.ValidationRequest.list("-created_date", 200),
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["admin-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 200),
  });

  const { data: allNotes = [] } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: () => base44.entities.Note.list("-created_date", 200),
  });

  const { data: allHypotheses = [] } = useQuery({
    queryKey: ["admin-hypotheses"],
    queryFn: () => base44.entities.Hypothesis.list("-created_date", 200),
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["admin-lab-requests"],
    queryFn: () => base44.entities.LabRequest.list("-updated_date", 100),
  });

  const { data: allActivities = [] } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: () => base44.entities.Activity.list("-created_date", 20),
  });

  const sharedProjects = allProjects.filter(p => p.visibility_setting === "platform_shared");
  const pendingValidations = allValidations.filter(v => v.status === "pending" || v.status === "in_review");
  const validatedAssets = allAssets.filter(a => a.status === "validated" || a.status === "tokenised");

  const projectStatusData = ["draft", "active", "validation", "validated", "tokenised"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: allProjects.filter(p => p.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  const validationStatusData = ["pending", "in_review", "running", "approved", "rejected"].map(s => ({
    name: s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: allValidations.filter(v => v.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center p-10">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fafbfc] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-[#000021]">Platform Admin</h1>
          <p className="text-[11px] text-gray-400">UniVerse Ecosystem — Full Platform View</p>
        </div>
        {/* Stats inline in header */}
        <div className="hidden lg:flex items-center gap-3">
          <StatCard label="Projects" value={allProjects.length} icon={FolderKanban} color="#3b82f6" sub={`${sharedProjects.length} shared`} />
          <StatCard label="Pending Validations" value={pendingValidations.length} icon={Shield} color="#f59e0b" sub={`${allValidations.length} total`} />
          <StatCard label="Validated Assets" value={validatedAssets.length} icon={Box} color="#10b981" sub={`${allAssets.length} total`} />
          <StatCard label="Lab Requests" value={labRequests.length} icon={FlaskConical} color="#6366f1" sub={`${labRequests.filter(r => r.status === "pending").length} pending`} />
        </div>
        <AdminModeToggle />
      </div>

      {/* 3-panel body */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* LEFT — User Directory (25%) */}
        <div className="w-[220px] flex-shrink-0 border-r border-gray-100 flex flex-col p-3 gap-3 overflow-hidden">
          <UserDirectoryPanel
            users={allUsers}
            selectedUser={selectedUser}
            onSelectUser={u => setSelectedUser(selectedUser?.id === u.id ? null : u)}
          />
        </div>

        {/* CENTRE — Platform Intelligence RAG (50%) */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden min-w-0">
          {/* Mini charts row */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            <MiniChart title="Project Status" data={projectStatusData} />
            <MiniChart title="Validation Pipeline" data={validationStatusData} />
          </div>

          {/* RAG — takes remaining space */}
          <div className="flex-1 min-h-0">
            <PlatformIntelligenceRAG
              allProjects={allProjects}
              allNotes={allNotes}
              allAssets={allAssets}
              allHypotheses={allHypotheses}
              allValidations={allValidations}
            />
          </div>
        </div>

        {/* RIGHT — User detail or recent activity (25%) */}
        <div className="w-[260px] flex-shrink-0 border-l border-gray-100 p-3 overflow-y-auto">
          {selectedUser ? (
            <UserDetailPanel user={selectedUser} />
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Recent Activity</p>
              {allActivities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No activity yet</p>
              ) : allActivities.map(a => (
                <div key={a.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3 h-3 text-indigo-500" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-700 leading-snug">{a.action}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{a.created_by}</p>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 text-center mt-4 px-1">← Select a user to view their profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}