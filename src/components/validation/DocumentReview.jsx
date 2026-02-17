import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Save, History, Loader2, Check } from "lucide-react";

export default function DocumentReview({ validation, note, onClose, onEditNote }) {
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();





  if (!note) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No note linked to this validation</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between bg-white">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{note.title}</h3>
          <p className="text-sm text-gray-500 mt-1">Review & Track Changes</p>
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
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
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

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-base text-gray-700 whitespace-pre-wrap overflow-y-auto" style={{ minHeight: '600px' }}>
          {note.content}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-6 flex gap-2 bg-gray-50">
       <Button
         className="bg-blue-600 hover:bg-blue-700 text-xs"
         onClick={onEditNote}
       >
         Edit Note
       </Button>
       <Button
         variant="outline"
         onClick={onClose}
         className="text-xs"
       >
         Close
       </Button>
      </div>
    </div>
  );
}