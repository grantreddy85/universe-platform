import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  StickyNote,
  Trash2,
  Send,
  Save,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import NotesAssistant from "./NotesAssistant";
import SectionQueryDialog from "../SectionQueryDialog";
import NoteAIPanel from "./NoteAIPanel";

const sourceStyles = {
  manual: "bg-gray-100 text-gray-600",
  research_chat: "bg-blue-50 text-blue-600",
  ai_copilot: "bg-violet-50 text-violet-600",
};

const sourceLabel = {
  manual: "Manual",
  research_chat: "Research",
  ai_copilot: "AI Copilot",
};

export default function NotesTab({ project }) {
  const [selectedNote, setSelectedNote] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [isDirty, setIsDirty] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const isNew = selectedNote === "new";
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["project-notes", project.id],
    queryFn: () => base44.entities.Note.filter({ project_id: project.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Note.create({ ...data, project_id: project.id, source: "manual" }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
      setIsDirty(false);
      setSelectedNote(created);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
      setIsDirty(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
      setSelectedNote(null);
      setForm({ title: "", content: "" });
    },
  });

  const sendForValidation = async (note) => {
    await base44.entities.ValidationRequest.create({
      project_id: project.id,
      title: `Validation: ${note.title}`,
      type: "in_silico",
      status: "pending",
      results: note.content,
      linked_assets: [],
    });
    queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
  };

  const openNote = (note) => {
    setSelectedNote(note);
    setForm({ title: note.title, content: note.content || "" });
    setIsDirty(false);
  };

  const openNew = () => {
    setSelectedNote("new");
    setForm({ title: "", content: "" });
    setIsDirty(false);
  };

  const closeEditor = () => {
    setSelectedNote(null);
    setForm({ title: "", content: "" });
    setIsDirty(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (selectedNote === "new") {
      createMutation.mutate(form);
    } else {
      updateMutation.mutate({ id: selectedNote.id, data: form });
    }
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const isEditorOpen = selectedNote !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex h-[calc(100vh-130px)]">
      {/* Notes List Panel */}
      <div
        className={`flex flex-col border-r border-gray-100 bg-white transition-all duration-300 ${
          isEditorOpen ? "w-64 flex-shrink-0" : "flex-1"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className={`text-xs h-7 px-2.5 ${assistantOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
              title="Notes Guide"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Notes Guide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueryDialog(true)}
              className="text-xs text-gray-500 hover:text-green-600 h-7 px-2"
              title="Query notes"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>

            <Button
              onClick={openNew}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-2.5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <StickyNote className="w-8 h-8 text-gray-200 mb-3" />
              <p className="text-xs text-gray-400">No notes yet.</p>
              <p className="text-xs text-gray-400">Create one or save from Research chat.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notes.map((note) => {
                const isActive = selectedNote && selectedNote !== "new" && selectedNote.id === note.id;
                return (
                  <button
                    key={note.id}
                    onClick={() => openNote(note)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StickyNote className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                      <span className={`text-xs font-medium truncate ${isActive ? "text-blue-800" : "text-gray-800"}`}>
                        {note.title}
                      </span>
                    </div>
                    {note.source && (
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase ${sourceStyles[note.source] || sourceStyles.manual}`}
                      >
                        {sourceLabel[note.source] || note.source}
                      </Badge>
                    )}
                    {!isEditorOpen && note.content && (
                      <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2">{note.content}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {note.created_date && format(new Date(note.created_date), "MMM d, yyyy")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {isEditorOpen && (
        <div className="flex-1 flex flex-col bg-[#fafbfc] min-w-0">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              {!isNew && selectedNote?.source && (
                <Badge
                  variant="secondary"
                  className={`text-[10px] uppercase ${sourceStyles[selectedNote.source] || sourceStyles.manual}`}
                >
                  {sourceLabel[selectedNote.source] || selectedNote.source}
                </Badge>
              )}
              {isDirty && (
                <span className="text-[11px] text-amber-500">Unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-blue-600 h-7 px-2.5"
                  onClick={() => sendForValidation(selectedNote)}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send for Validation
                </Button>
              )}
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssistantOpen(!assistantOpen)}
                  className={`text-xs h-7 px-2.5 ${assistantOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
                  title="Notes Guide"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Notes Guide
                </Button>
              )}
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2.5"
                  onClick={() => deleteMutation.mutate(selectedNote.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.title.trim() || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-3"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <button
                onClick={closeEditor}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <Input
              value={form.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              placeholder="Note title..."
              className="text-xl font-semibold border-none shadow-none bg-transparent px-0 h-auto focus-visible:ring-0 text-gray-900 placeholder:text-gray-300 mb-4"
            />
            <Textarea
              value={form.content}
              onChange={(e) => handleFormChange("content", e.target.value)}
              placeholder="Start writing your note here..."
              className="w-full border-none shadow-none bg-transparent px-0 resize-none focus-visible:ring-0 text-sm text-gray-700 placeholder:text-gray-300 leading-relaxed"
              style={{ minHeight: "calc(100vh - 280px)" }}
            />
          </div>
        </div>
      )}

      {/* Notes Guide AI Assistant */}
      <NotesAssistant
        allNotes={notes}
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen(!assistantOpen)}
      />

      {/* Section Query Dialog */}
      <SectionQueryDialog
        open={showQueryDialog}
        onOpenChange={setShowQueryDialog}
        sectionName="Notes"
        sectionData={notes.map((n) => ({ title: n.title, content: n.content }))}
        project={project}
        onSaveToNotes={async ({ title, content, source }) => {
          await base44.entities.Note.create({
            project_id: project.id,
            title,
            content,
            source: source || "manual",
          });
          queryClient.invalidateQueries({ queryKey: ["project-notes", project.id] });
        }}
      />
    </div>
  );
}