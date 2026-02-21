import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, GitBranch, MoreHorizontal, Trash2, Play, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusIcons = {
  draft: Clock,
  running: Play,
  completed: CheckCircle2,
  failed: XCircle,
};

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  running: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-600",
};

export default function WorkflowsTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "in_silico_simulation", description: "" });
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["project-workflows", project.id],
    queryFn: () =>
      base44.entities.Workflow.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Workflow.create({ ...data, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-workflows", project.id] });
      setShowNew(false);
      setForm({ title: "", type: "in_silico_simulation", description: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["project-workflows", project.id] }),
  });

  return (
    <div className="flex h-full">
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Workflows</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiOpen(!aiOpen)}
            className={`text-xs h-7 px-2.5 ${aiOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Notes Guide
          </Button>
          <Button
            onClick={() => setShowNew(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-40 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <GitBranch className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No workflows created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const StatusIcon = statusIcons[wf.status] || Clock;
            return (
              <div
                key={wf.id}
                className="bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{wf.title}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] uppercase ${statusStyles[wf.status] || statusStyles.draft}`}
                      >
                        <StatusIcon className="w-2.5 h-2.5 mr-1" />
                        {wf.status || "draft"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {wf.type?.replace(/_/g, " ") || "Unspecified"}
                    </p>
                    {wf.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{wf.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(wf.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Workflow</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) return;
              createMutation.mutate(form);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Workflow title"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_silico_simulation">In-Silico Simulation</SelectItem>
                  <SelectItem value="meta_analysis">Meta-Analysis</SelectItem>
                  <SelectItem value="comparative_modelling">Comparative Modelling</SelectItem>
                  <SelectItem value="statistical_analysis">Statistical Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the workflow..."
                className="text-sm h-20 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs"
                disabled={!form.title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Workflow"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    <TabAIPanel
      tabName="Workflows"
      contextData={workflows}
      isOpen={aiOpen}
      onToggle={() => setAiOpen(!aiOpen)}
    />
  </div>
  );
}