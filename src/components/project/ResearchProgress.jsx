import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const RESEARCH_STAGES = [
  {
    id: 1,
    name: "Observation",
    description: "Document your research topic and observations",
    tab: "notes",
    icon: "📝"
  },
  {
    id: 2,
    name: "Hypothesis",
    description: "Formulate your research hypothesis",
    tab: "hypothesis",
    icon: "💡"
  },
  {
    id: 3,
    name: "Experiment",
    description: "Design and plan your experiment",
    tab: "workflows",
    icon: "🔬"
  },
  {
    id: 4,
    name: "Analysis",
    description: "Analyze results and data",
    tab: "validation",
    icon: "📊"
  },
  {
    id: 5,
    name: "Conclusions",
    description: "Report findings and conclusions",
    tab: "assets",
    icon: "📋"
  }
];

export default function ResearchProgress({ projectStatus, onTabChange }) {
  const isStageComplete = (stageId) => {
    // Simple logic: mark as complete if project has progressed past this stage
    return projectStatus >= stageId;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Research Methodology</h3>
        <p className="text-xs text-gray-500">Follow the scientific method to ensure research quality</p>
      </div>

      {/* Circular visualization for desktop */}
      <div className="hidden md:flex items-center justify-center gap-2 mb-8 flex-wrap">
        {RESEARCH_STAGES.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <button
              onClick={() => onTabChange?.(stage.tab)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
            >
              <div className="text-2xl">{stage.icon}</div>
              <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600">{stage.name}</p>
            </button>
            {index < RESEARCH_STAGES.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-300 mb-6" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Linear checklist */}
      <div className="space-y-2">
        {RESEARCH_STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => onTabChange?.(stage.tab)}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left group"
          >
            <div className="pt-0.5">
              {isStageComplete(stage.id) ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{stage.name}</p>
              <p className="text-xs text-gray-500">{stage.description}</p>
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">{stage.tab}</Badge>
          </button>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Tip:</span> Complete each stage thoroughly. This process ensures your research meets publication standards.
        </p>
      </div>
    </div>
  );
}