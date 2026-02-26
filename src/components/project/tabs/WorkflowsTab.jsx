import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GitBranch, MoreHorizontal, Trash2, Play, CheckCircle2, XCircle, Clock, Sparkles, ArrowLeft } from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WorkflowBuilder from "@/components/workflows/WorkflowBuilder";
import WorkflowCanvas from "@/components/workflows/WorkflowCanvas";

const statusIcons = {
  draft: Clock, running: Play, completed: CheckCircle2, failed: XCircle,
};
const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  running: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-600",
};

export default function WorkflowsTab({ project }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["project-workflows", project.id],
    queryFn: () => base44.entities.Workflow.filter({ project_id: project.id }, "-created_date", 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-workflows", project.id] });
      if (selectedWorkflow) setSelectedWorkflow(null);
    },
  });

  const handleCreated = (wf) => {
    queryClient.invalidateQueries({ queryKey: ["project-workflows", project.id] });
    setShowBuilder(false);
    setSelectedWorkflow(wf);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {selectedWorkflow && (
              <button onClick={() => setSelectedWorkflow(null)} className="text-gray-400 hover:text-gray-600 mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              {selectedWorkflow ? selectedWorkflow.title : "Workflows"}
            </h2>
            {selectedWorkflow && (
              <Badge className={`text-[10px] ${statusStyles[selectedWorkflow.status] || statusStyles.draft}`}>
                {selectedWorkflow.status || "draft"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setAiOpen(!aiOpen)}
              className={`text-xs h-7 px-2.5 ${aiOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />Notes Guide
            </Button>
            {!selectedWorkflow && (
              <Button onClick={() => setShowBuilder(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />New Workflow
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedWorkflow ? (
            <WorkflowCanvas workflow={selectedWorkflow} />
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <GitBranch className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">No workflows yet.</p>
              <Button onClick={() => setShowBuilder(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Create your first workflow
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {workflows.map(wf => {
                const StatusIcon = statusIcons[wf.status] || Clock;
                const steps = wf.parameters?.steps || [];
                return (
                  <div
                    key={wf.id}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedWorkflow(wf)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{wf.title}</h3>
                          <Badge variant="secondary" className={`text-[10px] uppercase ${statusStyles[wf.status] || statusStyles.draft}`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-1" />
                            {wf.status || "draft"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{wf.type?.replace(/_/g, " ") || "Other"}</p>
                        {wf.description && <p className="text-xs text-gray-500 line-clamp-2">{wf.description}</p>}
                        {steps.length > 0 && (
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-gray-400">{steps.length} steps</span>
                            <div className="flex gap-0.5">
                              {steps.map((s, i) => (
                                <div key={i} className={`w-3 h-1.5 rounded-full ${s.status === "completed" ? "bg-emerald-400" : s.status === "running" ? "bg-blue-400" : "bg-gray-200"}`} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-gray-400 flex-shrink-0"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); deleteMutation.mutate(wf.id); }}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TabAIPanel tabName="Workflows" contextData={workflows} isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />

      <WorkflowBuilder
        open={showBuilder}
        onOpenChange={setShowBuilder}
        projectId={project.id}
        onCreated={handleCreated}
      />
    </div>
  );
}