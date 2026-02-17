import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Save, History, Loader2, Check } from "lucide-react";

export default function DocumentReview({ validation, note, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note?.content || "");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setEditedContent(note?.content || "");
  }, [note]);

  const updateMutation = useMutation({
    mutationFn: async (newContent) => {
      // Update the note
      await base44.entities.Note.update(note.id, { content: newContent });

      // Track edit in validation history
      const user = await base44.auth.me();
      const editHistory = validation.edit_history || [];
      const newEdit = {
        editor_email: user.email,
        timestamp: new Date().toISOString(),
        original_content: note.content,
        edited_content: newContent,
        change_summary: `Edited by ${user.full_name || user.email}`
      };

      // Update validation request with new edit history
      await base44.entities.ValidationRequest.update(validation.id, {
        edit_history: [...editHistory, newEdit]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-notes"] });
      queryClient.invalidateQueries({ queryKey: ["project-validations"] });
      setIsEditing(false);
    },
  });

  if (!note) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No note linked to this validation</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{note.title}</h3>
          <p className="text-xs text-gray-500 mt-1">Review & Track Changes</p>
        </div>
        <div className="flex gap-2">
          {validation.edit_history?.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-blue-600 hover:bg-blue-50"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              History ({validation.edit_history.length})
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showHistory && validation.edit_history?.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 space-y-3 mb-4">
            <h4 className="text-xs font-semibold text-blue-900 uppercase">Edit History</h4>
            <div className="space-y-2">
              {validation.edit_history.map((edit, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{edit.editor_email}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(edit.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{edit.change_summary}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      <p className="font-medium text-red-700 mb-1">Before:</p>
                      <p className="text-red-600 line-clamp-2">{edit.original_content}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="font-medium text-green-700 mb-1">After:</p>
                      <p className="text-green-600 line-clamp-2">{edit.edited_content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEditing ? (
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
              Edit Document
            </label>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="h-96 text-sm"
              placeholder="Edit the document content..."
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
              Document Content
            </label>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
              {note.content}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4 flex gap-2">
        {isEditing ? (
          <>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-xs flex-1"
              onClick={() => updateMutation.mutate(editedContent)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedContent(note.content);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="text-xs w-full"
          >
            Suggest Changes
          </Button>
        )}
      </div>
    </div>
  );
}