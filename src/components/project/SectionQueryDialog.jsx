import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";

export default function SectionQueryDialog({
  open,
  onOpenChange,
  sectionName,
  sectionData,
  project,
  onSaveToNotes,
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const dataStr = typeof sectionData === "string" 
      ? sectionData 
      : JSON.stringify(sectionData, null, 2);

    const prompt = `You are a research progression assistant. The user is working on "${project.title}" in the "${sectionName}" section of their research project.

Project Context:
- Title: ${project.title}
- Field: ${project.field || "Unspecified"}
- Status: ${project.status}
- Description: ${project.description || "No description"}

Current Section Data:
${dataStr}

User Question: ${query}

Provide a focused, actionable response that:
1. Addresses their specific question
2. Identifies any gaps or areas needing clarification
3. Suggests next steps or improvements
4. Ensures alignment with their research objectives`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    setResult(response);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!saveTitle.trim() || !result) return;
    setSaving(true);
    
    await onSaveToNotes({
      title: saveTitle,
      content: `**Query:** ${query}\n\n**Response:**\n\n${result}`,
      source: "section_query",
    });

    setSaving(false);
    setSaveTitle("");
    setQuery("");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Query {sectionName}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            Ask the AI to analyze your {sectionName.toLowerCase()} and check alignment with your research objectives.
          </p>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {!result ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Your Question
                </Label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`e.g. Are my ${sectionName.toLowerCase()} aligned with the research objective? What gaps do I have?`}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 resize-none h-24"
                />
              </div>
              <Button
                onClick={handleQuery}
                disabled={!query.trim() || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Query & Analyze
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Query</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{query}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Analysis</p>
                <div className="bg-white border border-gray-100 rounded-lg p-4 text-sm prose prose-sm prose-gray max-w-none">
                  <ReactMarkdown className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {result}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Save to Notes (Optional)
              </Label>
              <Input
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Query Results - Methodology Alignment"
                className="text-sm"
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          {result ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setQuery("");
                  setSaveTitle("");
                }}
              >
                New Query
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-xs"
                disabled={!saveTitle.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1.5" />
                    Save to Notes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}