import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Sparkles, ChevronDown, ChevronUp, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const CATEGORY_COLORS = {
  biological_cellular: "bg-emerald-50 text-emerald-700 border-emerald-100",
  molecular_analytical: "bg-blue-50 text-blue-700 border-blue-100",
  protein_immunology: "bg-purple-50 text-purple-700 border-purple-100",
  structural_chemical: "bg-amber-50 text-amber-700 border-amber-100",
};

const CATEGORY_LABELS = {
  biological_cellular: "Biological & Cellular",
  molecular_analytical: "Molecular & Analytical",
  protein_immunology: "Protein & Immunology",
  structural_chemical: "Structural & Chemical",
};

export default function LabRecommendations({ hypothesis, project }) {
  const [expanded, setExpanded] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["lab-services"],
    queryFn: () => base44.entities.LabService.list(),
  });

  const generateRecommendations = async () => {
    if (recommendations) {
      setExpanded((v) => !v);
      return;
    }
    setExpanded(true);
    setLoading(true);

    const serviceList = services.map((s) =>
      `ID:${s.id} | Name: ${s.name} | Category: ${s.category} | Capabilities: ${(s.capabilities || []).join(", ")} | Turnaround: ${s.turnaround_days || "N/A"} days`
    ).join("\n");

    const prompt = `You are a scientific research advisor helping a researcher identify the best real-world lab tests to validate their hypothesis.

Project: "${project.title}"
Field: ${project.field || "Life Sciences"}

Hypothesis Title: "${hypothesis.title}"
Hypothesis Description: "${hypothesis.description || "No additional description provided."}"

Available Lab Services:
${serviceList}

Based on the hypothesis, recommend the 2-4 most relevant lab services from the list above that could help validate or advance this hypothesis. For each recommendation:
1. Explain WHY this test is relevant to the specific hypothesis (2-3 sentences, scientifically grounded)
2. Describe what specific insight or data this test would provide
3. Indicate the expected value of this test for the research

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "service_id": "<exact ID from the list>",
      "relevance_reason": "<why this test matters for this hypothesis>",
      "expected_insight": "<what data/insight this would provide>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "testing_strategy": "<1-2 sentence overall testing strategy suggestion>"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service_id: { type: "string" },
                relevance_reason: { type: "string" },
                expected_insight: { type: "string" },
                priority: { type: "string" },
              },
            },
          },
          testing_strategy: { type: "string" },
        },
      },
    });

    // Enrich with service data
    const enriched = (result.recommendations || []).map((rec) => ({
      ...rec,
      service: services.find((s) => s.id === rec.service_id),
    })).filter((r) => r.service);

    setRecommendations({ ...result, recommendations: enriched });
    setLoading(false);
  };

  const priorityColors = {
    high: "bg-red-50 text-red-600 border-red-100",
    medium: "bg-amber-50 text-amber-600 border-amber-100",
    low: "bg-gray-50 text-gray-500 border-gray-100",
  };

  return (
    <div className="border border-teal-100 rounded-xl bg-teal-50/40 overflow-hidden">
      <button
        onClick={generateRecommendations}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-50/60 transition-colors"
        disabled={loading}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center">
            <FlaskConical className="w-3.5 h-3.5 text-teal-600" strokeWidth={1.8} />
          </div>
          <span className="text-xs font-semibold text-teal-800">
            {recommendations ? "Lab Testing Recommendations" : "Get Lab Testing Recommendations"}
          </span>
          {!recommendations && (
            <span className="text-[10px] text-teal-500 bg-teal-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin" />
        ) : expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-teal-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-teal-500" />
        )}
      </button>

      {expanded && !loading && recommendations && (
        <div className="px-4 pb-4 space-y-3">
          {recommendations.testing_strategy && (
            <p className="text-xs text-teal-700 bg-teal-100/60 rounded-lg px-3 py-2 leading-relaxed">
              <strong>Strategy:</strong> {recommendations.testing_strategy}
            </p>
          )}
          <div className="space-y-2.5">
            {recommendations.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{rec.service.name}</span>
                      <Badge className={`text-[10px] border ${CATEGORY_COLORS[rec.service.category] || "bg-gray-50 text-gray-500"}`}>
                        {CATEGORY_LABELS[rec.service.category] || rec.service.category}
                      </Badge>
                      {rec.priority && (
                        <Badge className={`text-[10px] border capitalize ${priorityColors[rec.priority] || priorityColors.medium}`}>
                          {rec.priority} priority
                        </Badge>
                      )}
                    </div>
                    {rec.service.turnaround_days && (
                      <p className="text-[10px] text-gray-400 mt-0.5">~{rec.service.turnaround_days} day turnaround</p>
                    )}
                  </div>
                  <Link to={createPageUrl("Labs")}>
                    <Button variant="outline" size="sm" className="text-[10px] h-7 px-2.5 flex-shrink-0">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Request
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{rec.relevance_reason}</p>
                {rec.expected_insight && (
                  <div className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      <strong>Expected insight:</strong> {rec.expected_insight}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && loading && (
        <div className="px-4 pb-4 flex items-center gap-2 text-xs text-teal-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Analysing hypothesis and matching lab capabilities...
        </div>
      )}
    </div>
  );
}