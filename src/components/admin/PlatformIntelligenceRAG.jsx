import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Globe, BookOpen, FlaskConical, TrendingUp, Lightbulb, Save, X, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    label: "Platform trends",
    prompt: "What are the dominant research themes across the platform? Identify the most active therapeutic areas and highlight any emerging topics.",
    color: "#3b82f6"
  },
  {
    icon: BookOpen,
    label: "Validation pipeline",
    prompt: "Summarise the current validation pipeline. Which projects are closest to validated status and what are the bottlenecks?",
    color: "#f59e0b"
  },
  {
    icon: FlaskConical,
    label: "Lab opportunities",
    prompt: "Which platform hypotheses or assets could most benefit from lab validation right now? Cross-reference with available lab services.",
    color: "#10b981"
  },
  {
    icon: Lightbulb,
    label: "Generate hypothesis",
    prompt: "HYPOTHESIS SYNTHESIS: Analyse ALL platform notes, validated assets, hypotheses and project descriptions. Cross-reference this knowledge base with current published literature to identify gaps in the research. Propose a novel, testable research hypothesis — include: (1) the gap identified, (2) supporting evidence from platform data, (3) relevant external literature, (4) a clear hypothesis statement, (5) suggested experimental approach.",
    color: "#6366f1",
    highlight: true
  },
];

