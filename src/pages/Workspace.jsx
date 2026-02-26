import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, MoreHorizontal, Trash2, FolderInput, Lightbulb, Upload, StickyNote, Edit3, FlaskConical, GitBranch, Archive, Shield, Box, ExternalLink, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { format } from "date-fns";

const typeIcons = {
  note: StickyNote,
  hypothesis: Lightbulb,
  cohort: FlaskConical,
  workflow: GitBranch,
  document: Archive,
  validation: Shield,
  asset: Box
};

const typeStyles = {
  note: "bg-gray-50 text-gray-600",
  hypothesis: "bg-amber-50 text-amber-600",
  cohort: "bg-blue-50 text-blue-600",
  workflow: "bg-purple-50 text-purple-600",
  document: "bg-green-50 text-green-600",
  validation: "bg-red-50 text-red-600",
  asset: "bg-indigo-50 text-indigo-600"
};

const typeLabels = {
  note: "Note",
  hypothesis: "Hypothesis",
  cohort: "Cohort",
  workflow: "Workflow",
  document: "Document",
  validation: "Validation",
  asset: "Asset"
};

export default function Workspace() {
  const [showNew, setShowNew] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [savingToProject, setSavingToProject] = useState(false);
  const [savedToProject, setSavedToProject] = useState(null);
  const [form, setForm] = useState({ title: "", type: "note", content: "" });
  const queryClient = useQueryClient();

  const [userEmail, setUserEmail] = useState(null);
  useEffect(() => {base44.auth.me().then((u) => setUserEmail(u.email)).catch(() => {});}, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["workspace-items", userEmail],
    queryFn: () => base44.entities.WorkspaceItem.filter({ created_by: userEmail }, "-created_date", 100),
    enabled: !!userEmail
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list", userEmail],
    queryFn: () => base44.entities.Project.filter({ created_by: userEmail }, "title", 100),
    enabled: !!userEmail
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkspaceItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      setShowNew(false);
      setForm({ title: "", type: "note", content: "" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkspaceItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      setEditingItem(null);
      setForm({ title: "", type: "note", content: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-items"] })
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, projectId, item }) => {
      // Create the appropriate entity based on type
      const entityData = {
        project_id: projectId,
        title: item.title,
        description: item.content,
        content: item.content
      };

      switch (item.type) {
        case "note":
          await base44.entities.Note.create({
            project_id: projectId,
            title: item.title,
            content: item.content || "",
            source: "manual"
          });
          break;
        case "hypothesis":
          await base44.entities.Hypothesis.create({
            project_id: projectId,
            title: item.title,
            description: item.content || "",
            status: "draft"
          });
          break;
        case "cohort":
          await base44.entities.Cohort.create({
            project_id: projectId,
            name: item.title,
            status: "draft"
          });
          break;
        case "workflow":
          await base44.entities.Workflow.create({
            project_id: projectId,
            title: item.title,
            description: item.content || "",
            status: "draft",
            type: "other"
          });
          break;
        case "document":
          if (item.file_url) {
            await base44.entities.ProjectDocument.create({
              project_id: projectId,
              title: item.title,
              file_url: item.file_url,
              file_type: "other"
            });
          }
          break;
        case "validation":
          await base44.entities.ValidationRequest.create({
            project_id: projectId,
            title: item.title,
            type: "in_silico",
            status: "pending"
          });
          break;
        case "asset":
          await base44.entities.Asset.create({
            project_id: projectId,
            title: item.title,
            type: "hypothesis",
            description: item.content || "",
            status: "draft"
          });
          break;
      }

      // Update workspace item as assigned
      await base44.entities.WorkspaceItem.update(id, { assigned_project_id: projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      queryClient.invalidateQueries({ queryKey: ["project-notes"] });
      queryClient.invalidateQueries({ queryKey: ["project-hypotheses"] });
      queryClient.invalidateQueries({ queryKey: ["project-cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["project-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      queryClient.invalidateQueries({ queryKey: ["project-validations"] });
      queryClient.invalidateQueries({ queryKey: ["project-assets"] });
    }
  });

  const saveToNewProjectMutation = useMutation({
    mutationFn: async ({ item, projectTitle }) => {
      const project = await base44.entities.Project.create({
        title: projectTitle,
        status: "draft"
      });
      await base44.entities.Note.create({
        project_id: project.id,
        title: item.title,
        content: item.content || "",
        source: "ai_copilot"
      });
      await base44.entities.WorkspaceItem.update(item.id, { assigned_project_id: project.id });
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-items"] });
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      setSavedToProject(project);
      setNewProjectTitle("");
    }
  });

  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryCounts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.keys(typeLabels).map((key) => ({
    type: key,
    label: typeLabels[key],
    icon: typeIcons[key],
    style: typeStyles[key],
    count: categoryCounts[key] || 0
  }));

  const filteredItems = selectedCategory ?
  items.filter((item) => item.type === selectedCategory) :
  items;

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#525153] text-2xl font-semibold tracking-tight">Workspace</h1>
          <p className="text-sm text-gray-400 mt-1">Personal scratchpad for unassigned ideas and data.</p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          size="sm" className="bg-[#000021] text-[#00f2ff] px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-8 hover:bg-blue-700">


          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Item
        </Button>
      </div>

      {isLoading ?
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) =>
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
        )}
        </div> :
      items.length === 0 ?
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Your workspace is empty. Add notes, ideas, or draft hypotheses here.</p>
        </div> :

      <>
          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedCategory(selectedCategory === cat.type ? null : cat.type)}
                className={`relative bg-white rounded-xl border-2 p-5 transition-all text-left hover:shadow-md ${
                selectedCategory === cat.type ?
                "border-blue-400 shadow-sm" :
                "border-gray-100 hover:border-gray-200"}`
                }>

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${cat.style}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{cat.label}</h3>
                  <p className="text-2xl font-bold text-gray-800">{cat.count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat.count === 1 ? "item" : "items"}
                  </p>
                </button>);

          })}
          </div>

          {/* Items List */}
          {selectedCategory &&
        <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-gray-700">
                Showing: {typeLabels[selectedCategory]}
              </h2>
              <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-blue-600 hover:text-blue-700">

                Clear filter
              </button>
            </div>
        }

          <div className="space-y-3">
            {filteredItems.map((item) => {
            const Icon = typeIcons[item.type] || StickyNote;
            const assignedProject = projects.find((p) => p.id === item.assigned_project_id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-100 p-5 hover:border-gray-200 transition-colors">

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      typeStyles[item.type] || typeStyles.note}`
                      }>

                        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => { setViewingItem(item); setSavedToProject(null); setNewProjectTitle(""); }}
                        >{item.title}</h3>
                        {item.content &&
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                      }
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                          variant="secondary"
                          className={`text-[10px] uppercase ${typeStyles[item.type] || typeStyles.note}`}>

                            {typeLabels[item.type] || item.type}
                          </Badge>
                          {assignedProject &&
                        <Badge variant="outline" className="text-[10px]">
                              <FolderInput className="w-2.5 h-2.5 mr-1" />
                              {assignedProject.title}
                            </Badge>
                        }
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
                          setSavedToProject(null);
                          setNewProjectTitle("");
                        }}>
                          <Edit3 className="w-3.5 h-3.5 mr-2" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                        onClick={() => {
                          setEditingItem(item);
                          setForm({ title: item.title, type: item.type, content: item.content || "" });
                          setSavedToProject(null);
                          setNewProjectTitle("");
                          // Scroll to new project input after dialog opens
                          setTimeout(() => document.getElementById("new-project-input")?.focus(), 200);
                        }}>
                          <FolderPlus className="w-3.5 h-3.5 mr-2" />
                          Save to New Project
                        </DropdownMenuItem>
                        {projects.length > 0 &&
                      <>
                            {projects.slice(0, 5).map((p) =>
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => assignMutation.mutate({ id: item.id, projectId: p.id, item })}>

                                <FolderInput className="w-3.5 h-3.5 mr-2" />
                                Assign to {p.title}
                              </DropdownMenuItem>
                        )}
                          </>
                      }
                        <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteMutation.mutate(item.id)}>

                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>);

          })}
          </div>
        </>
      }

      {/* View Item Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => {
        if (!open) { setViewingItem(null); setSavedToProject(null); setNewProjectTitle(""); }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              {viewingItem && (() => { const Icon = typeIcons[viewingItem.type] || StickyNote; return <Icon className="w-4 h-4 text-gray-500" />; })()}
              {viewingItem?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 mt-1">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {viewingItem.content || "No content."}
              </p>
              <div className="border-t pt-4">
                {savedToProject ? (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> Saved to project: <span className="font-semibold">{savedToProject.title}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Save to a new project</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="New project title…"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newProjectTitle.trim()) {
                            setSavingToProject(true);
                            saveToNewProjectMutation.mutate({ item: viewingItem, projectTitle: newProjectTitle }, { onSettled: () => setSavingToProject(false) });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={!newProjectTitle.trim() || savingToProject}
                        className="bg-[#000021] text-[#00f2ff] text-xs h-8"
                        onClick={() => {
                          setSavingToProject(true);
                          saveToNewProjectMutation.mutate({ item: viewingItem, projectTitle: newProjectTitle }, { onSettled: () => setSavingToProject(false) });
                        }}
                      >
                        {savingToProject ? "Saving…" : <><FolderPlus className="w-3.5 h-3.5 mr-1" /> Create</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showNew || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowNew(false);
          setEditingItem(null);
          setForm({ title: "", type: "note", content: "" });
          setSavedToProject(null);
          setNewProjectTitle("");
        }
      }}>
        <DialogContent className={editingItem?.type === "hypothesis" ? "sm:max-w-2xl" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingItem ? `Edit ${typeLabels[editingItem.type] || "Item"}` : "New Workspace Item"}
            </DialogTitle>
          </DialogHeader>

          {/* Hypothesis Editor — structured guided view */}
          {editingItem?.type === "hypothesis" ? (
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Hypothesis Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="A clear, testable statement of your hypothesis"
                  className="text-sm font-medium" />
              </div>

              {/* Guided notes sections */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Notes Guide — Structure Your Hypothesis</p>
                {[
                  { label: "Background / Rationale", placeholder: "What existing evidence or observation prompted this hypothesis?", key: "background" },
                  { label: "Proposed Mechanism", placeholder: "What biological or chemical mechanism are you proposing?", key: "mechanism" },
                  { label: "Predicted Outcome", placeholder: "What do you predict will happen if this hypothesis is correct?", key: "outcome" },
                  { label: "Suggested Validation Method", placeholder: "How could this be tested? (e.g. in silico, lab assay, cohort study)", key: "validation" },
                ].map((section) => {
                  // Parse structured content from the content field
                  const contentObj = (() => { try { return JSON.parse(form.content || "{}"); } catch { return { raw: form.content }; } })();
                  const value = contentObj[section.key] || (section.key === "background" && contentObj.raw ? contentObj.raw : "");
                  return (
                    <div key={section.key} className="space-y-1">
                      <Label className="text-[11px] font-medium text-gray-600">{section.label}</Label>
                      <Textarea
                        value={value}
                        onChange={(e) => {
                          const current = (() => { try { return JSON.parse(form.content || "{}"); } catch { return {}; } })();
                          // If it was previously raw text, move it to background on first structured edit
                          if (current.raw && section.key === "background") { delete current.raw; }
                          setForm({ ...form, content: JSON.stringify({ ...current, [section.key]: e.target.value }) });
                        }}
                        placeholder={section.placeholder}
                        className="text-xs h-16 resize-none bg-white"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Save to new project */}
              <div className="border-t pt-4">
                {savedToProject ? (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> Saved to project: <span className="font-semibold">{savedToProject.title}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-500">Save to a new project</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-project-input"
                        placeholder="New project title…"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="text-sm h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newProjectTitle.trim() || savingToProject}
                        className="bg-[#000021] text-[#00f2ff] text-xs h-8 whitespace-nowrap"
                        onClick={() => {
                          setSavingToProject(true);
                          saveToNewProjectMutation.mutate(
                            { item: { ...editingItem, title: form.title, content: form.content }, projectTitle: newProjectTitle },
                            { onSettled: () => setSavingToProject(false) }
                          );
                        }}
                      >
                        {savingToProject ? "Saving…" : <><FolderPlus className="w-3.5 h-3.5 mr-1" /> Create</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingItem(null); setForm({ title: "", type: "note", content: "" }); setSavedToProject(null); setNewProjectTitle(""); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                  disabled={!form.title.trim() || updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: editingItem.id, data: form })}
                >
                  {updateMutation.isPending ? "Saving..." : "Update Hypothesis"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Standard editor for all other types */
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
              className="space-y-4 mt-2">

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="What's on your mind?"
                  className="text-sm" />
              </div>
              {!editingItem && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="hypothesis">Hypothesis</SelectItem>
                      <SelectItem value="cohort">Cohort</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="validation">Validation Request</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your thoughts..."
                  className="text-sm h-24 resize-none" />
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
                  disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingItem ? "Update" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>);

}