import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, X, ChevronRight } from "lucide-react";
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

  const getLinkedNote = (validation) => {
    if (!validation.results) return null;
    return projectNotes.find(n => n.content === validation.results);
  };

  if (expandedNote) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{expandedNote.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpandedNote(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
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
      </div>
    );
  }

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
          New Validation
        </Button>
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
            const linkedNote = getLinkedNote(v);
            return (
              <div key={v.id} className="bg-white rounded-lg border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-900">{v.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{v.type}</p>
                {linkedNote && (
                  <button
                    onClick={() => setExpandedNote(linkedNote)}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    View Note →
                  </button>
                )}
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