export default function PlatformIntelligenceRAG({ allProjects, allNotes, allAssets, allHypotheses, allValidations, allUsers = [] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [showContributorDialog, setShowContributorDialog] = useState(false);
  const [pendingSaveContent, setPendingSaveContent] = useState(null);
  const [pendingSaveIndex, setPendingSaveIndex] = useState(null);
  const [selectedContributors, setSelectedContributors] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const projectsSummary = allProjects.slice(0, 40).map(p =>
      `Project: "${p.title}" | Field: ${p.field || "N/A"} | Status: ${p.status} | Description: ${(p.description || "").slice(0, 120)}`
    ).join("\n");

    const notesSummary = allNotes.slice(0, 30).map(n =>
      `Note: "${n.title}" | Content: ${(n.content || "").slice(0, 150)}`
    ).join("\n");

    const assetsSummary = allAssets.slice(0, 30).map(a => {
      const attribution = (a.attribution || []).map(attr =>
        `${attr.contributor} (${attr.role}, ${attr.share_percentage}%)`
      ).join(", ");
      const topicClusters = (a.topic_clusters || []).map(tc =>
        `${tc.topic} (${tc.weight_percentage}%)`
      ).join(", ");
      return `Asset: "${a.title}" | Type: ${a.type} | Status: ${a.status} | Description: ${(a.description || "").slice(0, 100)} | Attribution: ${attribution || "none"} | Topics: ${topicClusters || "none"}`;
    }).join("\n");

    const hypothesesSummary = allHypotheses.slice(0, 20).map(h =>
      `Hypothesis: "${h.title}" | Status: ${h.status} | Description: ${(h.description || "").slice(0, 120)}`
    ).join("\n");

    // Build a contributor map from all assets for attribution weighting
    const contributorMap = {};
    allAssets.forEach(a => {
      (a.attribution || []).forEach(attr => {
        if (!contributorMap[attr.contributor]) {
          contributorMap[attr.contributor] = { roles: new Set(), totalShares: 0, assetCount: 0 };
        }
        contributorMap[attr.contributor].roles.add(attr.role);
        contributorMap[attr.contributor].totalShares += attr.share_percentage || 0;
        contributorMap[attr.contributor].assetCount += 1;
      });
    });
    const contributorsSummary = Object.entries(contributorMap).map(([contributor, data]) =>
      `Contributor: ${contributor} | Roles: ${[...data.roles].join(", ")} | Avg Share: ${(data.totalShares / data.assetCount).toFixed(1)}% | Assets Involved: ${data.assetCount}`
    ).join("\n");

    return { projectsSummary, notesSummary, assetsSummary, hypothesesSummary, contributorsSummary };
  };

  const send = async (promptText) => {
    const text = promptText || input;
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg = { role: "user", content: text };
    setMessages(m => [...m, userMsg]);

    const { projectsSummary, notesSummary, assetsSummary, hypothesesSummary, contributorsSummary } = buildContext();

    const systemPrompt = `You are the UniVerse Platform Intelligence assistant — a research AI with full visibility across all platform activity. You have access to the collective knowledge base of all researchers on the platform.

IMPORTANT — ATTRIBUTION & WEIGHTING SYSTEM:
Each asset on the platform has an "attribution" array. Every contributor has a role and a share_percentage. Roles include: researcher, lab, universe, investor, funder, tool_creator. Share percentages across all contributors on a single asset must sum to 100%. When generating insights or hypotheses that reference specific assets or contributors, always reflect these weighted contributions accurately — a contributor with a higher share_percentage has had a greater proportional impact on that asset. Lab equity shares dilute all other contributors proportionally.

Topic clusters also have weight_percentage values per asset — these indicate how much of the asset's research belongs to each therapeutic area.

PLATFORM KNOWLEDGE BASE:
=== Projects (${allProjects.length} total) ===
${projectsSummary}

=== Research Notes (${allNotes.length} total) ===
${notesSummary}

=== Assets with Attribution & Topic Weights (${allAssets.length} total) ===
${assetsSummary}

=== Hypotheses (${allHypotheses.length} total) ===
${hypothesesSummary}

=== Contributor Overview (across all assets) ===
${contributorsSummary || "No contributor data yet"}

=== Platform Stats ===
- Total Projects: ${allProjects.length}
- Total Notes: ${allNotes.length}
- Total Assets: ${allAssets.length}
- Validated Assets: ${allAssets.filter(a => a.status === "validated" || a.status === "tokenised").length}
- Total Hypotheses: ${allHypotheses.length}
- Active Validations: ${allValidations.filter(v => ["pending","in_review","running"].includes(v.status)).length}

Query: ${text}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      add_context_from_internet: true,
    });

    setMessages(m => [...m, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const saveAsNote = async (content, index) => {
    setSavingIndex(index);

    // Ask the LLM to extract contributor attribution weights from the response
    const attributionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analysing an AI-generated research insight to extract contributor attribution data.

PLATFORM CONTRIBUTOR DATA (from assets):
${allAssets.slice(0, 20).map(a =>
  (a.attribution || []).map(attr => `${attr.contributor} (${attr.role}, ${attr.share_percentage}%)`).join(", ")
).filter(Boolean).join("\n")}

INSIGHT CONTENT:
${content.slice(0, 1500)}

Task: Based on which contributors, researchers, labs or funders are referenced or implied in the insight above — and their known platform share weights — assign proportional attribution percentages for this note. Only include contributors actually mentioned or whose assets are directly relevant. Percentages must sum to 100. If no specific contributors are identifiable, assign 100% to "universe" (the platform itself).

Return a JSON object with this exact schema:
{
  "attribution": [
    { "contributor": "email_or_name", "role": "researcher|lab|universe|investor|funder|tool_creator", "share_percentage": number }
  ],
  "tags": ["array", "of", "relevant", "topic", "tags", "max 5"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          attribution: {
            type: "array",
            items: {
              type: "object",
              properties: {
                contributor: { type: "string" },
                role: { type: "string" },
                share_percentage: { type: "number" }
              }
            }
          },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    });

    const tags = ["platform-intelligence", "admin", ...(attributionResult?.tags || [])];

    // Detect if this is a hypothesis response (from the hypothesis synthesis prompt)
    const isHypothesis = content.toLowerCase().includes("hypothesis") && content.toLowerCase().includes("gap");
    await base44.entities.WorkspaceItem.create({
      title: `Platform Intelligence — ${new Date().toLocaleDateString()}`,
      type: isHypothesis ? "hypothesis" : "note",
      content,
      metadata: {
        tags,
        attribution: attributionResult?.attribution || [{ contributor: "universe", role: "universe", share_percentage: 100 }]
      }
    });

    setSavingIndex(null);
    setSavedIndex(index);
    setTimeout(() => setSavedIndex(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#000021] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#00F2FF]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">Platform Intelligence</p>
            <p className="text-[10px] text-gray-400">RAG across all platform knowledge</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="grid grid-cols-2 gap-1.5">
          {SUGGESTED_PROMPTS.map(({ icon: Icon, label, prompt, color, highlight }) => (
            <button
              key={label}
              onClick={() => send(prompt)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] transition-all hover:scale-[1.02] disabled:opacity-50 ${
                highlight
                  ? "bg-[#000021] text-[#00F2FF] border border-[#00F2FF]/20"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color: highlight ? "#00F2FF" : color }} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Globe className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-xs text-gray-400 max-w-xs">
              Ask anything about the ecosystem — or use a suggested prompt above to generate cross-platform insights and novel hypotheses.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-xs bg-[#000021] text-white">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[90%] space-y-2">
                  <div className="rounded-xl px-4 py-3 text-sm bg-gray-50 border border-gray-200 text-gray-700">
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveAsNote(m.content, i)}
                      disabled={savingIndex === i}
                      className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {savingIndex === i ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : savedIndex === i ? (
                        <span className="text-green-500">Saved to Notes ✓</span>
                      ) : (
                        <><Save className="w-3 h-3" /> Save as note</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Querying platform knowledge + live literature…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) send(); }}
          placeholder="Ask a custom question across all platform data…"
          className="text-xs h-9 bg-gray-50"
          disabled={loading}
        />
        <Button
          onClick={() => send()}
          size="icon"
          className="h-9 w-9 bg-[#000021] hover:bg-[#000021]/90 flex-shrink-0"
          disabled={!input.trim() || loading}
        >
          <Send className="w-3.5 h-3.5 text-[#00F2FF]" />
        </Button>
      </div>
    </div>
  );
}