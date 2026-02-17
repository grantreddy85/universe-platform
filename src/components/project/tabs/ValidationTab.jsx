import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, MoreHorizontal, Trash2, X, Check, Edit2, Mail, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DocumentReview from "@/components/validation/DocumentReview";
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
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [editingResults, setEditingResults] = useState(false);
  const [editingApprovers, setEditingApprovers] = useState(false);
  const [resultsText, setResultsText] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [showHistory, setShowHistory] = useState(false);
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

  const selectedNote = selectedValidation?.note_id 
    ? projectNotes.find(n => n.id === selectedValidation.note_id)
    : null;

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

  const updateResultsMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ValidationRequest.update(data.id, { results: data.results }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
      setEditingResults(false);
      setSelectedValidation(null);
    },
  });

  const addApproverMutation = useMutation({
    mutationFn: (data) => {
      const updated = [...(data.validation.approvers || []), data.email];
      return base44.entities.ValidationRequest.update(data.validation.id, { approvers: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
      setApproverEmail("");
    },
  });

  const removeApproverMutation = useMutation({
    mutationFn: (data) => {
      const updated = (data.validation.approvers || []).filter((e) => e !== data.email);
      return base44.entities.ValidationRequest.update(data.validation.id, { approvers: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] });
    },
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
        <div className="grid grid-cols-3 gap-6">
          {/* Validation List */}
          <div className="col-span-2 space-y-3">
            {validations.map((v) => (
             <button
               key={v.id}
               onClick={() => {
                   setSelectedValidation(v);
                   setResultsText(v.results || "");
                   setEditingResults(false);
                 }}
                className={`w-full text-left bg-white rounded-lg border p-5 hover:border-gray-300 transition-all ${
                  selectedValidation?.id === v.id ? "border-blue-300 ring-1 ring-blue-100 bg-blue-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
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
                  <DropdownMenu onClick={(e) => e.stopPropagation()}>
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
              </button>
            ))}
          </div>

          {/* Details Panel */}
          {selectedValidation && (
            <div className="col-span-1 bg-white rounded-xl border border-gray-100 p-5 space-y-5 max-h-[600px] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Results</h4>
                {editingResults ? (
                  <div className="space-y-2">
                    <Textarea
                      value={resultsText}
                      onChange={(e) => setResultsText(e.target.value)}
                      className="text-xs h-32"
                      placeholder="Add validation results..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs flex-1"
                        onClick={() => updateResultsMutation.mutate({ id: selectedValidation.id, results: resultsText })}
                        disabled={updateResultsMutation.isPending}
                      >
                        {updateResultsMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingResults(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {resultsText ? (
                      <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-2">{resultsText}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-2">No results added yet</p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingResults(true)}
                      className="text-xs text-blue-600 hover:bg-blue-50 w-full justify-start"
                    >
                      <Edit2 className="w-3 h-3 mr-1.5" />
                      {resultsText ? "Edit Results" : "Add Results"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Document Review</h4>
                {projectNotes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedValidation.note_id ? (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-900 font-medium mb-2">Linked Note</p>
                        <p className="text-xs text-blue-700 mb-3">{selectedNote?.title}</p>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs w-full"
                          onClick={() => setReviewingNote(true)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Review & Track Changes
                        </Button>
                      </div>
                    ) : (
                      <Select 
                        onValueChange={(noteId) => {
                          const mutation = useMutation({
                            mutationFn: (data) => base44.entities.ValidationRequest.update(data.id, { note_id: data.note_id }),
                            onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-validations", project.id] }),
                          });
                          mutation.mutate({ id: selectedValidation.id, note_id: noteId });
                        }}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select note to review..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projectNotes.map(n => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No notes available for this project</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Approvers</h4>
                {editingApprovers ? (
                  <div className="space-y-2">
                    <Input
                      value={approverEmail}
                      onChange={(e) => setApproverEmail(e.target.value)}
                      placeholder="approver@example.com"
                      type="email"
                      className="text-xs h-8"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs flex-1"
                        onClick={() => {
                          if (approverEmail.trim() && !selectedValidation.approvers?.includes(approverEmail)) {
                            addApproverMutation.mutate({ validation: selectedValidation, email: approverEmail.trim() });
                          }
                        }}
                        disabled={!approverEmail.trim() || addApproverMutation.isPending}
                      >
                        {addApproverMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingApprovers(false)}
                        className="text-xs"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {selectedValidation.approvers?.length > 0 ? (
                      <div className="space-y-1.5 mb-2">
                        {selectedValidation.approvers.map((email) => (
                          <div key={email} className="flex items-center justify-between bg-blue-50 rounded-lg p-2 border border-blue-200 text-xs">
                            <span className="text-gray-700">{email}</span>
                            <button
                              onClick={() => removeApproverMutation.mutate({ validation: selectedValidation, email })}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-2">No approvers assigned</p>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingApprovers(true)}
                      className="text-xs text-blue-600 hover:bg-blue-50 w-full justify-start"
                    >
                      <Mail className="w-3 h-3 mr-1.5" />
                      Add Approver
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {reviewingNote && selectedNote && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <DocumentReview 
            validation={selectedValidation} 
            note={selectedNote}
            onClose={() => setReviewingNote(false)}
            onEditNote={() => {
              setReviewingNote(false);
              // Navigate to Notes tab and select the note for editing
              // This assumes a parent component handles tab switching
            }}
          />
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