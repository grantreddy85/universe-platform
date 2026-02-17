import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, MoreHorizontal, Trash2, FolderInput, Lightbulb, Upload, StickyNote, Edit3 } from "lucide-react";
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
import { format } from "date-fns";

const typeIcons = {
  note: StickyNote,
  hypothesis_draft: Lightbulb,
  data_upload: Upload,
  idea: Lightbulb,
};

const typeStyles = {
  note: "bg-gray-50 text-gray-600",
  hypothesis_draft: "bg-amber-50 text-amber-600",
  data_upload: "bg-blue-50 text-blue-600",
  idea: "bg-violet-50 text-violet-600",
};

export default function Workspace() {
  const [showNew, setShowNew] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ title: "", type: "note", content: "" });
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["workspace-items"],
    queryFn: () => base44.entities.WorkspaceItem.list("-created_date", 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => base44.entities.Project.list("title", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkspaceItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      setShowNew(false);
      setForm({ title: "", type: "note", content: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkspaceItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      setEditingItem(null);
      setForm({ title: "", type: "note", content: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-items"] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, projectId }) =>
      base44.entities.WorkspaceItem.update(id, { assigned_project_id: projectId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-items"] }),
  });

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Workspace</h1>
          <p className="text-sm text-gray-400 mt-1">Personal scratchpad for unassigned ideas and data.</p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Item
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Your workspace is empty. Add notes, ideas, or draft hypotheses here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = typeIcons[item.type] || StickyNote;
            const assignedProject = projects.find((p) => p.id === item.assigned_project_id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        typeStyles[item.type] || typeStyles.note
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      {item.content && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase ${typeStyles[item.type] || typeStyles.note}`}
                        >
                          {item.type?.replace(/_/g, " ")}
                        </Badge>
                        {assignedProject && (
                          <Badge variant="outline" className="text-[10px]">
                            <FolderInput className="w-2.5 h-2.5 mr-1" />
                            {assignedProject.title}
                          </Badge>
                        )}
                        <span className="text-[11px] text-gray-400">
                          {item.created_date && format(new Date(item.created_date), "MMM d")}
                        </span>
                      </div>
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
                        onClick={() => {
                          setEditingItem(item);
                          setForm({ title: item.title, type: item.type, content: item.content || "" });
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {projects.length > 0 && (
                        <>
                          {projects.slice(0, 5).map((p) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => assignMutation.mutate({ id: item.id, projectId: p.id })}
                            >
                              <FolderInput className="w-3.5 h-3.5 mr-2" />
                              Assign to {p.title}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(item.id)}
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

      <Dialog open={showNew || editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowNew(false);
          setEditingItem(null);
          setForm({ title: "", type: "note", content: "" });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? "Edit Item" : "New Workspace Item"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) return;
              if (editingItem) {
                updateMutation.mutate({ id: editingItem.id, data: form });
              } else {
                createMutation.mutate(form);
              }
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's on your mind?"
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
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="hypothesis_draft">Hypothesis Draft</SelectItem>
                  <SelectItem value="data_upload">Data Upload</SelectItem>
                  <SelectItem value="idea">Idea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your thoughts..."
                className="text-sm h-24 resize-none"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setShowNew(false);
                setEditingItem(null);
                setForm({ title: "", type: "note", content: "" });
              }}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs"
                disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingItem ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}