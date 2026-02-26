import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, BookOpen, FlaskConical, Loader2, MessageSquare, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const SOURCE_BADGE_COLORS = {
  "ClinicalTrials": "bg-blue-50 text-blue-600",
  "PubMed": "bg-emerald-50 text-emerald-600",
  "bioRxiv": "bg-purple-50 text-purple-600",
  "medRxiv": "bg-pink-50 text-pink-600",
  "PMC": "bg-amber-50 text-amber-600",
  "EuropePMC": "bg-cyan-50 text-cyan-600"
};

function StudyCard({ study, onAskAbout }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] uppercase font-medium px-2 py-0.5 ${SOURCE_BADGE_COLORS[study.source] || "bg-gray-50 text-gray-600"}`}>
            {study.source}
          </Badge>
          {study.status && (
            <Badge className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5">{study.status}</Badge>
          )}
          {study.year && (
            <span className="text-[10px] text-gray-400">{study.year}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onAskAbout(study)}
            className="text-[10px] flex items-center gap-1 text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> Ask AI
          </button>
          {study.url && (
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 p-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{study.title}</p>
      {study.authors && (
        <p className="text-[11px] text-gray-400 mb-1 italic">{study.authors}</p>
      )}
      {study.journal && (
        <p className="text-[11px] text-gray-500 mb-1">{study.journal}</p>
      )}
      {study.summary && (
        <div>
          <p className={`text-[11px] text-gray-500 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {study.summary}
          </p>
          {study.summary.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-0.5">
              {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
            </button>
          )}
        </div>
      )}
      {study.n && (
        <p className="text-[10px] text-gray-400 mt-2">n = {study.n}</p>
      )}
    </div>
  );
}

