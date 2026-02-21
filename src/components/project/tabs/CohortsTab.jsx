import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FlaskConical, MoreHorizontal, Trash2, Sparkles } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  defined: "bg-blue-50 text-blue-600",
  queried: "bg-amber-50 text-amber-600",
  assigned: "bg-emerald-50 text-emerald-600",
};

export default function CohortsTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", organism: "", strain: "", sample_size: "" });
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: cohorts = [], isLoading } = useQuery({
    queryKey: ["project-cohorts", project.id],
    queryFn: () => base44.entities.Cohort.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Cohort.create({
        ...data,
        project_id: project.id,
        sample_size: data.sample_size ? Number(data.sample_size) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-cohorts", project.id] });
      setShowNew(false);
      setForm({ name: "", organism: "", strain: "", sample_size: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cohort.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-cohorts", project.id] }),
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Cohorts</h2>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Cohort
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-40 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <FlaskConical className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No cohorts defined yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cohorts.map((cohort) => (
            <div
              key={cohort.id}
              className="bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{cohort.name}</h3>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase ${statusStyles[cohort.status] || statusStyles.draft}`}
                    >
                      {cohort.status || "draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    {cohort.organism && <span>Organism: {cohort.organism}</span>}
                    {cohort.strain && <span>Strain: {cohort.strain}</span>}
                    {cohort.sample_size && <span>n = {cohort.sample_size}</span>}
                  </div>
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
                      onClick={() => deleteMutation.mutate(cohort.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Cohort</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim()) return;
              createMutation.mutate(form);
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cohort name"
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Organism</Label>
                <Input
                  value={form.organism}
                  onChange={(e) => setForm({ ...form, organism: e.target.value })}
                  placeholder="e.g. S. aureus"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Strain</Label>
                <Input
                  value={form.strain}
                  onChange={(e) => setForm({ ...form, strain: e.target.value })}
                  placeholder="e.g. MRSA ST239"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Sample Size</Label>
              <Input
                type="number"
                value={form.sample_size}
                onChange={(e) => setForm({ ...form, sample_size: e.target.value })}
                placeholder="Target n"
                className="text-sm"
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
                disabled={!form.name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Cohort"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}