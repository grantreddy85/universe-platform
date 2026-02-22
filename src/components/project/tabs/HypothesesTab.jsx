import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lightbulb, MoreHorizontal, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LabRecommendations from "../LabRecommendations";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  testing: "bg-blue-50 text-blue-600",
  validated: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
};

const confidenceColor = (score) => {
  if (!score) return "bg-gray-100";
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-400";
};

export default function HypothesesTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", status: "draft", confidence: "" });
  const queryClient = useQueryClient();

  const { data: hypotheses = [], isLoading } = useQuery({
    queryKey: ["project-hypotheses", project.id],
    queryFn: () => base44.entities.Hypothesis.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Hypothesis.create({
        ...data,
        project_id: project.id,
        confidence: data.confidence ? Number(data.confidence) : undefined,
        source: "manual",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-hypotheses", project.id] });
      setShowNew(false);
      setForm({ title: "", description: "", status: "draft", confidence: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Hypothesis.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-hypotheses", project.id] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Hypothesis.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-hypotheses", project.id] }),
  });

  return (
    <div className="p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Hypotheses</h2>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Hypothesis
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-full bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : hypotheses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Lightbulb className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No hypotheses yet.</p>
          <p className="text-xs text-gray-300 mt-1">Create one manually or generate using the AI tab.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {hypotheses.map((h) => {
            const isExpanded = expandedId === h.id;
            return (
              <div
                key={h.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors"
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{h.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase ${statusStyles[h.status] || statusStyles.draft}`}
                        >
                          {h.status || "draft"}
                        </Badge>
                        {h.source === "ai_generated" && (
                          <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI Generated
                          </span>
                        )}
                      </div>
                      {h.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{h.description}</p>
                      )}
                      {h.confidence != null && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confidenceColor(h.confidence)}`}
                              style={{ width: `${h.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{h.confidence}% confidence</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : h.id)}
                        className="text-[10px] flex items-center gap-1 text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Lab Tests</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: h.id, status: "testing" })}>
                            Mark Testing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: h.id, status: "validated" })}>
                            Mark Validated
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: h.id, status: "rejected" })}>
                            Mark Rejected
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(h.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Lab Recommendations Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-50 pt-3">
                    <LabRecommendations hypothesis={h} project={project} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Hypothesis Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Hypothesis</DialogTitle>
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
                placeholder="e.g. MRSA resistance is driven by efflux pump overexpression"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the hypothesis in detail..."
                className="text-sm h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="validated">Validated</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Confidence %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.confidence}
                  onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                  placeholder="0–100"
                  className="text-sm"
                />
              </div>
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
                {createMutation.isPending ? "Creating..." : "Create Hypothesis"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}