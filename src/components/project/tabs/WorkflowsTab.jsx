import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GitBranch, Loader2, ExternalLink, Trash2, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WorkflowBuilder from "@/components/workflows/WorkflowBuilder";
import WorkflowCanvas from "@/components/workflows/WorkflowCanvas";
import WorkflowHubImporter from "@/components/workflows/WorkflowHubImporter";
import WorkflowAIPanel from "@/components/workflows/WorkflowAIPanel";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const TYPE_LABELS = {
  in_silico_simulation: "In-Silico",
  meta_analysis: "Meta-Analysis",
  comparative_modelling: "Comparative Modelling",
  statistical_analysis: "Statistical Analysis",
  other: "Other",
};

export default function WorkflowsTab({ project }) {
  const projectId = project?.id;
  const queryClient = useQueryClient();

  const [showBuilder, setShowBuilder] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [canvasState, setCanvasState] = useState({ nodes: [], edges: [] });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows", projectId],
    queryFn: () => base44.entities.Workflow.filter({ project_id: projectId }, "-created_date", 50),
    enabled: !!projectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
      if (selectedWorkflow) setSelectedWorkflow(null);
    },
  });

  const handleCreated = (wf) => {
    queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
    setShowBuilder(false);
    openWorkflow(wf);
  };

  const handleImport = async (wfData) => {
    const wf = await base44.entities.Workflow.create({ project_id: projectId, ...wfData });
    queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
    setShowImporter(false);
    openWorkflow(wf);
  };

  const openWorkflow = (wf) => {
    setSelectedWorkflow(wf);
    const saved = wf.parameters?.canvas;
    setCanvasState(saved || { nodes: [], edges: [] });
  };

  const saveCanvas = async (newState) => {
    setCanvasState(newState);
    await base44.entities.Workflow.update(selectedWorkflow.id, {
      parameters: { ...selectedWorkflow.parameters, canvas: newState }
    });
    queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
  };

  // Detail view
  if (selectedWorkflow) {
    const isWorkflowHub = selectedWorkflow.parameters?.source === "workflowhub";
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={() => setSelectedWorkflow(null)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            ← Workflows
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800 truncate">{selectedWorkflow.title}</span>
          <Badge className={`${STATUS_COLORS[selectedWorkflow.status]} text-[10px] ml-auto`}>
            {selectedWorkflow.status}
          </Badge>
          {isWorkflowHub && (
            <a href={selectedWorkflow.parameters?.source_url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                <ExternalLink className="w-3 h-3" /> WorkflowHub
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => deleteMutation.mutate(selectedWorkflow.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* WorkflowHub imported: show metadata instead of canvas */}
        {isWorkflowHub ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl space-y-4">
              {selectedWorkflow.parameters?.workflow_type && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{selectedWorkflow.parameters.workflow_type}</Badge>
                  {selectedWorkflow.parameters?.license && (
                    <Badge variant="outline" className="text-xs">{selectedWorkflow.parameters.license}</Badge>
                  )}
                </div>
              )}
              {selectedWorkflow.description && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedWorkflow.description.replace(/[#*`]/g, "").slice(0, 2000)}
                  </p>
                </div>
              )}
              {selectedWorkflow.parameters?.tags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWorkflow.parameters.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 rounded px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <a href={selectedWorkflow.parameters?.source_url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2 mt-2">
                  <ExternalLink className="w-4 h-4" /> View full workflow on WorkflowHub
                </Button>
              </a>
            </div>
          </div>
        ) : (
          /* Canvas editor for custom workflows */
          <div className="flex-1 overflow-hidden">
            <WorkflowCanvas
              nodes={canvasState.nodes}
              edges={canvasState.edges}
              onChange={saveCanvas}
            />
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="flex h-full">
      <div className="p-6 flex-1 max-w-5xl overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Workflows</h2>
          <p className="text-xs text-gray-400 mt-0.5">Build custom pipelines or import from WorkflowHub</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel((v) => !v)}
            className="text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Workflow Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImporter(true)}
            className="text-xs gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            Import from WorkflowHub
          </Button>
          <Button
            size="sm"
            onClick={() => setShowBuilder(true)}
            className="text-xs gap-1.5 bg-gray-900 text-white hover:bg-gray-700"
          >
            <Plus className="w-3.5 h-3.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      )}

      {!isLoading && workflows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitBranch className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 font-medium">No workflows yet</p>
          <p className="text-xs text-gray-300 mt-1 mb-4">Create a custom pipeline or import from WorkflowHub</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImporter(true)} className="text-xs gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Import from WorkflowHub
            </Button>
            <Button size="sm" onClick={() => setShowBuilder(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Workflow
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => openWorkflow(wf)}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              {wf.parameters?.source === "workflowhub"
                ? <Globe className="w-4 h-4 text-indigo-400" />
                : <GitBranch className="w-4 h-4 text-indigo-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{wf.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{wf.description || TYPE_LABELS[wf.type] || "Workflow"}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {wf.parameters?.source === "workflowhub" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-500 border-blue-200">WorkflowHub</Badge>
              )}
              <Badge className={`${STATUS_COLORS[wf.status]} text-[10px]`}>{wf.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      <WorkflowBuilder
        open={showBuilder}
        onOpenChange={setShowBuilder}
        projectId={projectId}
        onCreated={handleCreated}
      />

      <WorkflowHubImporter
        open={showImporter}
        onClose={() => setShowImporter(false)}
        onImport={handleImport}
      />
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <WorkflowAIPanel
          project={project}
          onClose={() => setShowAIPanel(false)}
          onOpenImporter={() => { setShowAIPanel(false); setShowImporter(true); }}
          onGenerateWorkflow={async (wfData) => {
            const wf = await base44.entities.Workflow.create({ project_id: projectId, ...wfData });
            queryClient.invalidateQueries({ queryKey: ["workflows", projectId] });
            setShowAIPanel(false);
            openWorkflow(wf);
          }}
        />
      )}
    </div>
  );
}