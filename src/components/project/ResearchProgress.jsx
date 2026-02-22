import React from "react";
import { CheckCircle2, Circle, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES = [
  {
    id: "vault",
    name: "Build Knowledge Base",
    description: "Upload unpublished data, papers and results to your RAG vault",
    tab: "vault",
    icon: "🗄️",
    check: ({ vaultDocs }) => vaultDocs.length > 0,
    hint: "Upload at least one document to seed your AI knowledge base",
    cta: "Go to Vault",
  },
  {
    id: "notes",
    name: "Observation & Notes",
    description: "Capture your initial observations and research context",
    tab: "notes",
    icon: "📝",
    check: ({ notes }) => notes.length > 0,
    hint: "Add your first note to begin documenting your research",
    cta: "Go to Notes",
  },
  {
    id: "hypothesis",
    name: "Hypothesis",
    description: "Formulate a testable research hypothesis",
    tab: "vault",
    icon: "💡",
    check: ({ hypotheses }) => hypotheses.length > 0,
    hint: "Define at least one hypothesis — the AI can help based on your Vault",
    cta: "Go to Vault",
  },
  {
    id: "experiment",
    name: "Experiment & Analysis",
    description: "Run workflows, use lab services or cohorts to gather data",
    tab: "workflows",
    icon: "🔬",
    check: ({ workflows, labRequests }) => workflows.length > 0 || labRequests.length > 0,
    hint: "Set up a workflow or submit a lab request",
    cta: "Go to Workflows",
  },
  {
    id: "validation",
    name: "Validation",
    description: "Validate your findings with peer review or in-silico analysis",
    tab: "validation",
    icon: "🛡️",
    check: ({ validations }) => validations.some(v => v.status === "approved"),
    inProgress: ({ validations }) => validations.length > 0,
    hint: "Send a note for validation to verify your findings",
    cta: "Go to Validation",
  },
  {
    id: "assets",
    name: "Publish & Tokenise",
    description: "Create research assets and publish your findings",
    tab: "assets",
    icon: "📋",
    check: ({ assets }) => assets.length > 0,
    hint: "Create an asset from your validated research",
    cta: "Go to Assets",
  },
];

export default function ResearchProgress({ counts, onTabChange }) {
  const { notes = [], hypotheses = [], workflows = [], labRequests = [], validations = [], assets = [] } = counts;
  const ctx = { notes, hypotheses, workflows, labRequests, validations, assets };

  const stages = STAGES.map((s) => ({
    ...s,
    complete: s.check(ctx),
    inProgress: s.inProgress ? s.inProgress(ctx) && !s.check(ctx) : false,
  }));

  // Find the current active stage (first incomplete)
  const currentStageIndex = stages.findIndex((s) => !s.complete);
  const currentStage = stages[currentStageIndex];
  const completedCount = stages.filter(s => s.complete).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Research Journey</h3>
          <p className="text-xs text-gray-400 mt-0.5">{completedCount} of {stages.length} stages complete</p>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / stages.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500">{Math.round((completedCount / stages.length) * 100)}%</span>
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-1">
        {stages.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          return (
            <button
              key={stage.id}
              onClick={() => onTabChange?.(stage.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
                isCurrent
                  ? "bg-blue-50 border border-blue-100"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 w-5 flex items-center justify-center">
                {stage.complete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : stage.inProgress ? (
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-100" />
                ) : (
                  <Circle className={`w-4 h-4 ${isCurrent ? "text-blue-400" : "text-gray-200"}`} />
                )}
              </div>

              {/* Emoji */}
              <span className="text-base flex-shrink-0">{stage.icon}</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  stage.complete ? "text-gray-400 line-through" : isCurrent ? "text-blue-700" : "text-gray-600"
                }`}>
                  {stage.name}
                </p>
                {isCurrent && (
                  <p className="text-[10px] text-blue-500 mt-0.5">{stage.hint}</p>
                )}
              </div>

              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? "text-blue-400" : "text-gray-200 group-hover:text-gray-400"}`} />
            </button>
          );
        })}
      </div>

      {/* Next step CTA */}
      {currentStage && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide mb-0.5">Next Step</p>
            <p className="text-xs text-blue-800 font-medium">{currentStage.name}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">{currentStage.hint}</p>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs flex-shrink-0"
            onClick={() => onTabChange?.(currentStage.tab)}
          >
            {currentStage.cta}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      {completedCount === stages.length && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
          <p className="text-xs text-emerald-700 font-medium">🎉 All stages complete — your research is publication-ready!</p>
        </div>
      )}
    </div>
  );
}