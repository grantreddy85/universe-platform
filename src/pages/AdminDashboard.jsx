import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import {
  Shield, FolderKanban, Box, Coins, Users, FlaskConical, CheckCircle2,
  Clock, XCircle, AlertCircle, Send, Loader2, Sparkles, Brain, Dna,
  Activity, Globe, ChevronDown, ChevronRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import AdminModeToggle from "@/components/admin/AdminModeToggle";

const VAULT_CATEGORIES = [
  { key: "neurodegeneration", label: "Neurodegeneration", color: "#6366f1", icon: Brain },
  { key: "oncology", label: "Oncology", color: "#ef4444", icon: Dna },
  { key: "cardiology", label: "Cardiology", color: "#f59e0b", icon: Activity },
  { key: "immunology", label: "Immunology", color: "#10b981", icon: Shield },
  { key: "genomics", label: "Genomics", color: "#3b82f6", icon: Dna },
  { key: "other", label: "Other", color: "#8b5cf6", icon: Globe },
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  in_review: "#3b82f6",
  running: "#8b5cf6",
  approved: "#10b981",
  rejected: "#ef4444",
  draft: "#9ca3af",
  active: "#3b82f6",
  validated: "#10b981",
  tokenised: "#6366f1",
};

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ background: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.7} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function VaultSectorPanel({ projects, notes, validations }) {
  const [expanded, setExpanded] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [loading, setLoading] = useState(null);

  // Categorise projects by field keyword
  const categorise = (project) => {
    const text = (project.title + " " + (project.field || "") + " " + (project.description || "")).toLowerCase();
    if (text.match(/neuro|alzheimer|parkinson|dementia|brain/)) return "neurodegeneration";
    if (text.match(/cancer|oncol|tumou?r|carcinoma|lymphoma|leukaemia/)) return "oncology";
    if (text.match(/cardio|heart|cardiovascular|coronary|arrhythmia/)) return "cardiology";
    if (text.match(/immuno|autoimmune|antibody|t.cell|cytokine/)) return "immunology";
    if (text.match(/genom|dna|rna|sequenc|crispr|gene/)) return "genomics";
    return "other";
  };

  const sectorData = VAULT_CATEGORIES.map((cat) => {
    const sectorProjects = projects.filter((p) => categorise(p) === cat.key);
    const sectorValidations = validations.filter((v) =>
      sectorProjects.some((p) => p.id === v.project_id)
    );
    return { ...cat, projects: sectorProjects, validations: sectorValidations };
  }).filter((s) => s.projects.length > 0);

  const sendRAG = async (sectorKey, input) => {
    if (!input.trim()) return;
    setLoading(sectorKey);
    const sector = sectorData.find((s) => s.key === sectorKey);
    const context = sector.projects.map((p) =>
      `Project: ${p.title}\nField: ${p.field || "N/A"}\nDescription: ${p.description || "N/A"}\nStatus: ${p.status}`
    ).join("\n\n");

    const prev = chatMessages[sectorKey] || [];
    const userMsg = { role: "user", content: input };
    setChatMessages((m) => ({ ...m, [sectorKey]: [...prev, userMsg] }));

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a research intelligence assistant for the UniVerse platform. You have access to ${sector.label} research projects from the platform ecosystem.\n\nContext:\n${context}\n\nUser Query: ${input}`,
      add_context_from_internet: true,
    });

    setChatMessages((m) => ({
      ...m,
      [sectorKey]: [...(m[sectorKey] || []), { role: "assistant", content: response }],
    }));
    setLoading(null);
  };

  return (
    <div className="space-y-3">
      {sectorData.map((sector) => {
        const Icon = sector.icon;
        const isOpen = expanded === sector.key;
        const msgs = chatMessages[sector.key] || [];
        return (
          <div key={sector.key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : sector.key)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: sector.color + "18" }}>
                <Icon className="w-4 h-4" style={{ color: sector.color }} strokeWidth={1.7} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{sector.label}</p>
                <p className="text-xs text-gray-400">{sector.projects.length} projects · {sector.validations.length} validations</p>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {/* Project list */}
                <div className="grid sm:grid-cols-2 gap-2">
                  {sector.projects.map((p) => (
                    <div key={p.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                      <p className="font-semibold text-gray-800 truncate">{p.title}</p>
                      <p className="text-gray-400 mt-0.5">{p.field || "General"} · {p.status}</p>
                    </div>
                  ))}
                </div>

                {/* RAG Chat */}
                <div className="border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-xs font-semibold text-gray-600">Query {sector.label} Research</p>
                  </div>
                  {msgs.length > 0 && (
                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {msgs.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.role === "user" ? "bg-[#000021] text-white" : "bg-white border border-gray-200 text-gray-700"}`}>
                            <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{m.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      {loading === sector.key && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Analysing...
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-3 flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { sendRAG(sector.key, chatInput); setChatInput(""); } }}
                      placeholder={`Ask about ${sector.label} research...`}
                      className="text-xs h-8 bg-white"
                      disabled={loading === sector.key}
                    />
                    <Button
                      size="sm"
                      className="h-8 w-8 p-0 bg-[#000021] hover:bg-[#000021]/90"
                      onClick={() => { sendRAG(sector.key, chatInput); setChatInput(""); }}
                      disabled={!chatInput.trim() || loading === sector.key}
                    >
                      <Send className="w-3 h-3 text-[#00F2FF]" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [platformChatInput, setPlatformChatInput] = useState("");
  const [platformMessages, setPlatformMessages] = useState([]);
  const [platformLoading, setPlatformLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [platformMessages]);

  // Fetch all platform data (no filter — admin sees everything)
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

  const { data: allActivities = [] } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: () => base44.entities.Activity.list("-created_date", 50),
  });

  const { data: labRequests = [] } = useQuery({
    queryKey: ["admin-lab-requests"],
    queryFn: () => base44.entities.LabRequest.list("-updated_date", 100),
  });

  // Derived stats
  const sharedProjects = allProjects.filter((p) => p.visibility_setting === "platform_shared");
  const pendingValidations = allValidations.filter((v) => v.status === "pending" || v.status === "in_review");
  const validatedAssets = allAssets.filter((a) => a.status === "validated" || a.status === "tokenised");

  // Chart data
  const projectStatusData = ["draft", "active", "validation", "validated", "tokenised"].map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: allProjects.filter((p) => p.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((d) => d.value > 0);

  const validationStatusData = ["pending", "in_review", "running", "approved", "rejected"].map((s) => ({
    name: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: allValidations.filter((v) => v.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((d) => d.value > 0);

  const labStatusData = ["pending", "in_review", "processing", "completed", "rejected"].map((s) => ({
    name: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: labRequests.filter((r) => r.status === s).length,
  })).filter((d) => d.value > 0);

  const sendPlatformRAG = async () => {
    if (!platformChatInput.trim()) return;
    const input = platformChatInput;
    setPlatformChatInput("");
    setPlatformLoading(true);

    const userMsg = { role: "user", content: input };
    setPlatformMessages((m) => [...m, userMsg]);

    const context = allProjects.slice(0, 30).map((p) =>
      `Project: ${p.title} | Field: ${p.field || "N/A"} | Status: ${p.status} | Shared: ${p.visibility_setting === "platform_shared" ? "Yes" : "No"}`
    ).join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the UniVerse platform intelligence assistant with full visibility of all shared research activity. Provide insights, cross-project analysis, and actionable recommendations.\n\nPlatform Overview:\n- Total Projects: ${allProjects.length} (${sharedProjects.length} shared)\n- Pending Validations: ${pendingValidations.length}\n- Validated Assets: ${validatedAssets.length}\n- Lab Requests: ${labRequests.length}\n\nProject Data:\n${context}\n\nAdmin Query: ${input}`,
      add_context_from_internet: true,
    });

    setPlatformMessages((m) => [...m, { role: "assistant", content: response }]);
    setPlatformLoading(false);
  };

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
    <div className="min-h-screen bg-[#fafbfc] p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#000021]">Platform Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">UniVerse Ecosystem — Full Platform View</p>
        </div>
        <AdminModeToggle />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={allProjects.length} icon={FolderKanban} color="#3b82f6" sub={`${sharedProjects.length} shared`} />
        <StatCard label="Pending Validations" value={pendingValidations.length} icon={Shield} color="#f59e0b" sub={`${allValidations.length} total`} />
        <StatCard label="Validated Assets" value={validatedAssets.length} icon={Box} color="#10b981" sub={`${allAssets.length} total`} />
        <StatCard label="Lab Requests" value={labRequests.length} icon={FlaskConical} color="#6366f1" sub={`${labRequests.filter(r => r.status === "pending").length} pending`} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Project Status</p>
          {projectStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={projectStatusData} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {projectStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {projectStatusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-gray-400 text-center py-10">No data yet</p>}
        </div>

        {/* Validation Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Validation Pipeline</p>
          {validationStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={validationStatusData} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {validationStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {validationStatusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-gray-400 text-center py-10">No validations yet</p>}
        </div>

        {/* Lab Requests Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Lab Requests</p>
          {labStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={labStatusData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 text-center py-10">No lab requests yet</p>}
        </div>
      </div>

      {/* Vault Sectors + Platform RAG */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vault Categories */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Research Vault — By Sector</p>
          <VaultSectorPanel projects={allProjects} notes={allNotes} validations={allValidations} />
        </div>

        {/* Platform-wide RAG */}
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ minHeight: 480 }}>
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-xs font-semibold text-gray-700">Platform Intelligence — RAG Query</p>
              <p className="text-[11px] text-gray-400">Query across all shared platform activity</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {platformMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pt-10">
                <Globe className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Ask anything about the ecosystem — cross-project insights, trends, validation patterns…</p>
              </div>
            ) : (
              platformMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-[#000021] text-white" : "bg-gray-50 border border-gray-200 text-gray-700"}`}>
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            )}
            {platformLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Analysing platform data…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <Input
              value={platformChatInput}
              onChange={(e) => setPlatformChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendPlatformRAG(); }}
              placeholder="e.g. Which oncology projects are nearing validation?"
              className="text-sm h-10 bg-gray-50"
              disabled={platformLoading}
            />
            <Button
              onClick={sendPlatformRAG}
              size="icon"
              className="h-10 w-10 bg-[#000021] hover:bg-[#000021]/90 flex-shrink-0"
              disabled={!platformChatInput.trim() || platformLoading}
            >
              <Send className="w-4 h-4 text-[#00F2FF]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Platform Activity</p>
        {allActivities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No activity yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {allActivities.slice(0, 10).map((a) => (
              <div key={a.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700">{a.action}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{a.created_by} · {a.entity_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}