import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Users, FolderKanban, Shield, Box, FlaskConical, CheckCircle,
  Clock, XCircle, PlayCircle, ChevronRight, ArrowRight, Search,
  Activity, BarChart3, Coins
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const VAL_STATUS = {
  pending:   { color: "bg-gray-100 text-gray-600",   label: "Pending",   icon: Clock },
  in_review: { color: "bg-blue-100 text-blue-600",   label: "In Review", icon: Shield },
  running:   { color: "bg-amber-100 text-amber-600", label: "Running",   icon: PlayCircle },
  approved:  { color: "bg-green-100 text-green-600", label: "Approved",  icon: CheckCircle },
  rejected:  { color: "bg-red-100 text-red-600",     label: "Rejected",  icon: XCircle },
};

const LAB_STATUS = {
  pending:    { color: "bg-amber-100 text-amber-600",   label: "Pending" },
  in_review:  { color: "bg-blue-100 text-blue-600",     label: "In Review" },
  processing: { color: "bg-purple-100 text-purple-600", label: "Processing" },
  completed:  { color: "bg-emerald-100 text-emerald-600", label: "Completed" },
  rejected:   { color: "bg-red-100 text-red-500",       label: "Rejected" },
};

export default function AdminCRMDashboard() {
  const [userSearch, setUserSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin-all-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 200),
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["admin-all-validations"],
    queryFn: () => base44.entities.ValidationRequest.list("-created_date", 200),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["admin-all-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 200),
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["admin-all-lab-requests"],
    queryFn: () => base44.entities.LabRequest.list("-updated_date", 100),
  });

  const { data: labServices = [] } = useQuery({
    queryKey: ["admin-lab-services"],
    queryFn: () => base44.entities.LabService.list(),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["admin-all-activities"],
    queryFn: () => base44.entities.Activity.list("-created_date", 20),
  });

  const updateValidation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ValidationRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-validations"] }),
  });

  // Platform stats
  const stats = [
    { label: "Total Users",        value: allUsers.length,                                                   icon: Users,         accent: "bg-indigo-50 text-indigo-600" },
    { label: "Total Projects",     value: projects.length,                                                   icon: FolderKanban,  accent: "bg-blue-50 text-blue-600" },
    { label: "Pending Validation", value: validations.filter(v => v.status === "pending").length,            icon: Clock,         accent: "bg-amber-50 text-amber-600" },
    { label: "Validated Assets",   value: assets.filter(a => a.status === "validated" || a.status === "tokenised").length, icon: Box, accent: "bg-green-50 text-green-600" },
    { label: "Active Lab Requests",value: labRequests.filter(r => r.status === "pending" || r.status === "processing").length, icon: FlaskConical, accent: "bg-teal-50 text-teal-600" },
    { label: "Tokenised Assets",   value: assets.filter(a => a.status === "tokenised").length,              icon: Coins,         accent: "bg-purple-50 text-purple-600" },
  ];

  // Per-user summary
  const filteredUsers = allUsers.filter(u =>
    !userSearch ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getUserStats = (email) => ({
    projects: projects.filter(p => p.created_by === email).length,
    validations: validations.filter(v => v.created_by === email).length,
    assets: assets.filter(a => a.created_by === email).length,
  });

  const pendingValidations = validations.filter(v => v.status === "pending" || v.status === "in_review");

  return (
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 max-w-7xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Platform Overview</h1>
        <p className="text-sm text-gray-400 mt-1">Consolidated view across all researchers and projects</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.accent} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* LEFT: Users CRM table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Researchers
              </h2>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300 w-44"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredUsers.map(u => {
                const us = getUserStats(u.email);
                return (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#000021] flex items-center justify-center text-[#00F2FF] text-xs font-semibold flex-shrink-0">
                      {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || "—"}</p>
                      <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span title="Projects" className="flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" /> {us.projects}
                      </span>
                      <span title="Validations" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" /> {us.validations}
                      </span>
                      <span title="Assets" className="flex items-center gap-1">
                        <Box className="w-3 h-3" /> {us.assets}
                      </span>
                    </div>
                    <Badge className="text-[10px] bg-gray-100 text-gray-500 capitalize">{u.role || "user"}</Badge>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No users found.</p>
              )}
            </div>
          </div>

          {/* Pending Validations — action needed */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" /> Validation Queue
              </h2>
              <Link to={createPageUrl("AdminDashboard")} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingValidations.slice(0, 6).map(v => {
                const cfg = VAL_STATUS[v.status] || VAL_STATUS.pending;
                const Icon = cfg.icon;
                const proj = projects.find(p => p.id === v.project_id);
                return (
                  <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {proj?.title || "Unknown project"} · {v.created_by}
                      </p>
                    </div>
                    <Badge className={`${cfg.color} text-[10px] flex items-center gap-1`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {v.status === "pending" && (
                        <Button size="sm" variant="outline"
                          className="text-[10px] h-6 px-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => updateValidation.mutate({ id: v.id, status: "in_review" })}>
                          Review
                        </Button>
                      )}
                      {v.status === "in_review" && (
                        <>
                          <Button size="sm" className="text-[10px] h-6 px-2 bg-green-600 hover:bg-green-700"
                            onClick={() => updateValidation.mutate({ id: v.id, status: "approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline"
                            className="text-[10px] h-6 px-2 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => updateValidation.mutate({ id: v.id, status: "rejected" })}>
                            Reject
                          </Button>
                        </>
                      )}
                      <Link to={createPageUrl("ProjectDetail") + `?id=${v.project_id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-300 hover:text-gray-600" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {pendingValidations.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No pending validations.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Activity feed + Lab Requests */}
        <div className="space-y-6">
          {/* Recent Platform Activity */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Activity className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Platform Activity</h2>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {activities.slice(0, 15).map(a => (
                <div key={a.id} className="px-5 py-3">
                  <p className="text-xs text-gray-700 leading-snug">{a.action}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.created_by} · {new Date(a.created_date).toLocaleDateString()}</p>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No activity yet.</p>
              )}
            </div>
          </div>

          {/* Lab Requests */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Lab Requests</h2>
              </div>
              <Link to={createPageUrl("Labs")} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {labRequests.slice(0, 8).map(req => {
                const service = labServices.find(s => s.id === req.service_id);
                const sc = LAB_STATUS[req.status] || { color: "bg-gray-100 text-gray-500", label: req.status };
                return (
                  <div key={req.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{req.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{service?.name || "Lab Service"} · {req.requester_email || req.created_by}</p>
                      <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>
                );
              })}
              {labRequests.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">No lab requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}