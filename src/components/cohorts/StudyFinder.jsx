import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, Loader2, X, BookOpen, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function StudyCard({ study }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`text-[10px] px-2 py-0.5 font-medium uppercase tracking-wide ${
              study.source === "ClinicalTrials.gov"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}
            variant="outline"
          >
            {study.source === "ClinicalTrials.gov" ? (
              <FlaskConical className="w-2.5 h-2.5 mr-1 inline" />
            ) : (
              <BookOpen className="w-2.5 h-2.5 mr-1 inline" />
            )}
            {study.source}
          </Badge>
          {study.phase && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              {study.phase}
            </span>
          )}
          {study.year && (
            <span className="text-[10px] text-gray-400">{study.year}</span>
          )}
        </div>
        {study.url && (
          <a
            href={study.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <h4 className="text-xs font-semibold text-gray-800 leading-snug mb-1.5">{study.title}</h4>

      {study.authors && (
        <p className="text-[11px] text-gray-400 mb-1.5 italic">{study.authors}</p>
      )}

      {study.summary && (
        <>
          <p className={`text-[11px] text-gray-500 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
            {study.summary}
          </p>
          {study.summary.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-600 mt-1 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Show less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show more</>
              )}
            </button>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {(study.tags || []).map((tag) => (
          <span key={tag} className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function StudyFinder({ activeFilters }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const findStudies = async () => {
    setLoading(true);
    setOpen(true);

    // Build a human-readable query from the active filters
    const filterLabels = activeFilters.map((f) => f.split(":")[1]);
    const query = filterLabels.join(", ") || "human clinical studies";

    const prompt = `You are a research assistant. Based on the following cohort criteria: "${query}", find and return 6–10 relevant human studies from ClinicalTrials.gov AND PubMed.

For each study return:
- title: full study title
- source: "ClinicalTrials.gov" or "PubMed"
- url: a real, valid URL to the study (use https://clinicaltrials.gov/search?query=... for ClinicalTrials or https://pubmed.ncbi.nlm.nih.gov/?term=... for PubMed — construct realistic links)
- phase: (for clinical trials: "Phase 1", "Phase 2", "Phase 3", etc. — null if not applicable)
- year: publication or registration year as a string
- authors: first author et al. (for PubMed studies)
- summary: 1–2 sentence abstract summary
- tags: array of 2–4 short keyword tags relevant to the study

Focus on studies that match the criteria closely. Mix ClinicalTrials.gov and PubMed results. Use real study titles and realistic data — search your knowledge base for actual registered trials and published papers that match these criteria.`;

    const data = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          studies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                source: { type: "string" },
                url: { type: "string" },
                phase: { type: "string" },
                year: { type: "string" },
                authors: { type: "string" },
                summary: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    });

    setResults(data.studies || []);
    setLoading(false);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <Button
          onClick={findStudies}
          disabled={loading || activeFilters.length === 0}
          size="sm"
          variant="outline"
          className="text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 mr-1.5" />
          )}
          {loading ? "Searching..." : `Find Studies (${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""})`}
        </Button>
        {results && (
          <button
            onClick={() => { setResults(null); setOpen(false); }}
            className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {activeFilters.length === 0 && (
        <p className="text-[11px] text-gray-400 italic">Select filters on the left to find matching studies.</p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 animate-pulse">
              <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
              <div className="h-4 w-full bg-gray-100 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && open && results && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-400">{results.length} studies found</p>
          {results.map((study, i) => (
            <StudyCard key={i} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}