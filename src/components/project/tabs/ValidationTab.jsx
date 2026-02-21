import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, X, ChevronRight, Trash2, Send, Sparkles } from "lucide-react";
import TabAIPanel from "./TabAIPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ValidationAssistant from "./ValidationAssistant";

export default function ValidationTab({ project }) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", type: "in_silico" });
  const [expandedNote, setExpandedNote] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: validations = [], isLoading } = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () =>
      base44.entities.ValidationRequest.filter({ project_id: project.id }, "-created_date", 100),
  });

  const { data: projectNotes = [] } = useQuery({
    queryKey: ["project-notes", project.id],
    queryFn: () => base44.entities.Note.filter({ project_id: project.id }, "-updated_date"),
    initialData: [],
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] }),
  });

  const getLinkedNote = (validation) => {
    if (!validation.results) return null;
    return projectNotes.find(n => n.content === validation.results);
  };

  const handleApplySuggestion = useCallback(async (originalExcerpt, suggestionText) => {
    if (!expandedNote || !expandedNote.id) return;
    let newContent = expandedNote.content || "";

    if (originalExcerpt && newContent.includes(originalExcerpt)) {
      // Find the paragraph/block that contains the original excerpt and replace it
      const paragraphs = newContent.split(/\n\n+/);
      const matchIdx = paragraphs.findIndex((p) => p.includes(originalExcerpt));
      if (matchIdx !== -1) {
        paragraphs[matchIdx] = suggestionText;
        newContent = paragraphs.join("\n\n");
      } else {
        // Fallback: inline replace the excerpt itself
        newContent = newContent.replace(originalExcerpt, suggestionText);
      }
    } else {
      // No match found — append as a new section
      newContent = newContent ? `${newContent}\n\n${suggestionText}` : suggestionText;
    }

    await base44.entities.Note.update(expandedNote.id, { content: newContent });
    queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
    setExpandedNote((prev) => ({ ...prev, content: newContent }));
  }, [expandedNote, project.id, queryClient]);

  if (expandedNote) {
    const isAssistantVisible = assistantOpen !== false;
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{expandedNote.title}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const note = expandedNote;
                await base44.entities.Asset.create({
                  project_id: project.id,
                  title: note.title,
                  type: "publication",
                  description: note.content?.slice(0, 300),
                  status: "validated",
                });
                queryClient.invalidateQueries({ queryKey: ["project-assets", project.id] });
                setExpandedNote(null);
                alert("Published to Assets ✓");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              <Send className="w-3 h-3 mr-1.5" />
              Publish to Assets
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedValidation(validations.find(v => getLinkedNote(v)?.id === expandedNote.id));
                setAssistantOpen(!isAssistantVisible);
              }}
              className="text-xs text-gray-500 hover:text-blue-600"
            >
              {isAssistantVisible ? (
                <>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Close Assistant
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mr-1.5" />
                  Guide
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpandedNote(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-sm text-gray-600 mb-6">
                Created {new Date(expandedNote.created_date).toLocaleDateString()}
              </div>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                {expandedNote.content}
              </div>
            </div>
          </div>
          <ValidationAssistant
            validation={selectedValidation}
            linkedNote={expandedNote}
            isOpen={isAssistantVisible}
            onToggle={() => setAssistantOpen(!isAssistantVisible)}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Validation</h2>
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
            New Validation
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : validations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Shield className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No validations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {validations.map((v) => {
            const linkedNote = projectNotes.find(n => n.id === v.note_id) || getLinkedNote(v);
            return (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedValidation(v);
                  if (linkedNote) {
                    setExpandedNote(linkedNote);
                    setAssistantOpen(true);
                  } else {
                    // Open with a blank note placeholder so the guide can still help
                    setExpandedNote({ id: null, title: v.title, content: v.results || "", created_date: v.created_date });
                    setAssistantOpen(true);
                  }
                }}
                className="bg-white rounded-lg border border-gray-100 p-4 cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{v.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{v.type?.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this validation?")) deleteMutation.mutate(v.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">New Validation</DialogTitle>
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
                placeholder="Validation title"
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
                disabled={!form.title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}