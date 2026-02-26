import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function CohortAssistantDialog({
  open,
  onOpenChange,
  onCohortCreated,
  activeFilters,
  onFiltersApply,
  project,
}) {
  const [stage, setStage] = useState("question"); // question, recommending, review, destination
  const [question, setQuestion] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [cohortName, setCohortName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);
  const [sampleSize, setSampleSize] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const generateCohortName = (filterCount, question) => {
    const suggestions = [
      "Disease Cohort",
      "Clinical Population",
      "Research Cohort",
      "Study Group",
      "Patient Cohort",
      "Control Group",
    ];
    
    const words = question.toLowerCase().split(" ");
    const keyWords = words.filter(w => w.length > 4 && !["which", "what", "should", "would", "could"].includes(w));
    
    if (keyWords.length > 0) {
      return keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1) + " Cohort";
    }
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const handleAskAssistant = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setStage("recommending");

    const projectContext = project ? `
Project Context:
- Title: ${project.title}
- Description: ${project.description || "No description"}
- Field: ${project.field || "Not specified"}
- Tags: ${project.tags?.join(", ") || "None"}
- Status: ${project.status}` : "";

    const prompt = `${projectContext}

Based on this research question or requirement: "${question}"
    
Recommend a cohort specification that aligns with the project goals (if provided) with:
1. Key filters (age groups, organism types, data types, phenotypes, etc.) - be specific with values
2. Target sample size (realistic number)
3. Brief reasoning (1-2 sentences why this specification fits the project)

Format your response as JSON with these fields:
{
  "filters": ["age:30-45 Yr", "organism:Homo Sapiens", "data_type:RNA-Seq"],
  "sample_size": 150,
  "reasoning": "This cohort targets adult humans with gene expression data, suitable for studying age-related transcriptional changes."
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          filters: { type: "array", items: { type: "string" } },
          sample_size: { type: "number" },
          reasoning: { type: "string" },
        },
      },
    });

    const genName = generateCohortName(response.filters.length, question);
    setRecommendation(response);
    setCohortName(genName);
    setSelectedFilters(response.filters);
    setSampleSize(response.sample_size.toString());
    setStage("review");
    setIsLoading(false);
  };

  const handleCreateCohort = () => {
    onFiltersApply(selectedFilters, sampleSize);
    onCohortCreated({
      name: cohortName,
      sample_size: parseInt(sampleSize),
      filters: selectedFilters,
    });
    resetDialog();
  };

  const resetDialog = () => {
    setStage("question");
    setQuestion("");
    setRecommendation(null);
    setCohortName("");
    setSelectedFilters(activeFilters);
    setSampleSize("");
    onOpenChange(false);
  };

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Cohort Assistant
          </DialogTitle>
        </DialogHeader>

        {stage === "question" && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
               <Label className="text-sm font-medium">What cohort do you need?</Label>
               <p className="text-xs text-gray-500">
                 {project ? `I understand your project context. Ask me anything about your research needs for "${project.title}" and I'll recommend a cohort specification.` : "Ask me anything about your research needs and I'll recommend a cohort specification."}
               </p>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., 'I need healthy adult humans with RNA-seq data for a transcriptomics study'"
                className="text-sm min-h-20"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAskAssistant}
                disabled={!question.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Recommend
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "recommending" && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Analyzing your requirements...</p>
            </div>
          </div>
        )}

        {stage === "review" && recommendation && (
          <div className="flex flex-col mt-4" style={{maxHeight: "70vh"}}>
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">{recommendation.reasoning}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Cohort Name</Label>
                <Input
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Sample Size</Label>
                <Input
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Recommended Filters ({selectedFilters.length})
                </Label>
                <div className="space-y-2">
                  {recommendation.filters.map((filter) => {
                    const isSelected = selectedFilters.includes(filter);
                    return (
                      <button
                        key={filter}
                        onClick={() => toggleFilter(filter)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-blue-300"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                        <span className="text-xs text-gray-700 flex-1 text-left">{filter}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStage("question")}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateCohort}
                disabled={!cohortName.trim() || !sampleSize}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Save Cohort
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}