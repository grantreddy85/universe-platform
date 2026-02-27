import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function TabAIPanel({
  tabName, contextData, isOpen, onToggle,
  project, availableFilters, onSetFilters, onCreateCohort,
  hypotheses, notes, documents
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cohortSuggestion, setCohortSuggestion] = useState(null); // { name, sample_size, filters: [], reasoning }
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [cohortCreated, setCohortCreated] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildPrompt = (userInput) => {
    const isCohorts = tabName === "Cohorts" && project;

    if (!isCohorts) {
      const context = contextData
        ? `\n\nCurrent ${tabName} data:\n${typeof contextData === "string" ? contextData : JSON.stringify(contextData, null, 2)}`
        : `\n\nNo ${tabName.toLowerCase()} data available yet.`;
      return `You are an expert research assistant helping a scientist with their ${tabName} module. Answer concisely and helpfully.\n\n${tabName} context:${context}\n\nUser question: ${userInput}`;
    }

    const hypothesesContext = hypotheses?.length > 0
      ? hypotheses.map(h => `  - [${h.status}] ${h.title}: ${h.description || ""}`).join("\n")
      : "  None yet";

    const notesContext = notes?.length > 0
      ? notes.slice(0, 10).map(n => `  - ${n.title}: ${(n.content || "").slice(0, 200)}`).join("\n")
      : "  None yet";

    const documentsContext = documents?.length > 0
      ? documents.map(d => `  - ${d.title} (${d.file_type || "file"}): ${d.summary || d.methodology || "No summary"}`).join("\n")
      : "  None yet";

    const cohortData = typeof contextData === "object" && contextData !== null ? contextData : {};
    const savedCohorts = cohortData.cohorts || [];
    const filterInfo = availableFilters ? `\n\nAvailable filters:\n${availableFilters}` : "";

    return `You are an expert research cohort assistant. Help the scientist design the best cohort for their research goals.

Project: ${project.title}
Description: ${project.description || "Not specified"}
Field: ${project.field || "Not specified"}
Tags: ${project.tags?.join(", ") || "None"}

Hypotheses:
${hypothesesContext}

Notes:
${notesContext}

Documents:
${documentsContext}

Existing cohorts (${savedCohorts.length}):
${savedCohorts.length > 0 ? savedCohorts.map(c => `- ${c.name} (${c.status}, n=${c.sample_size || "?"})`).join("\n") : "None yet"}
${filterInfo}

User question: ${userInput}

Respond in two parts:
1. A plain-text explanation answering the user's question (1-3 paragraphs).
2. If a cohort recommendation is appropriate, end your response with a JSON block on its own line in EXACTLY this format (no extra text around it):
COHORT_JSON:{"name":"...","sample_size":100,"filters":[{"field":"...","operator":"equals","value":"..."}],"reasoning":"..."}

Only include COHORT_JSON if you have a concrete recommendation. The JSON must be valid and on a single line.`;
  };

  const sendMessage = async (overrideInput) => {
    const userInput = overrideInput || input;
    if (!userInput.trim()) return;

    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCohortSuggestion(null);
    setFiltersApplied(false);
    setCohortCreated(false);

    const prompt = buildPrompt(userInput);
    const response = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: tabName === "Cohorts" });

    // Parse COHORT_JSON from response
    let suggestion = null;
    let displayContent = response;

    const cohortJsonMatch = response.match(/COHORT_JSON:(\{.*\})/);
    if (cohortJsonMatch) {
      try {
        suggestion = JSON.parse(cohortJsonMatch[1]);
        displayContent = response.replace(/COHORT_JSON:\{.*\}/, "").trim();
      } catch (e) {
        // JSON parse failed, show full response
      }
    }

    setCohortSuggestion(suggestion);
    setMessages((prev) => [...prev, { role: "assistant", content: displayContent }]);
    setIsLoading(false);
  };

  const handleRecommendCohort = () => {
    sendMessage("Based on this project's research goals and existing cohorts, recommend the most useful cohort I should build next — including specific filters and sample size.");
  };

  if (!isOpen) return null;

  const lastMessageIsAssistant = messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">Cohort Guide</span>
        </div>
        <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="w-6 h-6 text-blue-400 mx-auto" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Ask me to recommend a cohort, or describe your research goal and I'll suggest filters and a sample size.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const displayContent = msg.content;
            return (
              <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 text-gray-800 border border-gray-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {displayContent}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
            </div>
          </div>
        )}

        {/* Cohort suggestion card — shown after the last assistant message */}
        {cohortSuggestion && lastMessageIsAssistant && !isLoading && (
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Recommended Cohort
            </p>

            <div>
              <p className="text-sm font-semibold text-gray-900">{cohortSuggestion.name}</p>
              {cohortSuggestion.sample_size && (
                <p className="text-xs text-gray-500 mt-0.5">Target sample size: {cohortSuggestion.sample_size}</p>
              )}
            </div>

            {cohortSuggestion.filters?.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wide mb-1.5">Filters</p>
                <div className="flex flex-wrap gap-1">
                  {cohortSuggestion.filters.map((f, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">
                      {f.field}: {f.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {/* Apply Filters button */}
              {onSetFilters && cohortSuggestion.filters?.length > 0 && (
                filtersApplied ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Filters applied to Study Finder
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-7"
                    onClick={() => {
                      const filterStrings = cohortSuggestion.filters.map(f => `${f.field}:${f.value}`);
                      onSetFilters(filterStrings);
                      setFiltersApplied(true);
                    }}
                  >
                    ✦ Apply Filters to Study Finder
                  </Button>
                )
              )}

              {/* Create Cohort button */}
              {onCreateCohort && (
                cohortCreated ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Cohort created successfully
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                    onClick={() => {
                      onCreateCohort(cohortSuggestion);
                      setCohortCreated(true);
                    }}
                  >
                    ✦ Create This Cohort
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recommend Cohort Button */}
      {tabName === "Cohorts" && (
        <div className="border-t border-gray-100 p-3">
          <Button
            onClick={handleRecommendCohort}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
            disabled={isLoading}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Recommend a Cohort
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about cohorts..."
            className="text-xs"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}