export default function StudyFinderPanel({ activeFilters, project, onAskAboutStudy, onClose, isEmbedded }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  React.useEffect(() => {
    if (isEmbedded && activeFilters.length > 0) {
      handleSearch();
    }
  }, [activeFilters]);

  const filterSummary = activeFilters.map(f => {
    const [, val] = f.split(":");
    return val;
  }).join(", ");

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);

    // Query internal ResearchPaper index
    let internalContext = "";
    const allPapers = await base44.entities.ResearchPaper.list("-created_date", 200);
    const terms = filterSummary.toLowerCase().split(/[,\s]+/).filter(t => t.length > 3);
    const internalMatches = allPapers.filter(p =>
      terms.some(t => p.title?.toLowerCase().includes(t))
    ).slice(0, 15);
    if (internalMatches.length > 0) {
      internalContext = `\n\nAdditionally, from our internal curated index of 50,000+ neurodegenerative disease papers (2021–2025), these are relevant:\n` +
        internalMatches.map(p =>
          `- "${p.title}" (PMID: ${p.article_id})${p.s3_url ? ` PDF: ${p.s3_url}` : ""}${p.pmc_link ? ` PMC: ${p.pmc_link}` : ""}`
        ).join("\n") +
        `\nInclude these internal papers in your "studies" array where relevant, using source: "UniVerse Index".`;
    }

    const prompt = `You are a biomedical research assistant. Find real, existing studies from multiple sources matching these cohort criteria: ${filterSummary || "human clinical research"}.${internalContext}

Search from these sources:
- ClinicalTrials.gov (clinical trials)
- PubMed (peer-reviewed articles)
- bioRxiv (preprints on biology)
- medRxiv (preprints on medicine)
- PubMed Central (PMC articles)
- Europe PMC (additional publications)

Return a JSON object with:
- "stats": { "total_studies": number, "clinical_trials": number, "pubmed_papers": number, "preprints": number, "total_participants": number, "date_range": string }
- "phase_distribution": array of { "name": string, "value": number } — study phases
- "disease_distribution": array of { "name": string, "value": number } — disease/condition categories found
- "year_distribution": array of { "year": string, "count": number } — publications per year (last 10 years)
- "top_institutions": array of { "name": string, "count": number } — top contributing institutions
- "studies": array of up to 15 objects, each with: { "source": "ClinicalTrials"|"PubMed"|"bioRxiv"|"medRxiv"|"PMC"|"EuropePMC", "title": string, "authors": string, "year": string|number, "journal": string, "status": string, "summary": string, "n": string, "url": string, "pmid_or_nct": string }

Focus on real, verifiable studies with actual identifiers (NCT IDs, PMIDs, DOIs).`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          stats: { type: "object" },
          phase_distribution: { type: "array", items: { type: "object" } },
          disease_distribution: { type: "array", items: { type: "object" } },
          year_distribution: { type: "array", items: { type: "object" } },
          top_institutions: { type: "array", items: { type: "object" } },
          studies: { type: "array", items: { type: "object" } },
        },
      },
    });
    setResults(res);
    setLoading(false);
    setActiveTab("overview");
  };

  const tabs = ["overview", "studies"];

  return (
    <div className={`flex-shrink-0 border-l border-gray-100 bg-[#fafbfc] flex flex-col h-full ${isEmbedded ? "flex-1" : "w-[400px]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">Study Finder</span>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2.5 border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => window.dispatchEvent(new CustomEvent("save_cohort_from_filters", { detail: { activeFilters } }))}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Save Cohort
            </Button>
          )}
          {!isEmbedded && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter summary */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        {activeFilters.length === 0 ? (
          <p className="text-xs text-gray-400">Select filters to find matching studies.</p>
        ) : (
          <div className="flex flex-wrap gap-1 mb-2">
            {activeFilters.slice(0, 6).map(f => {
              const [, val] = f.split(":");
              return (
                <Badge key={f} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5">{val}</Badge>
              );
            })}
            {activeFilters.length > 6 && (
              <Badge className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5">+{activeFilters.length - 6} more</Badge>
            )}
          </div>
        )}
        <Button
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8 mt-1"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Searching…</>
          ) : (
            <><Search className="w-3.5 h-3.5 mr-1.5" />Find Studies</>
          )}
        </Button>
      </div>

      {/* Tabs */}
      {results && (
        <div className="flex border-b border-gray-100 bg-white">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 text-xs py-2.5 font-medium capitalize transition-colors ${
                activeTab === t
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "overview" ? "Overview" : `Papers (${results.studies?.length || 0})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-xs">Searching multiple scientific sources…</p>
          </div>
        )}

        {results && activeTab === "overview" && (
          <>
            {/* Stats */}
            {results.stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total Studies", val: results.stats.total_studies?.toLocaleString() },
                  { label: "Clinical Trials", val: results.stats.clinical_trials?.toLocaleString() },
                  { label: "PubMed Papers", val: results.stats.pubmed_papers?.toLocaleString() },
                  { label: "Preprints", val: results.stats.preprints?.toLocaleString() },
                  { label: "Participants", val: results.stats.total_participants?.toLocaleString() },
                ].map(s => s.val && (
                  <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-3">
                    <p className="text-lg font-bold text-gray-800">{s.val}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Year trend */}
            {results.year_distribution?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Publications per Year</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={results.year_distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Disease distribution */}
            {results.disease_distribution?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Disease Landscape</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={results.disease_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                    >
                      {results.disease_distribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top institutions */}
            {results.top_institutions?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Top Institutions</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={results.top_institutions.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 120, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={115} interval={0} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Phase distribution */}
            {results.phase_distribution?.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-3">Study Phases</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={results.phase_distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {results && activeTab === "studies" && (
          <div className="space-y-3">
            {results.studies?.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No studies found for these filters.</p>
            )}
            {results.studies?.map((study, i) => (
              <StudyCard key={i} study={study} onAskAbout={onAskAboutStudy} />
            ))}
          </div>
        )}

        {!results && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <BookOpen className="w-8 h-8 text-gray-200" />
            <p className="text-xs text-gray-400 max-w-[200px]">
              Select filters and click <strong>Find Studies</strong> to discover matching research across multiple scientific sources.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}