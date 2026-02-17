import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, MoreHorizontal, Trash2, X, Check, Edit2, Mail, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const statusStyles = {
  pending: "bg-gray-100 text-gray-600",
  in_review: "bg-amber-50 text-amber-600",
  running: "bg-blue-50 text-blue-600",
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
};

export default function ValidationTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "in_silico" });
  const queryClient = useQueryClient();

  const { data: validations = [], isLoading } = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () =>
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ValidationRequest.create({ ...data, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
      setShowNew(false);
      setForm({ title: "", type: "in_silico" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ValidationRequest.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] }),
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Validation</h2>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Submit Validation
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
      ) : validations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No validation requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {validations.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{v.title}</h3>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] uppercase ${statusStyles[v.status] || statusStyles.pending}`}
                    >
                      {(v.status || "pending").replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {v.type === "in_silico" ? "In-Silico Validation" : "Lab Submission"}
                  </p>
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
                      onClick={() => deleteMutation.mutate(v.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {(v.reproducibility_score != null || v.confidence_index != null) && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {v.reproducibility_score != null && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Reproducibility</p>
                      <Progress value={v.reproducibility_score} className="h-1.5" />
                      <p className="text-xs text-gray-600 mt-1">{v.reproducibility_score}%</p>
                    </div>
                  )}
                  {v.confidence_index != null && (
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Confidence</p>
                      <Progress value={v.confidence_index} className="h-1.5" />
                      <p className="text-xs text-gray-600 mt-1">{v.confidence_index}%</p>
                    </div>
                  )}
                </div>
              )}
              {v.results && (
                <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{v.results}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Submit Validation</DialogTitle>
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
                placeholder="Validation request title"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Pathway</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_silico">In-Silico Validation</SelectItem>
                  <SelectItem value="lab_submission">Submit to UniVerse Labs</SelectItem>
                </SelectContent>
              </Select>
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
                {createMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}