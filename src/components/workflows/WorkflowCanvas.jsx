import React, { useState } from "react";
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Play, Settings, FlaskConical, Microscope, Database, BarChart2, FileText, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEP_ICONS = {
  sample_prep: FlaskConical,
  ms_acquisition: Microscope,
  data_processing: Cpu,
  protein_identification: Database,
  quantification: BarChart2,
  statistical_analysis: BarChart2,
  bioinformatics: Cpu,
  reporting: FileText,
};

const STEP_COLORS = {
  sample_prep: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-500", badge: "bg-purple-100 text-purple-700" },
  ms_acquisition: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500", badge: "bg-blue-100 text-blue-700" },
  data_processing: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500", badge: "bg-orange-100 text-orange-700" },
  protein_identification: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-500", badge: "bg-green-100 text-green-700" },
  quantification: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-500", badge: "bg-cyan-100 text-cyan-700" },
  statistical_analysis: { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-500", badge: "bg-pink-100 text-pink-700" },
  bioinformatics: { bg: "bg-indigo-50", border: "border-indigo-200", icon: "text-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  reporting: { bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-500", badge: "bg-gray-100 text-gray-600" },
};

const STATUS_CONFIG = {
  pending: { icon: Circle, label: "Pending", cls: "text-gray-400" },
  running: { icon: Play, label: "Running", cls: "text-blue-500 animate-pulse" },
  completed: { icon: CheckCircle2, label: "Completed", cls: "text-emerald-500" },
};

function WorkflowStep({ step, index, total, isLast, onToggle, expanded }) {
  const colors = STEP_COLORS[step.type] || STEP_COLORS.reporting;
  const Icon = STEP_ICONS[step.type] || Settings;
  const statusCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex items-start gap-0">
      {/* Left connector line */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${colors.border} ${colors.bg} shadow-sm z-10`}>
          <Icon className={`w-4 h-4 ${colors.icon}`} strokeWidth={1.7} />
        </div>
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 min-h-[28px]" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
        {/* Header */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition-all"
          onClick={() => onToggle(index)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step {index + 1}</span>
              <Badge className={`text-[10px] px-1.5 py-0 ${colors.badge}`}>{step.type?.replace(/_/g, " ")}</Badge>
              <span className={`flex items-center gap-1 text-[10px] ${statusCfg.cls}`}>
                <StatusIcon className="w-3 h-3" /> {statusCfg.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{step.title}</p>
          </div>
          <div className="flex-shrink-0 text-gray-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-opacity-40 space-y-3" style={{ borderColor: "inherit" }}>
            {step.objective && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Objective</p>
                <p className="text-xs text-gray-600">{step.objective}</p>
              </div>
            )}
            {step.steps?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Sub-steps</p>
                <div className="space-y-1">
                  {step.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <div className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-gray-400">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step.tools?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Software / Instruments</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.tools.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-white rounded-full border border-gray-200 text-gray-600 font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {step.inputs?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Inputs</p>
                  {step.inputs.map((inp, i) => (
                    <p key={i} className="text-[11px] text-gray-500">← {inp}</p>
                  ))}
                </div>
                {step.outputs?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Outputs</p>
                    {step.outputs.map((out, i) => (
                      <p key={i} className="text-[11px] text-gray-500">→ {out}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {step.parameters && Object.keys(step.parameters).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Key Parameters</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(step.parameters).map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg border border-gray-100 px-2.5 py-1.5">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{k.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-700 font-medium truncate">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowCanvas({ workflow }) {
  const [expandedSteps, setExpandedSteps] = useState({});

  if (!workflow) return null;

  const steps = workflow.parameters?.steps || [];

  const toggleStep = (i) => setExpandedSteps(prev => ({ ...prev, [i]: !prev[i] }));
  const expandAll = () => {
    const all = {};
    steps.forEach((_, i) => all[i] = true);
    setExpandedSteps(all);
  };
  const collapseAll = () => setExpandedSteps({});

  const completedCount = steps.filter(s => s.status === "completed").length;

  return (
    <div className="p-6">
      {/* Pipeline header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{workflow.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{workflow.type?.replace(/_/g, " ")} · {steps.length} steps · {completedCount}/{steps.length} completed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-50">Expand all</button>
          <button onClick={collapseAll} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-50">Collapse all</button>
        </div>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="mb-6 bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      )}

      {/* Steps DAG */}
      <div>
        {steps.map((step, i) => (
          <WorkflowStep
            key={i}
            step={step}
            index={i}
            total={steps.length}
            isLast={i === steps.length - 1}
            expanded={!!expandedSteps[i]}
            onToggle={toggleStep}
          />
        ))}
      </div>

      {/* Results summary */}
      {workflow.results_summary && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Results Summary</p>
          <p className="text-xs text-emerald-800">{workflow.results_summary}</p>
        </div>
      )}
    </div>
  );
}